import React from 'react';
import { Stethoscope, Loader2 } from 'lucide-react';

interface LoadingSpinnerProps {
  message?: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ message = 'Loading NEXUS-Q...' }) => {
  return (
    <div className="min-h-screen bg-[#0f172a] flex flex-col items-center justify-center p-4">
      <div className="relative flex items-center justify-center mb-6">
        <div className="w-16 h-16 rounded-2xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center animate-pulse">
          <Stethoscope className="w-8 h-8 text-blue-400" />
        </div>
        <div className="absolute -inset-2">
          <Loader2 className="w-20 h-20 text-blue-500/40 animate-spin" />
        </div>
      </div>
      <div className="flex items-center gap-2 mb-2">
        <span className="text-xl font-bold tracking-tight text-white">NEXUS</span>
        <span className="text-xl font-bold tracking-tight text-blue-400">-Q</span>
      </div>
      <p className="text-xs text-slate-400 font-medium tracking-wide uppercase">{message}</p>
    </div>
  );
};

export default LoadingSpinner;
