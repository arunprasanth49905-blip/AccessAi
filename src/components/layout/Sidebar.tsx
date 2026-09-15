import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  Home,
  Camera,
  Mic,
  FileText,
  Compass,
  Clock,
  UserCheck,
  Shield,
  Settings,
  Sparkles,
  PhoneCall,
  Eye,
} from 'lucide-react';
import { useAssistant } from '../../context/AssistantContext';
import { StatusIndicator } from '../common/StatusIndicator';

const NAV_ITEMS = [
  { path: '/app', label: 'Home', icon: Home, shortcut: 'H' },
  { path: '/camera', label: 'Camera', icon: Camera, badge: 'Vision', shortcut: 'C' },
  { path: '/voice', label: 'Voice', icon: Mic, badge: 'Live', shortcut: 'V' },
  { path: '/reader', label: 'Read', icon: FileText, shortcut: 'R' },
  { path: '/navigation', label: 'Navigate', icon: Compass, shortcut: 'N' },
  { path: '/history', label: 'History', icon: Clock },
  { path: '/profile', label: 'Profile', icon: UserCheck },
  { path: '/safety', label: 'Safety', icon: Shield, badge: 'Protected' },
  { path: '/settings', label: 'Settings', icon: Settings },
  { path: '/demo', label: 'Demo Mode', icon: Sparkles, highlight: true },
];

export const Sidebar: React.FC = () => {
  const { openEmergencyModal } = useAssistant();

  return (
    <aside
      className="hidden md:flex flex-col w-64 lg:w-72 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 shrink-0 h-screen sticky top-0 overflow-y-auto p-4 select-none"
      aria-label="Sidebar Navigation"
    >
      {/* Brand logo & tagline */}
      <div className="flex items-center justify-between pb-4 mb-2 border-b border-slate-100 dark:border-slate-800">
        <NavLink to="/app" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-2xl bg-brand-600 text-white flex items-center justify-center shadow-md group-hover:bg-brand-700 transition-colors">
            <Eye className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-xl tracking-tight text-slate-900 dark:text-slate-100">
                Access<span className="text-brand-600">AI</span>
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
              Accessibility Companion
            </p>
          </div>
        </NavLink>
      </div>

      {/* Connection status indicator */}
      <div className="px-1 py-2 mb-2">
        <StatusIndicator />
      </div>

      {/* Navigation links */}
      <nav className="flex-1 space-y-1 py-2" aria-label="Main Navigation">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => `
                flex items-center justify-between px-3.5 py-3 rounded-2xl font-medium transition-all group
                ${
                  isActive
                    ? 'bg-brand-600 text-white shadow-sm font-semibold'
                    : 'text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800/70'
                }
                ${item.highlight ? 'ring-1 ring-brand-400/40 bg-brand-50/50 dark:bg-brand-950/20' : ''}
              `}
            >
              <div className="flex items-center gap-3 min-w-0">
                <Icon className="w-5 h-5 shrink-0" />
                <span className="truncate text-sm sm:text-base">{item.label}</span>
              </div>

              <div className="flex items-center gap-1.5">
                {item.badge && (
                  <span
                    className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded-md ${
                      item.badge === 'Live'
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                        : 'bg-brand-100 text-brand-800 dark:bg-brand-950 dark:text-brand-300'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
                {item.shortcut && (
                  <kbd className="hidden lg:inline-block text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500 opacity-60">
                    {item.shortcut}
                  </kbd>
                )}
              </div>
            </NavLink>
          );
        })}
      </nav>

      {/* Emergency Assistance Action */}
      <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2">
        <button
          type="button"
          onClick={openEmergencyModal}
          className="w-full flex items-center justify-center gap-2.5 px-4 py-3 rounded-2xl bg-red-600 hover:bg-red-700 text-white font-bold text-sm shadow-sm transition-all focus-visible:ring-4 focus-visible:ring-red-400"
        >
          <PhoneCall className="w-4 h-4 animate-bounce" />
          <span>Emergency Support</span>
        </button>

        <div className="text-center text-[11px] text-slate-400 dark:text-slate-500">
          AI assistance — verify critical information.
        </div>
      </div>
    </aside>
  );
};
