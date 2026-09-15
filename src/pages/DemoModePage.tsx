import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Sparkles,
  Play,
  RotateCcw,
  CheckCircle2,
  Volume2,
  ArrowRight,
  ShieldAlert,
  Compass,
  FileText,
  Eye,
  Camera,
  Activity,
  Layers,
} from 'lucide-react';
import { PageContainer } from '../components/layout/PageContainer';
import { AccessibleButton } from '../components/common/AccessibleButton';
import { ConfidenceIndicator } from '../components/common/ConfidenceIndicator';
import { SafetyAlert } from '../components/common/SafetyAlert';
import { speechService } from '../services/speechService';
import { audioFeedback } from '../services/audioFeedbackService';
import { useAssistant } from '../context/AssistantContext';

type ScenarioId = 'street-crossing' | 'reading-sign' | 'indoor-navigation' | 'obstacle-alert';

interface Scenario {
  id: ScenarioId;
  title: string;
  category: string;
  badge: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  tags: string[];
}

const SCENARIOS: Scenario[] = [
  {
    id: 'street-crossing',
    title: 'Street Crossing',
    category: 'Spatial Vision',
    badge: 'Scenario 1',
    description: 'Pedestrian crosswalk detection, traffic light status, moving vehicles, and safe crossing audio cues.',
    icon: Eye,
    tags: ['Crosswalk', 'Person', 'Vehicle', 'Road'],
  },
  {
    id: 'reading-sign',
    title: 'Reading a Sign',
    category: 'OCR & Translation',
    badge: 'Scenario 2',
    description: 'Detects "Main Entrance →", extracts operating hours, translates to Tamil & Hindi, and reads aloud.',
    icon: FileText,
    tags: ['Main Entrance', 'Open Hours', 'Wheelchair Ramp', 'Audio Read'],
  },
  {
    id: 'indoor-navigation',
    title: 'Indoor Navigation',
    category: 'Accessible Routing',
    badge: 'Scenario 3',
    description: 'Calculates 100% step-free route avoiding stairs: Reception → Ramp → Elevator → Accessible Entrance.',
    icon: Compass,
    tags: ['Reception', 'Ramp', 'Elevator', 'Accessible Entrance'],
  },
  {
    id: 'obstacle-alert',
    title: 'Obstacle Alert',
    category: 'Safety Confidence',
    badge: 'Scenario 4',
    description: 'Detects unexpected trolley in pathway, calibrates medium confidence, and issues verify prompt.',
    icon: ShieldAlert,
    tags: ['Obstacle Warning', 'Medium Confidence', 'Verify Before Moving'],
  },
];

