import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import {
  Home,
  Camera,
  Mic,
  Compass,
  UserCheck,
  Menu,
  X,
  FileText,
  Clock,
  Shield,
  Settings,
  Sparkles,
  PhoneCall,
} from 'lucide-react';
import { useAssistant } from '../../context/AssistantContext';

const PRIMARY_TABS = [
  { path: '/app', label: 'Home', icon: Home },
  { path: '/camera', label: 'Camera', icon: Camera },
  { path: '/voice', label: 'Voice', icon: Mic, highlight: true },
  { path: '/navigation', label: 'Navigate', icon: Compass },
  { path: '/profile', label: 'Profile', icon: UserCheck },
];

const SECONDARY_TABS = [
  { path: '/reader', label: 'Text Reader / OCR', icon: FileText, desc: 'Read signs, menus, labels' },
  { path: '/history', label: 'Assistance History', icon: Clock, desc: 'Past scans, transcript logs' },
  { path: '/safety', label: 'Safety Center', icon: Shield, desc: 'Confidence levels, trusted contacts' },
  { path: '/settings', label: 'Settings', icon: Settings, desc: 'Voice, text size, contrast' },
  { path: '/demo', label: 'Demo Scenarios', icon: Sparkles, desc: 'Judge 1-click test suite' },
];

export const MobileNavigation: React.FC = () => {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { openEmergencyModal } = useAssistant();

  return (
    <>
      {/* Slide-over Drawer for Secondary Pages */}
      {drawerOpen && (
        <div
          className="md:hidden fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex flex-col justify-end"
          role="dialog"
          aria-modal="true"
          aria-label="More options menu"
        >
          <div
            className="fixed inset-0"
            onClick={() => setDrawerOpen(false)}
            aria-hidden="true"
          />
          <div className="relative bg-white dark:bg-slate-900 rounded-t-3xl border-t border-slate-200 dark:border-slate-800 p-6 space-y-4 max-h-[80vh] overflow-y-auto z-10 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-bold text-lg text-slate-900 dark:text-slate-100">All Features</h3>
              <button
                type="button"
                onClick={() => setDrawerOpen(false)}
                className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500"
                aria-label="Close menu"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 gap-2">
              {SECONDARY_TABS.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    onClick={() => setDrawerOpen(false)}
                    className={({ isActive }) => `
                      flex items-center gap-3.5 p-3.5 rounded-2xl transition-colors
                      ${
                        isActive
                          ? 'bg-brand-50 text-brand-700 dark:bg-brand-950 dark:text-brand-300 font-bold'
                          : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200'
                      }
                    `}
                  >
                    <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-brand-600 dark:text-brand-400 shrink-0">
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="font-semibold text-sm">{item.label}</div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">{item.desc}</div>
                    </div>
                  </NavLink>
                );
              })}
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={() => {
                  setDrawerOpen(false);
                  openEmergencyModal();
                }}
                className="w-full flex items-center justify-center gap-2 p-3.5 rounded-2xl bg-red-600 text-white font-bold text-sm shadow-md"
              >
                <PhoneCall className="w-5 h-5" />
                <span>Simulate Emergency Support</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sticky Bottom Navigation Bar */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 px-2 py-1.5 safe-area-inset-bottom"
        aria-label="Mobile Navigation"
      >
        <div className="flex items-center justify-around">
          {PRIMARY_TABS.map((tab) => {
            const Icon = tab.icon;
            return (
              <NavLink
                key={tab.path}
                to={tab.path}
                className={({ isActive }) => `
                  flex flex-col items-center justify-center min-w-[56px] py-1 px-1 rounded-2xl transition-all
                  ${
                    isActive
                      ? 'text-brand-600 dark:text-brand-400 font-bold scale-105'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
                  }
                  ${tab.highlight ? 'relative' : ''}
                `}
              >
                <div
                  className={`p-1.5 rounded-xl ${
                    tab.highlight
                      ? 'bg-brand-600 text-white shadow-sm'
                      : ''
                  }`}
                >
                  <Icon className="w-5 h-5" />
                </div>
                <span className="text-[11px] font-medium tracking-tight mt-0.5">{tab.label}</span>
              </NavLink>
            );
          })}

          {/* More Drawer Trigger */}
          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            className="flex flex-col items-center justify-center min-w-[56px] py-1 px-1 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100"
            aria-label="Open full menu"
          >
            <div className="p-1.5 rounded-xl">
              <Menu className="w-5 h-5" />
            </div>
            <span className="text-[11px] font-medium tracking-tight mt-0.5">More</span>
          </button>
        </div>
      </nav>
    </>
  );
};
