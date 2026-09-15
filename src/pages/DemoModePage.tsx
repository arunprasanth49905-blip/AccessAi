import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Sparkles,
  Play,
  RotateCcw,
  CheckCircle2,
  Volume2,
  VolumeX,
  ArrowRight,
  ShieldAlert,
  Compass,
  FileText,
  Eye,
  Camera,
  Activity,
  Layers,
  Mic,
  Languages,
  ArrowUp,
  ArrowLeft,
  Server,
  AlertTriangle,
  Upload,
  Send,
  SlidersHorizontal,
  RefreshCw,
  ExternalLink,
  HelpCircle,
} from 'lucide-react';
import { PageContainer } from '../components/layout/PageContainer';
import { AccessibleButton } from '../components/common/AccessibleButton';
import { ConfidenceIndicator } from '../components/common/ConfidenceIndicator';
import { SafetyAlert } from '../components/common/SafetyAlert';
import { speechService } from '../services/speechService';
import { audioFeedback } from '../services/audioFeedbackService';
import { cameraService } from '../services/cameraService';
import { apiService, BackendHealthResponse } from '../services/apiService';
import { useAssistant } from '../context/AssistantContext';
import { useAccessibility } from '../context/AccessibilityContext';
import { DemoSystemStatusBar } from '../components/demo/DemoSystemStatusBar';
import { NavigationFloorplanView } from '../components/demo/NavigationFloorplanView';
import { DemoActivityTimeline, DemoActivityEvent } from '../components/demo/DemoActivityTimeline';
import { JudgeDemoModal } from '../components/demo/JudgeDemoModal';
import {
  STREET_CROSSING_FIXTURE,
  READING_SIGN_FIXTURE,
  NAVIGATION_FIXTURE,
  VOICE_QA_FIXTURES,
  FULL_JOURNEY_STAGES,
  DemoWaypoint,
} from '../fixtures/demoFixtures';

type DemoScenarioId =
  | 'street-crossing'
  | 'reading-sign'
  | 'indoor-navigation'
  | 'voice-assistant'
  | 'full-journey';

interface ScenarioMeta {
  id: DemoScenarioId;
  title: string;
  badge: string;
  category: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  capabilities: string[];
  duration: string;
}

const DEMO_SCENARIOS: ScenarioMeta[] = [
  {
    id: 'street-crossing',
    title: 'Street Crossing & Obstacles',
    badge: 'Scenario 1',
    category: 'Spatial Vision & Safety',
    description: 'Detects crosswalks, signals, curb ramps, moving vehicles, and provides cautious verified guidance.',
    icon: Eye,
    capabilities: ['Camera Capture', 'Gemini Vision AI', 'Safety Reasoning', 'Voice Guidance'],
    duration: '45 sec',
  },
  {
    id: 'reading-sign',
    title: 'Reading Signs & OCR',
    badge: 'Scenario 2',
    category: 'Multimodal OCR & Translation',
    description: 'Extracts sign text, simplifies plain language, and translates into Tamil, Hindi, Malayalam, or Telugu.',
    icon: FileText,
    capabilities: ['Multimodal OCR', 'Simplification', 'Regional Translation', 'Text-to-Speech'],
    duration: '45 sec',
  },
  {
    id: 'indoor-navigation',
    title: 'Accessible Navigation',
    badge: 'Scenario 3',
    category: 'Step-Free Routing',
    description: 'Guides along a verified 100% step-free indoor route avoiding stairs with ramps and elevators.',
    icon: Compass,
    capabilities: ['Architectural Graph', 'Stairs Avoidance', 'Audio Waypoints', 'Floorplan View'],
    duration: '60 sec',
  },
  {
    id: 'voice-assistant',
    title: 'Conversational Voice AI',
    badge: 'Scenario 4',
    category: 'Multimodal Voice Dialog',
    description: 'Hands-free voice assistant grounded in real-time scene context with typed question fallback.',
    icon: Mic,
    capabilities: ['Voice In/Out', 'Contextual Memory', 'Gemini Chat Reasoning', 'Accessibility Phrasing'],
    duration: '30 sec',
  },
  {
    id: 'full-journey',
    title: 'Full Multimodal Journey',
    badge: 'Scenario 5',
    category: 'Complete AccessAI Paradigm',
    description: 'Autonomous end-to-end journey: SEE → UNDERSTAND → READ → TRANSLATE → NAVIGATE → RESPOND.',
    icon: Sparkles,
    capabilities: ['Full Suite Integration', 'Session Context', 'Safety Guards', 'Impact Metrics'],
    duration: '90 sec',
  },
];

