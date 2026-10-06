import React from 'react';

interface ConfidenceMeterProps {
  confidence: number;
  size?: 'sm' | 'md' | 'lg';
}

const ConfidenceMeter: React.FC<ConfidenceMeterProps> = ({ confidence, size = 'md' }) => {
  const clamped = Math.max(0, Math.min(100, Math.round(confidence)));

  const sizeConfig = {
    sm: { dimension: 52, stroke: 5, fontSize: 'text-xs', label: false },
    md: { dimension: 80, stroke: 7, fontSize: 'text-sm font-bold', label: true },
    lg: { dimension: 110, stroke: 9, fontSize: 'text-lg font-bold', label: true },
  }[size];

  const radius = (sizeConfig.dimension - sizeConfig.stroke * 2) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (clamped / 100) * circumference;

  let colorClass = 'stroke-emerald-400';
  let textColorClass = 'text-emerald-400';
  let badgeLabel = 'High';

  if (clamped < 50) {
    colorClass = 'stroke-red-400';
    textColorClass = 'text-red-400';
    badgeLabel = 'Low';
  } else if (clamped < 75) {
    colorClass = 'stroke-amber-400';
    textColorClass = 'text-amber-400';
    badgeLabel = 'Moderate';
  }

  return (
    <div className="flex flex-col items-center justify-center">
      <div className="relative inline-flex items-center justify-center">
        <svg
          width={sizeConfig.dimension}
          height={sizeConfig.dimension}
          className="transform -rotate-90"
        >
          {/* Background circle */}
          <circle
            cx={sizeConfig.dimension / 2}
            cy={sizeConfig.dimension / 2}
            r={radius}
            stroke="currentColor"
            strokeWidth={sizeConfig.stroke}
            fill="transparent"
            className="text-slate-700/50"
          />
          {/* Progress circle */}
          <circle
            cx={sizeConfig.dimension / 2}
            cy={sizeConfig.dimension / 2}
            r={radius}
            stroke="currentColor"
            strokeWidth={sizeConfig.stroke}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            fill="transparent"
            className={`${colorClass} transition-all duration-700 ease-out`}
          />
        </svg>
        <div className={`absolute flex flex-col items-center justify-center ${textColorClass}`}>
          <span className={sizeConfig.fontSize}>{clamped}%</span>
        </div>
      </div>
      {sizeConfig.label && (
        <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider mt-1">
          {badgeLabel}
        </span>
      )}
    </div>
  );
};

export default ConfidenceMeter;
