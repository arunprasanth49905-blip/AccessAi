import React, { useState, useEffect } from 'react';
import {
  Compass,
  ArrowUp,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Volume2,
  VolumeX,
  Play,
  Pause,
  RotateCcw,
  Footprints,
  ShieldCheck,
  AlertTriangle,
} from 'lucide-react';
import { DemoWaypoint, NAVIGATION_FIXTURE } from '../../fixtures/demoFixtures';
import { speechService } from '../../services/speechService';
import { audioFeedback } from '../../services/audioFeedbackService';
import { AccessibleButton } from '../common/AccessibleButton';

interface NavigationFloorplanViewProps {
  onStepChange?: (stepIndex: number, waypoint: DemoWaypoint) => void;
}

export const NavigationFloorplanView: React.FC<NavigationFloorplanViewProps> = ({ onStepChange }) => {
  const waypoints = NAVIGATION_FIXTURE.waypoints;
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  const currentWaypoint = waypoints[currentStepIndex];

  // Speak waypoint instructions
  const speakCurrentInstruction = (waypoint: DemoWaypoint) => {
    audioFeedback.playChime();
    setIsSpeaking(true);
    speechService.speak(waypoint.instruction, {
      onEnd: () => setIsSpeaking(false),
      onError: () => setIsSpeaking(false),
    });
  };

  const handleNextStep = () => {
    if (currentStepIndex < waypoints.length - 1) {
      const nextIndex = currentStepIndex + 1;
      setCurrentStepIndex(nextIndex);
      audioFeedback.playClick();
      speakCurrentInstruction(waypoints[nextIndex]);
      onStepChange?.(nextIndex, waypoints[nextIndex]);
    } else {
      setIsPlaying(false);
      audioFeedback.playSuccess();
    }
  };

  const handlePrevStep = () => {
    if (currentStepIndex > 0) {
      const prevIndex = currentStepIndex - 1;
      setCurrentStepIndex(prevIndex);
      audioFeedback.playClick();
      speakCurrentInstruction(waypoints[prevIndex]);
      onStepChange?.(prevIndex, waypoints[prevIndex]);
    }
  };

  const handleRestart = () => {
    setCurrentStepIndex(0);
    setIsPlaying(false);
    audioFeedback.playClick();
    speakCurrentInstruction(waypoints[0]);
    onStepChange?.(0, waypoints[0]);
  };

  const handleTogglePlay = () => {
    if (isPlaying) {
      setIsPlaying(false);
      audioFeedback.playClick();
    } else {
      setIsPlaying(true);
      audioFeedback.playClick();
      if (!isSpeaking) {
        speakCurrentInstruction(currentWaypoint);
      }
    }
  };

  // Auto progression timer when "Play" mode is active
  useEffect(() => {
    if (!isPlaying) return;

    const timer = setInterval(() => {
      setCurrentStepIndex((prev) => {
        if (prev < waypoints.length - 1) {
          const next = prev + 1;
          speakCurrentInstruction(waypoints[next]);
          onStepChange?.(next, waypoints[next]);
          return next;
        } else {
          setIsPlaying(false);
          audioFeedback.playSuccess();
          return prev;
        }
      });
    }, 4500);

    return () => clearInterval(timer);
  }, [isPlaying, waypoints, onStepChange]);

  const getDirectionIcon = (direction: DemoWaypoint['direction']) => {
    switch (direction) {
      case 'straight':
        return <ArrowUp className="w-5 h-5 text-brand-600" />;
      case 'left':
        return <ArrowLeft className="w-5 h-5 text-emerald-600" />;
      case 'right':
        return <ArrowRight className="w-5 h-5 text-purple-600" />;
      case 'destination':
        return <CheckCircle2 className="w-5 h-5 text-emerald-600" />;
    }
  };

  return (
    <div className="space-y-4">
      {/* Interactive Architectural Floorplan SVG */}
      <div className="relative rounded-3xl overflow-hidden aspect-[16/9] sm:aspect-[2/1] bg-slate-950 border-2 border-slate-200 dark:border-slate-800 shadow-xl p-4 sm:p-6 flex items-center justify-center">
        {/* Floorplan Grid & Architectural Walls */}
        <svg
          viewBox="0 0 800 400"
          className="w-full h-full select-none"
          aria-label="Accessible indoor floorplan diagram"
        >
          {/* Architectural Grid Lines */}
          <defs>
            <pattern id="floor-grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(255, 255, 255, 0.05)" strokeWidth="1" />
            </pattern>
            <linearGradient id="routeGradient" x1="0%" y1="100%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#10b981" />
              <stop offset="50%" stopColor="#06b6d4" />
              <stop offset="100%" stopColor="#8b5cf6" />
            </linearGradient>
          </defs>

          <rect width="800" height="400" fill="url(#floor-grid)" />

          {/* Building Blueprint Rooms and Walls */}
          <g stroke="#334155" strokeWidth="3" fill="rgba(15, 23, 42, 0.6)">
            {/* Lobby / Entrance */}
            <rect x="50" y="260" width="180" height="110" rx="8" />
            {/* Central Corridor */}
            <rect x="230" y="180" width="220" height="190" rx="8" />
            {/* Elevator Concourse */}
            <rect x="450" y="100" width="140" height="180" rx="8" />
            {/* 2nd Floor Classroom Wing */}
            <rect x="590" y="50" width="160" height="180" rx="8" />
          </g>

          {/* Architectural Room Labels */}
          <text x="140" y="325" fill="#64748b" fontSize="11" fontWeight="bold" textAnchor="middle">
            MAIN ENTRANCE
          </text>
          <text x="340" y="300" fill="#64748b" fontSize="11" fontWeight="bold" textAnchor="middle">
            ACCESS RAMP (1:12)
          </text>
          <text x="520" y="195" fill="#64748b" fontSize="11" fontWeight="bold" textAnchor="middle">
            ELEVATOR B
          </text>
          <text x="670" y="145" fill="#64748b" fontSize="11" fontWeight="bold" textAnchor="middle">
            CLASSROOM 204
          </text>

          {/* Obstacle warning on the right side */}
          <g transform="translate(380, 240)">
            <rect x="-12" y="-12" width="24" height="24" rx="6" fill="#f59e0b" opacity="0.25" />
            <circle cx="0" cy="0" r="8" fill="#f59e0b" />
            <text x="0" y="3" fill="#000" fontSize="9" fontWeight="bold" textAnchor="middle">!</text>
            <text x="0" y="24" fill="#fbbf24" fontSize="9" fontWeight="bold" textAnchor="middle">
              Cart (Avoid)
            </text>
          </g>

          {/* Path Line (Dotted Background) */}
          <polyline
            points="120,310 280,240 460,160 600,160 700,90"
            fill="none"
            stroke="#475569"
            strokeWidth="5"
            strokeDasharray="8 8"
            strokeLinecap="round"
          />

          {/* Active Completed Path Line */}
          {currentStepIndex > 0 && (
            <polyline
              points={[
                '120,310',
                currentStepIndex >= 1 ? '280,240' : '',
                currentStepIndex >= 2 ? '460,160' : '',
                currentStepIndex >= 3 ? '600,160' : '',
                currentStepIndex >= 4 ? '700,90' : '',
              ]
                .filter(Boolean)
                .join(' ')}
              fill="none"
              stroke="url(#routeGradient)"
              strokeWidth="6"
              strokeLinecap="round"
            />
          )}

          {/* Waypoint Nodes */}
          {waypoints.map((wp, index) => {
            const isCurrent = index === currentStepIndex;
            const isCompleted = index < currentStepIndex;
            // Map coordinates:
            const coords = [
              { x: 120, y: 310 },
              { x: 280, y: 240 },
              { x: 460, y: 160 },
              { x: 600, y: 160 },
              { x: 700, y: 90 },
            ][index] || { x: 120, y: 310 };

            return (
              <g key={wp.id} transform={`translate(${coords.x}, ${coords.y})`}>
                {/* Active pulse ring */}
                {isCurrent && (
                  <circle cx="0" cy="0" r="22" fill="#10b981" opacity="0.3" className="animate-ping" />
                )}
                <circle
                  cx="0"
                  cy="0"
                  r="14"
                  fill={isCurrent ? '#10b981' : isCompleted ? '#065f46' : '#1e293b'}
                  stroke={isCurrent ? '#34d399' : isCompleted ? '#10b981' : '#475569'}
                  strokeWidth="3"
                />
                <text
                  cx="0"
                  cy="4"
                  fill="#ffffff"
                  fontSize="10"
                  fontWeight="bold"
                  textAnchor="middle"
                  dominantBaseline="middle"
                >
                  {index + 1}
                </text>
              </g>
            );
          })}
        </svg>

        {/* Floating Floorplan HUD Badges */}
        <div className="absolute top-3 left-3 bg-black/80 backdrop-blur-md px-3 py-1.5 rounded-full text-xs font-bold text-white flex items-center gap-1.5 border border-white/10">
          <Compass className="w-3.5 h-3.5 text-brand-400" />
          <span>Step-Free Indoor Graph</span>
        </div>

        <div className="absolute top-3 right-3 bg-black/80 backdrop-blur-md px-3 py-1.5 rounded-full text-xs font-bold text-emerald-400 flex items-center gap-1.5 border border-white/10">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Stairs Avoided (100%)</span>
        </div>

        <div className="absolute bottom-3 left-3 bg-black/80 backdrop-blur-md px-3 py-1.5 rounded-xl text-[11px] font-semibold text-slate-300 flex items-center gap-3 border border-white/10">
          <span>Destination: <strong className="text-white">{NAVIGATION_FIXTURE.destination}</strong></span>
          <span className="text-slate-500">|</span>
          <span>ETA: <strong className="text-emerald-400">{currentWaypoint.eta}</strong></span>
        </div>
      </div>

      {/* Current Waypoint Guidance Card */}
      <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 shadow-lg space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-2xl bg-brand-50 dark:bg-brand-950 border border-brand-200 dark:border-brand-800 flex items-center justify-center">
              {getDirectionIcon(currentWaypoint.direction)}
            </div>
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-brand-600 dark:text-brand-400">
                Waypoint {currentStepIndex + 1} of {waypoints.length}
              </span>
              <h4 className="font-extrabold text-base sm:text-lg text-slate-900 dark:text-slate-100">
                {currentWaypoint.title}
              </h4>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-extrabold px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
              {currentWaypoint.distance}
            </span>
          </div>
        </div>

        {/* Waypoint Instruction Text */}
        <p className="text-base sm:text-lg font-semibold text-slate-800 dark:text-slate-100 leading-relaxed">
          "{currentWaypoint.instruction}"
        </p>

        {/* Accessibility Feature details */}
        <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-start gap-2 text-xs text-slate-600 dark:text-slate-300">
          <Footprints className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
          <span>
            <strong>Accessibility Note:</strong> {currentWaypoint.accessibility}
          </span>
        </div>

        {/* Navigation Step Controls */}
        <div className="flex flex-wrap items-center justify-between gap-2.5 pt-2">
          <div className="flex items-center gap-2">
            <AccessibleButton
              variant="secondary"
              size="md"
              icon={<RotateCcw className="w-4 h-4" />}
              onClick={handleRestart}
              disabled={currentStepIndex === 0}
            >
              Restart
            </AccessibleButton>

            <AccessibleButton
              variant="outline"
              size="md"
              onClick={handlePrevStep}
              disabled={currentStepIndex === 0}
            >
              Previous
            </AccessibleButton>

            <AccessibleButton
              variant="primary"
              size="md"
              onClick={handleNextStep}
              disabled={currentStepIndex === waypoints.length - 1}
            >
              Next Step
            </AccessibleButton>
          </div>

          <div className="flex items-center gap-2">
            <AccessibleButton
              variant={isPlaying ? 'danger' : 'success'}
              size="md"
              icon={isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-current" />}
              onClick={handleTogglePlay}
            >
              {isPlaying ? 'Pause Auto-Run' : 'Auto Play Route'}
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
                  speakCurrentInstruction(currentWaypoint);
                }
              }}
            >
              {isSpeaking ? 'Mute' : 'Speak'}
            </AccessibleButton>
          </div>
        </div>
      </div>
    </div>
  );
};