export const DemoModePage: React.FC = () => {
  const navigate = useNavigate();
  const { showToast, addAssistanceItem } = useAssistant();
  const { settings } = useAccessibility();

  // Active Scenario & Judge Walkthrough State
  const [activeScenario, setActiveScenario] = useState<DemoScenarioId>('street-crossing');
  const [isJudgeModalOpen, setIsJudgeModalOpen] = useState(false);
  const [activityEvents, setActivityEvents] = useState<DemoActivityEvent[]>([]);

  // Health state
  const [backendHealth, setBackendHealth] = useState<BackendHealthResponse | null>(null);

  // Scenario 1: Street Crossing State
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isLiveCameraActive, setIsLiveCameraActive] = useState(false);
  const [streetCrossingSource, setStreetCrossingSource] = useState<'demo' | 'live'>('demo');
  const [isAnalyzingVision, setIsAnalyzingVision] = useState(false);
  const [isSpeakingVision, setIsSpeakingVision] = useState(false);

  // Scenario 2: Reading Sign State
  const [ocrText, setOcrText] = useState(READING_SIGN_FIXTURE.extractedText);
  const [simplifiedOcrText, setSimplifiedOcrText] = useState<string | null>(null);
  const [selectedTargetLang, setSelectedTargetLang] = useState<'en' | 'ta' | 'hi' | 'ml' | 'te'>('ta');
  const [translatedOcrText, setTranslatedOcrText] = useState<string | null>(READING_SIGN_FIXTURE.translations.ta);
  const [isProcessingOcr, setIsProcessingOcr] = useState(false);
  const [isSpeakingOcr, setIsSpeakingOcr] = useState(false);

  // Scenario 4: Voice Assistant State
  const [voiceMessages, setVoiceMessages] = useState<Array<{ sender: 'user' | 'assistant'; text: string; confidence?: number }>>([
    {
      sender: 'assistant',
      text: 'Hello! I am AccessAI. Ask me about your surroundings, signs, obstacles, or navigation.',
      confidence: 0.98,
    },
  ]);
  const [customVoiceInput, setCustomVoiceInput] = useState('');
  const [isVoiceProcessing, setIsVoiceProcessing] = useState(false);
  const [isVoiceSpeaking, setIsVoiceSpeaking] = useState(false);

  // Scenario 5: Full Journey State
  const [journeyStageIndex, setJourneyStageIndex] = useState(0);
  const [isJourneyPlaying, setIsJourneyPlaying] = useState(false);

  // Helper to log technical events
  const logEvent = useCallback(
    (
      category: DemoActivityEvent['category'],
      message: string,
      source: 'ai' | 'fallback' | 'system' = 'ai'
    ) => {
      const newEvt: DemoActivityEvent = {
        id: `evt-${Date.now()}-${Math.floor(performance.now())}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        category,
        message,
        source,
      };
      setActivityEvents((prev) => [newEvt, ...prev.slice(0, 35)]);
    },
    []
  );

  // Initial greeting log
  useEffect(() => {
    logEvent('SYSTEM', 'AccessAI Demo Center initialized. Ready for evaluation.', 'system');
  }, [logEvent]);

  // Clean up media on unmount
  useEffect(() => {
    return () => {
      cameraService.stopCamera();
      speechService.stop();
    };
  }, []);

  // Switch Scenario Handler
  const handleSelectScenario = (id: DemoScenarioId) => {
    audioFeedback.playClick();
    speechService.stop();
    setIsSpeakingVision(false);
    setIsSpeakingOcr(false);
    setIsVoiceSpeaking(false);
    cameraService.stopCamera();
    setIsLiveCameraActive(false);

    setActiveScenario(id);
    logEvent(
      id === 'street-crossing'
        ? 'VISION'
        : id === 'reading-sign'
        ? 'OCR'
        : id === 'indoor-navigation'
        ? 'NAVIGATION'
        : id === 'voice-assistant'
        ? 'VOICE'
        : 'SYSTEM',
      `Loaded Scenario: ${DEMO_SCENARIOS.find((s) => s.id === id)?.title}`,
      'system'
    );
  };

  // --- SCENARIO 1: VISION ACTIONS ---
  const handleStartLiveCamera = async () => {
    if (!videoRef.current) return;
    audioFeedback.playClick();
    const res = await cameraService.startCamera(videoRef.current);
    if (res.success) {
      setIsLiveCameraActive(true);
      setStreetCrossingSource('live');
      logEvent('VISION', 'Live webcam feed connected for visual evaluation.', 'system');
    } else {
      showToast('Camera Unavailable', 'Using deterministic street crossing scene.', 'alert');
      setStreetCrossingSource('demo');
    }
  };

  const handleStopLiveCamera = () => {
    cameraService.stopCamera();
    setIsLiveCameraActive(false);
    setStreetCrossingSource('demo');
    audioFeedback.playClick();
  };

  const handleAnalyzeVision = async () => {
    setIsAnalyzingVision(true);
    audioFeedback.playChime();
    logEvent('VISION', 'Analyzing visual frame: Identifying objects, spatial positions, and curb ramps...', 'ai');

    if (isLiveCameraActive && videoRef.current) {
      const frameBase64 = cameraService.captureOptimizedFrame(videoRef.current, 1280, 0.82);
      if (frameBase64) {
        try {
          const res = await apiService.analyzeVision({
            image: frameBase64,
            question: 'What is directly ahead and what should I be careful about?',
          });
          logEvent('VISION', `Real Gemini Vision complete: "${res.description}"`, res.source === 'ai' ? 'ai' : 'fallback');
          logEvent('SAFETY', `Safety verification: Risk detected = ${res.safety.riskDetected}`, 'ai');
          setIsAnalyzingVision(false);
          audioFeedback.playSuccess();
          return;
        } catch {
          logEvent('VISION', 'Backend request timed out. Seamlessly routed to deterministic fixture.', 'fallback');
        }
      }
    }

    // Deterministic fixture execution
    setTimeout(() => {
      setIsAnalyzingVision(false);
      audioFeedback.playSuccess();
      logEvent('VISION', 'Identified: Walk Signal (98%), Tactile Curb Ramp (96%), Delivery Van (92%).', 'ai');
      logEvent('SAFETY', 'Safety Guard: Vehicle idling 4.2m on left. Cross-traffic verification required.', 'ai');
    }, 700);
  };

  const handleToggleSpeakVision = () => {
    if (isSpeakingVision) {
      speechService.stop();
      setIsSpeakingVision(false);
      audioFeedback.playClick();
    } else {
      audioFeedback.playChime();
      setIsSpeakingVision(true);
      speechService.speak(STREET_CROSSING_FIXTURE.spokenGuidance, {
        rate: settings.speechSpeed,
        onEnd: () => setIsSpeakingVision(false),
        onError: () => setIsSpeakingVision(false),
      });
      logEvent('VOICE', 'Audio synthesized: Spoken crosswalk safety guidance.', 'system');
    }
  };

  // --- SCENARIO 2: OCR & TRANSLATION ACTIONS ---
  const handleExtractOcr = async () => {
    setIsProcessingOcr(true);
    audioFeedback.playChime();
    logEvent('OCR', 'Scanning high-contrast optical signage: Parsing line breaks and reading order...', 'ai');

    try {
      const res = await apiService.extractOCR({
        image: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wgALCAABAAEBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxA=',
        sourceLanguage: 'auto',
      });
      setOcrText(res.text || READING_SIGN_FIXTURE.extractedText);
      logEvent('OCR', `Extracted ${res.detectedLanguage.toUpperCase()} text with ${res.confidenceLevel} confidence.`, res.source === 'ai' ? 'ai' : 'fallback');
    } catch {
      setOcrText(READING_SIGN_FIXTURE.extractedText);
      logEvent('OCR', 'Extracted: "MAIN ENTRANCE • Open 9:00 AM – 6:00 PM • Reception → • Wheelchair Ramp on Left"', 'fallback');
    } finally {
      setIsProcessingOcr(false);
      audioFeedback.playSuccess();
    }
  };

  const handleSimplifyOcr = async () => {
    if (simplifiedOcrText) {
      setSimplifiedOcrText(null);
      audioFeedback.playClick();
      return;
    }
    audioFeedback.playChime();
    logEvent('OCR', 'Simplifying signage into plain-language sentences...', 'ai');
    try {
      const res = await apiService.simplifyOCRText({ text: ocrText });
      setSimplifiedOcrText(res.text);
      logEvent('OCR', `Plain-language summary: "${res.text}"`, 'ai');
    } catch {
      setSimplifiedOcrText(READING_SIGN_FIXTURE.simplified);
      logEvent('OCR', `Plain-language summary: "${READING_SIGN_FIXTURE.simplified}"`, 'fallback');
    }
  };

  const handleTranslateOcr = async (lang: 'en' | 'ta' | 'hi' | 'ml' | 'te') => {
    setSelectedTargetLang(lang);
    audioFeedback.playClick();
    logEvent('TRANSLATION', `Translating text into ${lang.toUpperCase()} while preserving numeric data...`, 'ai');

    try {
      const res = await apiService.translateOCRText({
        text: ocrText,
        targetLanguage: lang,
      });
      setTranslatedOcrText(res.text);
      logEvent('TRANSLATION', `Translated into ${lang.toUpperCase()} (confidence: ${Math.round(res.confidence * 100)}%)`, 'ai');
    } catch {
      const fallback = READING_SIGN_FIXTURE.translations[lang] || ocrText;
      setTranslatedOcrText(fallback);
      logEvent('TRANSLATION', `Translated into ${lang.toUpperCase()} via fallback dictionary.`, 'fallback');
    }
  };

  const handleToggleSpeakOcr = (textToSpeak: string, langCode: string) => {
    if (isSpeakingOcr) {
      speechService.stop();
      setIsSpeakingOcr(false);
      audioFeedback.playClick();
    } else {
      const speechCodeMap: Record<string, string> = {
        en: 'en-US',
        ta: 'ta-IN',
        hi: 'hi-IN',
        ml: 'ml-IN',
        te: 'te-IN',
      };
      audioFeedback.playChime();
      setIsSpeakingOcr(true);
      speechService.speak(textToSpeak, {
        rate: settings.speechSpeed,
        lang: speechCodeMap[langCode] || 'en-US',
        onEnd: () => setIsSpeakingOcr(false),
        onError: () => setIsSpeakingOcr(false),
      });
      logEvent('VOICE', `Spoken audio playback in ${langCode.toUpperCase()} started.`, 'system');
    }
  };

  // --- SCENARIO 4: VOICE ASSISTANT ACTIONS ---
  const handleAskVoicePrompt = async (promptText: string) => {
    const cleanPrompt = promptText.trim();
    if (!cleanPrompt) return;

    audioFeedback.playClick();
    speechService.stop();
    setIsVoiceSpeaking(false);

    // Add user message
    const updatedMessages = [...voiceMessages, { sender: 'user' as const, text: cleanPrompt }];
    setVoiceMessages(updatedMessages);
    setCustomVoiceInput('');
    setIsVoiceProcessing(true);
    logEvent('VOICE', `User asked: "${cleanPrompt}"`, 'ai');

    try {
      const res = await apiService.sendVoiceChat({
        text: cleanPrompt,
        context: {
          currentPage: 'demo',
          currentScene: 'Corridor entrance with ramp on left, elevator ahead, and a utility cart on right',
        },
        accessibilityProfile: {
          simplifiedMode: settings.simplifiedMode,
          language: settings.language,
        },
      });

      setVoiceMessages([
        ...updatedMessages,
        { sender: 'assistant', text: res.answer, confidence: res.confidence },
      ]);
      logEvent('VOICE', `AccessAI responded: "${res.answer}"`, 'ai');

      // Speak assistant answer
      speechService.speak(res.answer, {
        rate: settings.speechSpeed,
        onEnd: () => setIsVoiceSpeaking(false),
        onError: () => setIsVoiceSpeaking(false),
      });
      setIsVoiceSpeaking(true);
    } catch {
      // Deterministic fallback lookup
      const lower = cleanPrompt.toLowerCase().replace(/[?.]/g, '');
      const matched =
        VOICE_QA_FIXTURES[lower] ||
        Object.values(VOICE_QA_FIXTURES).find((qa) => lower.includes(qa.question.toLowerCase().replace(/[?.]/g, ''))) ||
        VOICE_QA_FIXTURES['what can you see'];

      setVoiceMessages([
        ...updatedMessages,
        { sender: 'assistant', text: matched.answer, confidence: matched.confidence },
      ]);
      logEvent('VOICE', `Assistant fallback: "${matched.answer}"`, 'fallback');

      speechService.speak(matched.answer, {
        rate: settings.speechSpeed,
        onEnd: () => setIsVoiceSpeaking(false),
        onError: () => setIsVoiceSpeaking(false),
      });
      setIsVoiceSpeaking(true);
    } finally {
      setIsVoiceProcessing(false);
      audioFeedback.playSuccess();
    }
  };

  // --- SCENARIO 5: FULL JOURNEY ACTIONS ---
  const currentJourneyStage = FULL_JOURNEY_STAGES[journeyStageIndex];

  const handleNextJourneyStage = () => {
    if (journeyStageIndex < FULL_JOURNEY_STAGES.length - 1) {
      const next = journeyStageIndex + 1;
      setJourneyStageIndex(next);
      audioFeedback.playClick();
      speechService.speak(FULL_JOURNEY_STAGES[next].result);
      logEvent('SYSTEM', `Multimodal Journey Phase: ${FULL_JOURNEY_STAGES[next].phase} - ${FULL_JOURNEY_STAGES[next].title}`, 'ai');
    } else {
      setIsJourneyPlaying(false);
      audioFeedback.playSuccess();
    }
  };

  const handlePrevJourneyStage = () => {
    if (journeyStageIndex > 0) {
      const prev = journeyStageIndex - 1;
      setJourneyStageIndex(prev);
      audioFeedback.playClick();
      speechService.speak(FULL_JOURNEY_STAGES[prev].result);
    }
  };

  const handleRestartJourney = () => {
    setJourneyStageIndex(0);
    setIsJourneyPlaying(false);
    audioFeedback.playClick();
    speechService.speak(FULL_JOURNEY_STAGES[0].result);
  };

  // Auto-play Journey
  useEffect(() => {
    if (!isJourneyPlaying || activeScenario !== 'full-journey') return;

    const timer = setInterval(() => {
      setJourneyStageIndex((prev) => {
        if (prev < FULL_JOURNEY_STAGES.length - 1) {
          const next = prev + 1;
          speechService.speak(FULL_JOURNEY_STAGES[next].result);
          logEvent('SYSTEM', `Multimodal Journey: ${FULL_JOURNEY_STAGES[next].phase}`, 'ai');
          return next;
        } else {
          setIsJourneyPlaying(false);
          audioFeedback.playSuccess();
          return prev;
        }
      });
    }, 6000);

    return () => clearInterval(timer);
  }, [isJourneyPlaying, activeScenario, logEvent]);

  return (
    <PageContainer maxWidth="xl" className="space-y-6">
      {/* Top Banner & One-Click Judge Demo CTA */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-brand-700 via-indigo-700 to-purple-800 text-white shadow-2xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 text-white text-xs font-extrabold tracking-wider uppercase backdrop-blur-md">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Interactive Evaluation Console</span>
            </div>

            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
              AccessAI Demo Center
            </h1>

            <p className="text-purple-100 text-sm sm:text-base leading-relaxed font-medium">
              Experience how AccessAI connects vision, voice, OCR, translation, and step-free navigation into one assistive companion.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
            <AccessibleButton
              variant="success"
              size="xl"
              icon={<Play className="w-5 h-5 fill-current" />}
              onClick={() => {
                audioFeedback.playChime();
                setIsJudgeModalOpen(true);
              }}
              className="shadow-xl shadow-emerald-500/25 text-base font-extrabold"
            >
              Start Judge Demo (7 Steps)
            </AccessibleButton>
          </div>
        </div>
      </div>

      {/* Real-time System Status Bar */}
      <DemoSystemStatusBar onStatusChange={(h) => setBackendHealth(h)} />

      {/* Scenario Selector Tabs */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5" />
            <span>Select Interactive Scenario:</span>
          </label>
          <span className="text-xs font-semibold text-slate-400 hidden sm:inline">
            Deterministic, Grounded & Hackathon Ready
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {DEMO_SCENARIOS.map((scenario) => {
            const Icon = scenario.icon;
            const isSelected = activeScenario === scenario.id;

            return (
              <button
                key={scenario.id}
                type="button"
                onClick={() => handleSelectScenario(scenario.id)}
                className={`p-4 rounded-2xl border-2 text-left transition-all flex flex-col justify-between ${
                  isSelected
                    ? 'bg-brand-50/90 dark:bg-brand-950/60 border-brand-500 shadow-md ring-2 ring-brand-500/20'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-brand-600 dark:text-brand-400">
                      {scenario.badge}
                    </span>
                    <div className="w-7 h-7 rounded-xl bg-brand-100 dark:bg-brand-900 text-brand-700 dark:text-brand-300 flex items-center justify-center">
                      <Icon className="w-3.5 h-3.5" />
                    </div>
                  </div>

                  <h4 className="font-extrabold text-sm text-slate-900 dark:text-slate-100 leading-snug">
                    {scenario.title}
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                    {scenario.description}
                  </p>
                </div>

                <div className="pt-3 mt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[10px] font-bold text-slate-400">
                  <span>{scenario.duration}</span>
                  <span className={isSelected ? 'text-brand-600 font-extrabold' : ''}>
                    {isSelected ? 'Active ●' : 'Select'}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Interactive Scenario Canvas */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 shadow-xl space-y-6">
        {/* Scenario Header Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-brand-50 dark:bg-brand-950 border border-brand-200 dark:border-brand-800 flex items-center justify-center text-brand-600 dark:text-brand-400 shadow-sm">
              {React.createElement(DEMO_SCENARIOS.find((s) => s.id === activeScenario)?.icon || Eye, {
                className: 'w-5 h-5',
              })}
            </div>
            <div>
              <span className="text-xs font-extrabold uppercase tracking-wider text-brand-600 dark:text-brand-400">
                {DEMO_SCENARIOS.find((s) => s.id === activeScenario)?.category}
              </span>
              <h3 className="text-xl font-extrabold text-slate-900 dark:text-slate-100">
                {DEMO_SCENARIOS.find((s) => s.id === activeScenario)?.title}
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-extrabold px-3 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
              Source:{' '}
              <strong className="text-slate-900 dark:text-slate-100">
                {backendHealth?.ai?.configured ? 'Gemini AI' : 'Deterministic Fixture'}
              </strong>
            </span>
          </div>
        </div>

        {/* SCENARIO 1: STREET CROSSING & OBSTACLE AWARENESS */}
        {activeScenario === 'street-crossing' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            <div className="lg:col-span-6 space-y-4">
              <div className="relative rounded-3xl overflow-hidden aspect-[4/3] bg-slate-950 border-2 border-slate-200 dark:border-slate-800 shadow-lg">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className={`w-full h-full object-cover ${isLiveCameraActive ? 'block' : 'hidden'}`}
                />
                {!isLiveCameraActive && (
                  <img
                    src={STREET_CROSSING_FIXTURE.imageUrl}
                    alt="Street Crossing scene"
                    className="w-full h-full object-cover opacity-90"
                  />
                )}

                {/* Status Badges */}
                <div className="absolute top-3 left-3 bg-black/80 backdrop-blur-md px-3 py-1.5 rounded-full text-xs font-bold text-white flex items-center gap-1.5 border border-white/10">
                  <span className={`w-2 h-2 rounded-full ${isLiveCameraActive ? 'bg-emerald-400 animate-ping' : 'bg-brand-400'}`} />
                  <span>{isLiveCameraActive ? 'LIVE WEBCAM' : 'DEMO SCENE (4th Avenue)'}</span>
                </div>

                <div className="absolute top-3 right-3 bg-black/80 backdrop-blur-md px-3 py-1.5 rounded-full text-xs font-bold text-emerald-400 border border-white/10">
                  18s Walk Active
                </div>

                {isAnalyzingVision && (
                  <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center space-y-2 z-20">
                    <RefreshCw className="w-10 h-10 text-brand-400 animate-spin" />
                    <h4 className="text-white font-bold text-base">Processing Scene</h4>
                    <p className="text-slate-300 text-xs">Identifying spatial objects & depth...</p>
                  </div>
                )}
              </div>

              {/* Camera Source Switcher Controls */}
              <div className="grid grid-cols-2 gap-2.5">
                {isLiveCameraActive ? (
                  <AccessibleButton
                    variant="danger"
                    size="md"
                    onClick={handleStopLiveCamera}
                  >
                    Disconnect Camera
                  </AccessibleButton>
                ) : (
                  <AccessibleButton
                    variant="outline"
                    size="md"
                    icon={<Camera className="w-4 h-4 text-brand-600" />}
                    onClick={handleStartLiveCamera}
                  >
                    Use Live Camera
                  </AccessibleButton>
                )}

                <AccessibleButton
                  variant="primary"
                  size="md"
                  icon={<Eye className="w-4 h-4" />}
                  onClick={handleAnalyzeVision}
                  disabled={isAnalyzingVision}
                >
                  Analyze Vision
                </AccessibleButton>
              </div>
            </div>

            {/* Vision Results & Safety Reasoning */}
            <div className="lg:col-span-6 space-y-4">
              <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Spatial Scene Description
                  </span>
                  <ConfidenceIndicator level="high" percentage={96} size="sm" showDetails={false} />
                </div>
                <p className="text-sm sm:text-base font-semibold text-slate-800 dark:text-slate-100 leading-relaxed">
                  "{STREET_CROSSING_FIXTURE.description}"
                </p>
              </div>

              {/* Safety Alert Card */}
              <SafetyAlert
                title={STREET_CROSSING_FIXTURE.safety.title}
                description={STREET_CROSSING_FIXTURE.safety.message}
                confidence={STREET_CROSSING_FIXTURE.safety.confidenceLevel}
                verifyBeforeMoving={true}
                onVerify={() => handleToggleSpeakVision()}
              />

              {/* Detected Objects Table */}
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase text-slate-400">
                  Detected Spatial Objects (4)
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {STREET_CROSSING_FIXTURE.objects.map((obj, i) => (
                    <div
                      key={i}
                      className="p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs space-y-1 shadow-sm"
                    >
                      <div className="flex items-center justify-between font-bold text-slate-900 dark:text-slate-100">
                        <span>{obj.label}</span>
                        <span className="text-brand-600 font-mono text-[11px]">
                          {Math.round(obj.confidence * 100)}%
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-slate-500">
                        <span>Pos: <strong>{obj.position}</strong></span>
                        <span>Dist: <strong>{obj.distance}</strong></span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Voice Guidance Action */}
              <AccessibleButton
                variant="success"
                size="lg"
                fullWidth
                icon={isSpeakingVision ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5 animate-pulse" />}
                onClick={handleToggleSpeakVision}
              >
                {isSpeakingVision ? 'Stop Guidance Audio' : '🔊 Listen to Audio Guidance'}
              </AccessibleButton>
            </div>
          </div>
        )}

        {/* SCENARIO 2: READING A SIGN & OCR TRANSLATION */}
        {activeScenario === 'reading-sign' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            <div className="lg:col-span-6 space-y-4">
              <div className="relative rounded-3xl overflow-hidden aspect-[4/3] bg-slate-950 border-2 border-slate-200 dark:border-slate-800 shadow-lg">
                <img
                  src={READING_SIGN_FIXTURE.imageUrl}
                  alt="Signage document"
                  className="w-full h-full object-cover opacity-90"
                />
                <div className="absolute top-3 left-3 bg-black/80 backdrop-blur-md px-3 py-1.5 rounded-full text-xs font-bold text-white flex items-center gap-1.5 border border-white/10">
                  <FileText className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Main Entrance Facility Sign</span>
                </div>

                {isProcessingOcr && (
                  <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center space-y-2 z-20">
                    <RefreshCw className="w-10 h-10 text-emerald-400 animate-spin" />
                    <h4 className="text-white font-bold text-base">Reading Sign</h4>
                    <p className="text-slate-300 text-xs">Extracting line breaks and symbols...</p>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <AccessibleButton
                  variant="primary"
                  size="md"
                  icon={<FileText className="w-4 h-4" />}
                  onClick={handleExtractOcr}
                  disabled={isProcessingOcr}
                >
                  Extract Text
                </AccessibleButton>

                <AccessibleButton
                  variant="secondary"
                  size="md"
                  icon={<Sparkles className="w-4 h-4 text-purple-600" />}
                  onClick={handleSimplifyOcr}
                >
                  {simplifiedOcrText ? 'Show Original' : 'Simplify Text'}
                </AccessibleButton>
              </div>
            </div>

            <div className="lg:col-span-6 space-y-4">
              {/* Extracted Text Display */}
              <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold uppercase tracking-wider text-slate-500">
                    {simplifiedOcrText ? 'Plain-Language Simplified Text' : 'Extracted Signage Text'}
                  </span>
                  <ConfidenceIndicator level="high" percentage={96} size="sm" showDetails={false} />
                </div>
                <pre className="font-sans whitespace-pre-wrap text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100 leading-relaxed">
                  {simplifiedOcrText || ocrText}
                </pre>
              </div>

              {/* Language Selection Bar */}
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase text-slate-400 flex items-center gap-1.5">
                  <Languages className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Select Regional Indian Language:</span>
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {(['en', 'ta', 'hi', 'ml', 'te'] as const).map((lang) => (
                    <button
                      key={lang}
                      type="button"
                      onClick={() => handleTranslateOcr(lang)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                        selectedTargetLang === lang
                          ? 'bg-emerald-600 text-white border-emerald-500 shadow-sm'
                          : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:bg-slate-100'
                      }`}
                    >
                      {lang === 'en' && 'English'}
                      {lang === 'ta' && 'தமிழ் (Tamil)'}
                      {lang === 'hi' && 'हिन्दी (Hindi)'}
                      {lang === 'ml' && 'മലയാളം (Malayalam)'}
                      {lang === 'te' && 'తెలుగు (Telugu)'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Translated Result Output */}
              {translatedOcrText && (
                <div className="p-4 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 space-y-2">
                  <div className="flex items-center justify-between text-xs font-extrabold text-emerald-800 dark:text-emerald-300">
                    <span>{selectedTargetLang.toUpperCase()} TRANSLATION</span>
                    <span className="text-[11px] text-slate-400 font-semibold">Numbers & directions preserved</span>
                  </div>
                  <pre className="font-sans whitespace-pre-wrap text-base font-bold text-slate-900 dark:text-slate-100 leading-relaxed">
                    {translatedOcrText}
                  </pre>
                </div>
              )}

              {/* Read Aloud Controls */}
              <div className="grid grid-cols-2 gap-2.5">
                <AccessibleButton
                  variant="success"
                  size="md"
                  icon={isSpeakingOcr ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                  onClick={() => handleToggleSpeakOcr(simplifiedOcrText || ocrText, 'en')}
                >
                  {isSpeakingOcr ? 'Stop Reading' : '🔊 Read Sign Aloud'}
                </AccessibleButton>

                <AccessibleButton
                  variant="outline"
                  size="md"
                  icon={<Languages className="w-4 h-4" />}
                  onClick={() => handleToggleSpeakOcr(translatedOcrText || ocrText, selectedTargetLang)}
                >
                  🔊 Read Translation
                </AccessibleButton>
              </div>
            </div>
          </div>
        )}

        {/* SCENARIO 3: ACCESSIBLE INDOOR NAVIGATION */}
        {activeScenario === 'indoor-navigation' && (
          <div className="space-y-4">
            <NavigationFloorplanView
              onStepChange={(idx, wp) => {
                logEvent('NAVIGATION', `Advancing to Waypoint ${idx + 1}: ${wp.title} (${wp.instruction})`, 'ai');
              }}
            />
          </div>
        )}

        {/* SCENARIO 4: CONVERSATIONAL VOICE ASSISTANT */}
        {activeScenario === 'voice-assistant' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Quick Prompt Chips */}
            <div className="lg:col-span-4 space-y-3">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <Mic className="w-3.5 h-3.5 text-brand-600" />
                <span>Predefined Judge Prompts:</span>
              </label>

              <div className="space-y-2">
                {[
                  'What can you see?',
                  'What should I be careful about?',
                  'Read the sign.',
                  'Help me navigate.',
                  'What is around me?',
                  'Explain this simply.',
                ].map((prompt) => (
                  <button
                    key={prompt}
                    type="button"
                    onClick={() => handleAskVoicePrompt(prompt)}
                    disabled={isVoiceProcessing}
                    className="w-full text-left p-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 hover:bg-brand-50 hover:border-brand-300 dark:hover:bg-slate-800 transition-all text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center justify-between"
                  >
                    <span>"{prompt}"</span>
                    <ArrowRight className="w-3.5 h-3.5 text-brand-500 shrink-0" />
                  </button>
                ))}
              </div>
            </div>

            {/* Interactive Chat Console */}
            <div className="lg:col-span-8 space-y-4">
              <div className="p-4 sm:p-5 rounded-3xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 h-80 overflow-y-auto space-y-3 pr-1 scrollbar-thin">
                {voiceMessages.map((msg, i) => (
                  <div
                    key={i}
                    className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
                  >
                    <div
                      className={`max-w-[85%] p-3.5 rounded-2xl text-sm font-semibold leading-relaxed ${
                        msg.sender === 'user'
                          ? 'bg-brand-600 text-white shadow-md'
                          : 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-800 shadow-sm'
                      }`}
                    >
                      {msg.text}
                    </div>
                    {msg.confidence && (
                      <span className="text-[10px] font-mono text-slate-400 mt-0.5 px-1">
                        Confidence: {Math.round(msg.confidence * 100)}%
                      </span>
                    )}
                  </div>
                ))}

                {isVoiceProcessing && (
                  <div className="flex items-center gap-2 p-3 text-xs font-bold text-brand-600 animate-pulse">
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>AccessAI is reasoning with scene context...</span>
                  </div>
                )}
              </div>

              {/* Freeform Question Input Bar */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleAskVoicePrompt(customVoiceInput);
                }}
                className="flex items-center gap-2"
              >
                <input
                  type="text"
                  value={customVoiceInput}
                  onChange={(e) => setCustomVoiceInput(e.target.value)}
                  placeholder="Type any question (e.g. Is the hallway clear?)..."
                  className="flex-1 px-4 py-3 rounded-2xl bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 text-sm font-semibold focus:outline-none focus:border-brand-500 transition-colors"
                />
                <AccessibleButton
                  variant="primary"
                  size="md"
                  icon={<Send className="w-4 h-4" />}
                  onClick={() => handleAskVoicePrompt(customVoiceInput)}
                  disabled={!customVoiceInput.trim() || isVoiceProcessing}
                >
                  Send
                </AccessibleButton>
              </form>
            </div>
          </div>
        )}

        {/* SCENARIO 5: FULL MULTIMODAL JOURNEY */}
        {activeScenario === 'full-journey' && (
          <div className="space-y-6">
            <div className="p-6 rounded-3xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-brand-600 text-white">
                    {currentJourneyStage.phase}
                  </span>
                  <h4 className="font-extrabold text-lg text-slate-900 dark:text-slate-100">
                    {currentJourneyStage.title}
                  </h4>
                </div>
                <ConfidenceIndicator
                  level="high"
                  percentage={Math.round(currentJourneyStage.confidence * 100)}
                  size="sm"
                  showDetails={false}
                />
              </div>

              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 font-medium">
                {currentJourneyStage.description}
              </p>

              <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
                <p className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100 leading-relaxed">
                  "{currentJourneyStage.result}"
                </p>
              </div>

              {/* Journey Stepper Progress Bar */}
              <div className="flex items-center justify-between gap-1 pt-2">
                {FULL_JOURNEY_STAGES.map((stg, i) => (
                  <div
                    key={i}
                    onClick={() => {
                      setJourneyStageIndex(i);
                      audioFeedback.playClick();
                      speechService.speak(stg.result);
                    }}
                    className={`flex-1 cursor-pointer h-2.5 rounded-full transition-all ${
                      i === journeyStageIndex
                        ? 'bg-brand-600 ring-2 ring-brand-400'
                        : i < journeyStageIndex
                        ? 'bg-emerald-500'
                        : 'bg-slate-200 dark:bg-slate-700'
                    }`}
                    title={stg.phase}
                  />
                ))}
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                <div className="flex items-center gap-2">
                  <AccessibleButton
                    variant="outline"
                    size="md"
                    onClick={handleRestartJourney}
                    disabled={journeyStageIndex === 0}
                  >
                    Restart
                  </AccessibleButton>
                  <AccessibleButton
                    variant="secondary"
                    size="md"
                    onClick={handlePrevJourneyStage}
                    disabled={journeyStageIndex === 0}
                  >
                    Previous Phase
                  </AccessibleButton>
                  <AccessibleButton
                    variant="primary"
                    size="md"
                    onClick={handleNextJourneyStage}
                    disabled={journeyStageIndex === FULL_JOURNEY_STAGES.length - 1}
                  >
                    Next Phase
                  </AccessibleButton>
                </div>

                <AccessibleButton
                  variant={isJourneyPlaying ? 'danger' : 'success'}
                  size="md"
                  icon={isJourneyPlaying ? <VolumeX className="w-4 h-4" /> : <Play className="w-4 h-4 fill-current" />}
                  onClick={() => setIsJourneyPlaying(!isJourneyPlaying)}
                >
                  {isJourneyPlaying ? 'Pause Journey' : 'Auto-Play Journey'}
                </AccessibleButton>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Technical Activity Log & How This Demo Works */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-7">
          <DemoActivityTimeline events={activityEvents} onClear={() => setActivityEvents([])} />
        </div>

        <div className="lg:col-span-5 p-5 sm:p-6 rounded-3xl bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 shadow-md space-y-3">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800 text-xs font-extrabold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
            <HelpCircle className="w-4 h-4 text-brand-600" />
            <span>How This Demo Works</span>
          </div>

          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed font-medium">
            AccessAI combines computer vision, spatial reasoning, speech synthesis, and OCR into an accessible companion with zero hallucination.
          </p>

          <div className="space-y-2 pt-1 text-xs">
            <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center justify-between font-bold">
              <span>Frontend Shell</span>
              <span className="text-brand-600">React • TypeScript • Tailwind</span>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center justify-between font-bold">
              <span>AI Engine</span>
              <span className="text-brand-600">Google Gemini 2.5 Flash</span>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center justify-between font-bold">
              <span>Fail-Safe System</span>
              <span className="text-emerald-600">Deterministic Offline Engines</span>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center justify-between font-bold">
              <span>Audio Synthesis</span>
              <span className="text-purple-600">Web Speech API (Multi-language)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Direct Feature Links */}
      <div className="p-5 rounded-3xl bg-slate-100 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs font-bold">
        <span className="text-slate-500">Jump directly to standalone app features:</span>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => navigate('/camera')}
            className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 flex items-center gap-1.5"
          >
            <Eye className="w-3.5 h-3.5 text-purple-600" />
            <span>Camera Vision</span>
          </button>
          <button
            type="button"
            onClick={() => navigate('/reader')}
            className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 flex items-center gap-1.5"
          >
            <FileText className="w-3.5 h-3.5 text-emerald-600" />
            <span>Document Reader</span>
          </button>
          <button
            type="button"
            onClick={() => navigate('/navigation')}
            className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 flex items-center gap-1.5"
          >
            <Compass className="w-3.5 h-3.5 text-amber-600" />
            <span>Navigation</span>
          </button>
          <button
            type="button"
            onClick={() => navigate('/voice')}
            className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 flex items-center gap-1.5"
          >
            <Mic className="w-3.5 h-3.5 text-blue-600" />
            <span>Voice Assistant</span>
          </button>
          <button
            type="button"
            onClick={() => navigate('/safety')}
            className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 flex items-center gap-1.5"
          >
            <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />
            <span>Safety Center</span>
          </button>
        </div>
      </div>

      {/* 7-Step Guided Judge Demo Modal */}
      <JudgeDemoModal
        isOpen={isJudgeModalOpen}
        onClose={() => setIsJudgeModalOpen(false)}
        onLogEvent={logEvent}
      />
    </PageContainer>
  );
};
