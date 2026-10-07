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
import ImageOverlay from '../components/analysis/ImageOverlay';
import FindingCard, { type MedicalFinding } from '../components/analysis/FindingCard';
import api from '../config/api';

interface AnalysisData {
  id: string;
  patientId: string;
  doctorId: string;
  doctorName?: string;
  imageType: string;
  imageName?: string;
  imageDataUrl?: string | null;
  clinicalNotes?: string;
  findings?: string;
  status: string;
  createdAt: string;
  analysis: {
    summary: string;
    imageQuality: string;
    imageQualityRating?: string;
    qualityWarning?: string | null;
    comparisonCaveat?: string | null;
    droppedFindings?: number;
    notLocalized?: { condition: string; statement: string; notesEvidence: string }[];
    overallAssessment: string;
    disclaimer: string;
    modelUsed: string;
    processingTime: number;
    findings: MedicalFinding[];
  };
}

/** Reports saved before the rename may still say NEXUS-Q. */
const rebrand = (text?: string) => text?.replace(/NEXUS[-_ ]?Q/gi, 'TetrixAI');

const AnalysisReport: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [report, setReport] = useState<AnalysisData | null>(null);
  const [patient, setPatient] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeFinding, setActiveFinding] = useState<number | null>(null);

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
        <div className="p-8 text-center text-slate-600">
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
            className="flex items-center gap-1.5 text-xs text-slate-600 hover:text-slate-900 transition-colors"
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
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
            <div>
              <div className="flex items-center gap-2.5">
                <span className="text-xl font-bold tracking-tight">
                  <span className="text-slate-900">Tetrix</span>
                  <span className="text-blue-600">AI</span>
                </span>
                <Badge variant="info">Clinical Decision Support</Badge>
              </div>
              <p className="text-xs text-slate-600 mt-1">
                Diagnostic Copilot & Imaging Report
              </p>
            </div>

            <div className="text-right text-xs text-slate-600">
              <div className="flex items-center sm:justify-end gap-1.5 text-slate-700">
                <Clock className="w-3.5 h-3.5" />
                <span>{new Date(report.createdAt).toLocaleString()}</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5 font-mono">ID: {report.id}</p>
            </div>
          </div>

          {/* Patient & Exam Metadata Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs pt-1">
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
              <span className="text-slate-500 font-medium block">Patient</span>
              <span className="text-slate-800 font-semibold text-sm">
                {patient?.name || 'Assigned Patient'}
              </span>
              <span className="text-slate-600 block text-[11px] mt-0.5">
                {patient ? `${patient.age}y • ${patient.gender}` : ''}
              </span>
            </div>

            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
              <span className="text-slate-500 font-medium block">Attending Physician</span>
              <span className="text-slate-800 font-semibold text-sm">
                {report.doctorName || 'Dr. Physician'}
              </span>
              <span className="text-slate-600 block text-[11px] mt-0.5">ID: {report.doctorId.slice(0, 8)}</span>
            </div>

            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
              <span className="text-slate-500 font-medium block">Imaging Modality</span>
              <span className="text-slate-800 font-semibold text-sm">{report.imageType}</span>
              <span className="text-slate-600 block text-[11px] mt-0.5">
                {report.imageName || 'Scan File'}
              </span>
            </div>

            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
              <span className="text-slate-500 font-medium block">Diagnostic Quality</span>
              <span
                className={`font-semibold text-sm capitalize ${
                  analysis?.imageQualityRating === 'poor' || analysis?.imageQualityRating === 'fair'
                    ? 'text-amber-700'
                    : 'text-emerald-700'
                }`}
              >
                {analysis?.imageQualityRating && analysis.imageQualityRating !== 'unknown'
                  ? analysis.imageQualityRating
                  : 'Unrated'}
              </span>
              <span
                className="text-slate-600 block text-[11px] mt-0.5 line-clamp-2"
                title={analysis?.imageQuality}
              >
                {analysis?.imageQuality}
              </span>
              <span className="text-slate-500 block text-[11px]">
                Latency: {(analysis?.processingTime / 1000).toFixed(1)}s
              </span>
            </div>
          </div>
        </div>

        {/* Poor-quality warning */}
        {analysis?.qualityWarning && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3 text-xs text-amber-700">
            <AlertOctagon className="w-5 h-5 text-amber-700 flex-shrink-0" />
            <p className="leading-relaxed">{analysis.qualityWarning}</p>
          </div>
        )}

        {analysis?.comparisonCaveat && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3 text-xs text-amber-800">
            <AlertOctagon className="w-5 h-5 text-amber-700 flex-shrink-0" />
            <p className="leading-relaxed">{analysis.comparisonCaveat}</p>
          </div>
        )}

        {/* Annotated scan */}
        {report.imageDataUrl && (
          <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-3">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
              <ScanLine className="w-4 h-4 text-blue-600" />
              <span>Localized Findings (click a box or card to highlight)</span>
            </div>
            <ImageOverlay
              imageUrl={report.imageDataUrl}
              findings={analysis?.findings || []}
              activeIndex={activeFinding}
              onSelect={setActiveFinding}
            />
          </div>
        )}

        {/* Clinical History & Symptoms */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-2">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
            <FileText className="w-4 h-4 text-blue-600" />
            <span>Presented Clinical Context & Patient History</span>
          </div>
          <p className="text-xs text-slate-700 leading-relaxed bg-slate-50 p-3.5 rounded-xl border border-slate-200">
            {report.clinicalNotes || 'No presenting symptoms provided at time of upload.'}
          </p>
        </div>

        {/* Executive Summary */}
        <div className="bg-white border border-blue-200 rounded-2xl p-6 space-y-3 relative overflow-hidden shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-blue-600" />
              <h3 className="text-base font-bold text-slate-900">Diagnostic AI Executive Summary</h3>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-lg">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Evidence Grounded</span>
            </div>
          </div>
          <p className="text-sm text-slate-800 leading-relaxed font-medium">
            {rebrand(analysis?.summary)}
          </p>
        </div>

        {/* Detailed Findings List */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <ScanLine className="w-5 h-5 text-blue-600" />
              <span>Identified Pathological & Anatomical Findings ({analysis?.findings?.length || 0})</span>
            </h3>
            <span className="text-xs text-slate-600">
              Each finding is verified with coordinates & confidence rating
            </span>
          </div>

          {analysis?.findings && analysis.findings.length > 0 ? (
            <div className="space-y-4">
              {analysis.findings.map((finding, idx) => (
                <FindingCard
                  key={idx}
                  finding={finding}
                  index={idx}
                  active={activeFinding === idx}
                  onSelect={() => setActiveFinding(activeFinding === idx ? null : idx)}
                />
              ))}
            </div>
          ) : (
            <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center text-slate-600 space-y-2">
              <CheckCircle2 className="w-10 h-10 text-emerald-700 mx-auto" />
              <p className="text-sm font-semibold text-slate-800">
                {analysis?.droppedFindings ? 'No evidence-supported findings' : 'No abnormalities identified'}
              </p>
              <p className="text-xs text-slate-600 max-w-md mx-auto">
                {analysis?.droppedFindings
                  ? `Doctor, ${analysis.droppedFindings} finding(s) were discarded because they could not be tied to an image region or the clinical notes.`
                  : 'Doctor, the model found nothing it could tie to an image region or the clinical notes.'}{' '}
                This does not exclude pathology.
              </p>
            </div>
          )}
        </div>

        {/* Claims from the notes that the scan could not confirm */}
        {!!analysis?.notLocalized?.length && (
          <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-3">
            <h3 className="text-sm font-semibold text-slate-800">Raised in the notes, not found on the scan</h3>
            <ul className="space-y-2">
              {analysis.notLocalized.map((c, i) => (
                <li key={i} className="text-xs text-slate-700 bg-slate-50 border border-slate-200 rounded-xl p-3">
                  <p className="font-medium text-slate-800">{c.statement}</p>
                  <p className="mt-1 text-slate-600">{c.notesEvidence}</p>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Overall Physician-Faced Assessment */}
        {analysis?.overallAssessment && (
          <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-3">
            <h3 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
              <Stethoscope className="w-4 h-4 text-blue-600" />
              Comprehensive Physician Assessment
            </h3>
            <div className="text-xs text-slate-700 leading-relaxed whitespace-pre-line bg-slate-50 p-4 rounded-xl border border-slate-200">
              {rebrand(analysis.overallAssessment)}
            </div>
          </div>
        )}

        {/* Medical Regulatory Disclaimer */}
        <div className="bg-red-50 border border-red-200 rounded-2xl p-5 flex items-start gap-3 text-xs text-red-700/90">
          <AlertOctagon className="w-5 h-5 text-red-700 flex-shrink-0 mt-0.5" />
          <div className="space-y-1">
            <span className="font-bold text-red-700">Regulatory Medical Device Warning: </span>
            <p className="leading-relaxed">
              {rebrand(analysis?.disclaimer) ||
                'TetrixAI is an assistive clinical decision support tool for certified physicians. Final diagnostic decisions and patient interventions remain the responsibility of the attending physician.'}
            </p>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default AnalysisReport;
