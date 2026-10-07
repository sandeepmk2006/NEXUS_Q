import { MapPin, FileText, CheckCircle2 } from 'lucide-react';
import ConfidenceMeter from './ConfidenceMeter';
import Badge from '../ui/Badge';

export interface MedicalFinding {
  finding: string;
  location: string;
  boundingBox?: [number, number, number, number] | null;
  evidenceSource?: 'image' | 'clinical_notes' | 'both';
  confidence: number;
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
  low: { variant: 'success', border: 'border-emerald-500/20' },
  moderate: { variant: 'warning', border: 'border-amber-500/20' },
  high: { variant: 'danger', border: 'border-orange-500/30' },
  critical: { variant: 'danger', border: 'border-red-500/40' },
};

const FindingCard: React.FC<FindingCardProps> = ({ finding, index, active, onSelect }) => {
  const config = severityConfig[finding.severity] || severityConfig.moderate;

  return (
    <div
      onClick={onSelect}
      className={`bg-[#1e293b] border ${config.border} ${active ? 'ring-2 ring-blue-500' : ''} rounded-2xl p-5 shadow-lg relative overflow-hidden transition-all hover:border-slate-600 ${onSelect ? 'cursor-pointer' : ''}`}
    >
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div className="space-y-3 flex-1">
          {/* Header Row */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-slate-800 border border-slate-700 text-xs font-semibold text-slate-300 flex items-center justify-center">
              {index + 1}
            </span>
            <h4 className="text-base font-semibold text-slate-100">{finding.finding}</h4>
            <Badge variant={config.variant} className="capitalize font-semibold">
              {finding.severity} Severity
            </Badge>
          </div>

          {/* Location Badge / Coordinates */}
          <div className="flex items-center gap-2 text-xs font-medium text-blue-400 bg-blue-500/10 border border-blue-500/20 px-3 py-1.5 rounded-lg w-fit">
            <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
            <span>
              Location: {finding.location}
              {!finding.boundingBox && ' (no image region - based on clinical notes)'}
            </span>
          </div>

          {/* Supporting Evidence */}
          <div className="bg-slate-900/60 rounded-xl p-3 border border-slate-800 space-y-1">
            <div className="flex items-center gap-1.5 text-xs font-medium text-slate-300">
              <FileText className="w-3.5 h-3.5 text-blue-400" />
              <span>Supporting Clinical Evidence:</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed pl-5">
              {finding.supportingEvidence}
            </p>
          </div>

          {/* Clinical Recommendation */}
          <div className="bg-blue-950/20 border border-blue-900/30 rounded-xl p-3 space-y-1">
            <div className="flex items-center gap-1.5 text-xs font-medium text-blue-300">
              <CheckCircle2 className="w-3.5 h-3.5 text-blue-400" />
              <span>Doctor Recommendation:</span>
            </div>
            <p className="text-xs text-blue-200/90 leading-relaxed pl-5 italic">
              "{finding.recommendation}"
            </p>
          </div>
        </div>

        {/* Confidence Meter */}
        <div className="flex sm:flex-col items-center justify-center p-3 rounded-xl bg-slate-900/40 border border-slate-800/80 min-w-[90px]">
          <ConfidenceMeter confidence={finding.confidence} size="md" />
        </div>
      </div>
    </div>
  );
};

export default FindingCard;
