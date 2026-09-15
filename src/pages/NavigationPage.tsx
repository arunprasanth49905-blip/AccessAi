import React, { useState } from 'react';
import {
  Compass,
  Search,
  MapPin,
  Volume2,
  CheckCircle2,
  ShieldCheck,
  Footprints,
  Clock,
  ArrowRight,
  Sparkles,
  SlidersHorizontal,
  ChevronDown,
} from 'lucide-react';
import { PageContainer } from '../components/layout/PageContainer';
import { AccessibleButton } from '../components/common/AccessibleButton';
import { ConfidenceIndicator } from '../components/common/ConfidenceIndicator';
import { navigationService, ACCESSIBLE_ROUTES } from '../services/navigationService';
import { speechService } from '../services/speechService';
import { audioFeedback } from '../services/audioFeedbackService';
import { useAssistant } from '../context/AssistantContext';
import { useAccessibility } from '../context/AccessibilityContext';
import { AccessibleRoute } from '../types';

export const NavigationPage: React.FC = () => {
  const { showToast, addAssistanceItem } = useAssistant();
  const { settings } = useAccessibility();

  const [selectedRouteKey, setSelectedRouteKey] = useState<string>('accessible-entrance');
  const [activeRoute, setActiveRoute] = useState<AccessibleRoute>(() =>
    navigationService.getRoute('accessible-entrance')
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [activeStepIndex, setActiveStepIndex] = useState(0);

  // Preference Toggles
  const [avoidStairs, setAvoidStairs] = useState(true);
  const [preferRamps, setPreferRamps] = useState(true);
  const [preferElevators, setPreferElevators] = useState(true);
  const [avoidCrowds, setAvoidCrowds] = useState(false);
  const [preferWellLit, setPreferWellLit] = useState(true);
  const [minimizeWalking, setMinimizeWalking] = useState(false);

  const handleSelectDestination = (key: string) => {
    audioFeedback.playClick();
    setSelectedRouteKey(key);
    const r = navigationService.getRoute(key);
    setActiveRoute(r);
    setActiveStepIndex(0);
    showToast('Accessible Route Calculated', `Calculated step-free path to ${r.destination}.`, 'success');

    addAssistanceItem({
      type: 'navigation',
      title: `Route to ${r.destination}`,
      summary: `${r.distanceMeters}m • ${r.durationMinutes} min • 100% Step-free`,
      confidence: 'high',
      actionUrl: '/navigation',
    });
  };

  const handleAnnounceStep = (text: string) => {
    audioFeedback.playChime();
    speechService.speak(text, { rate: settings.speechSpeed });
  };

  const handleStartFullAudioGuidance = () => {
    audioFeedback.playChime();
    const fullSummary = `Starting step-free guidance to ${activeRoute.destination}. Total distance is ${activeRoute.distanceMeters} meters, approximately ${activeRoute.durationMinutes} minutes. ${activeRoute.steps[0].audioAnnouncement}`;
    speechService.speak(fullSummary, { rate: settings.speechSpeed });
    showToast('Voice Navigation Started', 'Audio guidance is active.', 'info');
  };

  return (
    <PageContainer maxWidth="xl" className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-50 dark:bg-amber-950/70 border border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300 text-xs font-bold mb-1">
            <Compass className="w-3.5 h-3.5" />
            <span>NAVIGATE • Accessible & Step-Free Routing</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-100">
            Where would you like to go?
          </h2>
        </div>

        <AccessibleButton
          variant="primary"
          size="md"
          icon={<Volume2 className="w-4 h-4" />}
          onClick={handleStartFullAudioGuidance}
        >
          Start Audio Guidance
        </AccessibleButton>
      </div>

      {/* Destination Search Field & Quick Chips */}
      <div className="space-y-3">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search destination (e.g. Elevator B, Universal Restroom, Main Exit)..."
            className="w-full pl-12 pr-4 py-3.5 rounded-2xl bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 text-base font-medium focus:outline-none focus:border-brand-500 shadow-sm"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider shrink-0">
            Quick Destinations:
          </span>
          {[
            { key: 'accessible-entrance', label: 'Accessible Entrance' },
            { key: 'accessible-restroom', label: 'Universal Restroom' },
            { key: 'elevator-concourse', label: 'Elevator Concourse B' },
          ].map((dest) => (
            <button
              key={dest.key}
              onClick={() => handleSelectDestination(dest.key)}
              className={`px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-semibold whitespace-nowrap transition-all border ${
                selectedRouteKey === dest.key
                  ? 'bg-amber-500 text-white border-amber-500 font-bold shadow-sm'
                  : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:bg-slate-50'
              }`}
            >
              {dest.label}
            </button>
          ))}
        </div>
      </div>

      {/* Route Overview & Visual Map Split */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Route Summary & Step Flow */}
        <div className="lg:col-span-7 space-y-5">
          {/* Accessible Route Metric Card */}
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border-2 border-amber-500/40 dark:border-amber-500/30 shadow-xl space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <span className="text-xs uppercase font-bold text-amber-600 dark:text-amber-400 block mb-0.5">
                  Calculated Route
                </span>
                <h3 className="text-2xl font-extrabold text-slate-900 dark:text-slate-100">
                  {activeRoute.destination}
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                  100% Step-Free
                </span>
              </div>
            </div>

            {/* Distance & Time Metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div className="p-3.5 rounded-2xl bg-amber-50/70 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800">
                <div className="text-xs text-amber-800 dark:text-amber-300 font-semibold">Distance</div>
                <div className="text-2xl font-extrabold text-amber-900 dark:text-amber-100">
                  {activeRoute.distanceMeters} m
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                <div className="text-xs text-slate-500 dark:text-slate-400 font-semibold">Estimated Time</div>
                <div className="text-2xl font-extrabold text-slate-900 dark:text-slate-100">
                  {activeRoute.durationMinutes} min
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 col-span-2 sm:col-span-1">
                <div className="text-xs text-slate-500 dark:text-slate-400 font-semibold">Lighting & Path</div>
                <div className="text-sm font-bold text-slate-900 dark:text-slate-100 mt-1">
                  Bright • Tactile Ground
                </div>
              </div>
            </div>

            {/* Explicit Prompt Flow: You ↓ Ramp ↓ Elevator ↓ Accessible Entrance */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-3">
                Key Accessibility Waypoints
              </span>
              <div className="flex flex-wrap items-center justify-between gap-2 text-sm font-bold">
                <span className="px-3 py-1.5 rounded-xl bg-brand-100 text-brand-800 dark:bg-brand-950 dark:text-brand-300">
                  You (Start)
                </span>
                <span className="text-slate-400 font-bold">↓</span>
                <span className="px-3 py-1.5 rounded-xl bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                  Ramp
                </span>
                <span className="text-slate-400 font-bold">↓</span>
                <span className="px-3 py-1.5 rounded-xl bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300">
                  Elevator
                </span>
                <span className="text-slate-400 font-bold">↓</span>
                <span className="px-3 py-1.5 rounded-xl bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                  Accessible Entrance
                </span>
              </div>
            </div>

            {/* Step-by-Step Directions */}
            <div className="space-y-3 pt-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
                Turn-by-turn Waypoints:
              </span>
              {activeRoute.steps.map((step, idx) => {
                const isActive = activeStepIndex === idx;

                return (
                  <div
                    key={step.id}
                    onClick={() => {
                      setActiveStepIndex(idx);
                      handleAnnounceStep(step.audioAnnouncement);
                    }}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-start justify-between gap-3 ${
                      isActive
                        ? 'bg-amber-50 dark:bg-amber-950/50 border-amber-500 dark:border-amber-400 shadow-sm'
                        : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                          isActive
                            ? 'bg-amber-500 text-white'
                            : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        {idx + 1}
                      </div>

                      <div className="space-y-0.5">
                        <div className="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100">
                          {step.instruction}
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                          {step.detail}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-start shrink-0">
                      <span className="text-xs font-mono font-bold text-slate-400">{step.distance}</span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAnnounceStep(step.audioAnnouncement);
                        }}
                        className="p-1.5 rounded-lg hover:bg-amber-100 text-slate-600 dark:text-slate-300"
                        title="Read step aloud"
                      >
                        <Volume2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: Clean Map-Style Visualization & Preferences */}
        <div className="lg:col-span-5 space-y-5">
          {/* Clean Map-Style Tactile Floorplan Visualization */}
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Accessible Floorplan Route
              </span>
              <span className="text-xs text-emerald-600 font-bold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Stairs Avoided
              </span>
            </div>

            {/* Tactile SVG Map Layout */}
            <div className="w-full aspect-square rounded-2xl bg-slate-950 p-4 relative overflow-hidden border border-slate-800 flex items-center justify-center">
              <svg viewBox="0 0 300 300" className="w-full h-full">
                {/* Architectural Grid & Corridors */}
                <rect x="20" y="20" width="260" height="260" rx="16" fill="#0f172a" stroke="#1e293b" strokeWidth="2" />
                
                {/* Corridors */}
                <path d="M 50 150 L 250 150 M 150 50 L 150 250" stroke="#334155" strokeWidth="24" strokeLinecap="round" />

                {/* Stairs Node (Avoided - Marked with Red X) */}
                <rect x="60" y="80" width="40" height="40" rx="8" fill="#450a0a" stroke="#ef4444" strokeWidth="2" />
                <text x="80" y="104" fill="#ef4444" fontSize="10" fontWeight="bold" textAnchor="middle">STAIRS</text>
                <line x1="65" y1="85" x2="95" y2="115" stroke="#ef4444" strokeWidth="2" />

                {/* Accessible Route Line (Glowing Yellow/Amber) */}
                <path
                  d="M 50 220 L 150 220 L 150 150 L 230 150 L 230 70"
                  fill="none"
                  stroke="#f59e0b"
                  strokeWidth="8"
                  strokeDasharray="6 4"
                  strokeLinecap="round"
                  className="animate-pulse"
                />

                {/* Nodes on Path */}
                {/* Start (You) */}
                <circle cx="50" cy="220" r="14" fill="#2563eb" stroke="#ffffff" strokeWidth="3" />
                <text x="50" y="250" fill="#93c5fd" fontSize="11" fontWeight="bold" textAnchor="middle">You</text>

                {/* Ramp Node */}
                <rect x="135" y="205" width="30" height="30" rx="6" fill="#d97706" stroke="#ffffff" strokeWidth="2" />
                <text x="150" y="245" fill="#fcd34d" fontSize="10" fontWeight="bold" textAnchor="middle">Ramp</text>

                {/* Elevator Node */}
                <rect x="135" y="135" width="30" height="30" rx="6" fill="#7c3aed" stroke="#ffffff" strokeWidth="2" />
                <text x="150" y="125" fill="#c4b5fd" fontSize="10" fontWeight="bold" textAnchor="middle">Elevator B</text>

                {/* Destination */}
                <circle cx="230" cy="70" r="14" fill="#10b981" stroke="#ffffff" strokeWidth="3" />
                <text x="230" y="50" fill="#6ee7b7" fontSize="11" fontWeight="bold" textAnchor="middle">Entrance</text>
              </svg>

              <div className="absolute bottom-2 left-2 right-2 bg-black/80 backdrop-blur-sm text-white px-2.5 py-1.5 rounded-lg text-[10px] flex items-center justify-between">
                <span>Tactile map guide active</span>
                <span className="font-mono text-amber-400">Step-free node verified</span>
              </div>
            </div>
          </div>

          {/* Preferences Box */}
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 shadow-xl space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
              <SlidersHorizontal className="w-4 h-4 text-brand-600" />
              <h4 className="font-bold text-base text-slate-900 dark:text-slate-100">
                Routing Preferences
              </h4>
            </div>

            <div className="space-y-2.5">
              {[
                { label: 'Avoid stairs', checked: avoidStairs, set: setAvoidStairs },
                { label: 'Prefer ramps', checked: preferRamps, set: setPreferRamps },
                { label: 'Prefer elevators', checked: preferElevators, set: setPreferElevators },
                { label: 'Avoid crowded areas', checked: avoidCrowds, set: setAvoidCrowds },
                { label: 'Prefer well-lit routes', checked: preferWellLit, set: setPreferWellLit },
                { label: 'Minimize walking', checked: minimizeWalking, set: setMinimizeWalking },
              ].map((pref, i) => (
                <label
                  key={i}
                  className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/60 cursor-pointer transition-colors"
                >
                  <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                    {pref.label}
                  </span>
                  <input
                    type="checkbox"
                    checked={pref.checked}
                    onChange={(e) => {
                      audioFeedback.playClick();
                      pref.set(e.target.checked);
                      showToast('Routing Preference Updated', pref.label, 'info');
                    }}
                    className="w-5 h-5 rounded text-brand-600 focus:ring-brand-500 border-slate-300 dark:border-slate-700 cursor-pointer"
                  />
                </label>
              ))}
            </div>
          </div>
        </div>
      </div>
    </PageContainer>
  );
};
