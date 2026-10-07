import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  User,
  Activity,
  ScanLine,
  Phone,
  Mail,
  MapPin,
  Pill,
  AlertTriangle,
  FileText,
  Clock,
  ArrowLeft,
  ChevronRight,
} from 'lucide-react';
import toast from 'react-hot-toast';
import Layout from '../components/layout/Layout';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import api from '../config/api';

interface Patient {
  id: string;
  name: string;
  age: number;
  gender: string;
  bloodType?: string;
  phone?: string;
  email?: string;
  address?: string;
  medicalHistory?: string;
  allergies?: string[];
  currentMedications?: string[];
  assignedDoctorName?: string;
  createdAt: string;
}

interface AnalysisItem {
  id: string;
  imageType: string;
  imageName?: string;
  clinicalNotes?: string;
  createdAt: string;
  analysis: {
    summary: string;
    imageQuality: string;
    findings: Array<{
      finding: string;
      confidence: number;
      severity: string;
    }>;
  };
}

const PatientDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [patient, setPatient] = useState<Patient | null>(null);
  const [analyses, setAnalyses] = useState<AnalysisItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'history' | 'scans'>('overview');

  useEffect(() => {
    const fetchPatientData = async () => {
      try {
        setLoading(true);
        const [patRes, anaRes] = await Promise.all([
          api.get(`/patients/${id}`),
          api.get(`/patients/${id}/analyses`),
        ]);
        setPatient(patRes.data.patient);
        setAnalyses(anaRes.data.analyses || []);
      } catch (err: any) {
        toast.error('Failed to load patient record.');
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchPatientData();
  }, [id]);

  if (loading) {
    return (
      <Layout title="Patient Chart">
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full" />
        </div>
      </Layout>
    );
  }

  if (!patient) {
    return (
      <Layout title="Patient Chart">
        <div className="p-8 text-center text-slate-600">
          <p>Patient record not found.</p>
          <Button variant="secondary" className="mt-4" onClick={() => navigate('/patients')}>
            Back to Roster
          </Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title={`Patient Chart: ${patient.name}`}>
      <div className="px-4 lg:px-8 py-6 space-y-6 max-w-7xl mx-auto">
        {/* Top Breadcrumb & Actions */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate('/patients')}
            className="flex items-center gap-1.5 text-xs text-slate-600 hover:text-slate-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Patients</span>
          </button>

          <Button
            variant="primary"
            size="sm"
            onClick={() => navigate('/analysis/new', { state: { patientId: patient.id } })}
            className="flex items-center gap-2"
          >
            <ScanLine className="w-4 h-4" />
            <span>New AI Scan</span>
          </Button>
        </div>

        {/* Patient Header Card */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-600 to-blue-800 flex items-center justify-center text-white text-2xl font-bold shadow-sm shadow-blue-900/10">
                {patient.name.charAt(0)}
              </div>
              <div>
                <h2 className="text-2xl font-bold text-slate-900">{patient.name}</h2>
                <div className="flex flex-wrap items-center gap-2.5 mt-1 text-xs text-slate-600">
                  <span>{patient.age} years old</span>
                  <span>•</span>
                  <span>{patient.gender}</span>
                  <span>•</span>
                  <Badge variant="info">Blood: {patient.bloodType || 'Unknown'}</Badge>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 border-t md:border-t-0 md:border-l border-slate-200 pt-4 md:pt-0 md:pl-6 text-xs text-slate-600">
              <div>
                <span className="block text-slate-500 font-medium">Attending Physician</span>
                <span className="text-slate-800 font-semibold text-sm">
                  {patient.assignedDoctorName || 'Assigned Staff'}
                </span>
              </div>
              <div className="hidden sm:block w-px h-8 bg-slate-100" />
              <div>
                <span className="block text-slate-500 font-medium">Record Created</span>
                <span className="text-slate-800">
                  {new Date(patient.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex gap-2 border-b border-slate-200 mt-6 -mb-2">
            {[
              { id: 'overview', label: 'Patient Overview', icon: User },
              { id: 'history', label: 'Clinical History', icon: FileText },
              { id: 'scans', label: `Diagnostic Scans (${analyses.length})`, icon: Activity },
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-2 pb-3 px-3 text-xs font-semibold border-b-2 transition-all ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Tab 1: Overview */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4">
              <h3 className="text-sm font-semibold text-slate-800">
                Contact & Residential Details
              </h3>
              <div className="space-y-3 text-sm">
                <div className="flex items-center gap-3 text-slate-700">
                  <Phone className="w-4 h-4 text-slate-600" />
                  <span>{patient.phone || 'No phone recorded'}</span>
                </div>
                <div className="flex items-center gap-3 text-slate-700">
                  <Mail className="w-4 h-4 text-slate-600" />
                  <span>{patient.email || 'No email recorded'}</span>
                </div>
                <div className="flex items-center gap-3 text-slate-700">
                  <MapPin className="w-4 h-4 text-slate-600" />
                  <span>{patient.address || 'No address provided'}</span>
                </div>
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4">
              <h3 className="text-sm font-semibold text-slate-800">
                Diagnostics Summary
              </h3>
              <div className="space-y-2">
                <p className="text-xs text-slate-600">
                  Total multimodal scans analyzed by TetrixAI:
                </p>
                <div className="text-3xl font-bold text-blue-600">{analyses.length}</div>
                <p className="text-xs text-slate-500">
                  Last imaging procedure:{' '}
                  {analyses[0]
                    ? new Date(analyses[0].createdAt).toLocaleDateString()
                    : 'None yet'}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Clinical History */}
        {activeTab === 'history' && (
          <div className="space-y-6">
            <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-3">
              <h3 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
                <FileText className="w-4 h-4 text-blue-600" />
                Medical Baseline & Prior Conditions
              </h3>
              <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-200">
                {patient.medicalHistory || 'No previous medical history recorded.'}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-3">
                <h3 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-700" />
                  Known Allergies & Contraindications
                </h3>
                {patient.allergies && patient.allergies.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {patient.allergies.map((allergy, i) => (
                      <Badge key={i} variant="danger">
                        {allergy}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-500">No known allergies reported.</p>
                )}
              </div>

              <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-3">
                <h3 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
                  <Pill className="w-4 h-4 text-emerald-700" />
                  Current Active Medications
                </h3>
                {patient.currentMedications && patient.currentMedications.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {patient.currentMedications.map((med, i) => (
                      <Badge key={i} variant="success">
                        {med}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-500">No active medications recorded.</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Diagnostic Scans */}
        {activeTab === 'scans' && (
          <div className="space-y-4">
            {analyses.length === 0 ? (
              <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center text-slate-500 space-y-3">
                <ScanLine className="w-12 h-12 mx-auto opacity-30 text-slate-600" />
                <p className="text-base font-medium text-slate-700">No scans on file for this patient</p>
                <p className="text-xs max-w-sm mx-auto">
                  Upload an X-ray, CT, MRI, or pathology scan to analyze with TetrixAI.
                </p>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => navigate('/analysis/new', { state: { patientId: patient.id } })}
                  className="mt-2"
                >
                  Run First Analysis
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {analyses.map((scan) => (
                  <div
                    key={scan.id}
                    onClick={() => navigate(`/analysis/${scan.id}`)}
                    className="bg-white border border-slate-200 rounded-2xl p-5 hover:border-blue-300 transition-all cursor-pointer shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4"
                  >
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center gap-3">
                        <Badge variant="info">{scan.imageType.toUpperCase()}</Badge>
                        <span className="text-xs text-slate-500 flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          {new Date(scan.createdAt).toLocaleString()}
                        </span>
                        <Badge
                          variant={
                            scan.analysis.imageQuality?.toLowerCase().includes('poor')
                              ? 'danger'
                              : 'success'
                          }
                        >
                          Quality: {scan.analysis.imageQuality || 'Standard'}
                        </Badge>
                      </div>

                      <p className="text-sm font-semibold text-slate-800">
                        {scan.analysis.summary}
                      </p>

                      <div className="flex flex-wrap gap-2 pt-1">
                        {scan.analysis.findings?.map((f, fi) => (
                          <span
                            key={fi}
                            className="text-xs bg-slate-50 px-2.5 py-1 rounded-md border border-slate-200 text-slate-700"
                          >
                            {f.finding} ({f.confidence}%)
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end md:self-center">
                      <Button variant="ghost" size="sm" className="text-blue-600">
                        <span>View Detailed Report</span>
                        <ChevronRight className="w-4 h-4 ml-1" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default PatientDetail;
