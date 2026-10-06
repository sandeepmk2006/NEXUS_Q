import { Router, Response } from 'express';
import { db } from '../config/firebase';
import { authenticate, AuthRequest, requireAdmin, verifyTokenHelper } from '../middleware/auth';

const router = Router();

// Doctor registration (Google OAuth callback handled on frontend)
// This endpoint creates the user record in Firestore after OAuth
router.post('/register', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { idToken, specialization, licenseNumber, hospital, phone } = req.body;

    if (!idToken) {
      res.status(400).json({ error: 'ID token required' });
      return;
    }

    // Verify the token
    const decodedToken = await verifyTokenHelper(idToken);
    const { uid, email, name, picture } = decodedToken;

    if (!email) {
      res.status(400).json({ error: 'Email is required' });
      return;
    }

    // Check if admin email trying to register
    if (email === process.env.ADMIN_EMAIL) {
      res.status(400).json({ error: 'Admin account cannot be registered through this portal' });
      return;
    }

    // Check if user already exists
    const userDoc = await db.collection('users').doc(uid).get();
    if (userDoc.exists) {
      const userData = userDoc.data()!;
      res.json({ user: userData, message: 'User already exists' });
      return;
    }

    // Create doctor user in Firestore
    const userData = {
      uid,
      email,
      displayName: name || email.split('@')[0],
      photoURL: picture || null,
      role: 'doctor',
      specialization: specialization || '',
      licenseNumber: licenseNumber || '',
      hospital: hospital || '',
      phone: phone || '',
      status: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await db.collection('users').doc(uid).set(userData);

    res.status(201).json({ user: userData, message: 'Doctor account created successfully' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Sign in - verify token and return user data
router.post('/signin', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { idToken } = req.body;

    if (!idToken) {
      res.status(400).json({ error: 'ID token required' });
      return;
    }

    const decodedToken = await verifyTokenHelper(idToken);
    const userDoc = await db.collection('users').doc(decodedToken.uid).get();

    if (!userDoc.exists) {
      // User signed in with Google but no Firestore record - needs to complete registration
      res.status(404).json({ 
        error: 'Account not found', 
        needsRegistration: true,
        email: decodedToken.email,
        name: decodedToken.name,
        picture: decodedToken.picture,
        uid: decodedToken.uid
      });
      return;
    }

    const userData = userDoc.data()!;

    if (userData.status === 'suspended') {
      res.status(403).json({ error: 'Account suspended. Contact admin.' });
      return;
    }

    res.json({ user: userData });
  } catch (error: any) {
    res.status(401).json({ error: 'Invalid token' });
  }
});

// Get current user profile
router.get('/me', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userDoc = await db.collection('users').doc(req.user!.uid).get();
    if (!userDoc.exists) {
      res.status(404).json({ error: 'User not found' });
      return;
    }
    res.json({ user: userDoc.data() });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Update profile
router.put('/profile', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { specialization, licenseNumber, hospital, phone, displayName } = req.body;
    const updates: Record<string, any> = { updatedAt: new Date().toISOString() };

    if (specialization !== undefined) updates.specialization = specialization;
    if (licenseNumber !== undefined) updates.licenseNumber = licenseNumber;
    if (hospital !== undefined) updates.hospital = hospital;
    if (phone !== undefined) updates.phone = phone;
    if (displayName !== undefined) updates.displayName = displayName;

    await db.collection('users').doc(req.user!.uid).update(updates);
    const updated = await db.collection('users').doc(req.user!.uid).get();
    res.json({ user: updated.data() });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Initialize admin account (run once)
router.post('/init-admin', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { secretKey, idToken } = req.body;
    
    if (secretKey !== process.env.ADMIN_INIT_SECRET) {
      res.status(403).json({ error: 'Invalid secret key' });
      return;
    }

    const decodedToken = await verifyTokenHelper(idToken);
    const { uid, email, name, picture } = decodedToken;

    if (email !== process.env.ADMIN_EMAIL) {
      res.status(403).json({ error: 'This email is not authorized as admin' });
      return;
    }

    const adminData = {
      uid,
      email,
      displayName: name || 'System Administrator',
      photoURL: picture || null,
      role: 'admin',
      status: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await db.collection('users').doc(uid).set(adminData);
    res.json({ user: adminData, message: 'Admin account initialized' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export { router as authRouter };
