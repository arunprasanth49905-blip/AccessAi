import React from 'react';
import {
  UserCheck,
  Eye,
  Ear,
  Footprints,
  Brain,
  MessageSquare,
  Sparkles,
  CheckCircle2,
  RotateCcw,
} from 'lucide-react';
import { PageContainer } from '../components/layout/PageContainer';
import { AccessibleButton } from '../components/common/AccessibleButton';
import { useAccessibility } from '../context/AccessibilityContext';
import { useAssistant } from '../context/AssistantContext';
import { AccessibilityProfile } from '../types';

export const AccessibilityProfilePage: React.FC = () => {
  const { profile, updateProfile, settings, resetDefaults } = useAccessibility();
  const { showToast } = useAssistant();

  const handleToggle = (key: keyof AccessibilityProfile) => {
    const newVal = !profile[key];
    updateProfile({ [key]: newVal });
    showToast(
      'Profile Updated',
      `${String(key)} is now ${newVal ? 'Enabled' : 'Disabled'}. UI adjusted immediately.`,
      'success'
    );
  };

  return (
    <PageContainer maxWidth="xl" className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-50 dark:bg-brand-950/70 border border-brand-200 dark:border-brand-800 text-brand-700 dark:text-brand-300 text-xs font-bold mb-1">
            <UserCheck className="w-3.5 h-3.5" />
            <span>PERSONALIZATION • Adaptive Profile Engine</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-100">
            My Accessibility Profile
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            Tailor how AccessAI interacts with you. Every preference immediately changes the interface.
          </p>
        </div>

        <AccessibleButton
          variant="outline"
          size="md"
          icon={<RotateCcw className="w-4 h-4" />}
          onClick={resetDefaults}
        >
          Reset to Defaults
        </AccessibleButton>
      </div>

      {/* Live Transformation Verification Card */}
      <div className="p-6 rounded-3xl bg-brand-50 dark:bg-brand-950/50 border-2 border-brand-300 dark:border-brand-700 shadow-md space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-brand-600 dark:text-brand-400" />
            <h3 className="font-extrabold text-base text-brand-900 dark:text-brand-100">
              Live Interface Feedback & Active State
            </h3>
          </div>
          <span className="text-xs font-bold font-mono px-2 py-0.5 rounded bg-brand-200/80 dark:bg-brand-900 text-brand-900 dark:text-brand-200">
            Real-time DOM Applied
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-brand-200 dark:border-brand-800">
            <div className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Font Sizing</div>
            <div className="text-sm font-bold text-slate-900 dark:text-slate-100 mt-0.5 capitalize">
              {settings.textSize} ({settings.textSize === 'xlarge' ? 'Large Text Mode' : 'Standard'})
            </div>
          </div>

          <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-brand-200 dark:border-brand-800">
            <div className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Contrast Mode</div>
            <div className="text-sm font-bold text-slate-900 dark:text-slate-100 mt-0.5 capitalize">
              {settings.contrastMode === 'standard' ? 'Standard Contrast' : 'High Contrast ON'}
            </div>
          </div>

          <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-brand-200 dark:border-brand-800">
            <div className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">UI Complexity</div>
            <div className="text-sm font-bold text-slate-900 dark:text-slate-100 mt-0.5">
              {settings.simplifiedMode ? 'Simplified Mode' : 'Standard Mode'}
            </div>
          </div>

          <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-brand-200 dark:border-brand-800">
            <div className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Voice Guidance</div>
            <div className="text-sm font-bold text-slate-900 dark:text-slate-100 mt-0.5">
              {settings.voiceGuidance ? 'Prominent & Active' : 'Off'}
            </div>
          </div>
        </div>
      </div>

      {/* Sections Grid */}
      <div className="space-y-6">
        {/* 1. VISION SECTION */}
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="w-10 h-10 rounded-xl bg-brand-100 dark:bg-brand-900 text-brand-600 dark:text-brand-300 flex items-center justify-center">
              <Eye className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">Vision</h3>
              <p className="text-xs text-slate-500">Visual aids, contrast enhancements, and text scaling</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              {
                key: 'largeText' as const,
                label: 'Large text',
                desc: 'Increases application-wide typography for superior readability',
                active: profile.largeText,
              },
              {
                key: 'highContrast' as const,
                label: 'High contrast',
                desc: 'Enforces pure black background with vibrant yellow/cyan borders',
                active: profile.highContrast,
              },
              {
                key: 'voiceDescriptions' as const,
                label: 'Voice descriptions',
                desc: 'Automatically reads visual scene descriptions aloud',
                active: profile.voiceDescriptions,
              },
              {
                key: 'autoRead' as const,
                label: 'Auto-read',
                desc: 'Speaks OCR text automatically upon completion',
                active: profile.autoRead,
              },
            ].map((item) => (
              <button
                key={item.key}
                type="button"
                onClick={() => handleToggle(item.key)}
                className={`p-4 rounded-2xl border text-left transition-all flex items-start justify-between gap-3 ${
                  item.active
                    ? 'bg-brand-50/80 dark:bg-brand-950/60 border-brand-500 dark:border-brand-400 shadow-sm'
                    : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                }`}
              >
                <div>
                  <div className="font-bold text-sm sm:text-base text-slate-900 dark:text-slate-100">
                    {item.label}
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-normal">
                    {item.desc}
                  </div>
                </div>
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 border ${
                    item.active
                      ? 'bg-brand-600 border-brand-600 text-white'
                      : 'border-slate-300 dark:border-slate-600'
                  }`}
                >
                  {item.active && <CheckCircle2 className="w-4 h-4" />}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* 2. HEARING SECTION */}
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-900 text-purple-600 dark:text-purple-300 flex items-center justify-center">
              <Ear className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">Hearing</h3>
              <p className="text-xs text-slate-500">Live captions and visual alert indicators</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              {
                key: 'liveCaptions' as const,
                label: 'Live captions',
                desc: 'Real-time text transcript of all spoken AI dialogs',
                active: profile.liveCaptions,
              },
              {
                key: 'visualAlerts' as const,
                label: 'Visual alerts',
                desc: 'Flashing badges and high-contrast alert callouts',
                active: profile.visualAlerts,
              },
              {
                key: 'textResponses' as const,
                label: 'Text responses',
                desc: 'Prioritize readable cards over audio speech output',
                active: profile.textResponses,
              },
            ].map((item) => (
              <button
                key={item.key}
                type="button"
                onClick={() => handleToggle(item.key)}
                className={`p-4 rounded-2xl border text-left transition-all flex items-start justify-between gap-3 ${
                  item.active
                    ? 'bg-purple-50/80 dark:bg-purple-950/60 border-purple-500 dark:border-purple-400 shadow-sm'
                    : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                }`}
              >
                <div>
                  <div className="font-bold text-sm sm:text-base text-slate-900 dark:text-slate-100">
                    {item.label}
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-normal">
                    {item.desc}
                  </div>
                </div>
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 border ${
                    item.active
                      ? 'bg-purple-600 border-purple-600 text-white'
                      : 'border-slate-300 dark:border-slate-600'
                  }`}
                >
                  {item.active && <CheckCircle2 className="w-4 h-4" />}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* 3. MOBILITY SECTION */}
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900 text-amber-600 dark:text-amber-300 flex items-center justify-center">
              <Footprints className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">Mobility</h3>
              <p className="text-xs text-slate-500">Routing guidelines, elevator preferences, and stairs avoidance</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              {
                key: 'avoidStairs' as const,
                label: 'Avoid stairs',
                desc: 'Strictly excludes staircase steps from calculated paths',
                active: profile.avoidStairs,
              },
              {
                key: 'accessibleRoutesOnly' as const,
                label: 'Accessible routes',
                desc: 'Only offers paths with confirmed ADA/step-free certifications',
                active: profile.accessibleRoutesOnly,
              },
              {
                key: 'minimizeWalking' as const,
                label: 'Minimize walking',
                desc: 'Calculates shortest physical transit distance',
                active: profile.minimizeWalking,
              },
            ].map((item) => (
              <button
                key={item.key}
                type="button"
                onClick={() => handleToggle(item.key)}
                className={`p-4 rounded-2xl border text-left transition-all flex items-start justify-between gap-3 ${
                  item.active
                    ? 'bg-amber-50/80 dark:bg-amber-950/60 border-amber-500 dark:border-amber-400 shadow-sm'
                    : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                }`}
              >
                <div>
                  <div className="font-bold text-sm sm:text-base text-slate-900 dark:text-slate-100">
                    {item.label}
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-normal">
                    {item.desc}
                  </div>
                </div>
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 border ${
                    item.active
                      ? 'bg-amber-600 border-amber-600 text-white'
                      : 'border-slate-300 dark:border-slate-600'
                  }`}
                >
                  {item.active && <CheckCircle2 className="w-4 h-4" />}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* 4. COGNITIVE SECTION */}
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900 text-emerald-600 dark:text-emerald-300 flex items-center justify-center">
              <Brain className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">Cognitive</h3>
              <p className="text-xs text-slate-500">Simplified language and reduced interface density</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              {
                key: 'simplifiedLanguage' as const,
                label: 'Simplified language',
                desc: 'Delivers concise, plain-language summaries without jargon',
                active: profile.simplifiedLanguage,
              },
              {
                key: 'stepByStepInstructions' as const,
                label: 'Step-by-step instructions',
                desc: 'Breaks complex spatial navigation into one task at a time',
                active: profile.stepByStepInstructions,
              },
              {
                key: 'reducedInterfaceComplexity' as const,
                label: 'Reduced interface complexity',
                desc: 'Hides auxiliary dashboard widgets for clean focus',
                active: profile.reducedInterfaceComplexity,
              },
            ].map((item) => (
              <button
                key={item.key}
                type="button"
                onClick={() => handleToggle(item.key)}
                className={`p-4 rounded-2xl border text-left transition-all flex items-start justify-between gap-3 ${
                  item.active
                    ? 'bg-emerald-50/80 dark:bg-emerald-950/60 border-emerald-500 dark:border-emerald-400 shadow-sm'
                    : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                }`}
              >
                <div>
                  <div className="font-bold text-sm sm:text-base text-slate-900 dark:text-slate-100">
                    {item.label}
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-normal">
                    {item.desc}
                  </div>
                </div>
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 border ${
                    item.active
                      ? 'bg-emerald-600 border-emerald-600 text-white'
                      : 'border-slate-300 dark:border-slate-600'
                  }`}
                >
                  {item.active && <CheckCircle2 className="w-4 h-4" />}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* 5. COMMUNICATION SECTION */}
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="w-10 h-10 rounded-xl bg-sky-100 dark:bg-sky-900 text-sky-600 dark:text-sky-300 flex items-center justify-center">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">Communication</h3>
              <p className="text-xs text-slate-500">Speech pacing, repetition, and verbal response formats</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            {[
              {
                key: 'voiceResponses' as const,
                label: 'Voice responses',
                desc: 'Speaks out AI answers automatically',
                active: profile.voiceResponses,
              },
              {
                key: 'textResponses' as const,
                label: 'Text responses',
                desc: 'Provides full readable text logs',
                active: profile.textResponses,
              },
              {
                key: 'slowerSpeech' as const,
                label: 'Slower speech',
                desc: 'Speaks at 0.85x speed for enhanced clarity',
                active: profile.slowerSpeech,
              },
              {
                key: 'repeatInstructions' as const,
                label: 'Repeat instructions',
                desc: 'Confirms safety steps with double reminders',
                active: profile.repeatInstructions,
              },
            ].map((item) => (
              <button
                key={item.key}
                type="button"
                onClick={() => handleToggle(item.key)}
                className={`p-4 rounded-2xl border text-left transition-all flex items-start justify-between gap-3 ${
                  item.active
                    ? 'bg-sky-50/80 dark:bg-sky-950/60 border-sky-500 dark:border-sky-400 shadow-sm'
                    : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                }`}
              >
                <div>
                  <div className="font-bold text-sm sm:text-base text-slate-900 dark:text-slate-100">
                    {item.label}
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-normal">
                    {item.desc}
                  </div>
                </div>
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 border ${
                    item.active
                      ? 'bg-sky-600 border-sky-600 text-white'
                      : 'border-slate-300 dark:border-slate-600'
                  }`}
                >
                  {item.active && <CheckCircle2 className="w-4 h-4" />}
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </PageContainer>
  );
};
