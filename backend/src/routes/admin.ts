import { Router, Response } from 'express';
import { db } from '../config/firebase';
import { authenticate, AuthRequest, requireAdmin } from '../middleware/auth';

const router = Router();

router.use(authenticate, requireAdmin);

// Get dashboard stats
router.get('/stats', async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const [doctorsSnap, patientsSnap, analysesSnap] = await Promise.all([
      db.collection('users').where('role', '==', 'doctor').get(),
      db.collection('patients').get(),
      db.collection('analyses').get(),
    ]);

    res.json({
      stats: {
        totalDoctors: doctorsSnap.size,
        totalPatients: patientsSnap.size,
        totalAnalyses: analysesSnap.size,
      },
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get all doctors
router.get('/doctors', async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const snapshot = await db.collection('users').where('role', '==', 'doctor').get();
    const doctors = snapshot.docs.map((doc: any) => ({
      id: doc.id,
      ...doc.data(),
    }));
    res.json({ doctors });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get all patients (admin view)
router.get('/patients', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { doctorId } = req.query;
    let query: any = db.collection('patients');

    if (doctorId) {
      query = query.where('assignedDoctorId', '==', doctorId);
    }

    const snapshot = await query.get();
    const patients = snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() }));
    patients.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    res.json({ patients });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Transfer patient from one doctor to another
router.patch('/patients/:patientId/transfer', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { targetDoctorId } = req.body;
    const patientId = req.params.patientId as string;

    if (!targetDoctorId) {
      res.status(400).json({ error: 'Target doctor ID required' });
      return;
    }

    // Verify target doctor exists
    const doctorDoc = await db.collection('users').doc(targetDoctorId).get();
    if (!doctorDoc.exists || doctorDoc.data()!.role !== 'doctor') {
      res.status(404).json({ error: 'Target doctor not found' });
      return;
    }

    const patientDoc = await db.collection('patients').doc(patientId).get();
    if (!patientDoc.exists) {
      res.status(404).json({ error: 'Patient not found' });
      return;
    }

    const doctorData = doctorDoc.data()!;
    await db.collection('patients').doc(patientId).update({
      assignedDoctorId: targetDoctorId,
      assignedDoctorName: doctorData.displayName,
      updatedAt: new Date().toISOString(),
      transferredAt: new Date().toISOString(),
      transferredBy: req.user!.uid,
    });

    // Log the transfer
    await db.collection('audit_logs').add({
      action: 'patient_transfer',
      patientId,
      fromDoctorId: patientDoc.data()!.assignedDoctorId,
      toDoctorId: targetDoctorId,
      performedBy: req.user!.uid,
      timestamp: new Date().toISOString(),
    });

    const updated = await db.collection('patients').doc(patientId).get();
    res.json({ patient: { id: updated.id, ...updated.data() }, message: 'Patient transferred successfully' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Suspend/Activate doctor
router.patch('/doctors/:doctorId/status', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { status } = req.body;
    const doctorId = req.params.doctorId as string;

    if (!['active', 'suspended'].includes(status)) {
      res.status(400).json({ error: 'Invalid status' });
      return;
    }

    await db.collection('users').doc(doctorId).update({
      status,
      updatedAt: new Date().toISOString(),
    });

    res.json({ message: `Doctor ${status === 'active' ? 'activated' : 'suspended'} successfully` });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get all analyses (admin view)
router.get('/analyses', async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const snapshot = await db.collection('analyses').orderBy('createdAt', 'desc').limit(100).get();
    const analyses = snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() }));
    res.json({ analyses });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get audit logs
router.get('/audit-logs', async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const snapshot = await db.collection('audit_logs').orderBy('timestamp', 'desc').limit(50).get();
    const logs = snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() }));
    res.json({ logs });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export { router as adminRouter };
