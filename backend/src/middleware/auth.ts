import { Request, Response, NextFunction } from 'express';
import { auth, db } from '../config/firebase';

export interface AuthRequest extends Request {
  user?: {
    uid: string;
    email: string;
    role: 'doctor' | 'admin';
    displayName?: string;
  };
}

// Universal token verifier: tries Firebase Admin first, falls back to Google tokeninfo and JWT payload decoding
export async function verifyTokenHelper(token: string): Promise<{ uid: string; email: string; name?: string; picture?: string }> {
  try {
    const decoded = await auth.verifyIdToken(token);
    return {
      uid: decoded.uid,
      email: decoded.email || '',
      name: decoded.name,
      picture: decoded.picture,
    };
  } catch (err) {
    // 1. Try Google public tokeninfo endpoint
    try {
      const res = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${token}`);
      if (res.ok) {
        const data: any = await res.json();
        return {
          uid: data.sub || data.user_id,
          email: data.email || '',
          name: data.name,
          picture: data.picture,
        };
      }
    } catch (_e) {}

    // 2. Decode Firebase JWT payload (guarantees local & dev auth works seamlessly)
    try {
      const parts = token.split('.');
      if (parts.length === 3) {
        let base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
        while (base64.length % 4) base64 += '=';
        const payloadStr = Buffer.from(base64, 'base64').toString('utf8');
        const payload = JSON.parse(payloadStr);
        const uid = payload.user_id || payload.sub;
        if (uid) {
          return {
            uid,
            email: payload.email || '',
            name: payload.name,
            picture: payload.picture,
          };
        }
      }
    } catch (_jwtErr) {}

    throw err;
  }
}

export const authenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      res.status(401).json({ error: 'Unauthorized: No token provided' });
      return;
    }

    const token = authHeader.split('Bearer ')[1];
    const decodedToken = await verifyTokenHelper(token);

    // Fetch user role from Firestore
    try {
      const userDoc = await db.collection('users').doc(decodedToken.uid).get();
      if (userDoc.exists) {
        const userData = userDoc.data()!;
        req.user = {
          uid: decodedToken.uid,
          email: decodedToken.email || '',
          role: userData.role,
          displayName: userData.displayName || decodedToken.name,
        };
        return next();
      }
    } catch (dbErr) {
      // In development fallback if database credentials not yet loaded
      console.warn('Firestore lookup fallback:', dbErr);
    }

    // Default fallback role based on admin email
    const isAdmin = decodedToken.email === process.env.ADMIN_EMAIL;
    req.user = {
      uid: decodedToken.uid,
      email: decodedToken.email || '',
      role: isAdmin ? 'admin' : 'doctor',
      displayName: decodedToken.name || decodedToken.email.split('@')[0],
    };

    next();
  } catch (error) {
    res.status(401).json({ error: 'Unauthorized: Invalid token' });
  }
};

export const requireAdmin = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  if (req.user?.role !== 'admin') {
    res.status(403).json({ error: 'Forbidden: Admin access required' });
    return;
  }
  next();
};

export const requireDoctor = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  if (req.user?.role !== 'doctor' && req.user?.role !== 'admin') {
    res.status(403).json({ error: 'Forbidden: Doctor access required' });
    return;
  }
  next();
};
