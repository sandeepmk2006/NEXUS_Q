import { Router, Response } from 'express';
import { db } from '../config/firebase';
import { authenticate, AuthRequest, requireDoctor } from '../middleware/auth';
import { analyzemedicalImage } from '../services/geminiService';
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 20 * 1024 * 1024 } });

router.use(authenticate);

// Analyze a medical image
router.post('/analyze', requireDoctor, upload.single('image'), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { patientId, clinicalNotes, imageType, findings } = req.body;

    if (!req.file) {
      res.status(400).json({ error: 'Medical image is required' });
      return;
    }

    if (!patientId) {
      res.status(400).json({ error: 'Patient ID is required' });
      return;
    }

    // Check patient access
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

    // Convert image to base64
    const imageBase64 = req.file.buffer.toString('base64');
    const imageMimeType = req.file.mimetype;

    // Run AI analysis
    const analysisResult = await analyzemedicalImage({
      imageBase64,
      imageMimeType,
      clinicalNotes: clinicalNotes || '',
      imageType: imageType || 'medical scan',
      patientInfo: {
        age: patient.age,
        gender: patient.gender,
        medicalHistory: patient.medicalHistory,
        currentMedications: patient.currentMedications,
      },
    });

    // Save analysis to Firestore
    const analysisId = uuidv4();
    const analysisData = {
      id: analysisId,
      patientId,
      doctorId: req.user!.uid,
      doctorName: req.user!.displayName || '',
      imageType: imageType || 'medical scan',
      imageName: req.file.originalname,
      imageSize: req.file.size,
      clinicalNotes: clinicalNotes || '',
      findings: findings || '',
      analysis: analysisResult,
      status: 'completed',
      createdAt: new Date().toISOString(),
    };

    await db.collection('analyses').doc(analysisId).set(analysisData);

    // Update patient's last analysis date
    await db.collection('patients').doc(patientId).update({
      lastAnalysisAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    res.status(201).json({ analysis: analysisData });
  } catch (error: any) {
    console.error('Analysis error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get a specific analysis
router.get('/:analysisId', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const analysisId = req.params.analysisId as string;
    const analysisDoc = await db.collection('analyses').doc(analysisId).get();
    if (!analysisDoc.exists) {
      res.status(404).json({ error: 'Analysis not found' });
      return;
    }

    const analysis = analysisDoc.data()!;
    if (req.user!.role === 'doctor' && analysis.doctorId !== req.user!.uid) {
      res.status(403).json({ error: 'Access denied' });
      return;
    }

    res.json({ analysis: { id: analysisDoc.id, ...analysis } });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get recent analyses for a doctor
router.get('/', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    let query: any = db.collection('analyses');

    if (req.user!.role === 'doctor') {
      query = query.where('doctorId', '==', req.user!.uid);
    }

    const snapshot = await query.get();
    let analyses = snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() }));
    // Sort in memory and limit
    analyses.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    analyses = analyses.slice(0, 50);
    res.json({ analyses });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export { router as analysisRouter };
