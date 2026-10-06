import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore, Firestore } from 'firebase-admin/firestore';
import { getAuth, Auth } from 'firebase-admin/auth';
import { appDb } from '../services/db';
import dotenv from 'dotenv';

dotenv.config();

let rawDb: Firestore | null = null;
let auth: Auth;

if (!getApps().length) {
  if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY) {
    const serviceAccount = {
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    };

    initializeApp({
      credential: cert(serviceAccount),
    });
    rawDb = getFirestore();
  } else {
    initializeApp({
      projectId: process.env.FIREBASE_PROJECT_ID || 'door-bell-bf626',
    });
  }
}

auth = getAuth();

// Export resilient db that falls back gracefully
export const db = (rawDb || appDb) as any;
export { auth };
