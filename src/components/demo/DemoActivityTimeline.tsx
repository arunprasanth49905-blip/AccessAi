import React from 'react';
import { Activity, Clock, Trash2, Cpu } from 'lucide-react';

export interface DemoActivityEvent {
  id: string;
  timestamp: string;
  category: 'VISION' | 'SAFETY' | 'VOICE' | 'OCR' | 'TRANSLATION' | 'NAVIGATION' | 'SYSTEM';
  message: string;
  source: 'ai' | 'fallback' | 'system';
}

interface DemoActivityTimelineProps {
  events: DemoActivityEvent[];
  onClear?: () => void;
}

export const DemoActivityTimeline: React.FC<DemoActivityTimelineProps> = ({ events, onClear }) => {
  const getCategoryColor = (category: DemoActivityEvent['category']) => {
    switch (category) {
      case 'VISION':
        return 'bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800';
      case 'SAFETY':
        return 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800';
      case 'VOICE':
        return 'bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800';
      case 'OCR':
        return 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800';
      case 'TRANSLATION':
        return 'bg-teal-100 dark:bg-teal-950 text-teal-700 dark:text-teal-300 border-teal-200 dark:border-teal-800';
      case 'NAVIGATION':
        return 'bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800';
      case 'SYSTEM':
      default:
        return 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700';
    }
  };

  return (
    <div className="p-4 sm:p-5 rounded-3xl bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 shadow-md space-y-3">
      <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800 text-xs">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-brand-600" />
          <span className="font-extrabold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
            Technical Activity Log
          </span>
          <span className="text-[11px] font-semibold text-slate-400">
            ({events.length} {events.length === 1 ? 'event' : 'events'})
          </span>
        </div>

        {events.length > 0 && onClear && (
          <button
            type="button"
            onClick={onClear}
            className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-400 hover:text-rose-500 transition-colors"
          >
            <Trash2 className="w-3 h-3" />
            <span>Clear</span>
          </button>
        )}
      </div>

      {events.length === 0 ? (
        <div className="text-center py-6 text-slate-400 text-xs font-medium">
          <Clock className="w-6 h-6 mx-auto text-slate-300 dark:text-slate-700 mb-1" />
          <p>No activity yet. Run any scenario or the Judge Demo to log events.</p>
        </div>
      ) : (
        <div className="max-h-56 overflow-y-auto space-y-2 pr-1 scrollbar-thin">
          {events.map((evt) => (
            <div
              key={evt.id}
              className="p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-start justify-between gap-2 text-xs"
            >
              <div className="space-y-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span
                    className={`text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded-md border ${getCategoryColor(
                      evt.category
                    )}`}
                  >
                    {evt.category}
                  </span>
                  <span className="text-slate-400 text-[10px] font-mono">{evt.timestamp}</span>
                </div>
                <p className="font-semibold text-slate-800 dark:text-slate-200 break-words leading-relaxed">
                  {evt.message}
                </p>
              </div>

              <span
                className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full whitespace-nowrap shrink-0 border ${
                  evt.source === 'ai'
                    ? 'bg-brand-50 dark:bg-brand-950 text-brand-700 dark:text-brand-300 border-brand-200 dark:border-brand-800'
                    : 'bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800'
                }`}
              >
                {evt.source === 'ai' ? 'Gemini AI' : 'Fallback'}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
