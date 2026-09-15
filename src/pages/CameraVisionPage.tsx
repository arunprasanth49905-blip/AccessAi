import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Camera,
  Scan,
  Sparkles,
  ShieldAlert,
  Volume2,
  VolumeX,
  Video,
  VideoOff,
  HelpCircle,
  AlertTriangle,
  RotateCcw,
  AlertCircle,
  Server,
  Upload,
  RefreshCw,
  Play,
  Pause,
  FlipHorizontal,
  CheckCircle2,
  Image as ImageIcon,
} from 'lucide-react';
import { PageContainer } from '../components/layout/PageContainer';
import { AccessibleButton } from '../components/common/AccessibleButton';
import { ConfidenceIndicator } from '../components/common/ConfidenceIndicator';
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
  const { showToast, addAssistanceItem, updateSceneContext } = useAssistant();
  const { settings } = useAccessibility();

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Optional sample reference scenes for testing when no camera is present
  const [scenes] = useState<CameraScene[]>(() => visionService.getScenes());
  const [selectedSampleScene, setSelectedSampleScene] = useState<CameraScene | null>(null);

  // Camera & Stream States
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');
  const [capturedSnapshot, setCapturedSnapshot] = useState<string | null>(null);
  const [imageSourceDescription, setImageSourceDescription] = useState<string>('Live Camera');

  // Real-Time Continuous Auto-Scan Mode
  const [isAutoScanActive, setIsAutoScanActive] = useState(false);
  const autoScanIntervalRef = useRef<number | null>(null);

  // Analysis & Pipeline States
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [activePipelineStep, setActivePipelineStep] = useState<PipelineStep | null>(null);
  const [pipelineMessage, setPipelineMessage] = useState<string>('');
  const [visionResult, setVisionResult] = useState<VisionResult | null>(null);

  // Interactive Question Answering States
  const [isQuestionOpen, setIsQuestionOpen] = useState(false);
  const [customQuestion, setCustomQuestion] = useState('');
  const [activeQuestion, setActiveQuestion] = useState<string>('Describe this scene');
  const [isSpeaking, setIsSpeaking] = useState(false);

  // Drag-and-drop state
  const [isDragging, setIsDragging] = useState(false);

  // Attempt real webcam access on mount
  useEffect(() => {
    let mounted = true;

    async function initCamera() {
      if (videoRef.current) {
        const res = await cameraService.startCamera(videoRef.current, 'environment');
        if (mounted) {
          if (res.success) {
            setIsCameraActive(true);
            setCameraError(null);
            setSelectedSampleScene(null);
            setImageSourceDescription('Live Camera Feed');
            showToast('Live Camera Active', 'Real-time video feed ready for AI analysis.', 'success');
          } else {
            setIsCameraActive(false);
            setCameraError(res.error || 'Camera unavailable');
            showToast('Camera Permission / Hardware Notice', 'You can upload a photo or use a sample reference image.', 'info');
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

  // Stop auto-scan on unmount
  useEffect(() => {
    return () => {
      if (autoScanIntervalRef.current) {
        window.clearInterval(autoScanIntervalRef.current);
      }
    };
  }, []);

  // Start / Resume live camera
  const handleStartCamera = async () => {
    audioFeedback.playClick();
    if (videoRef.current) {
      const res = await cameraService.startCamera(videoRef.current, facingMode);
      if (res.success) {
        setIsCameraActive(true);
        setCameraError(null);
        setCapturedSnapshot(null);
        setSelectedSampleScene(null);
        setImageSourceDescription('Live Camera Feed');
        showToast('Camera Started', 'Live stream active.', 'success');
      } else {
        setCameraError(res.error || 'Failed to start camera');
        showToast('Camera Notice', res.error || 'Camera could not be started.', 'warning');
      }
    }
  };

  // Stop live camera
  const handleStopCamera = () => {
    audioFeedback.playClick();
    if (isAutoScanActive) {
      setIsAutoScanActive(false);
      if (autoScanIntervalRef.current) {
        window.clearInterval(autoScanIntervalRef.current);
        autoScanIntervalRef.current = null;
      }
    }
    cameraService.stopCamera();
    setIsCameraActive(false);
    showToast('Camera Paused', 'Video stream paused.', 'info');
  };

  // Flip front / rear camera
  const handleToggleCameraFacing = async () => {
    audioFeedback.playClick();
    const newMode = facingMode === 'environment' ? 'user' : 'environment';
    setFacingMode(newMode);
    if (videoRef.current && isCameraActive) {
      cameraService.stopCamera();
      const res = await cameraService.startCamera(videoRef.current, newMode);
      if (res.success) {
        showToast('Camera Flipped', `Switched to ${newMode === 'environment' ? 'back' : 'front'} camera.`, 'info');
      }
    }
  };

  // Core Vision Analysis: Image -> Real AI Endpoint -> Live Results
  const handleAnalyze = useCallback(
    async (questionToAsk: string = 'Describe this scene', sourceFrame?: string) => {
      let imageToAnalyze = sourceFrame || capturedSnapshot;

      if (!imageToAnalyze && isCameraActive && videoRef.current) {
        imageToAnalyze = cameraService.captureOptimizedFrame(videoRef.current, 1280, 0.85);
        if (imageToAnalyze && !capturedSnapshot) {
          setCapturedSnapshot(imageToAnalyze);
        }
      } else if (!imageToAnalyze && selectedSampleScene) {
        imageToAnalyze = selectedSampleScene.imageUrl;
      }

      if (!imageToAnalyze) {
        showToast('No Image Available', 'Please start the camera, capture a frame, or upload a photo.', 'warning');
        return;
      }

      setIsAnalyzing(true);
      setAnalysisError(null);
      setActiveQuestion(questionToAsk);
      audioFeedback.playChime();

      // Pipeline status steps
      setActivePipelineStep('camera');
      setPipelineMessage('Optimizing image frame for analysis...');
      await new Promise((r) => setTimeout(r, 120));

      setActivePipelineStep('vision');
      setPipelineMessage('Streaming to Gemini Multimodal Vision AI...');
      await new Promise((r) => setTimeout(r, 150));

      setActivePipelineStep('reasoning');
      setPipelineMessage('Detecting real objects, paths, and obstacles...');

      try {
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
            currentScene: imageSourceDescription,
          },
        });

        setActivePipelineStep('response');
        setPipelineMessage('Rendering spatial geometry and safety feedback...');
        await new Promise((r) => setTimeout(r, 100));

        setVisionResult(result);
        setAnalysisError(null);
        updateSceneContext(
          result.description,
          result.objects.map((o) => o.label)
        );
        audioFeedback.playSuccess();
        setIsAnalyzing(false);

        // Record to assistant history
        addAssistanceItem({
          type: 'scene',
          title: `Vision: ${result.objects[0]?.label ? `${result.objects[0].label} & more` : 'Scene Analyzed'}`,
          summary: result.description,
          confidence: result.confidenceLevel,
          actionUrl: '/camera',
        });

        // Voice Guidance: Read description or safety hazard aloud
        if (settings.voiceGuidance) {
          setIsSpeaking(true);
          const speechText = result.safety.riskDetected
            ? `Attention: ${result.safety.message}. ${result.description}`
            : result.description;

          speechService.speak(speechText, {
            rate: settings.speechSpeed,
            onEnd: () => setIsSpeaking(false),
            onError: () => setIsSpeaking(false),
          });
        }
      } catch (err: unknown) {
        const errMsg = err instanceof Error ? err.message : 'Vision AI analysis failed';
        console.error('[CameraVision] Analysis error:', err);
        setAnalysisError(errMsg);
        setIsAnalyzing(false);
        audioFeedback.playWarning();
        showToast('Analysis Error', errMsg, 'warning');
      }
    },
    [capturedSnapshot, isCameraActive, selectedSampleScene, imageSourceDescription, settings, showToast, updateSceneContext, addAssistanceItem]
  );

  // Toggle Continuous Real-Time Auto-Scan
  const handleToggleAutoScan = () => {
    audioFeedback.playClick();
    if (isAutoScanActive) {
      setIsAutoScanActive(false);
      if (autoScanIntervalRef.current) {
        window.clearInterval(autoScanIntervalRef.current);
        autoScanIntervalRef.current = null;
      }
      showToast('Continuous Scan Off', 'Manual capture mode active.', 'info');
    } else {
      if (!isCameraActive) {
        handleStartCamera();
      }
      setIsAutoScanActive(true);
      showToast('Continuous Real-Time Scan Active', 'Analyzing live camera feed every 4 seconds.', 'success');

      // Trigger immediately, then interval
      if (videoRef.current) {
        const frame = cameraService.captureOptimizedFrame(videoRef.current, 1280, 0.85);
        if (frame) handleAnalyze('Describe immediate path and obstacles', frame);
      }

      autoScanIntervalRef.current = window.setInterval(() => {
        if (!isAnalyzing && videoRef.current && isCameraActive) {
          const frame = cameraService.captureOptimizedFrame(videoRef.current, 1280, 0.85);
          if (frame) {
            handleAnalyze('Describe immediate path and obstacles', frame);
          }
        }
      }, 4500);
    }
  };

  // Capture Image Snapshot
  const handleCapture = () => {
    audioFeedback.playChime();
    let frame: string | null = null;

    if (isCameraActive && videoRef.current) {
      frame = cameraService.captureOptimizedFrame(videoRef.current, 1280, 0.85);
    } else if (selectedSampleScene) {
      frame = selectedSampleScene.imageUrl;
    }

    if (frame) {
      setCapturedSnapshot(frame);
      setVisionResult(null);
      setImageSourceDescription(isCameraActive ? 'Captured Live Frame' : selectedSampleScene?.name || 'Captured Image');
      showToast('Frame Captured', 'Ready to analyze with Gemini Vision AI.', 'success');
    } else {
      showToast('Capture Failed', 'No active camera feed or image to capture.', 'warning');
    }
  };

  // Retake / Clear Snapshot
  const handleRetake = () => {
    audioFeedback.playClick();
    setCapturedSnapshot(null);
    setVisionResult(null);
    setAnalysisError(null);
    speechService.stop();
    setIsSpeaking(false);
    if (!isCameraActive) {
      handleStartCamera();
    }
  };

  // File Upload Handlers (for uploading real photos)
  const handleFileUpload = (file: File) => {
    if (!file.type.startsWith('image/')) {
      showToast('Invalid File', 'Please select an image file (JPEG, PNG, WEBP).', 'warning');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const base64 = e.target?.result as string;
      if (base64) {
        if (isCameraActive) {
          cameraService.stopCamera();
          setIsCameraActive(false);
        }
        setCapturedSnapshot(base64);
        setSelectedSampleScene(null);
        setVisionResult(null);
        setImageSourceDescription(`Uploaded Photo: ${file.name}`);
        showToast('Photo Uploaded', `Loaded "${file.name}". Click Analyze to inspect.`, 'success');
      }
    };
    reader.readAsDataURL(file);
  };

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  // Select Sample Reference Image (as a real image input)
  const handleSelectSample = (scene: CameraScene) => {
    audioFeedback.playClick();
    if (isCameraActive) {
      cameraService.stopCamera();
      setIsCameraActive(false);
    }
    setSelectedSampleScene(scene);
    setCapturedSnapshot(scene.imageUrl);
    setVisionResult(null);
    setImageSourceDescription(`Sample Photo: ${scene.name}`);
    showToast('Sample Photo Selected', 'Click Analyze to run real Gemini Vision on this image.', 'info');
  };

  // Contextual follow-up question
  const handleAskContextualQuestion = async (q: string) => {
    if (!q.trim()) return;
    audioFeedback.playClick();
    setActiveQuestion(q);
    setCustomQuestion('');
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

  // REAL DETECTED OBJECTS ONLY: Never show mock objects when there is no analysis!
  const detectedObjects: DetectedVisionObject[] = visionResult ? visionResult.objects : [];

  return (
    <PageContainer maxWidth="xl" className="space-y-6">
      {/* Hidden File Input for uploading photos */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => {
          if (e.target.files && e.target.files[0]) {
            handleFileUpload(e.target.files[0]);
          }
        }}
      />

      {/* Top Header & Real-time Live Mode Status */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-50 dark:bg-brand-950/70 border border-brand-200 dark:border-brand-800 text-brand-700 dark:text-brand-300 text-xs font-bold mb-1">
            <Camera className="w-3.5 h-3.5" />
            <span>REAL-TIME VISION • Gemini Multimodal AI</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-100">
            Camera & Spatial Assistant
          </h2>
        </div>

        {/* Live Status Indicators */}
        <div className="flex items-center gap-2 flex-wrap">
          {isAutoScanActive && (
            <div className="px-3 py-1.5 rounded-full bg-cyan-100 text-cyan-900 dark:bg-cyan-950/80 dark:text-cyan-200 border border-cyan-300 dark:border-cyan-800 text-xs font-extrabold flex items-center gap-2 shadow-sm animate-pulse">
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-cyan-600 dark:text-cyan-400" />
              <span>CONTINUOUS SCAN ACTIVE</span>
            </div>
          )}

          {isCameraActive ? (
            <div className="px-3 py-1.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 text-xs font-extrabold flex items-center gap-2 shadow-sm">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
              <span>LIVE CAMERA ({facingMode === 'environment' ? 'BACK' : 'FRONT'})</span>
            </div>
          ) : capturedSnapshot ? (
            <div className="px-3 py-1.5 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-950/80 dark:text-blue-300 border border-blue-300 dark:border-blue-800 text-xs font-bold flex items-center gap-2">
              <ImageIcon className="w-3.5 h-3.5" />
              <span>IMAGE LOADED</span>
            </div>
          ) : (
            <div className="px-3 py-1.5 rounded-full bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-300 dark:border-slate-700 text-xs font-bold flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-slate-400" />
              <span>CAMERA IDLE</span>
            </div>
          )}

          {visionResult && (
            <div className="px-3 py-1.5 rounded-full text-xs font-extrabold border shadow-sm flex items-center gap-1.5 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
              <Server className="w-3.5 h-3.5 text-brand-500" />
              <span className="text-brand-600 dark:text-brand-400">REAL AI DATA</span>
            </div>
          )}
        </div>
      </div>

      {/* Camera Access Advisory / Fallback Action Card */}
      {cameraError && !capturedSnapshot && (
        <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/50 border-2 border-amber-300 dark:border-amber-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs sm:text-sm text-amber-900 dark:text-amber-200">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
            <div>
              <span className="font-bold">Camera status: </span>
              <span>{cameraError} You can upload a photo or pick a sample scene below to test real AI vision.</span>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <AccessibleButton
              variant="primary"
              size="sm"
              icon={<Upload className="w-4 h-4" />}
              onClick={() => fileInputRef.current?.click()}
            >
              Upload Photo
            </AccessibleButton>
            <AccessibleButton
              variant="secondary"
              size="sm"
              onClick={handleStartCamera}
            >
              Retry Camera
            </AccessibleButton>
          </div>
        </div>
      )}

      {/* Main Camera Viewport / Image Stage */}
      <div
        className={`relative rounded-3xl overflow-hidden bg-slate-950 aspect-[4/3] sm:aspect-video border-2 shadow-2xl transition-all ${
          isDragging ? 'border-brand-500 ring-4 ring-brand-500/30' : 'border-slate-800'
        }`}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleFileDrop}
      >
        {/* Real Live Hardware Video Element */}
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className={`w-full h-full object-cover ${isCameraActive && !capturedSnapshot ? 'block' : 'hidden'}`}
        />

        {/* Captured Snapshot or Uploaded Image */}
        {(!isCameraActive || capturedSnapshot) && capturedSnapshot && (
          <img
            src={capturedSnapshot}
            alt="Current Camera View"
            className="w-full h-full object-cover"
          />
        )}

        {/* Empty Placeholder when camera is stopped and no image loaded */}
        {!isCameraActive && !capturedSnapshot && (
          <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center text-slate-400 space-y-3">
            <Camera className="w-12 h-12 text-slate-600" />
            <div className="max-w-md">
              <p className="font-bold text-slate-200 text-base">Camera is currently stopped</p>
              <p className="text-xs text-slate-400 mt-1">
                Start your webcam, drag & drop a photo here, or select a sample image below to run real AI vision analysis.
              </p>
            </div>
            <div className="flex items-center gap-2 pt-2">
              <AccessibleButton
                variant="primary"
                size="md"
                icon={<Video className="w-4 h-4" />}
                onClick={handleStartCamera}
              >
                Start Camera
              </AccessibleButton>
              <AccessibleButton
                variant="secondary"
                size="md"
                icon={<Upload className="w-4 h-4" />}
                onClick={() => fileInputRef.current?.click()}
              >
                Upload Photo
              </AccessibleButton>
            </div>
          </div>
        )}

        {/* Active Scanning Animation Overlay */}
        {isAnalyzing && (
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <div className="w-full h-1.5 bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-[0_0_20px_#00e5ff] animate-radar-sweep" />
            <div className="absolute inset-0 bg-brand-500/10 backdrop-blur-[1px]" />
          </div>
        )}

        {/* Grounded Real Bounding Boxes: ONLY rendered from REAL AI ANALYSIS */}
        <div className="absolute inset-0 pointer-events-none p-2" aria-hidden="true">
          {detectedObjects.map((obj, i) => {
            if (!obj.box) return null;
            const isDanger =
              obj.label.toLowerCase().includes('obstacle') ||
              obj.label.toLowerCase().includes('cart') ||
              obj.label.toLowerCase().includes('wire') ||
              obj.label.toLowerCase().includes('drop') ||
              obj.label.toLowerCase().includes('hazard') ||
              obj.label.toLowerCase().includes('step');

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
                  showToast(
                    obj.label,
                    `${obj.position.toUpperCase()} • ${Math.round(obj.confidence * 100)}% confidence • ${obj.details || 'Detected by Gemini AI'}`,
                    'info'
                  );
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

                <span className="text-[10px] font-mono font-bold bg-black/80 text-white px-1.5 py-0.5 rounded self-end backdrop-blur-sm capitalize">
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
              {capturedSnapshot ? 'Frame Captured' : isCameraActive ? 'Live Hardware Camera' : imageSourceDescription}
            </span>
            {visionResult && (
              <span className="text-emerald-400 font-semibold hidden sm:inline">
                • {detectedObjects.length} Real Objects Tracked
              </span>
            )}
          </div>

          <div className="flex items-center gap-3 font-mono text-[11px] text-white/80">
            <span>Model: Gemini Vision AI</span>
            <span>Spatial Confidence: {visionResult ? `${Math.round(visionResult.confidence * 100)}%` : 'Ready'}</span>
          </div>
        </div>
      </div>

      {/* Primary Action Controls Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 sm:gap-3">
        {/* 1. Capture / Retake */}
        {!capturedSnapshot ? (
          <AccessibleButton
            variant="primary"
            size="lg"
            icon={<Camera className="w-5 h-5" />}
            onClick={handleCapture}
            disabled={!isCameraActive}
            className="col-span-1 shadow-md shadow-brand-500/20"
          >
            CAPTURE
          </AccessibleButton>
        ) : (
          <AccessibleButton
            variant="secondary"
            size="lg"
            icon={<RotateCcw className="w-5 h-5" />}
            onClick={handleRetake}
            className="col-span-1"
          >
            RETAKE
          </AccessibleButton>
        )}

        {/* 2. Analyze Scene (Single Click Snapshot Analysis) */}
        <AccessibleButton
          variant={capturedSnapshot ? 'success' : 'primary'}
          size="lg"
          icon={<Scan className="w-5 h-5" />}
          onClick={() => handleAnalyze('Describe this scene')}
          disabled={isAnalyzing || (!capturedSnapshot && !isCameraActive)}
          className="col-span-1 sm:col-span-2 shadow-md font-extrabold"
        >
          {isAnalyzing ? 'Analyzing...' : 'ANALYZE SCENE'}
        </AccessibleButton>

        {/* 3. Real-Time Auto-Scan Toggle */}
        <AccessibleButton
          variant={isAutoScanActive ? 'success' : 'outline'}
          size="lg"
          icon={isAutoScanActive ? <Pause className="w-5 h-5 text-emerald-600 dark:text-emerald-400" /> : <Play className="w-5 h-5" />}
          onClick={handleToggleAutoScan}
          disabled={isAnalyzing && !isAutoScanActive}
          className="col-span-1"
        >
          {isAutoScanActive ? 'Auto-Scan ON' : 'Auto-Scan'}
        </AccessibleButton>

        {/* 4. Upload Image */}
        <AccessibleButton
          variant="outline"
          size="lg"
          icon={<Upload className="w-5 h-5" />}
          onClick={() => fileInputRef.current?.click()}
          className="col-span-1"
        >
          Upload
        </AccessibleButton>

        {/* 5. Start / Stop Camera Toggle */}
        {isCameraActive ? (
          <AccessibleButton
            variant="outline"
            size="lg"
            icon={<VideoOff className="w-5 h-5" />}
            onClick={handleStopCamera}
            className="col-span-1"
          >
            Stop Video
          </AccessibleButton>
        ) : (
          <AccessibleButton
            variant="outline"
            size="lg"
            icon={<Video className="w-5 h-5" />}
            onClick={handleStartCamera}
            className="col-span-1"
          >
            Start Video
          </AccessibleButton>
        )}
      </div>

      {/* Secondary Controls: Camera Flip & Ask AccessAI */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
        <div className="flex items-center gap-2">
          {isCameraActive && (
            <button
              type="button"
              onClick={handleToggleCameraFacing}
              className="px-3 py-1.5 rounded-xl text-xs font-bold border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 flex items-center gap-1.5 transition-colors"
            >
              <FlipHorizontal className="w-3.5 h-3.5" />
              <span>Flip to {facingMode === 'environment' ? 'Front' : 'Back'} Camera</span>
            </button>
          )}

          {visionResult && (
            <button
              type="button"
              onClick={handleToggleVoiceDescription}
              className="px-3 py-1.5 rounded-xl text-xs font-bold border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 flex items-center gap-1.5 transition-colors"
            >
              {isSpeaking ? <VolumeX className="w-3.5 h-3.5 text-red-500" /> : <Volume2 className="w-3.5 h-3.5 text-brand-500" />}
              <span>{isSpeaking ? 'Stop Voice' : 'Read Scene Aloud'}</span>
            </button>
          )}
        </div>

        <AccessibleButton
          variant="secondary"
          size="sm"
          icon={<HelpCircle className="w-4 h-4 text-purple-600 dark:text-purple-400" />}
          onClick={() => setIsQuestionOpen(!isQuestionOpen)}
        >
          {isQuestionOpen ? 'Hide Q&A' : 'Ask Question About View'}
        </AccessibleButton>
      </div>

      {/* Sample Reference Images (Clearly labeled testing environments) */}
      <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            Test With Real Sample Environments:
          </span>
          <span className="text-[11px] text-slate-400">
            Selected images are analyzed by live Gemini Vision AI
          </span>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {scenes.map((s) => (
            <button
              key={s.id}
              onClick={() => handleSelectSample(s)}
              className={`px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border flex items-center gap-2 ${
                selectedSampleScene?.id === s.id && capturedSnapshot === s.imageUrl
                  ? 'bg-brand-600 text-white border-brand-500 shadow-sm font-bold'
                  : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <img src={s.imageUrl} alt="" className="w-4 h-4 rounded object-cover" />
              <span>{s.name}</span>
            </button>
          ))}
        </div>
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

      {/* Analysis Error Alert */}
      {analysisError && (
        <div className="p-4 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-900 dark:text-red-200 flex items-center justify-between gap-3 text-xs sm:text-sm">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-600 shrink-0" />
            <span>{analysisError}</span>
          </div>
          <AccessibleButton
            variant="secondary"
            size="sm"
            onClick={() => handleAnalyze(activeQuestion)}
          >
            Retry Analysis
          </AccessibleButton>
        </div>
      )}

      {/* Structured Real Vision Result Cards */}
      {visionResult && (
        <div className="space-y-4">
          {/* 1. Scene Description Card */}
          <div className="p-6 sm:p-7 rounded-3xl bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 shadow-xl space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-brand-600" />
                <h3 className="font-extrabold text-lg text-slate-900 dark:text-slate-100">
                  REAL-TIME SCENE ANALYSIS
                </h3>
                <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-brand-50 text-brand-700 dark:bg-brand-950 dark:text-brand-300">
                  GEMINI VISION
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
          <div
            className={`p-5 sm:p-6 rounded-3xl border-2 shadow-md space-y-2 ${
              visionResult.safety.riskDetected
                ? 'bg-amber-50/90 dark:bg-amber-950/40 border-amber-400 dark:border-amber-600 text-amber-950 dark:text-amber-100'
                : 'bg-emerald-50/90 dark:bg-emerald-950/40 border-emerald-400 dark:border-emerald-600 text-emerald-950 dark:text-emerald-100'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 font-extrabold text-base">
                {visionResult.safety.riskDetected ? (
                  <>
                    <ShieldAlert className="w-5 h-5 text-amber-600" />
                    <span>SAFETY ALERT: OBSTACLE OR HAZARD</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    <span>PATH ASSESSMENT: CLEAR</span>
                  </>
                )}
              </div>
              <span className="text-xs uppercase font-extrabold px-2 py-0.5 rounded bg-black/10 dark:bg-white/10">
                {visionResult.confidenceLevel.toUpperCase()} CONFIDENCE
              </span>
            </div>

            <p className="text-sm sm:text-base font-semibold">
              {visionResult.safety.message}
            </p>

            <div className="text-xs opacity-80 flex items-center gap-1.5 pt-1">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
              <span>AccessAI assists navigation. Always confirm physical steps and surroundings before moving.</span>
            </div>
          </div>

          {/* 3. Detected Objects List (REAL ORIGINAL DATA) */}
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <h4 className="font-bold text-sm uppercase tracking-wider text-slate-500">
                DETECTED OBJECTS ({visionResult.objects.length})
              </h4>
              <span className="text-xs text-slate-400 font-mono">Grounded with spatial coordinates</span>
            </div>

            {visionResult.objects.length === 0 ? (
              <div className="py-6 text-center text-sm text-slate-500">
                No distinct objects detected in this specific frame. Path appears open.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {visionResult.objects.map((obj, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex flex-col justify-between hover:border-brand-400 transition-colors cursor-pointer"
                    onClick={() => {
                      audioFeedback.playClick();
                      showToast(obj.label, `${obj.position.toUpperCase()} • ${Math.round(obj.confidence * 100)}% • ${obj.details || ''}`, 'info');
                    }}
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
                      Position: <span className="text-slate-800 dark:text-slate-200 font-bold">{obj.position}</span>
                    </div>
                    {obj.details && (
                      <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                        {obj.details}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Contextual Ask AccessAI Drawer */}
      {isQuestionOpen && (
        <div className="p-6 rounded-3xl bg-slate-100 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-base text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <HelpCircle className="w-5 h-5 text-brand-600" />
              <span>Ask AccessAI About This View</span>
            </h3>
            <span className="text-xs text-slate-500 font-mono">Multimodal visual grounding</span>
          </div>

          {/* Quick Contextual Prompts */}
          <div className="flex flex-wrap gap-2">
            {[
              'Where is the door or exit?',
              'What obstacles or trip hazards are in front of me?',
              'What is on my right?',
              'What is on my left?',
              'Is the walking path clear?',
              'Read any signs or text in this image',
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
              placeholder="Ask anything about what is visible in this frame..."
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
      )}
    </PageContainer>
  );
};
