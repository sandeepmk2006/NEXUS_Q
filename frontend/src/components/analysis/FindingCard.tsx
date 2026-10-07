import { MapPin, FileText, CheckCircle2 } from 'lucide-react';
import ConfidenceMeter from './ConfidenceMeter';
import Badge from '../ui/Badge';

export interface MedicalFinding {
  finding: string;
  location: string;
  boundingBox?: [number, number, number, number] | null;
  evidenceSource?: 'image' | 'clinical_notes' | 'both';
  confidence: number;
  confidenceBreakdown?: {
    modelConfidence: number;
    qualityPenalty: number;
    ceiling: number;
    final: number;
    formula: string;
  };
  severity: 'low' | 'moderate' | 'high' | 'critical';
  supportingEvidence: string;
  recommendation: string;
}

interface FindingCardProps {
  finding: MedicalFinding;
  index: number;
  active?: boolean;
  onSelect?: () => void;
}

const severityConfig: Record<
  MedicalFinding['severity'],
  { variant: 'success' | 'warning' | 'danger' | 'info'; border: string }
> = {
  low: { variant: 'success', border: 'border-emerald-200' },
  moderate: { variant: 'warning', border: 'border-amber-200' },
  high: { variant: 'danger', border: 'border-orange-200' },
  critical: { variant: 'danger', border: 'border-red-200' },
};

const FindingCard: React.FC<FindingCardProps> = ({ finding, index, active, onSelect }) => {
  const config = severityConfig[finding.severity] || severityConfig.moderate;

  return (
    <div
      onClick={onSelect}
      className={`bg-white border ${config.border} ${active ? 'ring-2 ring-blue-500' : ''} rounded-2xl p-5 shadow-sm relative overflow-hidden transition-all hover:border-blue-300 ${onSelect ? 'cursor-pointer' : ''}`}
    >
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div className="space-y-3 flex-1">
          {/* Header Row */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-slate-100 border border-slate-200 text-xs font-semibold text-slate-700 flex items-center justify-center">
              {index + 1}
            </span>
            <h4 className="text-base font-semibold text-slate-900">{finding.finding}</h4>
            <Badge variant={config.variant} className="capitalize font-semibold">
              {finding.severity} Severity
            </Badge>
          </div>

          {/* Location Badge / Coordinates */}
          <div className="flex items-center gap-2 text-xs font-medium text-blue-600 bg-blue-50 border border-blue-200 px-3 py-1.5 rounded-lg w-fit">
            <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
            <span>
              Location: {finding.location}
              {!finding.boundingBox && ' (no image region - based on clinical notes)'}
            </span>
          </div>

          {/* Supporting Evidence */}
          <div className="bg-slate-50 rounded-xl p-3 border border-slate-200 space-y-1">
            <div className="flex items-center gap-1.5 text-xs font-medium text-slate-700">
              <FileText className="w-3.5 h-3.5 text-blue-600" />
              <span>Supporting Clinical Evidence:</span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed pl-5">
              {finding.supportingEvidence}
            </p>
          </div>

          {/* Clinical Recommendation */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 space-y-1">
            <div className="flex items-center gap-1.5 text-xs font-medium text-blue-600">
              <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
              <span>Doctor Recommendation:</span>
            </div>
            <p className="text-xs text-blue-800 leading-relaxed pl-5 italic">
              "{finding.recommendation}"
            </p>
          </div>
        </div>

        {/* Confidence Meter */}
        <div className="flex sm:flex-col items-center justify-center p-3 rounded-xl bg-slate-50 border border-slate-200 min-w-[90px]">
          <ConfidenceMeter confidence={finding.confidence} size="md" />
          {finding.confidenceBreakdown && (
            <dl className="mt-2 text-[11px] text-slate-600 space-y-0.5 w-full" title={finding.confidenceBreakdown.formula}>
              <div className="flex justify-between gap-3">
                <dt>Model</dt>
                <dd className="tabular-nums">{finding.confidenceBreakdown.modelConfidence}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt>Image quality</dt>
                <dd className="tabular-nums">-{finding.confidenceBreakdown.qualityPenalty}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt>Cap</dt>
                <dd className="tabular-nums">{finding.confidenceBreakdown.ceiling}</dd>
              </div>
            </dl>
          )}
        </div>
      </div>
    </div>
  );
};

export default FindingCard;
