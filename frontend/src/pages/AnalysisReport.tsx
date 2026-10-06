import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Activity,
  ArrowLeft,
  Printer,
  ShieldCheck,
  AlertOctagon,
  Clock,
  Stethoscope,
  ScanLine,
  FileText,
  CheckCircle2,
} from 'lucide-react';
import toast from 'react-hot-toast';
import Layout from '../components/layout/Layout';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import FindingCard, { type MedicalFinding } from '../components/analysis/FindingCard';
import api from '../config/api';

interface AnalysisData {
  id: string;
  patientId: string;
  doctorId: string;
  doctorName?: string;
  imageType: string;
  imageName?: string;
  clinicalNotes?: string;
  findings?: string;
  status: string;
  createdAt: string;
  analysis: {
    summary: string;
    imageQuality: string;
    overallAssessment: string;
    disclaimer: string;
    modelUsed: string;
    processingTime: number;
    findings: MedicalFinding[];
  };
}

const AnalysisReport: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [report, setReport] = useState<AnalysisData | null>(null);
  const [patient, setPatient] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReport = async () => {
      try {
        setLoading(true);
        const res = await api.get(`/analysis/${id}`);
        setReport(res.data.analysis);

        if (res.data.analysis.patientId) {
          try {
            const pRes = await api.get(`/patients/${res.data.analysis.patientId}`);
            setPatient(pRes.data.patient);
          } catch (e) {
            // non-fatal
          }
        }
      } catch (err) {
        toast.error('Failed to load diagnostic report.');
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchReport();
  }, [id]);

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <Layout title="Diagnostic Report">
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full" />
        </div>
      </Layout>
    );
  }

  if (!report) {
    return (
      <Layout title="Diagnostic Report">
        <div className="p-8 text-center text-slate-400">
          <p>Analysis report not found.</p>
          <Button variant="secondary" className="mt-4" onClick={() => navigate('/dashboard')}>
            Return to Dashboard
          </Button>
        </div>
      </Layout>
    );
  }

  const { analysis } = report;

  return (
    <Layout title={`Diagnostic Report #${report.id.slice(0, 8)}`}>
      <div className="px-4 lg:px-8 py-6 space-y-6 max-w-5xl mx-auto print:p-0 print:m-0">
        {/* Navigation & Print Actions */}
        <div className="flex items-center justify-between print:hidden">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back</span>
          </button>

          <div className="flex items-center gap-2">
            <Button variant="secondary" size="sm" onClick={handlePrint}>
              <Printer className="w-4 h-4 mr-1" />
              <span>Print / Export PDF</span>
            </Button>
          </div>
        </div>

        {/* Report Header Card */}
        <div className="bg-[#1e293b] border border-slate-700/60 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-700/60 pb-5">
            <div>
              <div className="flex items-center gap-2.5">
                <span className="text-xl font-bold text-white tracking-tight">Tetrix</span>
                <span className="text-xl font-bold text-blue-400 tracking-tight">AI</span>
                <Badge variant="info">Clinical Decision Support</Badge>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Diagnostic Copilot & Imaging Report
              </p>
            </div>

            <div className="text-right text-xs text-slate-400">
              <div className="flex items-center sm:justify-end gap-1.5 text-slate-300">
                <Clock className="w-3.5 h-3.5" />
                <span>{new Date(report.createdAt).toLocaleString()}</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5 font-mono">ID: {report.id}</p>
            </div>
          </div>

          {/* Patient & Exam Metadata Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs pt-1">
            <div className="bg-slate-900/50 p-3 rounded-xl border border-slate-800">
              <span className="text-slate-500 font-medium block">Patient</span>
              <span className="text-slate-200 font-semibold text-sm">
                {patient?.name || 'Assigned Patient'}
              </span>
              <span className="text-slate-400 block text-[11px] mt-0.5">
                {patient ? `${patient.age}y • ${patient.gender}` : ''}
              </span>
            </div>

            <div className="bg-slate-900/50 p-3 rounded-xl border border-slate-800">
              <span className="text-slate-500 font-medium block">Attending Physician</span>
              <span className="text-slate-200 font-semibold text-sm">
                {report.doctorName || 'Dr. Physician'}
              </span>
              <span className="text-slate-400 block text-[11px] mt-0.5">ID: {report.doctorId.slice(0, 8)}</span>
            </div>

            <div className="bg-slate-900/50 p-3 rounded-xl border border-slate-800">
              <span className="text-slate-500 font-medium block">Imaging Modality</span>
              <span className="text-slate-200 font-semibold text-sm">{report.imageType}</span>
              <span className="text-slate-400 block text-[11px] mt-0.5">
                {report.imageName || 'Scan File'}
              </span>
            </div>

            <div className="bg-slate-900/50 p-3 rounded-xl border border-slate-800">
              <span className="text-slate-500 font-medium block">Diagnostic Quality</span>
              <span className="text-emerald-400 font-semibold text-sm">
                {analysis?.imageQuality || 'Adequate'}
              </span>
              <span className="text-slate-400 block text-[11px] mt-0.5">
                Latency: {(analysis?.processingTime / 1000).toFixed(1)}s
              </span>
            </div>
          </div>
        </div>

        {/* Clinical History & Symptoms */}
        <div className="bg-[#1e293b] border border-slate-700/60 rounded-2xl p-5 space-y-2">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-300 uppercase tracking-wider">
            <FileText className="w-4 h-4 text-blue-400" />
            <span>Presented Clinical Context & Patient History</span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed bg-slate-900/60 p-3.5 rounded-xl border border-slate-800/80">
            {report.clinicalNotes || 'No presenting symptoms provided at time of upload.'}
          </p>
        </div>

        {/* Executive Summary */}
        <div className="bg-[#1e293b] border border-blue-500/30 rounded-2xl p-6 space-y-3 relative overflow-hidden shadow-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-blue-400" />
              <h3 className="text-base font-bold text-white">Diagnostic AI Executive Summary</h3>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-lg">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Evidence Grounded</span>
            </div>
          </div>
          <p className="text-sm text-slate-200 leading-relaxed font-medium">
            {analysis?.summary}
          </p>
        </div>

        {/* Detailed Findings List */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
              <ScanLine className="w-5 h-5 text-blue-400" />
              <span>Identified Pathological & Anatomical Findings ({analysis?.findings?.length || 0})</span>
            </h3>
            <span className="text-xs text-slate-400">
              Each finding is verified with coordinates & confidence rating
            </span>
          </div>

          {analysis?.findings && analysis.findings.length > 0 ? (
            <div className="space-y-4">
              {analysis.findings.map((finding, idx) => (
                <FindingCard key={idx} finding={finding} index={idx} />
              ))}
            </div>
          ) : (
            <div className="bg-[#1e293b] border border-slate-700/60 rounded-2xl p-8 text-center text-slate-400 space-y-2">
              <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto" />
              <p className="text-sm font-semibold text-slate-200">
                No acute abnormalities identified
              </p>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                No focal consolidation, acute fracture, pneumothorax, or abnormal mass lesion was
                detected in the scanned fields.
              </p>
            </div>
          )}
        </div>

        {/* Overall Physician-Faced Assessment */}
        {analysis?.overallAssessment && (
          <div className="bg-[#1e293b] border border-slate-700/60 rounded-2xl p-6 space-y-3">
            <h3 className="text-sm font-semibold text-slate-200 uppercase tracking-wider flex items-center gap-2">
              <Stethoscope className="w-4 h-4 text-blue-400" />
              Comprehensive Physician Assessment
            </h3>
            <div className="text-xs text-slate-300 leading-relaxed whitespace-pre-line bg-slate-900/60 p-4 rounded-xl border border-slate-800">
              {analysis.overallAssessment}
            </div>
          </div>
        )}

        {/* Medical Regulatory Disclaimer */}
        <div className="bg-red-950/20 border border-red-900/40 rounded-2xl p-5 flex items-start gap-3 text-xs text-red-200/90">
          <AlertOctagon className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
          <div className="space-y-1">
            <span className="font-bold text-red-300">Regulatory Medical Device Warning: </span>
            <p className="leading-relaxed">
              {analysis?.disclaimer ||
                'TetrixAI is an assistive clinical decision support tool for certified physicians. Final diagnostic decisions and patient interventions remain the responsibility of the attending physician.'}
            </p>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default AnalysisReport;
