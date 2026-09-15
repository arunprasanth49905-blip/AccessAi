import React from 'react';
import { ShieldCheck, AlertTriangle, AlertCircle, Info } from 'lucide-react';

interface ConfidenceIndicatorProps {
  level: 'high' | 'medium' | 'low';
  percentage?: number;
  showDetails?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export const ConfidenceIndicator: React.FC<ConfidenceIndicatorProps> = ({
  level,
  percentage,
  showDetails = true,
  size = 'md',
}) => {
  const config = {
    high: {
      label: 'High confidence',
      color: 'bg-emerald-50 text-emerald-800 border-emerald-300 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800',
      dot: 'bg-emerald-500',
      icon: <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />,
      tag: '🟢',
      advice: 'Strong visual match. Verify in dynamic environments.',
    },
    medium: {
      label: 'Medium confidence',
      color: 'bg-amber-50 text-amber-900 border-amber-300 dark:bg-amber-950/50 dark:text-amber-200 dark:border-amber-800',
      dot: 'bg-amber-500',
      icon: <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400" />,
      tag: '🟡',
      advice: 'Please verify before moving.',
    },
    low: {
      label: 'Low confidence',
      color: 'bg-rose-50 text-rose-900 border-rose-300 dark:bg-rose-950/50 dark:text-rose-200 dark:border-rose-800',
      dot: 'bg-rose-500',
      icon: <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400" />,
      tag: '🔴',
      advice: "I'm not completely sure what this object is. Please verify before relying on this information.",
    },
  };

  const current = config[level];

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5 gap-1.5',
    md: 'text-sm px-3 py-1 gap-2',
    lg: 'text-base px-4 py-1.5 gap-2.5 font-medium',
  };

  return (
    <div className="inline-flex flex-col">
      <div
        className={`inline-flex items-center rounded-full border ${current.color} ${sizeClasses[size]} select-none font-medium`}
        title={current.advice}
        role="status"
        aria-label={`${current.label}${percentage ? ` ${percentage}%` : ''}`}
      >
        <span className="shrink-0">{current.icon}</span>
        <span className="font-semibold">{current.label}</span>
        {percentage !== undefined && (
          <span className="font-mono text-xs opacity-80 px-1.5 py-0.5 rounded bg-black/5 dark:bg-white/10">
            {percentage}%
          </span>
        )}
      </div>

      {showDetails && (
        <span className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1">
          <Info className="w-3 h-3 shrink-0" />
          {current.advice}
        </span>
      )}
    </div>
  );
};
