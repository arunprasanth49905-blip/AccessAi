import React from 'react';
import {
  Settings as SettingsIcon,
  Sun,
  Moon,
  Monitor,
  Type,
  Volume2,
  Brain,
  Eye,
  Languages,
  RotateCcw,
} from 'lucide-react';
import { PageContainer } from '../components/layout/PageContainer';
import { AccessibleButton } from '../components/common/AccessibleButton';
import { useAccessibility } from '../context/AccessibilityContext';
import { useAssistant } from '../context/AssistantContext';
import { TextSize, ThemeMode, LanguageCode, AIResponseVerbosity } from '../types';

export const SettingsPage: React.FC = () => {
  const { settings, updateSettings, resetDefaults } = useAccessibility();
  const { showToast } = useAssistant();

  const handleUpdate = (partial: Parameters<typeof updateSettings>[0]) => {
    updateSettings(partial);
    showToast('Settings Saved', 'Preferences persisted to local storage.', 'success');
  };

  return (
    <PageContainer maxWidth="lg" className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold mb-1">
            <SettingsIcon className="w-3.5 h-3.5" />
            <span>PREFERENCES & ENGINE CONFIGURATION</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-100">
            Settings
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            Global appearance, speech synthesizer rate, AI verbosity, and primary dialect.
          </p>
        </div>

        <AccessibleButton
          variant="outline"
          size="md"
          icon={<RotateCcw className="w-4 h-4" />}
          onClick={resetDefaults}
        >
          Reset All
        </AccessibleButton>
      </div>

      <div className="space-y-6">
        {/* 1. APPEARANCE */}
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center gap-2.5 pb-2 border-b border-slate-100 dark:border-slate-800">
            <Sun className="w-5 h-5 text-amber-500" />
            <h3 className="font-bold text-base sm:text-lg text-slate-900 dark:text-slate-100">
              Appearance
            </h3>
          </div>

          <div className="grid grid-cols-3 gap-2.5">
            {[
              { mode: 'light' as ThemeMode, label: 'Light', icon: Sun },
              { mode: 'dark' as ThemeMode, label: 'Dark', icon: Moon },
              { mode: 'system' as ThemeMode, label: 'System', icon: Monitor },
            ].map((theme) => {
              const Icon = theme.icon;
              const isSelected = settings.theme === theme.mode;

              return (
                <button
                  key={theme.mode}
                  type="button"
                  onClick={() => handleUpdate({ theme: theme.mode })}
                  className={`p-3.5 rounded-2xl border text-sm font-bold flex flex-col items-center justify-center gap-2 transition-all ${
                    isSelected
                      ? 'bg-brand-600 text-white border-brand-500 shadow-md'
                      : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span>{theme.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 2. TEXT SIZE */}
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center gap-2.5 pb-2 border-b border-slate-100 dark:border-slate-800">
            <Type className="w-5 h-5 text-brand-600" />
            <h3 className="font-bold text-base sm:text-lg text-slate-900 dark:text-slate-100">
              Text Size Scaling
            </h3>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {[
              { size: 'small' as TextSize, label: 'Small', px: '14px' },
              { size: 'medium' as TextSize, label: 'Medium', px: '16px' },
              { size: 'large' as TextSize, label: 'Large', px: '19px' },
              { size: 'xlarge' as TextSize, label: 'Extra Large', px: '22px' },
            ].map((s) => {
              const isSelected = settings.textSize === s.size;

              return (
                <button
                  key={s.size}
                  type="button"
                  onClick={() => handleUpdate({ textSize: s.size })}
                  className={`p-3.5 rounded-2xl border flex flex-col items-center justify-center transition-all ${
                    isSelected
                      ? 'bg-brand-600 text-white border-brand-500 shadow-md'
                      : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <span className="font-bold text-sm sm:text-base">{s.label}</span>
                  <span className="text-[11px] opacity-75 font-mono">{s.px}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 3. VOICE & SPEECH */}
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center gap-2.5 pb-2 border-b border-slate-100 dark:border-slate-800">
            <Volume2 className="w-5 h-5 text-emerald-600" />
            <h3 className="font-bold text-base sm:text-lg text-slate-900 dark:text-slate-100">
              Voice & Speech Output
            </h3>
          </div>

          <div className="space-y-4">
            <label className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 cursor-pointer">
              <div>
                <div className="font-bold text-sm text-slate-900 dark:text-slate-100">Voice guidance enabled</div>
                <div className="text-xs text-slate-500">Audio feedback and verbal descriptions</div>
              </div>
              <input
                type="checkbox"
                checked={settings.voiceGuidance}
                onChange={(e) => handleUpdate({ voiceGuidance: e.target.checked })}
                className="w-5 h-5 rounded text-brand-600 focus:ring-brand-500"
              />
            </label>

            <label className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 cursor-pointer">
              <div>
                <div className="font-bold text-sm text-slate-900 dark:text-slate-100">Auto-read results</div>
                <div className="text-xs text-slate-500">Read OCR and scene detection automatically</div>
              </div>
              <input
                type="checkbox"
                checked={settings.autoReadAloud}
                onChange={(e) => handleUpdate({ autoReadAloud: e.target.checked })}
                className="w-5 h-5 rounded text-brand-600 focus:ring-brand-500"
              />
            </label>

            <div className="space-y-1.5 pt-1">
              <div className="flex justify-between text-xs font-bold text-slate-500">
                <span>Speech Speed</span>
                <span className="font-mono text-brand-600 dark:text-brand-400">{settings.speechSpeed}x</span>
              </div>
              <div className="grid grid-cols-4 gap-2">
                {[0.75, 1.0, 1.25, 1.5].map((speed) => (
                  <button
                    key={speed}
                    type="button"
                    onClick={() => handleUpdate({ speechSpeed: speed })}
                    className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                      settings.speechSpeed === speed
                        ? 'bg-emerald-600 text-white border-emerald-500'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    {speed}x
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* 4. AI RESPONSE VERBOSITY */}
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center gap-2.5 pb-2 border-b border-slate-100 dark:border-slate-800">
            <Brain className="w-5 h-5 text-purple-600" />
            <h3 className="font-bold text-base sm:text-lg text-slate-900 dark:text-slate-100">
              AI Response Depth
            </h3>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {[
              { key: 'concise' as AIResponseVerbosity, label: 'Concise', desc: 'Brief bullet points' },
              { key: 'normal' as AIResponseVerbosity, label: 'Normal', desc: 'Balanced summary' },
              { key: 'detailed' as AIResponseVerbosity, label: 'Detailed', desc: 'Full spatial reasoning' },
              { key: 'simple' as AIResponseVerbosity, label: 'Simple', desc: 'Plain language only' },
            ].map((item) => {
              const isSelected = settings.responseVerbosity === item.key;

              return (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => handleUpdate({ responseVerbosity: item.key })}
                  className={`p-3.5 rounded-2xl border flex flex-col items-start transition-all ${
                    isSelected
                      ? 'bg-purple-600 text-white border-purple-500 shadow-md'
                      : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <span className="font-bold text-sm">{item.label}</span>
                  <span className="text-[11px] opacity-75 mt-0.5">{item.desc}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 5. ACCESSIBILITY ENHANCEMENTS */}
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center gap-2.5 pb-2 border-b border-slate-100 dark:border-slate-800">
            <Eye className="w-5 h-5 text-amber-500" />
            <h3 className="font-bold text-base sm:text-lg text-slate-900 dark:text-slate-100">
              Accessibility Enhancements
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 cursor-pointer">
              <div>
                <div className="font-bold text-sm text-slate-900 dark:text-slate-100">High contrast</div>
                <div className="text-xs text-slate-500">Maximized luminance contrast borders</div>
              </div>
              <input
                type="checkbox"
                checked={settings.contrastMode !== 'standard'}
                onChange={(e) =>
                  handleUpdate({ contrastMode: e.target.checked ? 'high-dark' : 'standard' })
                }
                className="w-5 h-5 rounded text-brand-600 focus:ring-brand-500"
              />
            </label>

            <label className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 cursor-pointer">
              <div>
                <div className="font-bold text-sm text-slate-900 dark:text-slate-100">Reduced motion</div>
                <div className="text-xs text-slate-500">Disable smooth transitions & animations</div>
              </div>
              <input
                type="checkbox"
                checked={settings.reducedMotion}
                onChange={(e) => handleUpdate({ reducedMotion: e.target.checked })}
                className="w-5 h-5 rounded text-brand-600 focus:ring-brand-500"
              />
            </label>

            <label className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 cursor-pointer">
              <div>
                <div className="font-bold text-sm text-slate-900 dark:text-slate-100">Haptic feedback</div>
                <div className="text-xs text-slate-500">Device vibration on button presses</div>
              </div>
              <input
                type="checkbox"
                checked={settings.hapticFeedback}
                onChange={(e) => handleUpdate({ hapticFeedback: e.target.checked })}
                className="w-5 h-5 rounded text-brand-600 focus:ring-brand-500"
              />
            </label>

            <label className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 cursor-pointer">
              <div>
                <div className="font-bold text-sm text-slate-900 dark:text-slate-100">Simplified mode</div>
                <div className="text-xs text-slate-500">Streamline all visual layouts</div>
              </div>
              <input
                type="checkbox"
                checked={settings.simplifiedMode}
                onChange={(e) => handleUpdate({ simplifiedMode: e.target.checked })}
                className="w-5 h-5 rounded text-brand-600 focus:ring-brand-500"
              />
            </label>
          </div>
        </div>

        {/* 6. PRIMARY LANGUAGE */}
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center gap-2.5 pb-2 border-b border-slate-100 dark:border-slate-800">
            <Languages className="w-5 h-5 text-brand-600" />
            <h3 className="font-bold text-base sm:text-lg text-slate-900 dark:text-slate-100">
              Primary Language & Dialect
            </h3>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
            {[
              { code: 'en' as LanguageCode, label: 'English', native: 'English' },
              { code: 'ta' as LanguageCode, label: 'Tamil', native: 'தமிழ்' },
              { code: 'hi' as LanguageCode, label: 'Hindi', native: 'हिन्दी' },
              { code: 'ml' as LanguageCode, label: 'Malayalam', native: 'മലയാളം' },
              { code: 'te' as LanguageCode, label: 'Telugu', native: 'తెలుగు' },
            ].map((lang) => {
              const isSelected = settings.language === lang.code;

              return (
                <button
                  key={lang.code}
                  type="button"
                  onClick={() => handleUpdate({ language: lang.code })}
                  className={`p-3.5 rounded-2xl border text-center transition-all ${
                    isSelected
                      ? 'bg-brand-600 text-white border-brand-500 shadow-md'
                      : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <div className="font-bold text-sm">{lang.label}</div>
                  <div className="text-xs opacity-80 mt-0.5">{lang.native}</div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </PageContainer>
  );
};
