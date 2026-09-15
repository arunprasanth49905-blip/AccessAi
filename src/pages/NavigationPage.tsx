import React, { useState, useEffect } from 'react';
import {
  Compass,
  Search,
  Volume2,
  VolumeX,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  SlidersHorizontal,
  Play,
  Pause,
  RotateCcw,
  Square,
  Info,
  Layers,
} from 'lucide-react';
import { PageContainer } from '../components/layout/PageContainer';
import { AccessibleButton } from '../components/common/AccessibleButton';
import { navigationService, DestinationOption } from '../services/navigationService';
import { speechService } from '../services/speechService';
import { audioFeedback } from '../services/audioFeedbackService';
import { useAssistant } from '../context/AssistantContext';
import { useAccessibility } from '../context/AccessibilityContext';
import { AccessibleRoute } from '../types';

type NavState = 'idle' | 'navigating' | 'paused' | 'completed';

export const NavigationPage: React.FC = () => {
  const { showToast, addAssistanceItem, updateNavigationContext, updateNavigationState, setCurrentFeature } = useAssistant();
  const { settings } = useAccessibility();

  // Set current feature in unified context
  useEffect(() => {
    setCurrentFeature('navigation', '/navigation');
  }, [setCurrentFeature]);

  // Navigation State Machine
  const [navState, setNavState] = useState<NavState>('idle');
  const [selectedRouteKey, setSelectedRouteKey] = useState<string>('accessible-entrance');
  const [activeRoute, setActiveRoute] = useState<AccessibleRoute>(() =>
    navigationService.calculateLocalRoute('accessible-entrance', {
      avoidStairs: true,
      preferRamps: true,
      preferElevators: true,
    })
  );
  const [activeStepIndex, setActiveStepIndex] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [isVoiceGuidanceActive, setIsVoiceGuidanceActive] = useState(true);

  // Accessible Routing Preferences
  const [avoidStairs, setAvoidStairs] = useState(true);
  const [preferRamps, setPreferRamps] = useState(true);
  const [preferElevators, setPreferElevators] = useState(true);
  const [avoidCrowds, setAvoidCrowds] = useState(false);
  const [preferWellLit, setPreferWellLit] = useState(true);

  // Recalculate route whenever destination or preferences change
  useEffect(() => {
    let mounted = true;

    async function loadRoute() {
      const computed = await navigationService.calculateRoute(selectedRouteKey, {
        avoidStairs,
        preferRamps,
        preferElevators,
        avoidCrowds,
        preferWellLit,
      });

      if (mounted) {
        setActiveRoute(computed);
        if (navState === 'idle') {
          setActiveStepIndex(0);
        }
      }
    }

    loadRoute();

    return () => {
      mounted = false;
    };
  }, [selectedRouteKey, avoidStairs, preferRamps, preferElevators, avoidCrowds, preferWellLit, navState]);

  // Sync with Assistant Context whenever active waypoint or destination changes
  useEffect(() => {
    if (activeRoute && activeRoute.steps[activeStepIndex]) {
      const step = activeRoute.steps[activeStepIndex];
      updateNavigationState(
        activeRoute.destination,
        step.instruction,
        {
          stepFree: activeRoute.stepFree,
          distanceRemaining: `${activeRoute.distanceMeters}m`,
        }
      );
      updateNavigationContext(
        activeRoute.destination,
        step.instruction
      );
    }
  }, [activeRoute, activeStepIndex, updateNavigationContext, updateNavigationState]);

  // Clean up speech on unmount
  useEffect(() => {
    return () => {
      speechService.stop();
    };
  }, []);

  const destinations: DestinationOption[] = navigationService.getAvailableDestinations();

  const filteredDestinations = destinations.filter((d) =>
    d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    d.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSelectDestination = (key: string) => {
    audioFeedback.playClick();
    setSelectedRouteKey(key);
    setNavState('idle');
    setActiveStepIndex(0);
    showToast('Destination Selected', `Route plan updated for ${key}.`, 'info');
  };

  // State Machine Controls
  const handleStartRoute = () => {
    audioFeedback.playSuccess();
    setNavState('navigating');
    setActiveStepIndex(0);

    const firstStep = activeRoute.steps[0];
    const announcement = `Starting navigation to ${activeRoute.destination}. Total distance is ${activeRoute.distanceMeters} meters. ${firstStep?.audioAnnouncement || ''}`;

    if (isVoiceGuidanceActive && settings.voiceGuidance) {
      speechService.speak(announcement, { rate: settings.speechSpeed });
    }

    showToast('Navigation Started', `Heading to ${activeRoute.destination}`, 'success');

    addAssistanceItem({
      type: 'navigation',
      title: `Guided to ${activeRoute.destination}`,
      summary: `${activeRoute.distanceMeters}m • ${activeRoute.durationMinutes} min • Step-Free`,
      confidence: 'high',
      actionUrl: '/navigation',
    });
  };

  const handlePauseRoute = () => {
    audioFeedback.playClick();
    setNavState('paused');
    speechService.stop();
    showToast('Navigation Paused', 'Press Resume to continue route guidance.', 'info');
  };

  const handleResumeRoute = () => {
    audioFeedback.playClick();
    setNavState('navigating');
    const currentStep = activeRoute.steps[activeStepIndex];
    if (isVoiceGuidanceActive && settings.voiceGuidance && currentStep) {
      speechService.speak(`Resuming guidance. ${currentStep.audioAnnouncement}`, {
        rate: settings.speechSpeed,
      });
    }
    showToast('Navigation Resumed', 'Route guidance active.', 'info');
  };

  const handleNextStep = () => {
    if (activeStepIndex < activeRoute.steps.length - 1) {
      audioFeedback.playClick();
      const nextIndex = activeStepIndex + 1;
      setActiveStepIndex(nextIndex);

      const nextStep = activeRoute.steps[nextIndex];
      if (isVoiceGuidanceActive && settings.voiceGuidance && nextStep) {
        speechService.speak(nextStep.audioAnnouncement, { rate: settings.speechSpeed });
      }

      // If reached final step
      if (nextIndex === activeRoute.steps.length - 1) {
        setNavState('completed');
        audioFeedback.playSuccess();
        showToast('Destination Reached', `You have arrived at ${activeRoute.destination}.`, 'success');
      }
    }
  };

  const handlePreviousStep = () => {
    if (activeStepIndex > 0) {
      audioFeedback.playClick();
      const prevIndex = activeStepIndex - 1;
      setActiveStepIndex(prevIndex);
      setNavState('navigating');

      const prevStep = activeRoute.steps[prevIndex];
      if (isVoiceGuidanceActive && settings.voiceGuidance && prevStep) {
        speechService.speak(prevStep.audioAnnouncement, { rate: settings.speechSpeed });
      }
    }
  };

  const handleRestartRoute = () => {
    audioFeedback.playClick();
    setActiveStepIndex(0);
    setNavState('navigating');
    const firstStep = activeRoute.steps[0];
    if (isVoiceGuidanceActive && settings.voiceGuidance && firstStep) {
      speechService.speak(firstStep.audioAnnouncement, { rate: settings.speechSpeed });
    }
    showToast('Route Restarted', 'Beginning guidance from step 1.', 'info');
  };

  const handleStopRoute = () => {
    audioFeedback.playClick();
    speechService.stop();
    setNavState('idle');
    setActiveStepIndex(0);
    showToast('Navigation Stopped', 'Route ended.', 'info');
  };

  const handleSpeakSingleStep = (announcement: string) => {
    audioFeedback.playChime();
    speechService.speak(announcement, { rate: settings.speechSpeed });
  };

  const currentStep = activeRoute.steps[activeStepIndex] || activeRoute.steps[0];
  const nextStep = activeRoute.steps[activeStepIndex + 1] || null;
  const progressPercent = Math.round(((activeStepIndex + 1) / activeRoute.steps.length) * 100);

  // Coordinate nodes for SVG map rendering
  const mapNodePositions: Record<string, { x: number; y: number; label: string }> = {
    'accessible-entrance': { x: 230, y: 60, label: 'Main Entrance' },
    'accessible-restroom': { x: 240, y: 150, label: 'Restroom' },
    'elevator-bank-b': { x: 150, y: 140, label: 'Elevator B' },
    'classroom-204': { x: 150, y: 50, label: 'Classroom 204' },
    'cafeteria': { x: 60, y: 60, label: 'Cafeteria' },
  };

  const destCoords = mapNodePositions[selectedRouteKey] || { x: 230, y: 60, label: 'Destination' };

  return (
    <PageContainer maxWidth="xl" className="space-y-6">
      {/* Header with Title & Voice Guidance Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-50 dark:bg-amber-950/70 border border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300 text-xs font-bold mb-1">
            <Compass className="w-3.5 h-3.5" />
            <span>NAVIGATE • Accessible & Step-Free Routing</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-100">
            Accessible Indoor Navigation
          </h2>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <AccessibleButton
            variant={isVoiceGuidanceActive ? 'primary' : 'outline'}
            size="md"
            icon={isVoiceGuidanceActive ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            onClick={() => {
              audioFeedback.playClick();
              setIsVoiceGuidanceActive(!isVoiceGuidanceActive);
              if (isVoiceGuidanceActive) speechService.stop();
            }}
          >
            {isVoiceGuidanceActive ? 'Voice Guidance ON' : 'Voice Guidance Muted'}
          </AccessibleButton>
        </div>
      </div>

      {/* GPS Transparency Notice Banner */}
      <div className="p-4 rounded-2xl bg-slate-100 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 flex items-start sm:items-center justify-between gap-3 text-xs sm:text-sm text-slate-700 dark:text-slate-300">
        <div className="flex items-center gap-2.5">
          <Info className="w-4 h-4 text-brand-600 shrink-0" />
          <span>
            <strong>Indoor Structured Waypoints:</strong> GPS is unavailable indoors. AccessAI guides you via verified physical landmarks, tactile paving lines, and audible beacons.
          </span>
        </div>
        <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 whitespace-nowrap hidden sm:inline">
          ISO 21542 Accessibility
        </span>
      </div>

      {/* Destination Search & Filter Chips */}
      <div className="space-y-3">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search accessible indoor destinations (e.g., Restroom, Elevator, Classroom, Exit)..."
            className="w-full pl-12 pr-4 py-3.5 rounded-2xl bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 text-base font-medium focus:outline-none focus:border-brand-500 shadow-sm"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider shrink-0">
            Destinations:
          </span>
          {filteredDestinations.map((dest) => (
            <button
              key={dest.id}
              onClick={() => handleSelectDestination(dest.id)}
              className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold whitespace-nowrap transition-all border ${
                selectedRouteKey === dest.id
                  ? 'bg-amber-500 text-white border-amber-500 font-bold shadow-md shadow-amber-500/20'
                  : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:bg-slate-50'
              }`}
            >
              {dest.name}
            </button>
          ))}
        </div>
      </div>

      {/* Navigation State Bar & Progress */}
      {navState !== 'idle' && (
        <div className="p-5 rounded-3xl bg-amber-500 text-white shadow-xl space-y-3 animate-fadeIn">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="w-3 h-3 rounded-full bg-white animate-ping" />
              <div>
                <span className="text-xs uppercase font-extrabold tracking-wider text-amber-100 block">
                  {navState === 'navigating' && 'Active Navigation Guidance'}
                  {navState === 'paused' && 'Navigation Guidance Paused'}
                  {navState === 'completed' && 'Destination Reached'}
                </span>
                <h3 className="text-xl sm:text-2xl font-black">
                  {activeRoute.destination}
                </h3>
              </div>
            </div>

            <div className="flex items-center gap-2 font-mono text-sm font-bold bg-black/20 px-3 py-1.5 rounded-xl">
              <span>Step {activeStepIndex + 1} of {activeRoute.steps.length}</span>
              <span>•</span>
              <span>{progressPercent}% Complete</span>
            </div>
          </div>

          {/* Progress bar */}
          <div className="w-full h-2.5 bg-black/20 rounded-full overflow-hidden">
            <div
              className="h-full bg-white transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          {/* State Machine Action Controls */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-white/20">
            <div className="flex items-center gap-2">
              {navState === 'navigating' && (
                <AccessibleButton
                  variant="secondary"
                  size="sm"
                  icon={<Pause className="w-4 h-4" />}
                  onClick={handlePauseRoute}
                  className="bg-white/90 text-amber-950 hover:bg-white"
                >
                  Pause
                </AccessibleButton>
              )}

              {navState === 'paused' && (
                <AccessibleButton
                  variant="secondary"
                  size="sm"
                  icon={<Play className="w-4 h-4" />}
                  onClick={handleResumeRoute}
                  className="bg-white/90 text-amber-950 hover:bg-white"
                >
                  Resume
                </AccessibleButton>
              )}

              <AccessibleButton
                variant="outline"
                size="sm"
                icon={<ArrowLeft className="w-4 h-4" />}
                onClick={handlePreviousStep}
                disabled={activeStepIndex === 0}
                className="text-white border-white/40 hover:bg-white/10"
              >
                Previous
              </AccessibleButton>

              <AccessibleButton
                variant="secondary"
                size="sm"
                icon={<ArrowRight className="w-4 h-4" />}
                onClick={handleNextStep}
                disabled={activeStepIndex >= activeRoute.steps.length - 1}
                className="bg-white text-amber-900 font-bold hover:bg-amber-50"
              >
                Next Step
              </AccessibleButton>
            </div>

            <div className="flex items-center gap-2">
              <AccessibleButton
                variant="outline"
                size="sm"
                icon={<RotateCcw className="w-4 h-4" />}
                onClick={handleRestartRoute}
                className="text-white border-white/40 hover:bg-white/10"
              >
                Restart
              </AccessibleButton>

              <AccessibleButton
                variant="outline"
                size="sm"
                icon={<Square className="w-4 h-4 text-red-200" />}
                onClick={handleStopRoute}
                className="text-white border-white/40 hover:bg-red-500/30"
              >
                End Route
              </AccessibleButton>
            </div>
          </div>
        </div>
      )}

      {/* Main Grid: Active Route Summary, Waypoints & Floorplan Map */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Route Overview, Active Waypoint, and Steps */}
        <div className="lg:col-span-7 space-y-5">
          {/* Active Waypoint Stage Card */}
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border-2 border-amber-500/40 dark:border-amber-500/30 shadow-xl space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <span className="text-xs uppercase font-extrabold text-amber-600 dark:text-amber-400 block mb-0.5">
                  {navState === 'idle' ? 'Route Overview' : `Current Waypoint (${activeStepIndex + 1}/${activeRoute.steps.length})`}
                </span>
                <h3 className="text-2xl font-black text-slate-900 dark:text-slate-100">
                  {currentStep.instruction}
                </h3>
              </div>

              <div className="flex items-center gap-2">
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> 100% Step-Free
                </span>
              </div>
            </div>

            {/* Instruction detail & Spoken Announcement */}
            <div className="p-4 rounded-2xl bg-amber-50/70 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 space-y-2">
              <div className="text-xs font-bold uppercase tracking-wider text-amber-800 dark:text-amber-300">
                Waypoint Guidance:
              </div>
              <p className="text-base sm:text-lg font-semibold text-amber-950 dark:text-amber-100 leading-relaxed">
                "{currentStep.detail}"
              </p>
              <div className="pt-2 flex items-center justify-between text-xs">
                <span className="font-mono text-amber-800 dark:text-amber-300">
                  Segment Distance: <strong>{currentStep.distance}</strong>
                </span>
                <button
                  type="button"
                  onClick={() => handleSpeakSingleStep(currentStep.audioAnnouncement)}
                  className="inline-flex items-center gap-1 font-bold text-amber-900 dark:text-amber-200 hover:underline"
                >
                  <Volume2 className="w-3.5 h-3.5" />
                  <span>Replay Instruction</span>
                </button>
              </div>
            </div>

            {/* Next Waypoint Preview */}
            {nextStep && (
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="font-bold text-slate-400 uppercase tracking-wider shrink-0">
                    Next:
                  </span>
                  <span className="font-medium text-slate-800 dark:text-slate-200 truncate">
                    {nextStep.instruction}
                  </span>
                </div>
                <span className="font-mono font-bold text-slate-500 shrink-0 ml-2">
                  {nextStep.distance}
                </span>
              </div>
            )}

            {/* Big Action: Start Route (if idle) or Next Step */}
            {navState === 'idle' ? (
              <AccessibleButton
                variant="primary"
                size="xl"
                fullWidth
                icon={<Play className="w-5 h-5 fill-current" />}
                onClick={handleStartRoute}
                className="shadow-lg shadow-brand-500/25 py-4"
              >
                START ACCESSIBLE ROUTE
              </AccessibleButton>
            ) : navState === 'completed' ? (
              <AccessibleButton
                variant="success"
                size="lg"
                fullWidth
                icon={<RotateCcw className="w-5 h-5" />}
                onClick={handleRestartRoute}
              >
                RESTART ROUTE GUIDANCE
              </AccessibleButton>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                <AccessibleButton
                  variant="outline"
                  size="lg"
                  icon={<ArrowLeft className="w-4 h-4" />}
                  onClick={handlePreviousStep}
                  disabled={activeStepIndex === 0}
                >
                  Previous Step
                </AccessibleButton>
                <AccessibleButton
                  variant="primary"
                  size="lg"
                  icon={<ArrowRight className="w-4 h-4" />}
                  onClick={handleNextStep}
                >
                  {activeStepIndex === activeRoute.steps.length - 2 ? 'Final Waypoint' : 'Next Step'}
                </AccessibleButton>
              </div>
            )}
          </div>

          {/* Turn-by-turn Step List */}
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Turn-by-turn Waypoints ({activeRoute.steps.length})
              </span>
              <span className="text-xs text-slate-500 font-mono">
                Total: {activeRoute.distanceMeters} meters (~{activeRoute.durationMinutes} min)
              </span>
            </div>

            <div className="space-y-2.5">
              {activeRoute.steps.map((step, idx) => {
                const isActive = activeStepIndex === idx && navState !== 'idle';
                const isPassed = activeStepIndex > idx && navState !== 'idle';

                return (
                  <div
                    key={step.id}
                    onClick={() => {
                      setActiveStepIndex(idx);
                      if (navState === 'idle') setNavState('navigating');
                      handleSpeakSingleStep(step.audioAnnouncement);
                    }}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-start justify-between gap-3 ${
                      isActive
                        ? 'bg-amber-50 dark:bg-amber-950/50 border-amber-500 shadow-sm ring-2 ring-amber-400/20'
                        : isPassed
                        ? 'bg-slate-50/60 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 opacity-60'
                        : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                          isActive
                            ? 'bg-amber-500 text-white'
                            : isPassed
                            ? 'bg-emerald-500 text-white'
                            : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        {isPassed ? '✓' : idx + 1}
                      </div>

                      <div className="space-y-0.5">
                        <div className="text-sm font-bold text-slate-900 dark:text-slate-100">
                          {step.instruction}
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">
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
                          handleSpeakSingleStep(step.audioAnnouncement);
                        }}
                        className="p-1 rounded-lg hover:bg-amber-100 text-slate-600 dark:text-slate-300"
                        title="Read aloud"
                      >
                        <Volume2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: Clean SVG Tactile Floorplan & Preferences */}
        <div className="lg:col-span-5 space-y-5">
          {/* Tactile Floorplan Map */}
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5" />
                <span>Indoor Floorplan Layout</span>
              </span>
              <span className="text-xs text-emerald-600 font-bold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Step-Free Certified
              </span>
            </div>

            {/* Dynamic SVG Map */}
            <div className="w-full aspect-square rounded-2xl bg-slate-950 p-4 relative overflow-hidden border border-slate-800 flex items-center justify-center">
              <svg viewBox="0 0 300 300" className="w-full h-full">
                {/* Architectural Building Outline */}
                <rect x="20" y="20" width="260" height="260" rx="16" fill="#0f172a" stroke="#1e293b" strokeWidth="2" />

                {/* Primary Hallway Corridors */}
                <path d="M 50 220 L 250 220" stroke="#334155" strokeWidth="22" strokeLinecap="round" />
                <path d="M 150 50 L 150 250" stroke="#334155" strokeWidth="22" strokeLinecap="round" />
                <path d="M 50 60 L 250 60" stroke="#334155" strokeWidth="18" strokeLinecap="round" />
                <path d="M 50 150 L 250 150" stroke="#334155" strokeWidth="18" strokeLinecap="round" />

                {/* Stairs Node (Avoided - Marked with Red X) */}
                <rect x="55" y="110" width="35" height="30" rx="6" fill="#450a0a" stroke="#ef4444" strokeWidth="2" />
                <text x="72" y="128" fill="#ef4444" fontSize="8" fontWeight="bold" textAnchor="middle">STAIRS</text>
                <line x1="60" y1="115" x2="85" y2="135" stroke="#ef4444" strokeWidth="2" />

                {/* Dynamic Route Line from Origin to Destination */}
                <path
                  d={`M 50 220 L 150 220 L 150 140 L ${destCoords.x} ${destCoords.y}`}
                  fill="none"
                  stroke="#f59e0b"
                  strokeWidth="7"
                  strokeDasharray="6 4"
                  strokeLinecap="round"
                  className="animate-pulse"
                />

                {/* Start Node: You (Main Entrance) */}
                <circle cx="50" cy="220" r="12" fill="#2563eb" stroke="#ffffff" strokeWidth="2.5" />
                <text x="50" y="245" fill="#93c5fd" fontSize="10" fontWeight="bold" textAnchor="middle">Start</text>

                {/* Ground Ramp */}
                <rect x="135" y="205" width="30" height="30" rx="6" fill="#d97706" stroke="#ffffff" strokeWidth="1.5" />
                <text x="150" y="245" fill="#fcd34d" fontSize="9" fontWeight="bold" textAnchor="middle">Ramp</text>

                {/* Elevator Concourse B */}
                <rect x="135" y="125" width="30" height="30" rx="6" fill="#7c3aed" stroke="#ffffff" strokeWidth="1.5" />
                <text x="150" y="115" fill="#c4b5fd" fontSize="9" fontWeight="bold" textAnchor="middle">Elevator B</text>

                {/* Target Destination Node */}
                <circle cx={destCoords.x} cy={destCoords.y} r="14" fill="#10b981" stroke="#ffffff" strokeWidth="3" />
                <text x={destCoords.x} y={destCoords.y - 18} fill="#6ee7b7" fontSize="10" fontWeight="black" textAnchor="middle">
                  {destCoords.label}
                </text>

                {/* Animated User Waypoint Avatar Marker */}
                {navState !== 'idle' && (
                  <circle
                    cx={
                      activeStepIndex === 0 ? 50 :
                      activeStepIndex === 1 ? 150 :
                      activeStepIndex === 2 ? 150 :
                      destCoords.x
                    }
                    cy={
                      activeStepIndex === 0 ? 220 :
                      activeStepIndex === 1 ? 205 :
                      activeStepIndex === 2 ? 140 :
                      destCoords.y
                    }
                    r="8"
                    fill="#38bdf8"
                    stroke="#ffffff"
                    strokeWidth="2"
                    className="animate-ping"
                  />
                )}
              </svg>

              <div className="absolute bottom-2 left-2 right-2 bg-black/85 backdrop-blur-sm text-white px-3 py-1.5 rounded-xl text-[10px] flex items-center justify-between">
                <span>Waypoint Map: {activeRoute.destination}</span>
                <span className="font-mono text-amber-400 font-bold">100% Step-Free</span>
              </div>
            </div>
          </div>

          {/* Accessible Routing Preferences Box */}
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 shadow-xl space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
              <SlidersHorizontal className="w-4 h-4 text-brand-600" />
              <h4 className="font-bold text-base text-slate-900 dark:text-slate-100">
                Accessible Routing Preferences
              </h4>
            </div>

            <div className="space-y-2">
              {[
                { label: 'Avoid stairs (100% step-free)', checked: avoidStairs, set: setAvoidStairs },
                { label: 'Prefer access ramps', checked: preferRamps, set: setPreferRamps },
                { label: 'Prefer elevators for multi-level', checked: preferElevators, set: setPreferElevators },
                { label: 'Avoid crowded concourses', checked: avoidCrowds, set: setAvoidCrowds },
                { label: 'Prefer high-illumination routes', checked: preferWellLit, set: setPreferWellLit },
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
