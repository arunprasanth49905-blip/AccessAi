import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Mic, Eye, Sun, Moon, Sparkles, PhoneCall } from 'lucide-react';
import { useAccessibility } from '../../context/AccessibilityContext';
import { useAssistant } from '../../context/AssistantContext';
import { StatusIndicator } from '../common/StatusIndicator';

const ROUTE_TITLES: Record<string, { title: string; subtitle: string }> = {
  '/app': { title: 'Home Dashboard', subtitle: 'How can I help you today?' },
  '/camera': { title: 'Camera & Vision', subtitle: 'Real-time scene analysis and obstacle detection' },
  '/voice': { title: 'Voice Assistant', subtitle: 'Natural multimodal conversation' },
  '/reader': { title: 'Text Reader / OCR', subtitle: 'Read signs, documents, and labels aloud' },
  '/navigation': { title: 'Accessible Navigation', subtitle: 'Find step-free routes and elevators' },
  '/history': { title: 'Assistance History', subtitle: 'Review past vision scans and readings' },
  '/profile': { title: 'Accessibility Profile', subtitle: 'Personalize vision, mobility, and speech assistance' },
  '/settings': { title: 'Settings', subtitle: 'Application preferences and language' },
  '/safety': { title: 'Safety Center', subtitle: 'Confidence levels and emergency contacts' },
  '/demo': { title: 'Hackathon Demo Suite', subtitle: 'One-click scenarios for judges' },
};

export const Header: React.FC = () => {
  const location = useLocation();
  const { settings, updateSettings } = useAccessibility();
  const { openEmergencyModal } = useAssistant();

  const currentRoute = ROUTE_TITLES[location.pathname] || {
    title: 'AccessAI',
    subtitle: 'Your world, made more understandable.',
  };

  const toggleHighContrast = () => {
    updateSettings({
      contrastMode: settings.contrastMode === 'standard' ? 'high-dark' : 'standard',
    });
  };

  const toggleTheme = () => {
    updateSettings({
      theme: settings.theme === 'dark' ? 'light' : 'dark',
    });
  };

  return (
    <header className="sticky top-0 z-30 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-4 sm:px-6 py-3">
      {/* Skip to Content for Screen Readers */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 z-50 bg-brand-600 text-white px-4 py-2 rounded-xl font-bold"
      >
        Skip to main content
      </a>

      <div className="flex items-center justify-between gap-3">
        {/* Title area */}
        <div className="min-w-0">
          <h1 className="text-lg sm:text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100 truncate">
            {currentRoute.title}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 hidden sm:block truncate">
            {currentRoute.subtitle}
          </p>
        </div>

        {/* Action controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="hidden sm:block">
            <StatusIndicator />
          </div>

          {/* Quick Voice Assistant */}
          <NavLink
            to="/voice"
            aria-label="Open Voice Assistant"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-brand-50 hover:bg-brand-100 text-brand-700 dark:bg-brand-950 dark:hover:bg-brand-900 dark:text-brand-300 border border-brand-200 dark:border-brand-800 text-xs font-bold transition-all focus-visible:ring-2 focus-visible:ring-brand-500"
          >
            <Mic className="w-3.5 h-3.5" />
            <span className="hidden xs:inline">Ask AI</span>
          </NavLink>

          {/* High Contrast Toggle */}
          <button
            type="button"
            onClick={toggleHighContrast}
            aria-label={settings.contrastMode === 'standard' ? 'Enable High Contrast Mode' : 'Disable High Contrast Mode'}
            title={settings.contrastMode === 'standard' ? 'Enable High Contrast' : 'Standard Contrast'}
            className={`p-2 rounded-xl border text-xs font-bold transition-all focus-visible:ring-2 focus-visible:ring-brand-500 ${
              settings.contrastMode !== 'standard'
                ? 'bg-yellow-400 text-black border-black font-extrabold'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:bg-slate-200'
            }`}
          >
            <Eye className="w-4 h-4" />
          </button>

          {/* Theme Toggle */}
          <button
            type="button"
            onClick={toggleTheme}
            aria-label={`Switch to ${settings.theme === 'dark' ? 'Light' : 'Dark'} Mode`}
            title={`Switch to ${settings.theme === 'dark' ? 'Light' : 'Dark'} Mode`}
            className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all focus-visible:ring-2 focus-visible:ring-brand-500"
          >
            {settings.theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
          </button>

          {/* Quick Demo Mode link */}
          <NavLink
            to="/demo"
            aria-label="Open Hackathon Demo Suite"
            className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300 border border-purple-200 dark:border-purple-800 text-xs font-bold transition-all focus-visible:ring-2 focus-visible:ring-purple-500"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Judge Demo</span>
          </NavLink>

          {/* Mobile Emergency Button */}
          <button
            type="button"
            onClick={openEmergencyModal}
            className="md:hidden p-2 rounded-xl bg-red-600 text-white shadow-sm hover:bg-red-700"
            aria-label="Emergency Assistance"
          >
            <PhoneCall className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
