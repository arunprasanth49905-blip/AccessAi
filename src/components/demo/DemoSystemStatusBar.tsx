import React, { useState, useEffect, useCallback } from 'react';
import {
  Server,
  Eye,
  Mic,
  FileText,
  Compass,
  ShieldCheck,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Clock,
} from 'lucide-react';
import { apiService, BackendHealthResponse } from '../../services/apiService';

interface DemoSystemStatusBarProps {
  onStatusChange?: (status: BackendHealthResponse | null) => void;
}

export const DemoSystemStatusBar: React.FC<DemoSystemStatusBarProps> = ({ onStatusChange }) => {
  const [health, setHealth] = useState<BackendHealthResponse | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [lastCheckedTime, setLastCheckedTime] = useState<string>('');
  const [latencyMs, setLatencyMs] = useState<number | null>(null);

  const checkHealth = useCallback(async () => {
    setIsChecking(true);
    const start = performance.now();
    const result = await apiService.getHealthDetails();
    const end = performance.now();
    setLatencyMs(Math.round(end - start));
    setHealth(result);
    setLastCheckedTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    setIsChecking(false);
    onStatusChange?.(result);
  }, [onStatusChange]);

  useEffect(() => {
    checkHealth();
  }, [checkHealth]);

  const isBackendOnline = health?.status === 'ok';
  const isGeminiActive = Boolean(health?.ai?.configured);

  return (
    <div className="p-4 sm:p-5 rounded-3xl bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 shadow-md space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3 pb-2 border-b border-slate-100 dark:border-slate-800 text-xs">
        <div className="flex items-center gap-2">
          <Server className="w-4 h-4 text-brand-600 dark:text-brand-400" />
          <span className="font-extrabold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
            Live System Capabilities
          </span>
          <span className="text-slate-400 hidden sm:inline">•</span>
          <span className="text-slate-500 font-medium hidden sm:inline">
            Real-time backend status verification
          </span>
        </div>

        <div className="flex items-center gap-3">
          {lastCheckedTime && (
            <div className="flex items-center gap-1 text-slate-400 text-[11px] font-medium">
              <Clock className="w-3 h-3" />
              <span>Checked {lastCheckedTime}</span>
              {latencyMs !== null && isBackendOnline && (
                <span className="text-emerald-600 dark:text-emerald-400 font-mono font-bold">({latencyMs}ms)</span>
              )}
            </div>
          )}

          <button
            type="button"
            onClick={checkHealth}
            disabled={isChecking}
            title="Refresh system status"
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 transition-all disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isChecking ? 'animate-spin text-brand-600' : ''}`} />
            <span className="hidden xs:inline">Verify</span>
          </button>
        </div>
      </div>

      {/* Capabilities Status Grid */}
      <div className="grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-6 gap-2">
        {/* 1. Backend / AI Connection */}
        <div className="p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[10px] font-extrabold uppercase tracking-wider">AI Backend</span>
            <Server className="w-3.5 h-3.5 text-brand-600" />
          </div>
          <div className="flex items-center gap-1.5">
            <span
              className={`w-2 h-2 rounded-full ${
                isBackendOnline
                  ? isGeminiActive
                    ? 'bg-emerald-500 animate-pulse'
                    : 'bg-amber-500'
                  : 'bg-rose-500'
              }`}
            />
            <span className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
              {isBackendOnline ? (isGeminiActive ? 'Gemini AI' : 'Fallback') : 'Offline'}
            </span>
          </div>
        </div>

        {/* 2. Vision AI */}
        <div className="p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[10px] font-extrabold uppercase tracking-wider">Vision AI</span>
            <Eye className="w-3.5 h-3.5 text-purple-600" />
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
              {isBackendOnline ? 'Ready (API)' : 'Ready (Demo)'}
            </span>
          </div>
        </div>

        {/* 3. Voice Assistant */}
        <div className="p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[10px] font-extrabold uppercase tracking-wider">Voice AI</span>
            <Mic className="w-3.5 h-3.5 text-blue-600" />
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
              {isBackendOnline ? 'Ready (API)' : 'Ready (Demo)'}
            </span>
          </div>
        </div>

        {/* 4. Multimodal OCR */}
        <div className="p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[10px] font-extrabold uppercase tracking-wider">OCR Reader</span>
            <FileText className="w-3.5 h-3.5 text-emerald-600" />
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
              {isBackendOnline && health?.ocr?.available ? 'Ready (API)' : 'Ready (Demo)'}
            </span>
          </div>
        </div>

        {/* 5. Navigation Engine */}
        <div className="p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[10px] font-extrabold uppercase tracking-wider">Navigation</span>
            <Compass className="w-3.5 h-3.5 text-amber-600" />
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="text-xs font-bold text-slate-900 dark:text-slate-100">Step-Free</span>
          </div>
        </div>

        {/* 6. Safety Guard */}
        <div className="p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[10px] font-extrabold uppercase tracking-wider">Safety Guard</span>
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400">Protected</span>
          </div>
        </div>
      </div>

      {!isBackendOnline && (
        <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-[11px] text-amber-800 dark:text-amber-300 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>Backend offline. AccessAI Demo Center will execute using deterministic fail-safe fixtures.</span>
          </div>
          <span className="font-bold uppercase tracking-wider text-[10px]">100% Demo Ready</span>
        </div>
      )}
    </div>
  );
};