export const DemoModePage: React.FC = () => {
  const navigate = useNavigate();
  const { showToast, addAssistanceItem } = useAssistant();

  const [activeScenario, setActiveScenario] = useState<ScenarioId>('street-crossing');
  const [isRunning, setIsRunning] = useState(false);
  const [executionLog, setExecutionLog] = useState<string[]>([]);
  const [simulatedResult, setSimulatedResult] = useState<{
    title: string;
    description: string;
    confidence: 'high' | 'medium' | 'low';
    visualUrl: string;
    details: string[];
    safetyNotice?: string;
  } | null>(null);

  const runScenario = (id: ScenarioId) => {
    setActiveScenario(id);
    setIsRunning(true);
    setExecutionLog([]);
    audioFeedback.playChime();

    if (id === 'street-crossing') {
      setExecutionLog([
        'Initializing high-framerate camera feed...',
        'Object detection: Identified Crosswalk (96%), Signal (98%), Stopped Sedan (92%)...',
        'Spatial depth: Curb ramp slope detected 0.8m ahead...',
        'Pedestrian walk signal confirmed green. Synthesizing audio chime...',
      ]);

      setTimeout(() => {
        setIsRunning(false);
        audioFeedback.playSuccess();
        const text = 'You are at a marked pedestrian crosswalk. The pedestrian signal is green for walking. A vehicle is stationary on your left behind the line.';
        speechService.speak(text);

        setSimulatedResult({
          title: 'Street Crossing: Walk Signal Active',
          description: text,
          confidence: 'high',
          visualUrl: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=1000&q=80',
          details: [
            'Crosswalk: 96% confidence (1.0m ahead)',
            'Signal: 98% Walk (Green countdown)',
            'Vehicle: 92% Stopped sedan (4.5m left)',
            'Road & Curb: 95% Tactile curb ramp',
          ],
        });

        addAssistanceItem({
          type: 'scene',
          title: 'Demo: Street Crossing',
          summary: text,
          confidence: 'high',
          actionUrl: '/demo',
        });
      }, 1100);
    } else if (id === 'reading-sign') {
      setExecutionLog([
        'Scanning high-contrast optical signage...',
        'OCR bounding box match: Header "MAIN ENTRANCE" (99%)...',
        'Direction arrow parsed: "Reception →" (97%)...',
        'Synthesizing voice output in English and Tamil...',
      ]);

      setTimeout(() => {
        setIsRunning(false);
        audioFeedback.playSuccess();
        const text = 'Main Entrance. Open 9:00 AM to 6:00 PM. Reception is to the right. Wheelchair ramp is located on the left.';
        speechService.speak(text);

        setSimulatedResult({
          title: 'Reading a Sign: Main Entrance & Hours',
          description: text,
          confidence: 'high',
          visualUrl: 'https://images.unsplash.com/photo-1541888946425-d0fbb186c5f7?auto=format&fit=crop&w=1000&q=80',
          details: [
            'Extracted Header: "MAIN ENTRANCE"',
            'Hours: "Open 9:00 AM – 6:00 PM"',
            'Directions: "Reception →"',
            'Accessibility Note: "Wheelchair Ramp on Left"',
          ],
        });

        addAssistanceItem({
          type: 'ocr',
          title: 'Demo: Main Entrance Sign',
          summary: text,
          confidence: 'high',
          actionUrl: '/demo',
        });
      }, 1100);
    } else if (id === 'indoor-navigation') {
      setExecutionLog([
        'Loading accessible architectural indoor graph...',
        'Stairs detected on left (Avoidance rule active)...',
        'Found verified 1:12 slope ramp (East Wing)...',
        'Connecting to Elevator B Concourse to Ground Entrance...',
      ]);

      setTimeout(() => {
        setIsRunning(false);
        audioFeedback.playSuccess();
        const text = 'Calculated 100% step-free route: Start at Reception, take gentle Ramp on left, enter Elevator B to Ground Floor, arrive at Accessible Entrance.';
        speechService.speak(text);

        setSimulatedResult({
          title: 'Indoor Navigation: Step-Free Path',
          description: text,
          confidence: 'high',
          visualUrl: 'https://images.unsplash.com/photo-1517649763962-0c623266ddc0?auto=format&fit=crop&w=1000&q=80',
          details: [
            'Waypoint 1: Reception (Start)',
            'Waypoint 2: Access Ramp (1:12 grade)',
            'Waypoint 3: Elevator B (Braille buttons)',
            'Waypoint 4: Accessible Entrance (120m total)',
          ],
        });

        addAssistanceItem({
          type: 'navigation',
          title: 'Demo: Indoor Route',
          summary: text,
          confidence: 'high',
          actionUrl: '/demo',
        });
      }, 1100);
    } else {
      // obstacle-alert
      setExecutionLog([
        'Monitoring central walking corridor in real time...',
        'Low-reflectance object detected at 1.5 meters...',
        'Classified as utility cleaning cart with medium confidence (84%)...',
        'Issuing cautionary verification safety alert...',
      ]);

      setTimeout(() => {
        setIsRunning(false);
        audioFeedback.playAlert();
        const text = 'An object may be blocking your path approximately 1.5 meters ahead. Medium confidence. Please verify before moving.';
        speechService.speak(text);

        setSimulatedResult({
          title: '⚠️ Possible Obstacle Detected',
          description: text,
          confidence: 'medium',
          safetyNotice: 'Medium confidence. Please verify before moving.',
          visualUrl: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1000&q=80',
          details: [
            'Obstacle: Utility cleaning trolley',
            'Distance: 1.5 meters',
            'Location: Center walking path',
            'Recommendation: Pause and verify before moving',
          ],
        });

        addAssistanceItem({
          type: 'safety',
          title: 'Demo: Obstacle Warning',
          summary: text,
          confidence: 'medium',
          actionUrl: '/demo',
        });
      }, 1100);
    }
  };

  return (
    <PageContainer maxWidth="xl" className="space-y-8">
      {/* Top Banner for Hackathon Judges */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-purple-700 via-brand-700 to-indigo-800 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10 space-y-3 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 text-white text-xs font-extrabold tracking-wider uppercase">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Hackathon Evaluation Suite</span>
          </div>

          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            DEMO MODE
          </h2>

          <p className="text-purple-100 text-sm sm:text-base leading-relaxed font-medium">
            Designed specifically for hackathon judges to verify every major multimodal interaction in one click without external API keys or permissions.
          </p>
        </div>
      </div>

      {/* 4 One-Click Scenarios Grid */}
      <div className="space-y-4">
        <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <Layers className="w-5 h-5 text-brand-600" />
          <span>One-Click Test Scenarios</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {SCENARIOS.map((scenario) => {
            const Icon = scenario.icon;
            const isSelected = activeScenario === scenario.id;

            return (
              <div
                key={scenario.id}
                className={`p-5 rounded-3xl border-2 transition-all flex flex-col justify-between ${
                  isSelected
                    ? 'bg-brand-50/80 dark:bg-brand-950/50 border-brand-500 dark:border-brand-400 shadow-md'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300'
                }`}
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-extrabold uppercase tracking-wider text-brand-600 dark:text-brand-400">
                      {scenario.badge}
                    </span>
                    <div className="w-8 h-8 rounded-xl bg-brand-100 dark:bg-brand-900 text-brand-700 dark:text-brand-300 flex items-center justify-center">
                      <Icon className="w-4 h-4" />
                    </div>
                  </div>

                  <div>
                    <h4 className="font-extrabold text-lg text-slate-900 dark:text-slate-100">
                      {scenario.title}
                    </h4>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                      {scenario.description}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-1">
                    {scenario.tags.map((tag) => (
                      <span
                        key={tag}
                        className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="pt-4 mt-2 border-t border-slate-100 dark:border-slate-800">
                  <AccessibleButton
                    variant={isSelected ? 'primary' : 'secondary'}
                    size="md"
                    fullWidth
                    icon={<Play className="w-4 h-4 fill-current" />}
                    onClick={() => runScenario(scenario.id)}
                    disabled={isRunning}
                  >
                    Run Scenario
                  </AccessibleButton>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Execution Console & Live Visual Output */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 shadow-xl space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-brand-600" />
            <h3 className="font-bold text-lg text-slate-900 dark:text-slate-100">
              Live Scenario Simulation Results
            </h3>
          </div>

          <div className="flex items-center gap-2">
            <AccessibleButton
              variant="outline"
              size="sm"
              icon={<RotateCcw className="w-3.5 h-3.5" />}
              onClick={() => runScenario(activeScenario)}
              disabled={isRunning}
            >
              Re-run
            </AccessibleButton>
          </div>
        </div>

        {/* Execution Logs */}
        {executionLog.length > 0 && (
          <div className="p-4 rounded-2xl bg-slate-950 text-emerald-400 font-mono text-xs space-y-1">
            {executionLog.map((log, idx) => (
              <div key={idx} className="flex items-start gap-2">
                <span className="text-slate-600">[{idx + 1}]</span>
                <span>{log}</span>
              </div>
            ))}
          </div>
        )}

        {/* Simulated Result Card */}
        {simulatedResult && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
            {/* Visual Screen Preview */}
            <div className="lg:col-span-6 relative rounded-2xl overflow-hidden aspect-video bg-slate-950 border border-slate-800">
              <img
                src={simulatedResult.visualUrl}
                alt={simulatedResult.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute bottom-2 left-2 right-2 bg-black/85 text-white px-3 py-1.5 rounded-xl text-xs flex justify-between items-center">
                <span className="font-bold">{simulatedResult.title}</span>
                <span className="font-mono text-emerald-400">Validated</span>
              </div>
            </div>

            {/* AI Output Details */}
            <div className="lg:col-span-6 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs uppercase font-bold text-slate-400">
                  Multimodal Assistance Output
                </span>
                <ConfidenceIndicator level={simulatedResult.confidence} showDetails={false} size="sm" />
              </div>

              <p className="text-base sm:text-lg font-medium text-slate-900 dark:text-slate-100 leading-relaxed">
                "{simulatedResult.description}"
              </p>

              {simulatedResult.safetyNotice && (
                <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/50 border border-amber-300 dark:border-amber-700 text-xs font-bold text-amber-900 dark:text-amber-200">
                  {simulatedResult.safetyNotice}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {simulatedResult.details.map((detail, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-2"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    <span>{detail}</span>
                  </div>
                ))}
              </div>

              <div className="flex gap-2 pt-2">
                <AccessibleButton
                  variant="primary"
                  size="md"
                  icon={<Volume2 className="w-4 h-4" />}
                  onClick={() => speechService.speak(simulatedResult.description)}
                >
                  Speak Again
                </AccessibleButton>
              </div>
            </div>
          </div>
        )}
      </div>
    </PageContainer>
  );
};
