import React, { useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useDropzone } from 'react-dropzone';
import {
  Upload,
  Activity,
  User,
  FileText,
  AlertTriangle,
  ScanLine,
  X,
  Sparkles,
  Info,
} from 'lucide-react';
import toast from 'react-hot-toast';
import Layout from '../components/layout/Layout';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import api from '../config/api';

interface PatientOption {
  id: string;
  name: string;
  age: number;
  gender: string;
}

const MODALITIES = [
  'Chest X-Ray',
  'Brain MRI (T1/T2/FLAIR)',
  'Abdominal CT Scan',
  'Chest CT Scan',
  'Musculoskeletal X-Ray',
  'Ultrasound / Sonography',
  'Histopathology Biopsy',
  'Mammography',
  'Other Medical Scan',
];

const NewAnalysis: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const preselectedPatientId = (location.state as any)?.patientId || '';

  const [patients, setPatients] = useState<PatientOption[]>([]);
  const [selectedPatientId, setSelectedPatientId] = useState(preselectedPatientId);
  const [imageType, setImageType] = useState('Chest X-Ray');
  const [clinicalNotes, setClinicalNotes] = useState('');
  const [preliminaryFindings, setPreliminaryFindings] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [loadingPatients, setLoadingPatients] = useState(true);

  useEffect(() => {
    const fetchPatients = async () => {
      try {
        const res = await api.get('/patients');
        setPatients(res.data.patients || []);
      } catch (err) {
        toast.error('Failed to load patient roster.');
      } finally {
        setLoadingPatients(false);
      }
    };
    fetchPatients();
  }, []);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      const selected = acceptedFiles[0];
      setFile(selected);
      const url = URL.createObjectURL(selected);
      setPreviewUrl(url);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.webp', '.bmp'],
    },
    maxFiles: 1,
    maxSize: 20 * 1024 * 1024, // 20MB
  });

  const clearFile = (e: React.MouseEvent) => {
    e.stopPropagation();
    setFile(null);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
  };

  const handleStartAnalysis = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedPatientId) {
      toast.error('Please select an active patient chart.');
      return;
    }

    if (!file) {
      toast.error('Please upload a diagnostic medical scan.');
      return;
    }

    if (!clinicalNotes.trim()) {
      toast.error('Please provide clinical notes or presenting symptoms to reduce AI hallucinations.');
      return;
    }

    try {
      setAnalyzing(true);
      const formData = new FormData();
      formData.append('image', file);
      formData.append('patientId', selectedPatientId);
      formData.append('imageType', imageType);
      formData.append('clinicalNotes', clinicalNotes.trim());
      formData.append('findings', preliminaryFindings.trim());

      const res = await api.post('/analysis/analyze', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      toast.success('Multimodal analysis generated with full evidence mapping!');
      navigate(`/analysis/${res.data.analysis.id}`);
    } catch (err: any) {
      console.error(err);
      toast.error(
        err.response?.data?.error ||
          'Diagnostic analysis failed. Please verify API configuration or file format.'
      );
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <Layout title="Multimodal AI Diagnostic Workspace">
      <div className="px-4 lg:px-8 py-6 space-y-6 max-w-5xl mx-auto">
        {/* Banner */}
        <div className="bg-gradient-to-r from-blue-900/30 via-slate-900 to-indigo-950/30 border border-blue-500/30 rounded-2xl p-6 shadow-xl relative overflow-hidden">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative z-10">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-blue-400" />
                <h2 className="text-xl font-bold text-white tracking-tight">
                  Second-Opinion AI Medical Imaging Assistant
                </h2>
              </div>
              <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
                NEXUS-Q synthesizes diagnostic medical scans with patient clinical notes to
                detect abnormalities, map exact anatomical regions, and compute confidence
                metrics with strict anti-hallucination guardrails.
              </p>
            </div>
            <Badge variant="info" className="px-3 py-1 font-semibold text-xs whitespace-nowrap">
              Gemini 2.0 Multimodal
            </Badge>
          </div>
        </div>

        {/* Warning / Guardrail Note */}
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 flex items-start gap-3 text-xs text-amber-200">
          <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
          <div className="leading-relaxed">
            <span className="font-semibold text-amber-300">Clinical Protocol: </span>
            This system operates exclusively as a decision support copilot for certified medical
            practitioners. All AI findings must be correlated with clinical judgment.
          </div>
        </div>

        <form onSubmit={handleStartAnalysis} className="space-y-6">
          {/* Step 1: Patient Selection */}
          <div className="bg-[#1e293b] border border-slate-700/60 rounded-2xl p-6 space-y-4">
            <div className="flex items-center gap-2">
              <User className="w-5 h-5 text-blue-400" />
              <h3 className="text-sm font-semibold text-slate-200 uppercase tracking-wider">
                Step 1: Select Patient Record
              </h3>
            </div>

            {loadingPatients ? (
              <p className="text-xs text-slate-400">Loading patients...</p>
            ) : patients.length === 0 ? (
              <div className="p-4 bg-slate-900 rounded-xl text-center text-xs text-slate-400">
                <span>No patients found under your account. </span>
                <button
                  type="button"
                  onClick={() => navigate('/patients')}
                  className="text-blue-400 underline font-medium"
                >
                  Create a patient first
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">
                    Select Attending Patient *
                  </label>
                  <select
                    value={selectedPatientId}
                    onChange={(e) => setSelectedPatientId(e.target.value)}
                    required
                    className="w-full px-3 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-slate-100 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  >
                    <option value="">-- Choose Patient --</option>
                    {patients.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.age}y, {p.gender})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">
                    Imaging Modality / Scan Type *
                  </label>
                  <select
                    value={imageType}
                    onChange={(e) => setImageType(e.target.value)}
                    required
                    className="w-full px-3 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-slate-100 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  >
                    {MODALITIES.map((mod) => (
                      <option key={mod} value={mod}>
                        {mod}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}
          </div>

          {/* Step 2: Upload Medical Scan */}
          <div className="bg-[#1e293b] border border-slate-700/60 rounded-2xl p-6 space-y-4">
            <div className="flex items-center gap-2">
              <ScanLine className="w-5 h-5 text-blue-400" />
              <h3 className="text-sm font-semibold text-slate-200 uppercase tracking-wider">
                Step 2: Upload Diagnostic Scan
              </h3>
            </div>

            {!previewUrl ? (
              <div
                {...getRootProps()}
                className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-colors ${
                  isDragActive
                    ? 'border-blue-500 bg-blue-500/10'
                    : 'border-slate-700 hover:border-slate-500 bg-slate-900/50'
                }`}
              >
                <input {...getInputProps()} />
                <Upload className="w-10 h-10 text-slate-400 mx-auto mb-3" />
                <p className="text-sm font-semibold text-slate-200">
                  Drag & drop medical image here, or click to browse
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  Supports DICOM exports, High-Res PNG, JPEG, WEBP up to 20MB
                </p>
              </div>
            ) : (
              <div className="relative rounded-2xl overflow-hidden border border-slate-700 bg-black/80 max-h-96 flex items-center justify-center">
                <img
                  src={previewUrl}
                  alt="Medical scan preview"
                  className="max-h-96 w-auto object-contain"
                />
                <button
                  type="button"
                  onClick={clearFile}
                  className="absolute top-3 right-3 p-2 rounded-full bg-slate-900/80 text-slate-300 hover:text-white hover:bg-red-600 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
                <div className="absolute bottom-3 left-3 bg-slate-900/90 px-3 py-1.5 rounded-lg text-xs text-slate-300 border border-slate-700">
                  {file?.name} ({(file?.size! / (1024 * 1024)).toFixed(2)} MB)
                </div>
              </div>
            )}
          </div>

          {/* Step 3: Clinical Context & Notes */}
          <div className="bg-[#1e293b] border border-slate-700/60 rounded-2xl p-6 space-y-4">
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-400" />
              <h3 className="text-sm font-semibold text-slate-200 uppercase tracking-wider">
                Step 3: Clinical Notes & Context (Mandatory)
              </h3>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Presenting Symptoms, Onset & Clinical Presentation *
              </label>
              <textarea
                rows={3}
                value={clinicalNotes}
                onChange={(e) => setClinicalNotes(e.target.value)}
                placeholder="e.g. 58-year-old male with persistent dry cough for 3 weeks, low-grade fever, mild dyspnea on exertion. Non-smoker. No previous respiratory disease."
                required
                className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-slate-100 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none placeholder-slate-500 leading-relaxed"
              />
              <p className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
                <Info className="w-3.5 h-3.5 text-blue-400" />
                Crucial for multimodal correlation. AI cross-references clinical notes to eliminate false-positive image artifacts.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Preliminary Doctor Observation / Suspected Pathology (Optional)
              </label>
              <input
                type="text"
                value={preliminaryFindings}
                onChange={(e) => setPreliminaryFindings(e.target.value)}
                placeholder="e.g. Suspected consolidation in right lower lobe vs atelectasis"
                className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-slate-100 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none placeholder-slate-500"
              />
            </div>
          </div>

          {/* Submit */}
          <div className="pt-2">
            <Button
              type="submit"
              variant="primary"
              size="lg"
              loading={analyzing}
              disabled={!file || !selectedPatientId || !clinicalNotes.trim()}
              className="w-full py-4 text-base font-semibold shadow-xl shadow-blue-600/20 bg-blue-600 hover:bg-blue-500"
            >
              <Activity className="w-5 h-5 mr-2" />
              {analyzing
                ? 'Synthesizing Multimodal Model & Extracting Regions...'
                : 'Run Multimodal Medical Diagnostic Analysis'}
            </Button>
          </div>
        </form>
      </div>
    </Layout>
  );
};

export default NewAnalysis;
