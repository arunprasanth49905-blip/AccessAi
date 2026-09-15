import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  ArrowRight,
  ArrowLeft,
  RotateCcw,
  X,
  Volume2,
  VolumeX,
  Play,
  Pause,
  CheckCircle2,
  ShieldCheck,
  Layers,
  Compass,
  FileText,
  Eye,
  Mic,
  Languages,
} from 'lucide-react';
import { JUDGE_DEMO_STEPS, JudgeStepData } from '../../fixtures/demoFixtures';
import { speechService } from '../../services/speechService';
import { audioFeedback } from '../../services/audioFeedbackService';
import { AccessibleButton } from '../common/AccessibleButton';

interface JudgeDemoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogEvent?: (category: 'VISION' | 'SAFETY' | 'VOICE' | 'OCR' | 'TRANSLATION' | 'NAVIGATION' | 'SYSTEM', message: string, source: 'ai' | 'fallback') => void;
}

export const JudgeDemoModal: React.FC<JudgeDemoModalProps> = ({ isOpen, onClose, onLogEvent }) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isAutoPlaying, setIsAutoPlaying] = useState(false);

  const currentStep: JudgeStepData = JUDGE_DEMO_STEPS[currentStepIndex];
  const progressPercent = Math.round(((currentStepIndex + 1) / JUDGE_DEMO_STEPS.length) * 100);

  // Speak step description
  const speakStep = (step: JudgeStepData) => {
    audioFeedback.playChime();
    setIsSpeaking(true);
    speechService.speak(step.audioPrompt, {
      onEnd: () => setIsSpeaking(false),
      onError: () => setIsSpeaking(false),
    });
  };

  // Announce step on change
  useEffect(() => {
    if (!isOpen) return;
    speakStep(currentStep);

    // Log event
    const categories: ('VISION' | 'SAFETY' | 'VOICE' | 'OCR' | 'TRANSLATION' | 'NAVIGATION' | 'SYSTEM')[] = [
      'VISION',
      'SAFETY',
      'VOICE',
      'OCR',
      'TRANSLATION',
      'NAVIGATION',
      'SYSTEM',
    ];
    onLogEvent?.(
      categories[currentStepIndex] || 'SYSTEM',
      `Judge Demo: Step ${currentStepIndex + 1} - ${currentStep.title}`,
      'ai'
    );
  }, [currentStepIndex, isOpen]);

  // Handle next step
  const handleNext = () => {
    if (currentStepIndex < JUDGE_DEMO_STEPS.length - 1) {
      audioFeedback.playClick();
      setCurrentStepIndex((prev) => prev + 1);
    } else {
      audioFeedback.playSuccess();
      setIsAutoPlaying(false);
    }
  };

  const handlePrev = () => {
    if (currentStepIndex > 0) {
      audioFeedback.playClick();
      setCurrentStepIndex((prev) => prev - 1);
    }
  };

  const handleRestart = () => {
    audioFeedback.playClick();
    setCurrentStepIndex(0);
  };

  const handleClose = () => {
    speechService.stop();
    setIsSpeaking(false);
    setIsAutoPlaying(false);
    audioFeedback.playClick();
    onClose();
  };

  // Auto-play timer
  useEffect(() => {
    if (!isAutoPlaying || !isOpen) return;

    const timer = setInterval(() => {
      setCurrentStepIndex((prev) => {
        if (prev < JUDGE_DEMO_STEPS.length - 1) {
          return prev + 1;
        } else {
          setIsAutoPlaying(false);
          audioFeedback.playSuccess();
          return prev;
        }
      });
    }, 7000);

    return () => clearInterval(timer);
  }, [isAutoPlaying, isOpen]);

  if (!isOpen) return null;

  const getStepIcon = (index: number) => {
    switch (index) {
      case 0:
        return <Eye className="w-5 h-5 text-purple-600" />;
      case 1:
        return <ShieldCheck className="w-5 h-5 text-amber-600" />;
      case 2:
        return <Mic className="w-5 h-5 text-blue-600" />;
      case 3:
        return <FileText className="w-5 h-5 text-emerald-600" />;
      case 4:
        return <Languages className="w-5 h-5 text-teal-600" />;
      case 5:
        return <Compass className="w-5 h-5 text-indigo-600" />;
      case 6:
      default:
        return <Sparkles className="w-5 h-5 text-brand-600" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 overflow-y-auto animate-fadeIn">
      <div className="w-full max-w-3xl rounded-3xl bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col my-auto">
        {/* Modal Header */}
        <div className="p-5 sm:p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/80 dark:bg-slate-800/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-brand-600 text-white flex items-center justify-center shadow-md shadow-brand-500/20">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-extrabold uppercase tracking-wider text-brand-600 dark:text-brand-400">
                  AccessAI Guided Evaluation
                </span>
                <span className="text-slate-300 dark:text-slate-700">•</span>
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                  Step {currentStep.stepNumber} of {currentStep.totalSteps}
                </span>
              </div>
              <h3 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-slate-100">
                {currentStep.title}
              </h3>
            </div>
          </div>

          <button
            type="button"
            onClick={handleClose}
            aria-label="Exit Judge Demo"
            className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5">
          <div
            className="bg-gradient-to-r from-brand-600 via-emerald-500 to-purple-600 h-1.5 transition-all duration-500"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Modal Body */}
        <div className="p-6 sm:p-8 space-y-6 flex-1">
          {/* Capability Pill */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-brand-50 dark:bg-brand-950/60 border border-brand-200 dark:border-brand-800 text-brand-700 dark:text-brand-300 text-xs font-extrabold">
            {getStepIcon(currentStepIndex)}
            <span>Core Capability: {currentStep.capability}</span>
          </div>

          {/* Step Summary Quote */}
          <p className="text-base sm:text-lg font-semibold text-slate-800 dark:text-slate-100 leading-relaxed">
            "{currentStep.summary}"
          </p>

          {/* Technical Evaluation Pillars */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            {currentStep.details.map((detail, idx) => (
              <div
                key={idx}
                className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-200 flex items-start gap-2.5"
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>{detail}</span>
              </div>
            ))}
          </div>

          {/* Final Step Callout */}
          {currentStepIndex === JUDGE_DEMO_STEPS.length - 1 && (
            <div className="p-5 rounded-2xl bg-gradient-to-r from-brand-50 via-emerald-50 to-purple-50 dark:from-brand-950/40 dark:via-emerald-950/40 dark:to-purple-950/40 border border-brand-200 dark:border-brand-800 text-center space-y-2">
              <span className="text-xs font-extrabold uppercase tracking-widest text-brand-600 dark:text-brand-400">
                Core Multimodal Paradigm
              </span>
              <h4 className="text-lg font-extrabold text-slate-900 dark:text-slate-100">
                SEE → UNDERSTAND → READ → TRANSLATE → NAVIGATE → RESPOND
              </h4>
              <p className="text-xs text-slate-600 dark:text-slate-400 max-w-xl mx-auto">
                AccessAI is built with industry-standard reliability, strict privacy guards, and zero visual hallucination.
              </p>
            </div>
          )}
        </div>

        {/* Modal Footer Controls */}
        <div className="p-5 sm:p-6 border-t border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/40 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <AccessibleButton
              variant="outline"
              size="md"
              icon={<RotateCcw className="w-4 h-4" />}
              onClick={handleRestart}
              disabled={currentStepIndex === 0}
            >
              Restart
            </AccessibleButton>

            <AccessibleButton
              variant={isAutoPlaying ? 'danger' : 'secondary'}
              size="md"
              icon={isAutoPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-current" />}
              onClick={() => setIsAutoPlaying(!isAutoPlaying)}
            >
              {isAutoPlaying ? 'Pause' : 'Auto Play'}
            </AccessibleButton>

            <AccessibleButton
              variant="secondary"
              size="md"
              icon={isSpeaking ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              onClick={() => {
                if (isSpeaking) {
                  speechService.stop();
                  setIsSpeaking(false);
                } else {
                  speakStep(currentStep);
                }
              }}
            >
              {isSpeaking ? 'Mute' : 'Speak'}
            </AccessibleButton>
          </div>

          <div className="flex items-center gap-2">
            <AccessibleButton
              variant="secondary"
              size="md"
              icon={<ArrowLeft className="w-4 h-4" />}
              onClick={handlePrev}
              disabled={currentStepIndex === 0}
            >
              Back
            </AccessibleButton>

            {currentStepIndex < JUDGE_DEMO_STEPS.length - 1 ? (
              <AccessibleButton
                variant="primary"
                size="md"
                icon={<ArrowRight className="w-4 h-4" />}
                onClick={handleNext}
              >
                Next Step
              </AccessibleButton>
            ) : (
              <AccessibleButton
                variant="success"
                size="md"
                icon={<CheckCircle2 className="w-4 h-4" />}
                onClick={handleClose}
              >
                Finish Evaluation
              </AccessibleButton>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
