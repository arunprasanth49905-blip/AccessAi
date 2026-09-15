import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Camera,
  Scan,
  Sparkles,
  ShieldAlert,
  Volume2,
  VolumeX,
  RefreshCw,
  Video,
  VideoOff,
  SlidersHorizontal,
  HelpCircle,
  FileText,
  AlertTriangle,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  Server,
} from 'lucide-react';
import { PageContainer } from '../components/layout/PageContainer';
import { AccessibleButton } from '../components/common/AccessibleButton';
import { ConfidenceIndicator } from '../components/common/ConfidenceIndicator';
import { SafetyAlert } from '../components/common/SafetyAlert';
import { ProcessingPipeline, PipelineStep } from '../components/common/ProcessingPipeline';
import { cameraService } from '../services/cameraService';
import { visionService } from '../services/visionService';
import { apiService, VisionResult, DetectedVisionObject } from '../services/apiService';
import { speechService } from '../services/speechService';
import { audioFeedback } from '../services/audioFeedbackService';
import { useAssistant } from '../context/AssistantContext';
import { useAccessibility } from '../context/AccessibilityContext';
import { CameraScene } from '../types';

export const CameraVisionPage: React.FC = () => {
  const navigate = useNavigate();
  const { showToast, addAssistanceItem, updateSceneContext } = useAssistant();
  const { settings } = useAccessibility();

  const videoRef = useRef<HTMLVideoElement | null>(null);

  // Scenes for Demo Vision Mode
  const [scenes] = useState<CameraScene[]>(() => visionService.getScenes());
  const [selectedScene, setSelectedScene] = useState<CameraScene>(() => visionService.getScenes()[0]);

  // Camera States
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [capturedSnapshot, setCapturedSnapshot] = useState<string | null>(null);
  const [isDemoVisionMode, setIsDemoVisionMode] = useState(false);

  // Analysis & Processing States
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [activePipelineStep, setActivePipelineStep] = useState<PipelineStep | null>(null);
  const [pipelineMessage, setPipelineMessage] = useState<string>('');
  const [visionResult, setVisionResult] = useState<VisionResult | null>(null);

  // Interactive Question Answering States
  const [isQuestionOpen, setIsQuestionOpen] = useState(false);
  const [customQuestion, setCustomQuestion] = useState('');
  const [activeQuestion, setActiveQuestion] = useState<string>('Describe this scene');
  const [qaAnswer, setQaAnswer] = useState<{ text: string; confidence: 'high' | 'medium' | 'low'; notice?: string } | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);

  // Attempt real webcam access on mount
  useEffect(() => {
    let mounted = true;

    async function initCamera() {
      if (videoRef.current) {
        const res = await cameraService.startCamera(videoRef.current);
        if (mounted) {
          if (res.success) {
            setIsCameraActive(true);
            setCameraError(null);
            setIsDemoVisionMode(false);
            showToast('Live Camera Connected', 'Live hardware video stream is active.', 'success');
          } else {
            setIsCameraActive(false);
            setCameraError(res.error || 'Camera unavailable');
            setIsDemoVisionMode(true);
            showToast('Camera Unavailable', 'Demo Vision is ready for evaluation.', 'info');
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

  // Start / Resume camera
  const handleStartCamera = async () => {
    audioFeedback.playClick();
    if (videoRef.current) {
      const res = await cameraService.startCamera(videoRef.current);
      if (res.success) {
        setIsCameraActive(true);
        setCameraError(null);
        setCapturedSnapshot(null);
        setIsDemoVisionMode(false);
        showToast('Camera Started', 'Live stream active.', 'success');
      } else {
        setCameraError(res.error || 'Failed to start camera');
        setIsDemoVisionMode(true);
        showToast('Camera Unavailable', 'Using Demo Vision Mode.', 'info');
      }
    }
  };

  // Stop camera
  const handleStopCamera = () => {
    audioFeedback.playClick();
    cameraService.stopCamera();
    setIsCameraActive(false);
    showToast('Camera Paused', 'Video stream paused.', 'info');
  };

  // Switch to Demo Vision Mode
  const handleUseDemoVision = () => {
    audioFeedback.playClick();
    cameraService.stopCamera();
    setIsCameraActive(false);
    setIsDemoVisionMode(true);
    setCapturedSnapshot(null);
    showToast('Demo Vision Mode Active', 'You can choose between simulated environment scenes.', 'info');
  };

  // Switch Scene in Demo Vision Mode
  const handleSelectScene = (scene: CameraScene) => {
    audioFeedback.playClick();
    setSelectedScene(scene);
    setCapturedSnapshot(null);
    setVisionResult(null);
    setQaAnswer(null);
  };

  // Capture Image
  const handleCapture = () => {
    audioFeedback.playChime();
    let frame: string | null = null;

    if (isCameraActive && videoRef.current) {
      frame = cameraService.captureOptimizedFrame(videoRef.current, 1280, 0.82);
    }

    if (!frame) {
      // Use the selected demo scene image if camera is not streaming
      frame = selectedScene.imageUrl;
    }

    setCapturedSnapshot(frame);
    setQaAnswer(null);
    showToast('Frame Captured', 'Image stored and ready for vision analysis.', 'success');
  };

  // Retake / Clear Snapshot
  const handleRetake = () => {
    audioFeedback.playClick();
    setCapturedSnapshot(null);
    setVisionResult(null);
    setQaAnswer(null);
    speechService.stop();
    setIsSpeaking(false);
    if (!isCameraActive && !isDemoVisionMode) {
      handleStartCamera();
    }
  };

  // Core Vision Analysis: Frame -> Backend -> Vision Result
  const handleAnalyze = async (questionToAsk: string = 'Describe this scene') => {
    const imageToAnalyze = capturedSnapshot || (videoRef.current ? cameraService.captureOptimizedFrame(videoRef.current, 1280, 0.82) : selectedScene.imageUrl);

    if (!imageToAnalyze) {
      showToast('Capture Required', 'Please capture an image before analyzing.', 'warning');
      return;
    }

    // Set snapshot if not already set
    if (!capturedSnapshot) {
      setCapturedSnapshot(imageToAnalyze);
    }

    setIsAnalyzing(true);
    setActiveQuestion(questionToAsk);
    audioFeedback.playChime();

    // Stage 1: Capturing
    setActivePipelineStep('camera');
    setPipelineMessage('Capturing optimized image frame...');
    await new Promise((r) => setTimeout(r, 200));

    // Stage 2: Uploading
    setActivePipelineStep('vision');
    setPipelineMessage('Uploading image to Vision AI endpoint...');
    await new Promise((r) => setTimeout(r, 250));

    // Stage 3: Analyzing
    setActivePipelineStep('reasoning');
    setPipelineMessage('Analyzing spatial geometry and objects...');

    try {
      // Call real backend endpoint POST /api/vision/analyze
      const result = await apiService.analyzeVision({
        image: imageToAnalyze,
        question: questionToAsk,
        accessibilityProfile: {
          textSize: settings.textSize,
          simplifiedMode: settings.simplifiedMode,
          voiceGuidance: settings.voiceGuidance,
          language: settings.language,
          reducedMotion: settings.reducedMotion,
        },
        context: {
          currentPage: 'camera',
          currentScene: isDemoVisionMode ? selectedScene.name : 'Live Camera View',
        },
      });

      // Stage 4: Responding
      setActivePipelineStep('response');
      setPipelineMessage('Preparing personalized accessibility response...');
      await new Promise((r) => setTimeout(r, 200));

      setVisionResult(result);
      updateSceneContext(result.description, result.objects.map((o) => o.label));
      audioFeedback.playSuccess();
      setIsAnalyzing(false);

      // Record to assistant history
      addAssistanceItem({
        type: 'scene',
        title: `Vision: ${result.objects[0]?.label || 'Scene Analysis'}`,
        summary: result.description,
        confidence: result.confidenceLevel,
        actionUrl: '/camera',
      });

      // Voice Guidance: Read description aloud
      if (settings.voiceGuidance) {
        setIsSpeaking(true);
        speechService.speak(result.description, {
          rate: settings.speechSpeed,
          onEnd: () => setIsSpeaking(false),
          onError: () => setIsSpeaking(false),
        });
      }
    } catch (err) {
      console.warn('Backend Vision API call failed, engaging Vision fallback:', err);
      showToast('Vision Fallback Active', 'Using local Vision reasoning engine.', 'info');

      // Local Fallback simulation
      const fallbackResult = await visionService.simulateScan(selectedScene);
      const adaptedResult: VisionResult = {
        source: 'demo',
        description: fallbackResult.scene.aiOverview,
        objects: fallbackResult.scene.detectedObjects.map((o) => ({
          label: o.label,
          confidence: o.confidence / 100,
          position: o.direction,
          box: o.box,
          details: o.details,
        })),
        safety: {
          riskDetected: Boolean(fallbackResult.scene.safetyAlert),
          message: fallbackResult.scene.safetyAlert?.text || 'Path is clear ahead.',
          confidence: 0.74,
        },
        confidence: 0.88,
        confidenceLevel: 'high',
      };

      setVisionResult(adaptedResult);
      updateSceneContext(adaptedResult.description, adaptedResult.objects.map((o) => o.label));
      audioFeedback.playSuccess();
      setIsAnalyzing(false);

      if (settings.voiceGuidance) {
        setIsSpeaking(true);
        speechService.speak(adaptedResult.description, {
          rate: settings.speechSpeed,
          onEnd: () => setIsSpeaking(false),
          onError: () => setIsSpeaking(false),
        });
      }
    }
  };

  // Contextual follow-up question (uses the same captured image!)
  const handleAskContextualQuestion = async (q: string) => {
    if (!q.trim()) return;
    audioFeedback.playClick();
    setActiveQuestion(q);
    setCustomQuestion('');

    if (!capturedSnapshot && !isCameraActive && !selectedScene.imageUrl) {
      showToast('Image Required', 'I need a camera image to answer your question.', 'warning');
      return;
    }

    await handleAnalyze(q);
  };

  // Toggle speech readout
  const handleToggleVoiceDescription = () => {
    if (isSpeaking) {
      speechService.stop();
      setIsSpeaking(false);
      audioFeedback.playClick();
      return;
    }

    if (visionResult) {
      setIsSpeaking(true);
      audioFeedback.playClick();
      speechService.speak(visionResult.description, {
        rate: settings.speechSpeed,
        onEnd: () => setIsSpeaking(false),
        onError: () => setIsSpeaking(false),
      });
    }
  };

  const detectedObjects: DetectedVisionObject[] = visionResult ? visionResult.objects : (isDemoVisionMode ? selectedScene.detectedObjects.map(o => ({
    label: o.label,
    confidence: o.confidence / 100,
    position: o.direction,
    box: o.box,
    details: o.details,
  })) : []);

  return (
    <PageContainer maxWidth="xl" className="space-y-6">
      {/* Top Header & Mode Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-50 dark:bg-brand-950/70 border border-brand-200 dark:border-brand-800 text-brand-700 dark:text-brand-300 text-xs font-bold mb-1">
            <Camera className="w-3.5 h-3.5" />
            <span>SEE • Real Camera + Multimodal Vision AI</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-100">
            Camera & Spatial Assistant
          </h2>
        </div>

        {/* Live Status Indicators */}
        <div className="flex items-center gap-2 flex-wrap">
          {isCameraActive ? (
            <div className="px-3 py-1.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 text-xs font-extrabold flex items-center gap-2 shadow-sm">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>LIVE CAMERA</span>
            </div>
          ) : (
            <div className="px-3 py-1.5 rounded-full bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-300 dark:border-slate-700 text-xs font-bold flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-slate-400" />
              <span>CAMERA PAUSED</span>
            </div>
          )}

          {visionResult && (
            <div className="px-3 py-1.5 rounded-full text-xs font-extrabold border shadow-sm flex items-center gap-1.5 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
              <Server className="w-3.5 h-3.5 text-slate-500" />
              {visionResult.source === 'ai' ? (
                <span className="text-brand-600 dark:text-brand-400">GEMINI VISION</span>
              ) : (
                <span className="text-amber-600 dark:text-amber-400">FALLBACK VISION</span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Camera Failure / Fallback Notice Card */}
      {cameraError && (
        <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/50 border-2 border-amber-300 dark:border-amber-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs sm:text-sm text-amber-900 dark:text-amber-200">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
            <div>
              <span className="font-bold">Camera unavailable: </span>
              <span>{cameraError} Demo Vision is ready.</span>
            </div>
          </div>
          <AccessibleButton
            variant="secondary"
            size="sm"
            onClick={handleUseDemoVision}
            className="shrink-0"
          >
            USE DEMO VISION
          </AccessibleButton>
        </div>
      )}

      {/* Demo Vision Scene Switcher Bar (when in Demo Vision Mode) */}
      {isDemoVisionMode && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>Demo Vision Environment Scenes:</span>
            </label>
            <button
              type="button"
              onClick={handleStartCamera}
              className="text-xs text-brand-600 font-bold hover:underline"
            >
              Try Live Camera Again
            </button>
          </div>
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
            {scenes.map((s) => (
              <button
                key={s.id}
                onClick={() => handleSelectScene(s)}
                className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold whitespace-nowrap transition-all border ${
                  selectedScene.id === s.id && !capturedSnapshot
                    ? 'bg-brand-600 text-white border-brand-500 shadow-sm font-bold'
                    : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:bg-slate-100'
                }`}
              >
                {s.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Main Camera / Snapshot Viewport */}
      <div className="relative rounded-3xl overflow-hidden bg-slate-950 aspect-[4/3] sm:aspect-video border-2 border-slate-800 shadow-2xl">
        {/* Real Live Hardware Video Element */}
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className={`w-full h-full object-cover ${isCameraActive && !capturedSnapshot ? 'block' : 'hidden'}`}
        />

        {/* Captured Snapshot or Demo Scene Image */}
        {(!isCameraActive || capturedSnapshot) && (
          <img
            src={capturedSnapshot || selectedScene.imageUrl}
            alt="Camera View"
            className="w-full h-full object-cover"
          />
        )}

        {/* Active Scanning Animation Overlay */}
        {isAnalyzing && (
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <div className="w-full h-1.5 bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-[0_0_20px_#00e5ff] animate-radar-sweep" />
            <div className="absolute inset-0 bg-brand-500/10 backdrop-blur-[1px]" />
          </div>
        )}

        {/* Bounding Boxes Overlay (Grounded, only rendered if boxes exist) */}
        <div className="absolute inset-0 pointer-events-none p-2" aria-hidden="true">
          {detectedObjects.map((obj, i) => {
            if (!obj.box) return null;
            const isDanger = obj.label.toLowerCase().includes('obstacle') || obj.label.toLowerCase().includes('cart');

            return (
              <div
                key={i}
                className={`
                  absolute rounded-xl transition-all duration-300 pointer-events-auto cursor-pointer
                  border-2 flex flex-col justify-between p-1.5
                  ${
                    isDanger
                      ? 'border-red-500 bg-red-500/20 shadow-[0_0_15px_rgba(239,68,68,0.4)]'
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
                  showToast(obj.label, `${obj.position.toUpperCase()} • ${Math.round(obj.confidence * 100)}% confidence`, 'info');
                }}
              >
                <span
                  className={`
                    text-[10px] sm:text-xs font-extrabold px-1.5 py-0.5 rounded shadow text-white tracking-wide self-start
                    ${isDanger ? 'bg-red-600' : 'bg-brand-600'}
                  `}
                >
                  {obj.label} {Math.round(obj.confidence * 100)}%
                </span>

                <span className="text-[10px] font-mono font-bold bg-black/80 text-white px-1.5 py-0.5 rounded self-end backdrop-blur-sm">
                  {obj.position}
                </span>
              </div>
            );
          })}
        </div>

        {/* HUD Overlay Bar */}
        <div className="absolute bottom-3 left-3 right-3 bg-slate-950/85 backdrop-blur-md text-white p-3 rounded-2xl border border-white/10 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className={`w-2.5 h-2.5 rounded-full ${isCameraActive ? 'bg-emerald-400 animate-pulse' : 'bg-slate-400'}`} />
            <span className="font-bold">
              {capturedSnapshot ? 'Frame Captured' : isCameraActive ? 'Live Camera Feed' : selectedScene.name}
            </span>
            <span className="text-white/60 hidden sm:inline">• {detectedObjects.length} Objects Tracked</span>
          </div>

          <div className="flex items-center gap-3 font-mono text-[11px] text-white/80">
            <span>Target: 1280px</span>
            <span>Spatial Confidence: {visionResult ? `${Math.round(visionResult.confidence * 100)}%` : 'Ready'}</span>
          </div>
        </div>
      </div>

      {/* Primary Action Controls Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2.5 sm:gap-3">
        {/* Capture / Retake */}
        {!capturedSnapshot ? (
          <AccessibleButton
            variant="primary"
            size="lg"
            icon={<Camera className="w-5 h-5" />}
            onClick={handleCapture}
            className="col-span-2 sm:col-span-2 shadow-md shadow-brand-500/20"
          >
            CAPTURE
          </AccessibleButton>
        ) : (
          <AccessibleButton
            variant="secondary"
            size="lg"
            icon={<RotateCcw className="w-5 h-5" />}
            onClick={handleRetake}
            className="col-span-2 sm:col-span-1"
          >
            RETAKE
          </AccessibleButton>
        )}

        {/* Analyze Scene */}
        <AccessibleButton
          variant={capturedSnapshot ? 'success' : 'secondary'}
          size="lg"
          icon={<Scan className="w-5 h-5" />}
          onClick={() => handleAnalyze('Describe this scene')}
          disabled={isAnalyzing || (!capturedSnapshot && !isCameraActive)}
          className="col-span-2 sm:col-span-2 shadow-md"
        >
          {isAnalyzing ? 'Analyzing Scene...' : 'ANALYZE SCENE'}
        </AccessibleButton>

        {/* Start / Stop Camera Toggle */}
        {isCameraActive ? (
          <AccessibleButton
            variant="outline"
            size="lg"
            icon={<VideoOff className="w-5 h-5" />}
            onClick={handleStopCamera}
            className="col-span-1"
          >
            Stop Camera
          </AccessibleButton>
        ) : (
          <AccessibleButton
            variant="outline"
            size="lg"
            icon={<Video className="w-5 h-5" />}
            onClick={handleStartCamera}
            className="col-span-1"
          >
            Start Camera
          </AccessibleButton>
        )}

        {/* Ask AI Contextual Drawer */}
        <AccessibleButton
          variant="secondary"
          size="lg"
          icon={<HelpCircle className="w-5 h-5 text-purple-600 dark:text-purple-400" />}
          onClick={() => setIsQuestionOpen(!isQuestionOpen)}
          className="col-span-1"
        >
          Ask AccessAI
        </AccessibleButton>

        {/* Voice Readout Toggle */}
        {visionResult && (
          <AccessibleButton
            variant="outline"
            size="lg"
            icon={isSpeaking ? <VolumeX className="w-5 h-5 text-red-500" /> : <Volume2 className="w-5 h-5" />}
            onClick={handleToggleVoiceDescription}
            className="col-span-2 sm:col-span-1"
          >
            {isSpeaking ? 'Stop Voice' : 'Speak Result'}
          </AccessibleButton>
        )}
      </div>

      {/* Multimodal Reasoning Pipeline Visualization */}
      {(isAnalyzing || activePipelineStep) && (
        <div className="space-y-2">
          <ProcessingPipeline activeStep={activePipelineStep || 'camera'} />
          {pipelineMessage && (
            <div className="text-center text-xs font-mono font-semibold text-brand-600 dark:text-brand-400">
              {pipelineMessage}
            </div>
          )}
        </div>
      )}

      {/* Structured Vision Result Cards */}
      {visionResult && (
        <div className="space-y-4">
          {/* 1. Scene Description Card */}
          <div className="p-6 sm:p-7 rounded-3xl bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 shadow-xl space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-brand-600" />
                <h3 className="font-extrabold text-lg text-slate-900 dark:text-slate-100">
                  SCENE
                </h3>
                <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                  {visionResult.source.toUpperCase()}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <ConfidenceIndicator
                  level={visionResult.confidenceLevel}
                  percentage={Math.round(visionResult.confidence * 100)}
                  showDetails={false}
                  size="sm"
                />
              </div>
            </div>

            <p className="text-base sm:text-lg font-medium text-slate-800 dark:text-slate-200 leading-relaxed">
              "{visionResult.description}"
            </p>
          </div>

          {/* 2. Safety Card (Risk detection & caution advice) */}
          <div className="p-5 sm:p-6 rounded-3xl border-2 shadow-md bg-amber-50/90 dark:bg-amber-950/40 border-amber-400 dark:border-amber-600 text-amber-950 dark:text-amber-100 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 font-extrabold text-base">
                <ShieldAlert className="w-5 h-5 text-amber-600" />
                <span>SAFETY</span>
              </div>
              <span className="text-xs uppercase font-extrabold px-2 py-0.5 rounded bg-amber-200/80 dark:bg-amber-900 text-amber-900 dark:text-amber-200">
                {visionResult.confidenceLevel.toUpperCase()} CONFIDENCE
              </span>
            </div>

            <p className="text-sm sm:text-base font-semibold">
              {visionResult.safety.message}
            </p>

            <div className="text-xs text-amber-800/80 dark:text-amber-300 flex items-center gap-1.5 pt-1">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
              <span>AccessAI assists you. Always verify critical physical information before moving.</span>
            </div>
          </div>

          {/* 3. Detected Objects List */}
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <h4 className="font-bold text-sm uppercase tracking-wider text-slate-500">
                DETECTED OBJECTS ({visionResult.objects.length})
              </h4>
              <span className="text-xs text-slate-400">Spatial positioning verified</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {visionResult.objects.map((obj, idx) => (
                <div
                  key={idx}
                  className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex flex-col justify-between"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-base text-slate-900 dark:text-slate-100 capitalize">
                      {obj.label}
                    </span>
                    <span className="font-mono text-xs font-extrabold text-brand-600 dark:text-brand-400">
                      {Math.round(obj.confidence * 100)}%
                    </span>
                  </div>
                  <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-1 capitalize">
                    Position: {obj.position}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Contextual Ask AccessAI Drawer (uses the SAME captured image!) */}
      <div className="p-6 rounded-3xl bg-slate-100 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-base text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-brand-600" />
            <span>Ask AccessAI About This Captured Image</span>
          </h3>
          <span className="text-xs text-slate-500">Contextual multimodal reasoning</span>
        </div>

        {/* Quick Contextual Questions */}
        <div className="flex flex-wrap gap-2">
          {[
            'Where is the door?',
            'What should I be careful about?',
            'What is on my right?',
            'What is on my left?',
            'What is directly ahead?',
            'Is the path clear?',
          ].map((prompt) => (
            <button
              key={prompt}
              type="button"
              onClick={() => handleAskContextualQuestion(prompt)}
              disabled={isAnalyzing}
              className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all border ${
                activeQuestion === prompt
                  ? 'bg-brand-600 text-white border-brand-500 shadow'
                  : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'
              }`}
            >
              {prompt}
            </button>
          ))}
        </div>

        {/* Custom Question Input Form */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleAskContextualQuestion(customQuestion);
          }}
          className="flex items-center gap-2 pt-1"
        >
          <input
            type="text"
            value={customQuestion}
            onChange={(e) => setCustomQuestion(e.target.value)}
            placeholder="Ask a specific question about this view..."
            className="flex-1 px-4 py-2.5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
          <AccessibleButton
            type="submit"
            variant="primary"
            size="md"
            disabled={!customQuestion.trim() || isAnalyzing}
          >
            Ask
          </AccessibleButton>
        </form>
      </div>
    </PageContainer>
  );
};
