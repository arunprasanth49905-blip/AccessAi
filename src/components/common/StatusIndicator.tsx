import React, { useState } from 'react';
import { Wifi, WifiOff, AlertCircle, RefreshCw, CheckCircle2, ChevronDown, Server, Cpu, Navigation, Eye, FileText } from 'lucide-react';
import { useAssistant } from '../../context/AssistantContext';

export const StatusIndicator: React.FC = () => {
  const { connectionStatus, healthDetails, checkConnection } = useAssistant();
  const [isOpen, setIsOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const statusConfig = {
    connected: {
      label: 'Connected',
      badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950/70 dark:text-emerald-300 dark:border-emerald-800',
      dotClass: 'bg-emerald-500',
      icon: <Wifi className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />,
      subtext: 'Gemini Multimodal AI Active',
    },
    limited: {
      label: 'Limited AI',
      badgeClass: 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950/70 dark:text-amber-300 dark:border-amber-800',
      dotClass: 'bg-amber-500',
      icon: <AlertCircle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />,
      subtext: 'Deterministic Fallback Active',
    },
    offline: {
      label: 'Offline',
      badgeClass: 'bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-950/70 dark:text-rose-300 dark:border-rose-800',
      dotClass: 'bg-rose-500',
      icon: <WifiOff className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />,
      subtext: 'Backend Unreachable',
    },
  };

  const current = statusConfig[connectionStatus];

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await checkConnection();
    setTimeout(() => setIsRefreshing(false), 500);
  };

  return (
    <div className="relative inline-block text-left">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-label={`Connection Status: ${current.label} (${current.subtext}). Click to view system connection details.`}
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
          <div className="absolute right-0 mt-2 w-72 rounded-2xl bg-white dark:bg-slate-900 shadow-2xl border border-slate-200 dark:border-slate-800 z-40 p-4 text-xs space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-1.5 font-bold text-slate-800 dark:text-slate-200">
                <Server className="w-4 h-4 text-brand-600" />
                <span>System Connection Health</span>
              </div>
              <button
                type="button"
                onClick={handleRefresh}
                disabled={isRefreshing}
                title="Ping backend health endpoint"
                className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-slate-100"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-brand-600' : ''}`} />
              </button>
            </div>

            {/* Service rows */}
            <div className="space-y-2 text-slate-600 dark:text-slate-300">
              <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60">
                <span className="flex items-center gap-1.5 font-medium">
                  <Server className="w-3.5 h-3.5 text-slate-400" />
                  Backend API:
                </span>
                <span className={`font-bold ${connectionStatus !== 'offline' ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {connectionStatus !== 'offline' ? 'Online (8000)' : 'Unreachable'}
                </span>
              </div>

              <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60">
                <span className="flex items-center gap-1.5 font-medium">
                  <Cpu className="w-3.5 h-3.5 text-slate-400" />
                  AI Intelligence:
                </span>
                <span className="font-bold text-brand-600 dark:text-brand-400">
                  {healthDetails?.ai?.configured ? 'Gemini 2.5 Flash' : 'Deterministic Fallback'}
                </span>
              </div>

              <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60">
                <span className="flex items-center gap-1.5 font-medium">
                  <FileText className="w-3.5 h-3.5 text-slate-400" />
                  OCR & Translate:
                </span>
                <span className="font-bold text-emerald-600">
                  {healthDetails?.ocr?.available ? 'Ready (5 Languages)' : 'Fallback Active'}
                </span>
              </div>

              <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60">
                <span className="flex items-center gap-1.5 font-medium">
                  <Navigation className="w-3.5 h-3.5 text-slate-400" />
                  Navigation Engine:
                </span>
                <span className="font-bold text-amber-600">
                  Step-Free Routing Ready
                </span>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
              <span>Automatic health check active</span>
              <button
                type="button"
                onClick={handleRefresh}
                className="text-brand-600 font-bold hover:underline"
              >
                Refresh Now
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
