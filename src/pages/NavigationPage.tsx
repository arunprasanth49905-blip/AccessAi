import React, { useState, useEffect, useCallback, useRef } from 'react';
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
  MapPin,
  Locate,
  AlertTriangle,
  Loader2,
  Navigation,
} from 'lucide-react';
import { PageContainer } from '../components/layout/PageContainer';
import { AccessibleButton } from '../components/common/AccessibleButton';
import {
  navigationService,
  DestinationOption,
  NavigationStateMachineState,
} from '../services/navigationService';
import { geolocationService, LocationState } from '../services/geolocationService';
import { speechService } from '../services/speechService';
import { audioFeedback } from '../services/audioFeedbackService';
import { useAssistant } from '../context/AssistantContext';
import { useAccessibility } from '../context/AccessibilityContext';
import { AccessibleRoute } from '../types';
import { BackendResolvedPlace } from '../services/apiService';
import { RouteMapSvg } from '../components/navigation/RouteMapSvg';

export const NavigationPage: React.FC = () => {
  const { showToast, addAssistanceItem, updateNavigationContext, updateNavigationState, setCurrentFeature } =
    useAssistant();
  const { settings } = useAccessibility();

  // Set current feature in unified context
  useEffect(() => {
    setCurrentFeature('navigation', '/navigation');
  }, [setCurrentFeature]);

  // Navigation State Machine
  const [navState, setNavState] = useState<NavigationStateMachineState>('idle');
  const [selectedRouteKey, setSelectedRouteKey] = useState<string>('accessible-entrance');
  const [selectedPlace, setSelectedPlace] = useState<BackendResolvedPlace | null>(null);
  const [activeRoute, setActiveRoute] = useState<AccessibleRoute>(() =>
    navigationService.calculateLocalRoute('accessible-entrance', {
      avoidStairs: true,
      preferRamps: true,
      preferElevators: true,
    })
  );
  const [activeStepIndex, setActiveStepIndex] = useState(0);
  const [isVoiceGuidanceActive, setIsVoiceGuidanceActive] = useState(true);
  const [isCalculatingRoute, setIsCalculatingRoute] = useState(false);
  const [isOffRoute, setIsOffRoute] = useState(false);
  const [offRouteDistance, setOffRouteDistance] = useState<number | null>(null);

  // Search & Places State
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<BackendResolvedPlace[]>([]);
  const [isSearchingPlaces, setIsSearchingPlaces] = useState(false);
  const [isSearchDropdownOpen, setIsSearchDropdownOpen] = useState(false);
  const searchDebounceRef = useRef<NodeJS.Timeout | null>(null);

  // GPS & Location Mode State
  const [userLocation, setUserLocation] = useState<LocationState | null>(null);
  const [useDeviceGps, setUseDeviceGps] = useState(false);
  const [isLocating, setIsLocating] = useState(false);

  // Accessible Routing Preferences
  const [avoidStairs, setAvoidStairs] = useState(true);
  const [preferRamps, setPreferRamps] = useState(true);
  const [preferElevators, setPreferElevators] = useState(true);
  const [avoidCrowds, setAvoidCrowds] = useState(false);
  const [preferWellLit, setPreferWellLit] = useState(true);

  // Update speech preferences on navigation service
  useEffect(() => {
    navigationService.setAccessibilityOptions({
      voiceGuidance: isVoiceGuidanceActive && settings.voiceGuidance,
      simplifiedMode: settings.simplifiedMode,
      language: settings.language,
    });
  }, [isVoiceGuidanceActive, settings.voiceGuidance, settings.simplifiedMode, settings.language]);

  // Place Search Autocomplete with debounce
  useEffect(() => {
    if (!searchQuery.trim() || searchQuery.length < 2) {
      setSearchResults([]);
      setIsSearchingPlaces(false);
      return;
    }

    if (searchDebounceRef.current) {
      clearTimeout(searchDebounceRef.current);
    }

    setIsSearchingPlaces(true);
    searchDebounceRef.current = setTimeout(async () => {
      try {
        const coords = userLocation?.coords
          ? { latitude: userLocation.coords.latitude, longitude: userLocation.coords.longitude }
          : undefined;
        const places = await navigationService.resolvePlace(searchQuery, coords);
        setSearchResults(places);
        setIsSearchDropdownOpen(true);
      } catch {
        setSearchResults([]);
      } finally {
        setIsSearchingPlaces(false);
      }
    }, 350);

    return () => {
      if (searchDebounceRef.current) {
        clearTimeout(searchDebounceRef.current);
      }
    };
  }, [searchQuery, userLocation]);

  // Toggle Device GPS Location
  const handleToggleGps = async () => {
    audioFeedback.playClick();
    if (!useDeviceGps) {
      setIsLocating(true);
      showToast('Acquiring GPS', 'Requesting device geolocation for real-world navigation...', 'info');
      try {
        const loc = await geolocationService.getCurrentPosition({ enableHighAccuracy: true });
        setUserLocation(loc);
        if (loc.coords && loc.source === 'device') {
          setUseDeviceGps(true);
          showToast(
            'GPS Active',
            `Location locked (Accuracy: ±${Math.round(loc.coords.accuracy)}m). Routing will now use your coordinates.`,
            'success'
          );
        } else if (loc.error) {
          showToast('Location Notice', loc.error, 'warning');
        }
      } catch {
        showToast('Location Unavailable', 'Could not obtain device GPS. Using indoor concourse anchor.', 'warning');
      } finally {
        setIsLocating(false);
      }
    } else {
      setUseDeviceGps(false);
      showToast('Indoor Mode Active', 'Routing anchored to Main Entrance Concourse.', 'info');
    }
  };

  // Recalculate route whenever destination, place, GPS mode, or preferences change
  const fetchRoute = useCallback(async () => {
    setIsCalculatingRoute(true);

    try {
      const destinationKey = selectedPlace ? selectedPlace.formattedAddress || selectedPlace.name : selectedRouteKey;
      const originCoords = useDeviceGps && userLocation?.coords
        ? { latitude: userLocation.coords.latitude, longitude: userLocation.coords.longitude }
        : undefined;
      const destinationCoords = selectedPlace
        ? { latitude: selectedPlace.latitude, longitude: selectedPlace.longitude }
        : undefined;

      const computed = await navigationService.calculateRoute(
        destinationKey,
        {
          avoidStairs,
          preferRamps,
          preferElevators,
          avoidCrowds,
          preferWellLit,
        },
        useDeviceGps ? 'Current Location' : 'main-entrance',
        {
          originCoords,
          destinationCoords,
        }
      );

      setActiveRoute(computed);
      if (navState === 'idle') {
        setActiveStepIndex(0);
      }
    } catch {
      // Fallback local route if calculation fails
      const fallback = navigationService.calculateLocalRoute(selectedRouteKey, {
        avoidStairs,
        preferRamps,
        preferElevators,
        avoidCrowds,
        preferWellLit,
      });
      setActiveRoute(fallback);
    } finally {
      setIsCalculatingRoute(false);
    }
  }, [
    selectedRouteKey,
    selectedPlace,
    useDeviceGps,
    userLocation,
    avoidStairs,
    preferRamps,
    preferElevators,
    avoidCrowds,
    preferWellLit,
    navState,
  ]);

  useEffect(() => {
    fetchRoute();
  }, [fetchRoute]);

  // Sync with Assistant Context whenever active waypoint or route changes
  useEffect(() => {
    if (activeRoute && activeRoute.steps[activeStepIndex]) {
      const currentStep = activeRoute.steps[activeStepIndex];
      const nextStep = activeRoute.steps[activeStepIndex + 1];

      updateNavigationState(activeRoute.destination, currentStep.instruction, {
        stepFree: activeRoute.stepFree,
        distanceRemaining: `${activeRoute.distanceMeters}m`,
        nextStep: nextStep ? nextStep.instruction : undefined,
        distanceToNext: nextStep ? nextStep.distance : undefined,
        isOffRoute,
        routeSource: activeRoute.source || 'osrm-pedestrian',
        accuracyLevel: userLocation?.accuracyLevel || 'high',
        status: navState,
      });

      updateNavigationContext(activeRoute.destination, currentStep.instruction);
    }
  }, [
    activeRoute,
    activeStepIndex,
    isOffRoute,
    navState,
    userLocation,
    updateNavigationContext,
    updateNavigationState,
  ]);

  // Clean up navigation and speech on unmount
  useEffect(() => {
    return () => {
      navigationService.stopNavigation();
      speechService.stop();
    };
  }, []);

  const destinations: DestinationOption[] = navigationService.getAvailableDestinations();

  const handleSelectIndoorDestination = (key: string) => {
    audioFeedback.playClick();
    setSelectedRouteKey(key);
    setSelectedPlace(null);
    setSearchQuery('');
    setIsSearchDropdownOpen(false);
    setNavState('idle');
    setActiveStepIndex(0);
    setIsOffRoute(false);
    showToast('Destination Selected', `Route plan updated for ${key}.`, 'info');
  };

  const handleSelectPlaceResult = (place: BackendResolvedPlace) => {
    audioFeedback.playSuccess();
    setSelectedPlace(place);
    setSelectedRouteKey(place.id);
    setSearchQuery(place.name);
    setIsSearchDropdownOpen(false);
    setNavState('idle');
    setActiveStepIndex(0);
    setIsOffRoute(false);
    showToast('Destination Set', `Routing to ${place.name} (${place.formattedAddress})`, 'success');
  };

  // State Machine Handlers
  const handleStartRoute = () => {
    audioFeedback.playSuccess();
    setActiveStepIndex(0);
    setIsOffRoute(false);

    navigationService.startNavigation(activeRoute, {
      onStateChange: (state) => {
        setNavState(state);
      },
      onStepAdvance: (index) => {
        setActiveStepIndex(index);
      },
      onLocationUpdate: (loc) => {
        setUserLocation(loc);
      },
      onOffRouteDetected: (distance) => {
        setIsOffRoute(true);
        setOffRouteDistance(distance);
        showToast('Off Route Alert', `User is ${distance}m away from the planned path.`, 'warning');
      },
      onArrival: () => {
        setNavState('arrived');
        showToast('Destination Reached', `You have arrived at ${activeRoute.destination}.`, 'success');
      },
    });

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
    navigationService.pauseNavigation();
    setNavState('paused');
    showToast('Navigation Paused', 'Press Resume to continue route guidance.', 'info');
  };

  const handleResumeRoute = () => {
    audioFeedback.playClick();
    navigationService.resumeNavigation();
    setNavState('navigating');
    showToast('Navigation Resumed', 'Route guidance active.', 'info');
  };

  const handleNextStep = () => {
    audioFeedback.playClick();
    navigationService.nextStep();
  };

  const handlePreviousStep = () => {
    audioFeedback.playClick();
    navigationService.previousStep();
  };

  const handleRestartRoute = () => {
    audioFeedback.playClick();
    handleStartRoute();
  };

  const handleStopRoute = () => {
    audioFeedback.playClick();
    navigationService.stopNavigation();
    setNavState('idle');
    setActiveStepIndex(0);
    setIsOffRoute(false);
    showToast('Navigation Stopped', 'Route guidance ended.', 'info');
  };

  const handleSpeakSingleStep = (announcement: string) => {
    audioFeedback.playChime();
    speechService.speak(announcement, { rate: settings.speechSpeed });
  };

  const currentStep = activeRoute.steps[activeStepIndex] || activeRoute.steps[0];
  const nextStep = activeRoute.steps[activeStepIndex + 1] || null;
  const progressPercent = Math.round(((activeStepIndex + 1) / Math.max(1, activeRoute.steps.length)) * 100);

  return (
    <PageContainer maxWidth="xl" className="space-y-6">
      {/* Header with Title, GPS Location Switch, & Voice Guidance Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-50 dark:bg-amber-950/70 border border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300 text-xs font-bold mb-1">
            <Compass className="w-3.5 h-3.5" />
            <span>NAVIGATE • Accessible & Step-Free Routing</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-100">
            Accessible Real-World & Indoor Navigation
          </h2>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Real GPS Location Toggle Button */}
          <AccessibleButton
            variant={useDeviceGps ? 'secondary' : 'outline'}
            size="md"
            icon={isLocating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Locate className="w-4 h-4" />}
            onClick={handleToggleGps}
            title="Toggle real device geolocation for outdoor walking navigation"
          >
            {useDeviceGps
              ? userLocation?.coords
                ? `GPS Active (±${Math.round(userLocation.coords.accuracy)}m)`
                : 'GPS Active'
              : 'Use Device GPS'}
          </AccessibleButton>

          {/* Voice Guidance Toggle */}
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
            {isVoiceGuidanceActive ? 'Voice ON' : 'Voice Muted'}
          </AccessibleButton>
        </div>
      </div>

      {/* Real-time Status Notice Banner */}
      <div className="p-4 rounded-2xl bg-slate-100 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 flex items-start sm:items-center justify-between gap-3 text-xs sm:text-sm text-slate-700 dark:text-slate-300">
        <div className="flex items-center gap-2.5">
          <Info className="w-4 h-4 text-brand-600 shrink-0" />
          <span>
            {activeRoute.source === 'osrm-pedestrian' ? (
              <span>
                <strong>OSRM Pedestrian Routing:</strong> Step-free real-world path geometry computed from OpenStreetMap data.
              </span>
            ) : (
              <span>
                <strong>Indoor Waypoints Engine:</strong> Step-free campus route guided by verified tactile paving, ramps, and audio beacons.
              </span>
            )}
          </span>
        </div>
        <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 whitespace-nowrap hidden sm:inline">
          {activeRoute.stepFree ? '100% Step-Free' : 'Pedestrian Path'}
        </span>
      </div>

      {/* Destination Search & Place Autocomplete Bar */}
      <div className="space-y-3 relative">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => {
              if (searchResults.length > 0) setIsSearchDropdownOpen(true);
            }}
            placeholder="Search destination, address, or campus landmark (e.g. Restroom, Library, Central Station)..."
            className="w-full pl-12 pr-10 py-3.5 rounded-2xl bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 text-base font-medium focus:outline-none focus:border-brand-500 shadow-sm"
          />
          {isSearchingPlaces && (
            <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 animate-spin" />
          )}
        </div>

        {/* Place Autocomplete Dropdown */}
        {isSearchDropdownOpen && searchResults.length > 0 && (
          <div className="absolute top-full left-0 right-0 z-30 mt-1 bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl max-h-72 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
            {searchResults.map((place) => (
              <button
                key={place.id}
                type="button"
                onClick={() => handleSelectPlaceResult(place)}
                className="w-full text-left p-3.5 hover:bg-amber-50 dark:hover:bg-amber-950/40 transition-colors flex items-start gap-3 group"
              >
                <MapPin className="w-4 h-4 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0 group-hover:scale-110 transition-transform" />
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    <span className="truncate">{place.name}</span>
                    {place.isAccessibleVerified && (
                      <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 shrink-0">
                        Step-Free
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 truncate">
                    {place.formattedAddress}
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Indoor Quick-Select Chips */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider shrink-0">
            Quick Indoor:
          </span>
          {destinations.map((dest) => (
            <button
              key={dest.id}
              onClick={() => handleSelectIndoorDestination(dest.id)}
              className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold whitespace-nowrap transition-all border ${
                selectedRouteKey === dest.id && !selectedPlace
                  ? 'bg-amber-500 text-white border-amber-500 font-bold shadow-md shadow-amber-500/20'
                  : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:bg-slate-50'
              }`}
            >
              {dest.name}
            </button>
          ))}
        </div>
      </div>

      {/* Navigation State Bar & Turn Banner */}
      {navState !== 'idle' && (
        <div
          className={`p-5 rounded-3xl text-white shadow-xl space-y-3 animate-fadeIn transition-colors ${
            isOffRoute
              ? 'bg-rose-600'
              : navState === 'approaching_turn'
              ? 'bg-amber-600'
              : navState === 'arrived'
              ? 'bg-emerald-600'
              : 'bg-amber-500'
          }`}
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="w-3 h-3 rounded-full bg-white animate-ping" />
              <div>
                <span className="text-xs uppercase font-extrabold tracking-wider text-amber-100 block">
                  {isOffRoute && (
                    <span className="flex items-center gap-1 text-white">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      <span>Off-Route Alert{offRouteDistance ? ` (${offRouteDistance}m from path)` : ' (>45m from path)'}</span>
                    </span>
                  )}
                  {!isOffRoute && navState === 'navigating' && 'Active Turn Guidance'}
                  {!isOffRoute && navState === 'approaching_turn' && 'Approaching Next Turn'}
                  {!isOffRoute && navState === 'paused' && 'Navigation Paused'}
                  {!isOffRoute && navState === 'arrived' && 'Destination Reached'}
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
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  {activeRoute.stepFree ? '100% Step-Free' : 'Pedestrian Path'}
                </span>
              </div>
            </div>

            {/* Instruction detail & Spoken Announcement */}
            <div className="p-4 rounded-2xl bg-amber-50/70 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 space-y-2">
              <div className="text-xs font-bold uppercase tracking-wider text-amber-800 dark:text-amber-300 flex items-center justify-between">
                <span>Waypoint Guidance:</span>
                {currentStep.streetName && (
                  <span className="font-mono text-slate-500 text-[11px]">
                    Street: {currentStep.streetName}
                  </span>
                )}
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
                icon={isCalculatingRoute ? <Loader2 className="w-5 h-5 animate-spin" /> : <Play className="w-5 h-5 fill-current" />}
                onClick={handleStartRoute}
                disabled={isCalculatingRoute}
                className="shadow-lg shadow-brand-500/25 py-4"
              >
                {isCalculatingRoute ? 'CALCULATING ACCESSIBLE ROUTE...' : 'START ACCESSIBLE ROUTE'}
              </AccessibleButton>
            ) : navState === 'arrived' ? (
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

            <div className="space-y-2.5 max-h-96 overflow-y-auto pr-1">
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
                        {step.streetName && (
                          <div className="text-[11px] font-mono text-slate-400">
                            {step.streetName}
                          </div>
                        )}
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

        {/* Right Column: Route Map SVG & Preferences */}
        <div className="lg:col-span-5 space-y-5">
          {/* Real-World Geometry or Tactile Floorplan Map */}
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                {activeRoute.geometry && activeRoute.geometry.length > 0 ? (
                  <>
                    <Navigation className="w-3.5 h-3.5 text-sky-500" />
                    <span>Real-World GPS Pedestrian Path</span>
                  </>
                ) : (
                  <>
                    <Layers className="w-3.5 h-3.5 text-amber-500" />
                    <span>Indoor Architectural Floorplan</span>
                  </>
                )}
              </span>
              <span className="text-xs text-emerald-600 font-bold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                {activeRoute.stepFree ? 'Step-Free Certified' : 'Verified Route'}
              </span>
            </div>

            {/* Dynamic SVG Map (Real geometry or Indoor floorplan) */}
            <RouteMapSvg
              geometry={activeRoute.geometry}
              steps={activeRoute.steps}
              activeStepIndex={activeStepIndex}
              destinationName={activeRoute.destination}
              isIndoor={!activeRoute.geometry || activeRoute.geometry.length === 0}
              selectedIndoorKey={selectedRouteKey}
              isOffRoute={isOffRoute}
              userCoords={userLocation?.coords || null}
            />
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
