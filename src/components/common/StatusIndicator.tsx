import React, { useState } from 'react';
import { Wifi, WifiOff, AlertCircle, ChevronDown } from 'lucide-react';
import { useAssistant } from '../../context/AssistantContext';
import { ConnectionStatus } from '../../types';

export const StatusIndicator: React.FC = () => {
  const { connectionStatus, setConnectionStatus } = useAssistant();
  const [isOpen, setIsOpen] = useState(false);

  const statusConfig = {
    connected: {
      label: 'Connected',
      badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950/70 dark:text-emerald-300 dark:border-emerald-800',
      dotClass: 'bg-emerald-500',
      icon: <Wifi className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />,
      subtext: 'Full multimodal cloud & local intelligence',
    },
    limited: {
      label: 'Limited connection',
      badgeClass: 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950/70 dark:text-amber-300 dark:border-amber-800',
      dotClass: 'bg-amber-500',
      icon: <AlertCircle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />,
      subtext: 'Reduced bandwidth profile engaged',
    },
    offline: {
      label: 'Offline Mode',
      badgeClass: 'bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-950/70 dark:text-rose-300 dark:border-rose-800',
      dotClass: 'bg-rose-500',
      icon: <WifiOff className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />,
      subtext: 'Local vision & speech active; some features limited',
    },
  };

  const current = statusConfig[connectionStatus];

  return (
    <div className="relative inline-block text-left">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-label={`Connection Status: ${current.label}. Click to simulate network state.`}
        className={`inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-xs font-semibold border transition-all ${current.badgeClass} hover:opacity-90 focus-visible:ring-2 focus-visible:ring-brand-500`}
      >
        <span className={`w-2 h-2 rounded-full ${current.dotClass} animate-pulse`} />
        <span>{current.label}</span>
        <ChevronDown className="w-3 h-3 opacity-70" />
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-30"
            onClick={() => setIsOpen(false)}
            aria-hidden="true"
          />
          <div className="absolute right-0 mt-2 w-64 rounded-2xl bg-white dark:bg-slate-900 shadow-xl border border-slate-200 dark:border-slate-800 z-40 p-2 text-xs">
            <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-800 font-bold text-slate-700 dark:text-slate-300 flex justify-between items-center">
              <span>Network Simulation</span>
              <span className="text-[10px] uppercase tracking-wider text-slate-400">Demo control</span>
            </div>

            {(['connected', 'limited', 'offline'] as ConnectionStatus[]).map((status) => {
              const cfg = statusConfig[status];
              const isSelected = connectionStatus === status;

              return (
                <button
                  key={status}
                  type="button"
                  onClick={() => {
                    setConnectionStatus(status);
                    setIsOpen(false);
                  }}
                  className={`w-full text-left p-2.5 my-0.5 rounded-xl flex items-start gap-2.5 transition-colors ${
                    isSelected
                      ? 'bg-slate-100 dark:bg-slate-800 font-semibold'
                      : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
                  }`}
                >
                  <span className="mt-0.5">{cfg.icon}</span>
                  <div>
                    <div className="font-semibold text-slate-800 dark:text-slate-200">{cfg.label}</div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400">{cfg.subtext}</div>
                  </div>
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
};
