import { Router, Response } from 'express';
import { db } from '../config/firebase';
import { authenticate, AuthRequest, requireDoctor } from '../middleware/auth';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

// All patient routes require authentication
router.use(authenticate);

// Get all patients for a doctor (or all for admin)
router.get('/', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    let query: any = db.collection('patients');

    if (req.user!.role === 'doctor') {
      query = query.where('assignedDoctorId', '==', req.user!.uid);
    }

    const snapshot = await query.get();
    const patients = snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() }));
    // Sort in memory to avoid needing composite index in Firestore
    patients.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    res.json({ patients });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get a specific patient
router.get('/:patientId', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const patientId = req.params.patientId as string;
    const patientDoc = await db.collection('patients').doc(patientId).get();

    if (!patientDoc.exists) {
      res.status(404).json({ error: 'Patient not found' });
      return;
    }

    const patient = patientDoc.data()!;

    // Doctors can only see their own patients
    if (req.user!.role === 'doctor' && patient.assignedDoctorId !== req.user!.uid) {
      res.status(403).json({ error: 'Access denied' });
      return;
    }

    res.json({ patient: { id: patientDoc.id, ...patient } });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Create a new patient
router.post('/', requireDoctor, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const {
      name, age, gender, bloodType, phone, email,
      address, medicalHistory, allergies, currentMedications,
      emergencyContact
    } = req.body;

    if (!name || !age || !gender) {
      res.status(400).json({ error: 'Name, age, and gender are required' });
      return;
    }

    const patientId = uuidv4();
    const patientData = {
      id: patientId,
      name,
      age: parseInt(age),
      gender,
      bloodType: bloodType || '',
      phone: phone || '',
      email: email || '',
      address: address || '',
      medicalHistory: medicalHistory || '',
      allergies: allergies || [],
      currentMedications: currentMedications || [],
      emergencyContact: emergencyContact || {},
      assignedDoctorId: req.user!.uid,
      assignedDoctorName: req.user!.displayName || '',
      analyses: [],
      status: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await db.collection('patients').doc(patientId).set(patientData);
    res.status(201).json({ patient: patientData });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Update patient
router.put('/:patientId', requireDoctor, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const patientId = req.params.patientId as string;
    const patientDoc = await db.collection('patients').doc(patientId).get();

    if (!patientDoc.exists) {
      res.status(404).json({ error: 'Patient not found' });
      return;
    }

    const patient = patientDoc.data()!;
    if (req.user!.role === 'doctor' && patient.assignedDoctorId !== req.user!.uid) {
      res.status(403).json({ error: 'Access denied' });
      return;
    }

    const allowedFields = [
      'name', 'age', 'gender', 'bloodType', 'phone', 'email',
      'address', 'medicalHistory', 'allergies', 'currentMedications',
      'emergencyContact', 'status'
    ];

    const updates: Record<string, any> = { updatedAt: new Date().toISOString() };
    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) updates[field] = req.body[field];
    });

    await db.collection('patients').doc(patientId).update(updates);
    const updated = await db.collection('patients').doc(patientId).get();
    res.json({ patient: { id: updated.id, ...updated.data() } });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get patient analyses
router.get('/:patientId/analyses', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const patientId = req.params.patientId as string;
    const patientDoc = await db.collection('patients').doc(patientId).get();
    if (!patientDoc.exists) {
      res.status(404).json({ error: 'Patient not found' });
      return;
    }

    const patient = patientDoc.data()!;
    if (req.user!.role === 'doctor' && patient.assignedDoctorId !== req.user!.uid) {
      res.status(403).json({ error: 'Access denied' });
      return;
    }

    const analysesSnapshot = await db
      .collection('analyses')
      .where('patientId', '==', patientId)
      .get();

    const analyses = analysesSnapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() }));
    analyses.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    res.json({ analyses });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export { router as patientRouter };
