import React from 'react';
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X } from 'lucide-react';
import { useAssistant } from '../../context/AssistantContext';

export const ToastContainer: React.FC = () => {
  const { toasts, dismissToast } = useAssistant();

  if (toasts.length === 0) return null;

  const iconMap = {
    success: <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />,
    warning: <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />,
    alert: <AlertCircle className="w-5 h-5 text-rose-500 shrink-0" />,
    info: <Info className="w-5 h-5 text-brand-500 shrink-0" />,
  };

  return (
    <div
      className="fixed bottom-20 sm:bottom-6 right-4 sm:right-6 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none"
      aria-live="polite"
      aria-atomic="true"
    >
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className="pointer-events-auto flex items-start gap-3 p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl transition-all transform translate-y-0"
          role="alert"
        >
          {iconMap[toast.type]}
          <div className="flex-1 min-w-0">
            <div className="text-sm font-bold text-slate-900 dark:text-slate-100">{toast.title}</div>
            {toast.description && (
              <div className="text-xs text-slate-600 dark:text-slate-400 mt-0.5 leading-normal">
                {toast.description}
              </div>
            )}
          </div>
          <button
            onClick={() => dismissToast(toast.id)}
            className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg"
            aria-label="Dismiss notification"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  );
};
