import React from 'react';
import { Camera, Scan, BrainCircuit, UserCheck, MessageSquareCheck } from 'lucide-react';

export type PipelineStep = 'camera' | 'vision' | 'reasoning' | 'intent' | 'response';

interface ProcessingPipelineProps {
  activeStep: PipelineStep;
  compact?: boolean;
}

const STEPS: { id: PipelineStep; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'camera', label: 'Camera Input', icon: Camera },
  { id: 'vision', label: 'Vision Analysis', icon: Scan },
  { id: 'reasoning', label: 'AI Reasoning', icon: BrainCircuit },
  { id: 'intent', label: 'User Intent', icon: UserCheck },
  { id: 'response', label: 'Personalized Response', icon: MessageSquareCheck },
];

export const ProcessingPipeline: React.FC<ProcessingPipelineProps> = ({ activeStep, compact = false }) => {
  const activeIndex = STEPS.findIndex((s) => s.id === activeStep);

  return (
    <div
      className={`bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-sm`}
      aria-label="AI Multimodal Processing Pipeline"
      role="region"
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-brand-600"></span>
          </span>
          <h4 className="text-xs sm:text-sm font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Multimodal Pipeline
          </h4>
        </div>
        <span className="text-xs font-mono font-medium px-2 py-0.5 rounded bg-brand-50 text-brand-700 dark:bg-brand-950/70 dark:text-brand-300">
          Step {activeIndex + 1} of {STEPS.length}
        </span>
      </div>

      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 sm:gap-1 relative">
        {STEPS.map((step, idx) => {
          const Icon = step.icon;
          const isDone = idx < activeIndex;
          const isActive = idx === activeIndex;

          return (
            <React.Fragment key={step.id}>
              <div
                className={`
                  flex items-center sm:flex-col sm:justify-center flex-1 p-2 sm:p-2.5 rounded-xl transition-all duration-300 gap-2.5 sm:gap-1.5
                  ${
                    isActive
                      ? 'bg-brand-50 border-2 border-brand-500 text-brand-700 dark:bg-brand-950/60 dark:border-brand-400 dark:text-brand-300 shadow-sm scale-[1.02]'
                      : isDone
                      ? 'bg-emerald-50/70 border border-emerald-300 text-emerald-700 dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-300'
                      : 'bg-slate-50 border border-slate-200 text-slate-400 dark:bg-slate-800/40 dark:border-slate-800 dark:text-slate-500'
                  }
                `}
              >
                <div
                  className={`
                    w-8 h-8 rounded-lg flex items-center justify-center shrink-0
                    ${
                      isActive
                        ? 'bg-brand-600 text-white animate-pulse'
                        : isDone
                        ? 'bg-emerald-600 text-white'
                        : 'bg-slate-200 dark:bg-slate-700 text-slate-500'
                    }
                  `}
                >
                  <Icon className="w-4 h-4" />
                </div>
                <div className="text-left sm:text-center min-w-0">
                  <div className="text-xs font-bold truncate">{step.label}</div>
                  {!compact && (
                    <div className="text-[10px] opacity-75 font-mono">
                      {isActive ? 'Processing...' : isDone ? 'Completed' : 'Queued'}
                    </div>
                  )}
                </div>
              </div>

              {idx < STEPS.length - 1 && (
                <div className="hidden sm:flex items-center justify-center text-slate-300 dark:text-slate-600 px-0.5 font-bold">
                  →
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};
