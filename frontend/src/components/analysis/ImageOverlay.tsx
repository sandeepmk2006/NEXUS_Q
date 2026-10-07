import type { MedicalFinding } from './FindingCard';

interface ImageOverlayProps {
  imageUrl: string;
  findings: MedicalFinding[];
  activeIndex: number | null;
  onSelect: (index: number | null) => void;
}

const colorFor = (severity: MedicalFinding['severity']) =>
  ({ low: '#34d399', moderate: '#fbbf24', high: '#fb923c', critical: '#f87171' })[severity] || '#fbbf24';

/** Draws each finding's normalized (0-1000) [ymin, xmin, ymax, xmax] box over the scan. */
const ImageOverlay: React.FC<ImageOverlayProps> = ({ imageUrl, findings, activeIndex, onSelect }) => (
  <div className="relative inline-block max-w-full bg-black rounded-xl overflow-hidden border border-slate-700">
    <img src={imageUrl} alt="Analyzed scan" className="block max-h-[520px] max-w-full" />
    {findings.map((f, i) => {
      if (!f.boundingBox) return null;
      const [ymin, xmin, ymax, xmax] = f.boundingBox;
      const color = colorFor(f.severity);
      const active = activeIndex === i;
      return (
        <button
          key={i}
          type="button"
          onClick={() => onSelect(active ? null : i)}
          title={`${f.finding} (${f.confidence}%)`}
          className="absolute focus:outline-none"
          style={{
            top: `${ymin / 10}%`,
            left: `${xmin / 10}%`,
            height: `${(ymax - ymin) / 10}%`,
            width: `${(xmax - xmin) / 10}%`,
            border: `2px solid ${color}`,
            background: active ? `${color}33` : 'transparent',
            boxShadow: active ? `0 0 0 2px ${color}66` : undefined,
          }}
        >
          <span
            className="absolute -top-0.5 -left-0.5 text-[10px] font-bold px-1 text-black"
            style={{ background: color }}
          >
            {i + 1}
          </span>
        </button>
      );
    })}
  </div>
);

export default ImageOverlay;
