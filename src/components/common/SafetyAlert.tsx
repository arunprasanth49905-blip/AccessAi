import React from 'react';
import { AlertTriangle, AlertCircle, ShieldAlert } from 'lucide-react';
import { ConfidenceIndicator } from './ConfidenceIndicator';

interface SafetyAlertProps {
  title: string;
  description: string;
  confidence: 'high' | 'medium' | 'low';
  verifyBeforeMoving?: boolean;
  onVerify?: () => void;
  className?: string;
}

export const SafetyAlert: React.FC<SafetyAlertProps> = ({
  title,
  description,
  confidence,
  verifyBeforeMoving = true,
  onVerify,
  className = '',
}) => {
  const isHighAlert = confidence === 'low' || title.toLowerCase().includes('obstacle') || title.toLowerCase().includes('hazard');

  return (
    <div
      role="alert"
      aria-live="polite"
      className={`
        rounded-2xl p-4 sm:p-5 border-2 transition-all
        ${
          isHighAlert
            ? 'bg-amber-50/90 dark:bg-amber-950/40 border-amber-400 dark:border-amber-600 text-amber-950 dark:text-amber-100 shadow-sm'
            : 'bg-blue-50/90 dark:bg-blue-950/40 border-blue-300 dark:border-blue-700 text-slate-900 dark:text-slate-100 shadow-sm'
        }
        ${className}
      `}
    >
      <div className="flex items-start gap-3.5">
        <div
          className={`p-2 rounded-xl shrink-0 ${
            isHighAlert
              ? 'bg-amber-200 dark:bg-amber-900 text-amber-800 dark:text-amber-200'
              : 'bg-blue-200 dark:bg-blue-900 text-blue-800 dark:text-blue-200'
          }`}
        >
          {isHighAlert ? <AlertTriangle className="w-6 h-6" /> : <ShieldAlert className="w-6 h-6" />}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
            <h3 className="text-base sm:text-lg font-bold tracking-tight">{title}</h3>
            <ConfidenceIndicator level={confidence} showDetails={false} size="sm" />
          </div>

          <p className="text-sm sm:text-base leading-relaxed opacity-90">{description}</p>

          {verifyBeforeMoving && (
            <div className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-100/80 dark:bg-amber-900/60 border border-amber-300 dark:border-amber-700 text-xs sm:text-sm font-semibold text-amber-900 dark:text-amber-200">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>Please verify physical path before moving.</span>
            </div>
          )}

          <div className="mt-3 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 border-t border-slate-200/60 dark:border-slate-800/60 pt-2">
            <span>AI assistance — verify critical information.</span>
            {onVerify && (
              <button
                onClick={onVerify}
                className="underline hover:text-slate-800 dark:hover:text-slate-200 font-medium"
              >
                Mark Verified
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
