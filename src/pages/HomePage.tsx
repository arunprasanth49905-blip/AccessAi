import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  Eye,
  Mic,
  FileText,
  Compass,
  ArrowRight,
  Clock,
  Sparkles,
  Play,
  Volume2,
  ChevronRight,
  ShieldAlert,
} from 'lucide-react';
import { PageContainer } from '../components/layout/PageContainer';
import { AccessibleButton } from '../components/common/AccessibleButton';
import { ConfidenceIndicator } from '../components/common/ConfidenceIndicator';
import { useAssistant } from '../context/AssistantContext';
import { speechService } from '../services/speechService';
import { audioFeedback } from '../services/audioFeedbackService';

export const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const { recentAssistance, showToast } = useAssistant();

  // Dynamic greeting based on current hour
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning 👋';
    if (hour < 17) return 'Good afternoon ☀️';
    return 'Good evening 🌙';
  };

  const handleReplayAssistance = (e: React.MouseEvent, summary: string) => {
    e.stopPropagation();
    audioFeedback.playChime();
    speechService.speak(summary);
    showToast('Replaying Assistance', summary, 'info');
  };

  return (
    <PageContainer maxWidth="xl" className="space-y-8">
      {/* Header section */}
      <section aria-labelledby="home-heading" className="space-y-2">
        <div className="text-sm font-semibold text-brand-600 dark:text-brand-400 flex items-center gap-2">
          <span>{getGreeting()}</span>
          <span className="text-slate-300 dark:text-slate-700">•</span>
          <span className="text-slate-500 dark:text-slate-400 font-normal">
            {new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}
          </span>
        </div>

        <h2 id="home-heading" className="text-3xl sm:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">
          How can I help you today?
        </h2>

        <p className="text-base sm:text-xl text-slate-600 dark:text-slate-400 font-normal max-w-2xl">
          Your world, made more understandable.
        </p>
      </section>

      {/* Large Central Action: 🎙️ Ask AccessAI */}
      <section aria-label="Quick voice trigger">
        <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-brand-600 via-brand-700 to-indigo-700 text-white shadow-xl shadow-brand-500/20 relative overflow-hidden">
          <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-white/5 blur-2xl pointer-events-none" />

          <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div className="space-y-2 max-w-lg">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 text-white text-xs font-bold tracking-wide">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Multimodal Voice Assistant</span>
              </div>
              <h3 className="text-2xl sm:text-3xl font-bold">Ask AccessAI Anything</h3>
              <p className="text-brand-100 text-sm sm:text-base leading-relaxed">
                "What's around me?", "Read the sign on the door", or "Find an accessible path without stairs."
              </p>
            </div>

            <AccessibleButton
              variant="secondary"
              size="xl"
              icon={<Mic className="w-6 h-6 text-brand-600" />}
              className="bg-white text-brand-800 hover:bg-brand-50 shadow-lg shrink-0 border-0"
              onClick={() => navigate('/voice')}
            >
              🎙️ Ask AccessAI
            </AccessibleButton>
          </div>
        </div>
      </section>

      {/* Four Large Feature Cards: SEE, READ, TALK, NAVIGATE */}
      <section aria-labelledby="features-heading" className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 id="features-heading" className="text-xl font-bold text-slate-900 dark:text-slate-100">
            Core Capabilities
          </h3>
          <span className="text-xs text-slate-500 dark:text-slate-400">
            SEE & TALK are prioritized for rapid visual assistance
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          {/* SEE (Prominent) */}
          <NavLink
            to="/camera"
            className="group p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border-2 border-brand-500/40 hover:border-brand-500 dark:border-brand-500/30 dark:hover:border-brand-400 shadow-md hover:shadow-xl transition-all relative overflow-hidden flex flex-col justify-between"
          >
            <div className="flex items-start justify-between gap-4 mb-6">
              <div className="w-14 h-14 rounded-2xl bg-brand-600 text-white flex items-center justify-center shadow-md group-hover:scale-110 transition-transform">
                <Eye className="w-7 h-7" />
              </div>
              <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-brand-100 text-brand-800 dark:bg-brand-950 dark:text-brand-300">
                Primary Vision
              </span>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <h4 className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">
                  SEE
                </h4>
                <ArrowRight className="w-5 h-5 text-brand-600 group-hover:translate-x-1.5 transition-transform" />
              </div>
              <p className="text-base text-slate-600 dark:text-slate-300 font-medium leading-relaxed">
                Describe what's around me.
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Spatial object detection, distance estimation & obstacle alerts.
              </p>
            </div>
          </NavLink>

          {/* TALK (Prominent) */}
          <NavLink
            to="/voice"
            className="group p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border-2 border-purple-500/40 hover:border-purple-500 dark:border-purple-500/30 dark:hover:border-purple-400 shadow-md hover:shadow-xl transition-all relative overflow-hidden flex flex-col justify-between"
          >
            <div className="flex items-start justify-between gap-4 mb-6">
              <div className="w-14 h-14 rounded-2xl bg-purple-600 text-white flex items-center justify-center shadow-md group-hover:scale-110 transition-transform">
                <Mic className="w-7 h-7" />
              </div>
              <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300">
                Primary Voice
              </span>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <h4 className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                  TALK
                </h4>
                <ArrowRight className="w-5 h-5 text-purple-600 group-hover:translate-x-1.5 transition-transform" />
              </div>
              <p className="text-base text-slate-600 dark:text-slate-300 font-medium leading-relaxed">
                Talk naturally with AccessAI.
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Interactive voice conversation, audio waveforms & safety confidence answers.
              </p>
            </div>
          </NavLink>

          {/* READ */}
          <NavLink
            to="/reader"
            className="group p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-emerald-500 dark:hover:border-emerald-500 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
          >
            <div className="flex items-start justify-between gap-4 mb-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                <FileText className="w-6 h-6" />
              </div>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                OCR & Translate
              </span>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <h4 className="text-xl font-bold text-slate-900 dark:text-slate-100 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                  READ
                </h4>
                <ArrowRight className="w-4 h-4 text-emerald-600 group-hover:translate-x-1 transition-transform" />
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-300 font-medium">
                Read signs, documents and text.
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Prescription labels, directions, and menus with Tamil/Hindi/Telugu translations.
              </p>
            </div>
          </NavLink>

          {/* NAVIGATE */}
          <NavLink
            to="/navigation"
            className="group p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-amber-500 dark:hover:border-amber-500 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
          >
            <div className="flex items-start justify-between gap-4 mb-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-100 dark:bg-amber-950 text-amber-600 dark:text-amber-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                <Compass className="w-6 h-6" />
              </div>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300">
                Step-Free
              </span>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <h4 className="text-xl font-bold text-slate-900 dark:text-slate-100 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                  NAVIGATE
                </h4>
                <ArrowRight className="w-4 h-4 text-amber-600 group-hover:translate-x-1 transition-transform" />
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-300 font-medium">
                Find an accessible route.
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Wheelchair ramps, elevators, and tactile paving paths avoiding stairs.
              </p>
            </div>
          </NavLink>
        </div>
      </section>

      {/* Recent Assistance Feed */}
      <section aria-labelledby="recent-heading" className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-slate-500 dark:text-slate-400" />
            <h3 id="recent-heading" className="text-xl font-bold text-slate-900 dark:text-slate-100">
              Recent Assistance
            </h3>
          </div>
          <NavLink
            to="/history"
            className="text-xs sm:text-sm font-semibold text-brand-600 hover:underline flex items-center gap-1"
          >
            View all history <ChevronRight className="w-4 h-4" />
          </NavLink>
        </div>

        <div className="space-y-3">
          {recentAssistance.slice(0, 4).map((item) => (
            <div
              key={item.id}
              onClick={() => navigate(item.actionUrl)}
              className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-brand-400 dark:hover:border-brand-600 shadow-sm hover:shadow transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div className="flex items-start gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0 text-brand-600 dark:text-brand-400">
                  {item.type === 'scene' && <Eye className="w-5 h-5" />}
                  {item.type === 'ocr' && <FileText className="w-5 h-5" />}
                  {item.type === 'safety' && <ShieldAlert className="w-5 h-5 text-amber-500" />}
                  {item.type === 'navigation' && <Compass className="w-5 h-5 text-amber-500" />}
                </div>

                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-base text-slate-900 dark:text-slate-100">{item.title}</span>
                    <span className="text-xs text-slate-400 dark:text-slate-500">• {item.relativeTime}</span>
                    {item.confidence && (
                      <ConfidenceIndicator level={item.confidence} showDetails={false} size="sm" />
                    )}
                  </div>
                  <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed line-clamp-2">
                    {item.summary}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                <button
                  type="button"
                  onClick={(e) => handleReplayAssistance(e, item.summary)}
                  title="Read aloud"
                  aria-label={`Read aloud: ${item.title}`}
                  className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors"
                >
                  <Volume2 className="w-4 h-4" />
                </button>
                <div className="p-2 text-slate-400">
                  <ChevronRight className="w-5 h-5" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </PageContainer>
  );
};
