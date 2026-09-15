import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Camera,
  Scan,
  Sparkles,
  ShieldAlert,
  Volume2,
  RefreshCw,
  Video,
  VideoOff,
  SlidersHorizontal,
  ChevronRight,
  MessageSquare,
  HelpCircle,
  FileText,
  AlertTriangle,
  Info,
} from 'lucide-react';
import { PageContainer } from '../components/layout/PageContainer';
import { AccessibleButton } from '../components/common/AccessibleButton';
import { ConfidenceIndicator } from '../components/common/ConfidenceIndicator';
import { SafetyAlert } from '../components/common/SafetyAlert';
import { ProcessingPipeline, PipelineStep } from '../components/common/ProcessingPipeline';
import { cameraService } from '../services/cameraService';
import { visionService } from '../services/visionService';
import { speechService } from '../services/speechService';
import { audioFeedback } from '../services/audioFeedbackService';
import { useAssistant } from '../context/AssistantContext';
import { useAccessibility } from '../context/AccessibilityContext';
import { CameraScene, DetectedObject } from '../types';

export const CameraVisionPage: React.FC = () => {
  const navigate = useNavigate();
  const { showToast, addAssistanceItem } = useAssistant();
  const { settings } = useAccessibility();

  const videoRef = useRef<HTMLVideoElement | null>(null);

  // States
  const [scenes] = useState<CameraScene[]>(() => visionService.getScenes());
  const [selectedScene, setSelectedScene] = useState<CameraScene>(() => visionService.getScenes()[0]);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [activePipelineStep, setActivePipelineStep] = useState<PipelineStep | null>(null);
  const [detectedObjects, setDetectedObjects] = useState<DetectedObject[]>(() => selectedScene.detectedObjects);
  const [aiDescription, setAiDescription] = useState<string>(selectedScene.aiOverview);
  const [capturedSnapshot, setCapturedSnapshot] = useState<string | null>(null);
  const [isQuestionOpen, setIsQuestionOpen] = useState(false);
  const [selectedQuestion, setSelectedQuestion] = useState<string>('');
  const [qaAnswer, setQaAnswer] = useState<{ text: string; confidence: 'high' | 'medium' | 'low'; notice?: string } | null>(null);

  // Initialize camera attempt or fallback
  useEffect(() => {
    let mounted = true;

    async function initCamera() {
      if (videoRef.current) {
        const res = await cameraService.startCamera(videoRef.current);
        if (mounted) {
          if (res.success) {
            setIsCameraActive(true);
            showToast('Live Camera Connected', 'Real device camera feed is active.', 'success');
          } else {
            setIsCameraActive(false);
            showToast('Demo Camera Mode Active', res.error || 'Using realistic environment scenes.', 'info');
          }
        }
      }
    }

    initCamera();

    return () => {
      mounted = false;
      cameraService.stopCamera();
    };
  }, []);

  // When scene changes in demo mode
  const handleSelectScene = (scene: CameraScene) => {
    setSelectedScene(scene);
    setDetectedObjects(scene.detectedObjects);
    setAiDescription(scene.aiOverview);
    setCapturedSnapshot(null);
    setQaAnswer(null);
    audioFeedback.playClick();
  };

  // Run full vision scan
  const handleStartScan = async () => {
    setIsScanning(true);
    audioFeedback.playChime();
    setQaAnswer(null);

    // Step 1: Camera
    setActivePipelineStep('camera');
    await new Promise((r) => setTimeout(r, 300));

    // Step 2: Vision
    setActivePipelineStep('vision');
    await new Promise((r) => setTimeout(r, 450));

    // Step 3: Reasoning
    setActivePipelineStep('reasoning');
    await new Promise((r) => setTimeout(r, 400));

    // Step 4: Intent
    setActivePipelineStep('intent');
    await new Promise((r) => setTimeout(r, 350));

    // Step 5: Response
    setActivePipelineStep('response');
    const result = await visionService.simulateScan(selectedScene);
    setDetectedObjects(result.scene.detectedObjects);
    setAiDescription(result.scene.aiOverview);

    audioFeedback.playSuccess();
    setIsScanning(false);

    // Record assistance history
    addAssistanceItem({
      type: 'scene',
      title: 'Scene described',
      summary: result.scene.aiOverview,
      confidence: result.scene.safetyAlert?.confidence || 'high',
      actionUrl: '/camera',
    });

    if (settings.voiceGuidance && settings.autoReadAloud) {
      speechService.speak(result.scene.aiOverview);
    }
  };

  // Capture Snapshot
  const handleCapture = () => {
    audioFeedback.playChime();
    if (isCameraActive && videoRef.current) {
      const snap = cameraService.captureSnapshot(videoRef.current);
      if (snap) {
        setCapturedSnapshot(snap);
        showToast('Snapshot Captured', 'Analyzing captured frame.', 'success');
        handleStartScan();
        return;
      }
    }
    setCapturedSnapshot(selectedScene.imageUrl);
    showToast('Snapshot Captured', `Captured ${selectedScene.name} view.`, 'info');
    handleStartScan();
  };

  // Speak AI Description
  const handleSpeakDescription = () => {
    audioFeedback.playClick();
    speechService.speak(aiDescription, { rate: settings.speechSpeed });
  };

  // Ask Question about scene
  const handleAskQuestion = (question: string) => {
    setSelectedQuestion(question);
    audioFeedback.playClick();
    const result = visionService.answerSceneQuestion(selectedScene, question);
    setQaAnswer({
      text: result.answer,
      confidence: result.confidence,
      notice: result.safetyNotice,
    });
    speechService.speak(result.answer, { rate: settings.speechSpeed });
  };

  return (
    <PageContainer maxWidth="xl" className="space-y-6">
      {/* Header & Mode controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-50 dark:bg-brand-950/70 border border-brand-200 dark:border-brand-800 text-brand-700 dark:text-brand-300 text-xs font-bold mb-1">
            <Camera className="w-3.5 h-3.5" />
            <span>SEE • Spatial Vision & Object Detection</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-100">
            Camera & Spatial Assistant
          </h2>
        </div>

        {/* Mode Pill: Live Camera vs Demo Camera */}
        <div className="flex items-center gap-2">
          <div className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-semibold flex items-center gap-2 shadow-sm">
            {isCameraActive ? (
              <>
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-emerald-700 dark:text-emerald-400">Live Hardware Stream</span>
              </>
            ) : (
              <>
                <span className="w-2 h-2 rounded-full bg-purple-500" />
                <span className="text-purple-700 dark:text-purple-400 font-bold">Demo Camera Mode</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Demo Scene Selector (when demo mode is active or user wants to test scenes) */}
      <div className="space-y-2">
        <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
          <SlidersHorizontal className="w-3.5 h-3.5" />
          <span>Switch Environment Scene:</span>
        </label>
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          {scenes.map((s) => (
            <button
              key={s.id}
              onClick={() => handleSelectScene(s)}
              className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold whitespace-nowrap transition-all border ${
                selectedScene.id === s.id
                  ? 'bg-brand-600 text-white border-brand-500 shadow-sm font-bold'
                  : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:bg-slate-100'
              }`}
            >
              {s.name}
            </button>
          ))}
        </div>
      </div>

      {/* Main Camera Viewport */}
      <div className="relative rounded-3xl overflow-hidden bg-slate-950 aspect-[4/3] sm:aspect-video border-2 border-slate-800 shadow-2xl">
        {/* Real Video Element */}
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className={`w-full h-full object-cover ${isCameraActive && !capturedSnapshot ? 'block' : 'hidden'}`}
        />

        {/* Demo Scene Image Element */}
        {(!isCameraActive || capturedSnapshot) && (
          <img
            src={capturedSnapshot || selectedScene.imageUrl}
            alt={selectedScene.name}
            className="w-full h-full object-cover"
          />
        )}

        {/* Radar Scanning Line Animation */}
        {isScanning && (
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <div className="w-full h-1.5 bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-[0_0_20px_#00e5ff] animate-radar-sweep" />
            <div className="absolute inset-0 bg-brand-500/10 backdrop-blur-[1px]" />
          </div>
        )}

        {/* Bounding Box Detection Overlay */}
        <div className="absolute inset-0 pointer-events-none p-2" aria-hidden="true">
          {detectedObjects.map((obj) => {
            const isDanger = obj.dangerLevel === 'warning';
            const isCaution = obj.dangerLevel === 'caution';

            return (
              <div
                key={obj.id}
                className={`
                  absolute rounded-xl transition-all duration-300 pointer-events-auto cursor-pointer
                  border-2 flex flex-col justify-between p-1.5
                  ${
                    isDanger
                      ? 'border-red-500 bg-red-500/20 shadow-[0_0_15px_rgba(239,68,68,0.4)]'
                      : isCaution
                      ? 'border-amber-400 bg-amber-400/20 shadow-[0_0_15px_rgba(245,158,11,0.4)]'
                      : 'border-brand-400 bg-brand-500/20 shadow-[0_0_15px_rgba(59,130,246,0.3)]'
                  }
                `}
                style={{
                  top: `${obj.box.top}%`,
                  left: `${obj.box.left}%`,
                  width: `${obj.box.width}%`,
                  height: `${obj.box.height}%`,
                }}
                onClick={() => {
                  audioFeedback.playClick();
                  showToast(obj.label, `${obj.details} (${obj.distanceMeters}m away)`, 'info');
                }}
              >
                <div className="flex items-center gap-1.5">
                  <span
                    className={`
                      text-[10px] sm:text-xs font-extrabold px-1.5 py-0.5 rounded shadow text-white tracking-wide
                      ${isDanger ? 'bg-red-600' : isCaution ? 'bg-amber-600' : 'bg-brand-600'}
                    `}
                  >
                    {obj.label} {obj.confidence}%
                  </span>
                </div>

                <div className="self-end">
                  <span className="text-[10px] font-mono font-bold bg-black/80 text-white px-1.5 py-0.5 rounded backdrop-blur-sm">
                    {obj.distanceMeters}m {obj.direction}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom HUD Bar */}
        <div className="absolute bottom-3 left-3 right-3 bg-slate-950/85 backdrop-blur-md text-white p-3 rounded-2xl border border-white/10 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-bold">{selectedScene.name}</span>
            <span className="text-white/60 hidden sm:inline">• {detectedObjects.length} Objects Detected</span>
          </div>

          <div className="flex items-center gap-3 font-mono text-[11px] text-white/80">
            <span>Spatial Confidence: 94%</span>
            <span>Distances: 0.8m – 3.0m</span>
          </div>
        </div>
      </div>

      {/* Primary Action Buttons Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2.5 sm:gap-3">
        <AccessibleButton
          variant="primary"
          size="lg"
          icon={<Scan className="w-5 h-5" />}
          onClick={handleStartScan}
          disabled={isScanning}
          className="col-span-2 sm:col-span-1 shadow-md"
        >
          {isScanning ? 'Scanning...' : 'Start Scan'}
        </AccessibleButton>

        <AccessibleButton
          variant="secondary"
          size="lg"
          icon={<Camera className="w-5 h-5" />}
          onClick={handleCapture}
          disabled={isScanning}
        >
          Capture
        </AccessibleButton>

        <AccessibleButton
          variant="secondary"
          size="lg"
          icon={<MessageSquare className="w-5 h-5 text-purple-600 dark:text-purple-400" />}
          onClick={() => setIsQuestionOpen(!isQuestionOpen)}
        >
          Ask AI
        </AccessibleButton>

        <AccessibleButton
          variant="secondary"
          size="lg"
          icon={<FileText className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />}
          onClick={() => navigate('/reader')}
        >
          Read Text
        </AccessibleButton>

        <AccessibleButton
          variant="secondary"
          size="lg"
          icon={<ShieldAlert className="w-5 h-5 text-amber-600 dark:text-amber-400" />}
          onClick={() => handleAskQuestion('What should I be careful about?')}
        >
          Safety Check
        </AccessibleButton>

        <AccessibleButton
          variant="secondary"
          size="lg"
          icon={<RefreshCw className="w-5 h-5" />}
          onClick={handleSpeakDescription}
        >
          Describe Again
        </AccessibleButton>
      </div>

      {/* Multimodal Reasoning Pipeline Visualization */}
      {(isScanning || activePipelineStep) && (
        <ProcessingPipeline activeStep={activePipelineStep || 'camera'} />
      )}

      {/* AI Description Card */}
      <div className="p-6 sm:p-7 rounded-3xl bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 shadow-lg space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-brand-600" />
            <h3 className="font-extrabold text-lg text-slate-900 dark:text-slate-100">
              AI Spatial Description
            </h3>
          </div>

          <div className="flex items-center gap-2">
            <ConfidenceIndicator level="high" percentage={95} showDetails={false} size="sm" />
            <AccessibleButton
              variant="outline"
              size="sm"
              icon={<Volume2 className="w-4 h-4" />}
              onClick={handleSpeakDescription}
            >
              Read Aloud
            </AccessibleButton>
          </div>
        </div>

        <p className="text-base sm:text-lg font-medium text-slate-800 dark:text-slate-200 leading-relaxed">
          "{aiDescription}"
        </p>

        {/* Identified Objects Pill List */}
        <div className="pt-2">
          <div className="text-xs uppercase font-bold tracking-wider text-slate-400 mb-2">
            Simulated Detection Confidence Breakdown
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {detectedObjects.map((obj) => (
              <div
                key={obj.id}
                className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex flex-col justify-between"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm text-slate-900 dark:text-slate-100 truncate">
                    {obj.label}
                  </span>
                  <span className="font-mono text-xs font-bold text-brand-600 dark:text-brand-400">
                    {obj.confidence}%
                  </span>
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  {obj.distanceMeters}m • {obj.direction}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Safety Alert Box (if present in current scene) */}
      {selectedScene.safetyAlert && (
        <SafetyAlert
          title={selectedScene.safetyAlert.type === 'warning' ? '⚠️ Possible Obstacle' : 'Safety Notice'}
          description={selectedScene.safetyAlert.text}
          confidence={selectedScene.safetyAlert.confidence}
          verifyBeforeMoving={selectedScene.safetyAlert.verifiedNeeded}
        />
      )}

      {/* Ask About Scene Interactive Drawer */}
      <div className="p-6 rounded-3xl bg-slate-100 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-base text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-brand-600" />
            <span>Ask About This Scene</span>
          </h3>
          <span className="text-xs text-slate-500">Instant multimodal answers</span>
        </div>

        <div className="flex flex-wrap gap-2">
          {[
            'What should I be careful about?',
            'Where is the nearest door?',
            'Is there a chair nearby?',
            'Is there a person around?',
          ].map((q) => (
            <button
              key={q}
              onClick={() => handleAskQuestion(q)}
              className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all border ${
                selectedQuestion === q
                  ? 'bg-brand-600 text-white border-brand-500 shadow'
                  : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'
              }`}
            >
              {q}
            </button>
          ))}
        </div>

        {/* Q&A Answer Display */}
        {qaAnswer && (
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-800 border-2 border-brand-400 dark:border-brand-600 space-y-2 mt-3 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase tracking-wider font-bold text-brand-600 dark:text-brand-400">
                AccessAI Answer
              </span>
              <ConfidenceIndicator level={qaAnswer.confidence} showDetails={false} size="sm" />
            </div>
            <p className="text-sm sm:text-base font-medium text-slate-800 dark:text-slate-100">
              "{qaAnswer.text}"
            </p>
            {qaAnswer.notice && (
              <div className="text-xs font-semibold text-amber-700 dark:text-amber-300 flex items-center gap-1.5 pt-1">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                <span>{qaAnswer.notice}</span>
              </div>
            )}
          </div>
        )}
      </div>
    </PageContainer>
  );
};
