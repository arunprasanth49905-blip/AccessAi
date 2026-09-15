// Route Map SVG Component - Renders both real-world GPS route geometry and indoor architectural floorplans
import React, { useMemo } from 'react';
import { CheckCircle2, AlertTriangle, Navigation, MapPin } from 'lucide-react';
import { NavStep } from '../../types';

interface RouteMapSvgProps {
  geometry?: [number, number][];
  steps: NavStep[];
  activeStepIndex: number;
  destinationName: string;
  isIndoor?: boolean;
  selectedIndoorKey?: string;
  isOffRoute?: boolean;
  userCoords?: { latitude: number; longitude: number } | null;
  className?: string;
}

export const RouteMapSvg: React.FC<RouteMapSvgProps> = ({
  geometry,
  steps,
  activeStepIndex,
  destinationName,
  isIndoor: _isIndoor = true,
  selectedIndoorKey = 'accessible-entrance',
  isOffRoute = false,
  userCoords,
  className = '',
}) => {
  const hasRealGeometry = Boolean(geometry && geometry.length >= 2);

  // Compute normalized SVG points for real-world geometry
  const { pathD, projectedPoints, startPt, endPt, activePt, userPt } = useMemo(() => {
    if (!hasRealGeometry || !geometry) {
      return { pathD: '', projectedPoints: [], startPt: null, endPt: null, activePt: null, userPt: null };
    }

    const PADDING = 36;
    const WIDTH = 320;
    const HEIGHT = 320;

    let minLat = Infinity;
    let maxLat = -Infinity;
    let minLng = Infinity;
    let maxLng = -Infinity;

    for (const [lat, lng] of geometry) {
      if (lat < minLat) minLat = lat;
      if (lat > maxLat) maxLat = lat;
      if (lng < minLng) minLng = lng;
      if (lng > maxLng) maxLng = lng;
    }

    const latSpan = maxLat - minLat || 0.0001;
    const lngSpan = maxLng - minLng || 0.0001;

    // Aspect-ratio preservation
    const drawWidth = WIDTH - 2 * PADDING;
    const drawHeight = HEIGHT - 2 * PADDING;

    const toSvgCoord = (lat: number, lng: number): [number, number] => {
      const normX = (lng - minLng) / lngSpan;
      const normY = (lat - minLat) / latSpan;

      const x = PADDING + normX * drawWidth;
      const y = HEIGHT - PADDING - normY * drawHeight; // Invert Y for north
      return [Math.round(x * 10) / 10, Math.round(y * 10) / 10];
    };

    const pts = geometry.map(([lat, lng]) => toSvgCoord(lat, lng));
    const d = pts.reduce((acc, [x, y], idx) => (idx === 0 ? `M ${x} ${y}` : `${acc} L ${x} ${y}`), '');

    const start = pts[0];
    const end = pts[pts.length - 1];

    // Find closest geometry point to active step
    const currentStep = steps[activeStepIndex];
    let activePoint = start;
    if (currentStep?.location) {
      activePoint = toSvgCoord(currentStep.location[0], currentStep.location[1]);
    } else if (pts.length > 0) {
      const ratio = Math.min(1, Math.max(0, activeStepIndex / (steps.length || 1)));
      const targetIdx = Math.min(pts.length - 1, Math.floor(ratio * pts.length));
      activePoint = pts[targetIdx];
    }

    let userPoint: [number, number] | null = null;
    if (userCoords) {
      userPoint = toSvgCoord(userCoords.latitude, userCoords.longitude);
    }

    return {
      pathD: d,
      projectedPoints: pts,
      startPt: start,
      endPt: end,
      activePt: activePoint,
      userPt: userPoint,
    };
  }, [hasRealGeometry, geometry, steps, activeStepIndex, userCoords]);

  // Coordinates for Indoor Architectural Floorplan nodes
  const indoorNodePositions: Record<string, { x: number; y: number; label: string }> = {
    'accessible-entrance': { x: 230, y: 60, label: 'Main Entrance' },
    'accessible-restroom': { x: 240, y: 150, label: 'Restroom' },
    'elevator-bank-b': { x: 150, y: 140, label: 'Elevator B' },
    'classroom-204': { x: 150, y: 50, label: 'Classroom 204' },
    'cafeteria': { x: 60, y: 60, label: 'Cafeteria' },
  };

  const destCoords = indoorNodePositions[selectedIndoorKey] || { x: 230, y: 60, label: 'Destination' };

  return (
    <div
      className={`w-full aspect-square rounded-2xl bg-slate-950 p-4 relative overflow-hidden border border-slate-800 flex items-center justify-center select-none ${className}`}
    >
      {hasRealGeometry ? (
        /* Real-World Geographic Route Map (OSRM Polyline) */
        <svg viewBox="0 0 320 320" className="w-full h-full" aria-label="Real-world geographic accessible route map">
          {/* Subtle Grid Pattern for Street Block Context */}
          <defs>
            <pattern id="grid-pattern" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#1e293b" strokeWidth="0.8" />
            </pattern>
          </defs>
          <rect width="320" height="320" fill="#090d16" />
          <rect width="320" height="320" fill="url(#grid-pattern)" />

          {/* Pedestrian Corridor Buffer (Gives visual width to walkway) */}
          <path
            d={pathD}
            fill="none"
            stroke="#1e3a8a"
            strokeWidth="14"
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity="0.6"
          />

          {/* Active Accessible Route Polyline */}
          <path
            d={pathD}
            fill="none"
            stroke={isOffRoute ? '#ef4444' : '#f59e0b'}
            strokeWidth="5"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeDasharray={isOffRoute ? '6 4' : undefined}
          />

          {/* Intermediate Turn Points */}
          {projectedPoints.map(([x, y], idx) => {
            if (idx === 0 || idx === projectedPoints.length - 1 || idx % 4 !== 0) return null;
            return <circle key={idx} cx={x} cy={y} r="3" fill="#64748b" stroke="#ffffff" strokeWidth="1" />;
          })}

          {/* Start Origin Node */}
          {startPt && (
            <g transform={`translate(${startPt[0]}, ${startPt[1]})`}>
              <circle r="9" fill="#2563eb" stroke="#ffffff" strokeWidth="2.5" />
              <text y="20" fill="#93c5fd" fontSize="9" fontWeight="bold" textAnchor="middle">
                Start
              </text>
            </g>
          )}

          {/* Destination Target Node */}
          {endPt && (
            <g transform={`translate(${endPt[0]}, ${endPt[1]})`}>
              <circle r="11" fill="#10b981" stroke="#ffffff" strokeWidth="3" />
              <text y="-16" fill="#6ee7b7" fontSize="10" fontWeight="bold" textAnchor="middle">
                Destination
              </text>
            </g>
          )}

          {/* Active Waypoint Target Marker */}
          {activePt && (
            <g transform={`translate(${activePt[0]}, ${activePt[1]})`}>
              <circle r="12" fill="none" stroke="#f59e0b" strokeWidth="2" opacity="0.6" className="animate-ping" />
              <circle r="6" fill="#f59e0b" stroke="#ffffff" strokeWidth="2" />
            </g>
          )}

          {/* Real-time User GPS Location Marker */}
          {userPt && (
            <g transform={`translate(${userPt[0]}, ${userPt[1]})`}>
              <circle r="8" fill="#0284c7" stroke="#ffffff" strokeWidth="2.5" />
              <circle r="14" fill="none" stroke="#38bdf8" strokeWidth="2" opacity="0.5" className="animate-ping" />
              <text y="22" fill="#38bdf8" fontSize="8" fontWeight="bold" textAnchor="middle">
                You
              </text>
            </g>
          )}
        </svg>
      ) : (
        /* Indoor Campus Tactile Floorplan */
        <svg viewBox="0 0 300 300" className="w-full h-full" aria-label="Indoor accessible floorplan map">
          {/* Architectural Building Outline */}
          <rect x="20" y="20" width="260" height="260" rx="16" fill="#0f172a" stroke="#1e293b" strokeWidth="2" />

          {/* Primary Hallway Corridors */}
          <path d="M 50 220 L 250 220" stroke="#334155" strokeWidth="22" strokeLinecap="round" />
          <path d="M 150 50 L 150 250" stroke="#334155" strokeWidth="22" strokeLinecap="round" />
          <path d="M 50 60 L 250 60" stroke="#334155" strokeWidth="18" strokeLinecap="round" />
          <path d="M 50 150 L 250 150" stroke="#334155" strokeWidth="18" strokeLinecap="round" />

          {/* Stairs Node (Avoided - Marked with Red X) */}
          <rect x="55" y="110" width="35" height="30" rx="6" fill="#450a0a" stroke="#ef4444" strokeWidth="2" />
          <text x="72" y="128" fill="#ef4444" fontSize="8" fontWeight="bold" textAnchor="middle">
            STAIRS
          </text>
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
          <text x="50" y="245" fill="#93c5fd" fontSize="10" fontWeight="bold" textAnchor="middle">
            Start
          </text>

          {/* Ground Ramp */}
          <rect x="135" y="205" width="30" height="30" rx="6" fill="#d97706" stroke="#ffffff" strokeWidth="1.5" />
          <text x="150" y="245" fill="#fcd34d" fontSize="9" fontWeight="bold" textAnchor="middle">
            Ramp
          </text>

          {/* Elevator Concourse B */}
          <rect x="135" y="125" width="30" height="30" rx="6" fill="#7c3aed" stroke="#ffffff" strokeWidth="1.5" />
          <text x="150" y="115" fill="#c4b5fd" fontSize="9" fontWeight="bold" textAnchor="middle">
            Elevator B
          </text>

          {/* Target Destination Node */}
          <circle cx={destCoords.x} cy={destCoords.y} r="14" fill="#10b981" stroke="#ffffff" strokeWidth="3" />
          <text
            x={destCoords.x}
            y={destCoords.y - 18}
            fill="#6ee7b7"
            fontSize="10"
            fontWeight="black"
            textAnchor="middle"
          >
            {destCoords.label}
          </text>

          {/* Animated User Waypoint Avatar Marker */}
          <circle
            cx={
              activeStepIndex === 0
                ? 50
                : activeStepIndex === 1
                ? 150
                : activeStepIndex === 2
                ? 150
                : destCoords.x
            }
            cy={
              activeStepIndex === 0
                ? 220
                : activeStepIndex === 1
                ? 205
                : activeStepIndex === 2
                ? 140
                : destCoords.y
            }
            r="8"
            fill="#38bdf8"
            stroke="#ffffff"
            strokeWidth="2"
            className="animate-ping"
          />
        </svg>
      )}

      {/* Map Badge Info Overlay */}
      <div className="absolute bottom-2.5 left-2.5 right-2.5 bg-black/85 backdrop-blur-md text-white px-3 py-1.5 rounded-xl text-[11px] flex items-center justify-between border border-white/10">
        <span className="truncate mr-2 flex items-center gap-1.5">
          {hasRealGeometry ? <Navigation className="w-3.5 h-3.5 text-sky-400 shrink-0" /> : <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0" />}
          <span className="truncate">{destinationName}</span>
        </span>
        {isOffRoute ? (
          <span className="text-rose-400 font-bold flex items-center gap-1 shrink-0 animate-pulse">
            <AlertTriangle className="w-3 h-3" /> Off Route
          </span>
        ) : (
          <span className="text-emerald-400 font-bold flex items-center gap-1 shrink-0 font-mono text-[10px]">
            <CheckCircle2 className="w-3 h-3" /> {hasRealGeometry ? 'GPS Pedestrian' : '100% Step-Free'}
          </span>
        )}
      </div>
    </div>
  );
};
