import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileText,
  Volume2,
  Copy,
  Languages,
  Bookmark,
  Sparkles,
  Camera,
  Upload,
  Check,
  CheckCircle2,
  VolumeX,
  RefreshCw,
  AlertTriangle,
  RotateCcw,
  Sparkle,
  Server,
  VideoOff,
  FlipHorizontal,
  Play,
  Pause,
  AlertCircle,
  Eye,
} from 'lucide-react';
import { PageContainer } from '../components/layout/PageContainer';
import { AccessibleButton } from '../components/common/AccessibleButton';
import { ConfidenceIndicator } from '../components/common/ConfidenceIndicator';
import { cameraService } from '../services/cameraService';
import { speechService } from '../services/speechService';
import { audioFeedback } from '../services/audioFeedbackService';
import { apiService, BackendOcrResult } from '../services/apiService';
import { useAssistant } from '../context/AssistantContext';
import { useAccessibility } from '../context/AccessibilityContext';
import { OCRSample, LanguageCode } from '../types';
import { OCR_SAMPLES } from '../services/ocrService';

interface LanguageOption {
  code: LanguageCode;
  label: string;
  native: string;
  speechCode: string;
}

const LANGUAGES: LanguageOption[] = [
  { code: 'en', label: 'English', native: 'English', speechCode: 'en-US' },
  { code: 'ta', label: 'Tamil', native: 'தமிழ்', speechCode: 'ta-IN' },
  { code: 'hi', label: 'Hindi', native: 'हिन्दी', speechCode: 'hi-IN' },
  { code: 'ml', label: 'Malayalam', native: 'മലയാളം', speechCode: 'ml-IN' },
  { code: 'te', label: 'Telugu', native: 'తెలుగు', speechCode: 'te-IN' },
];

export const TextReaderPage: React.FC = () => {
  const navigate = useNavigate();
  const { showToast, addAssistanceItem, updateOcrContext } = useAssistant();
  const { settings, setLanguage } = useAccessibility();

  // Camera stream state
  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const autoScanTimerRef = useRef<number | null>(null);

  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');

  // Real-Time Live Auto-Scan Mode
  const [isAutoScanActive, setIsAutoScanActive] = useState(false);

  // Active Image & OCR State - Clean by default, never pre-populated with mock text
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [imageLabel, setImageLabel] = useState<string>('Live Camera View');
  const [ocrResult, setOcrResult] = useState<BackendOcrResult | null>(null);
  const [selectedSample, setSelectedSample] = useState<OCRSample | null>(null);

  // Processing & Simplification State
  const [isProcessing, setIsProcessing] = useState(false);
  const [pipelineStep, setPipelineStep] = useState<string>('IDLE');
  const [simplifiedText, setSimplifiedText] = useState<string | null>(null);
  const [isSimplifying, setIsSimplifying] = useState(false);
  const [showSimplified, setShowSimplified] = useState(false);

  // Translation State
  const [selectedLanguage, setSelectedLanguage] = useState<LanguageCode>(settings.language || 'en');
  const [translatedText, setTranslatedText] = useState<string | null>(null);
  const [isTranslating, setIsTranslating] = useState(false);

  // Speech & UI Action State
  const [isReadingOriginal, setIsReadingOriginal] = useState(false);
  const [isReadingTranslation, setIsReadingTranslation] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  // Attempt real camera access on initial mount
  useEffect(() => {
    let mounted = true;

    async function initCamera() {
      if (videoRef.current) {
        const result = await cameraService.startCamera(videoRef.current, 'environment');
        if (mounted) {
          if (result.success) {
            setIsCameraActive(true);
            setCameraError(null);
            setImageLabel('Live Camera Feed');
            showToast('OCR Camera Ready', 'Point your camera at any text, sign, or document.', 'success');
          } else {
            setIsCameraActive(false);
            setCameraError(result.error || 'Camera unavailable');
            showToast('Camera Notice', 'You can upload an image or choose a reference sample.', 'info');
          }
        }
      }
    }

    initCamera();

    return () => {
      mounted = false;
      if (autoScanTimerRef.current) {
        window.clearInterval(autoScanTimerRef.current);
      }
      cameraService.stopCamera();
      speechService.stop();
    };
  }, []);

  // 1. START LIVE CAMERA
  const handleStartCamera = async () => {
    setCameraError(null);
    if (!videoRef.current) return;

    audioFeedback.playClick();
    const result = await cameraService.startCamera(videoRef.current, facingMode);
    if (result.success) {
      setIsCameraActive(true);
      setPreviewImage(null);
      setSelectedSample(null);
      setImageLabel('Live Camera Feed');
      showToast('Live Camera Active', 'Align text inside the frame and press Capture.', 'success');
    } else {
      setCameraError(result.error || 'Failed to start camera.');
      showToast('Camera Unavailable', 'You can upload an image or select a sample document.', 'warning');
    }
  };

  // 2. STOP CAMERA
  const handleStopCamera = () => {
    if (isAutoScanActive) {
      setIsAutoScanActive(false);
      if (autoScanTimerRef.current) {
        window.clearInterval(autoScanTimerRef.current);
        autoScanTimerRef.current = null;
      }
    }
    cameraService.stopCamera();
    setIsCameraActive(false);
    audioFeedback.playClick();
  };

  // 3. FLIP CAMERA (Front/Back)
  const handleToggleFacingMode = async () => {
    audioFeedback.playClick();
    const newMode = facingMode === 'environment' ? 'user' : 'environment';
    setFacingMode(newMode);
    if (videoRef.current && isCameraActive) {
      cameraService.stopCamera();
      const res = await cameraService.startCamera(videoRef.current, newMode);
      if (res.success) {
        showToast('Camera Switched', `Using ${newMode === 'environment' ? 'back' : 'front'} camera.`, 'info');
      }
    }
  };

  // 4. CENTRALIZED REAL OCR EXECUTION VIA GEMINI
  const runOcrAnalysis = useCallback(
    async (imageDataUrl: string, autoTriggerSpeech = false) => {
      setIsProcessing(true);
      setPipelineStep('UPLOADING');
      setSimplifiedText(null);
      setShowSimplified(false);
      setTranslatedText(null);
      speechService.stop();
      setIsReadingOriginal(false);
      setIsReadingTranslation(false);

      try {
        setPipelineStep('EXTRACTING');
        const result = await apiService.extractOCR({
          image: imageDataUrl,
          sourceLanguage: 'auto',
          accessibilityProfile: {
            textSize: settings.textSize,
            contrast: settings.contrastMode,
            simplifiedMode: settings.simplifiedMode,
            voiceGuidance: settings.voiceGuidance,
            language: settings.language,
            reducedMotion: settings.reducedMotion,
          },
          context: {
            currentPage: 'reader',
            currentLabel: imageLabel,
          },
        });

        setOcrResult(result);
        updateOcrContext(result.text, result.detectedLanguage);
        setPipelineStep('READY');
        audioFeedback.playSuccess();

        if (result.text && result.text.trim()) {
          showToast(
            'Text Transcribed',
            `Detected ${result.detectedLanguage.toUpperCase()} text (${Math.round(result.confidence * 100)}% confidence).`,
            'success'
          );

          // Record assistance item in persistent history
          addAssistanceItem({
            type: 'ocr',
            title: `OCR: ${result.text.slice(0, 32).replace(/\n/g, ' ')}...`,
            summary: result.text.slice(0, 120),
            confidence: result.confidenceLevel,
            actionUrl: '/reader',
          });

          // Auto read aloud if enabled
          if (autoTriggerSpeech || settings.autoReadAloud || settings.voiceGuidance) {
            const langObj = LANGUAGES.find((l) => l.code === result.detectedLanguage) || LANGUAGES[0];
            setIsReadingOriginal(true);
            speechService.speak(result.text, {
              rate: settings.speechSpeed,
              lang: langObj.speechCode,
              onEnd: () => setIsReadingOriginal(false),
              onError: () => setIsReadingOriginal(false),
            });
          }
        } else {
          showToast('No Text Found', 'No readable text was detected in this frame. Try adjusting angle or lighting.', 'info');
        }
      } catch (err) {
        console.error('OCR Extraction error:', err);
        const errMsg = err instanceof Error ? err.message : 'OCR service error';
        showToast('OCR Error', errMsg, 'warning');
        audioFeedback.playWarning();
      } finally {
        setIsProcessing(false);
      }
    },
    [imageLabel, settings, showToast, updateOcrContext, addAssistanceItem]
  );

  // 5. CAPTURE FROM CAMERA AND EXTRACT
  const handleCaptureAndExtract = async () => {
    if (!videoRef.current) return;

    audioFeedback.playChime();
    const capturedBase64 = cameraService.captureOptimizedFrame(videoRef.current, 1280, 0.85);
    if (!capturedBase64) {
      showToast('Capture Failed', 'Could not capture frame from camera.', 'warning');
      return;
    }

    setPreviewImage(capturedBase64);
    setImageLabel('Captured Frame');
    setSelectedSample(null);

    await runOcrAnalysis(capturedBase64, settings.voiceGuidance);
  };

  // 6. TOGGLE CONTINUOUS REAL-TIME LIVE SCAN
  const handleToggleAutoScan = () => {
    audioFeedback.playClick();
    if (isAutoScanActive) {
      setIsAutoScanActive(false);
      if (autoScanTimerRef.current) {
        window.clearInterval(autoScanTimerRef.current);
        autoScanTimerRef.current = null;
      }
      showToast('Auto-Scan Disabled', 'Manual capture mode active.', 'info');
    } else {
      if (!isCameraActive) {
        handleStartCamera();
      }
      setIsAutoScanActive(true);
      showToast('Continuous Live Scan Active', 'Transcribing text automatically every 4.5 seconds.', 'success');

      // Trigger immediately
      if (videoRef.current) {
        const frame = cameraService.captureOptimizedFrame(videoRef.current, 1280, 0.85);
        if (frame) {
          setPreviewImage(frame);
          runOcrAnalysis(frame, true);
        }
      }

      autoScanTimerRef.current = window.setInterval(() => {
        if (!isProcessing && videoRef.current && isCameraActive) {
          const frame = cameraService.captureOptimizedFrame(videoRef.current, 1280, 0.85);
          if (frame) {
            setPreviewImage(frame);
            runOcrAnalysis(frame, false);
          }
        }
      }, 4500);
    }
  };

  // 7. FILE UPLOAD (Real User Photo or Document)
  const handleFileSelected = (file: File) => {
    if (!file.type.startsWith('image/')) {
      showToast('Invalid File', 'Please upload a JPEG, PNG, or WebP image.', 'warning');
      return;
    }

    audioFeedback.playClick();
    if (isCameraActive) {
      cameraService.stopCamera();
      setIsCameraActive(false);
    }

    const reader = new FileReader();
    reader.onload = async () => {
      const dataUrl = reader.result as string;
      setPreviewImage(dataUrl);
      setSelectedSample(null);
      setImageLabel(`Uploaded: ${file.name}`);
      showToast('Image Loaded', `Transcribing "${file.name}" with Gemini OCR...`, 'info');
      await runOcrAnalysis(dataUrl, settings.voiceGuidance);
    };
    reader.readAsDataURL(file);
  };

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelected(e.dataTransfer.files[0]);
    }
  };

  // 8. SELECT SAMPLE REFERENCE DOCUMENT
  const handleSelectSample = async (sample: OCRSample) => {
    audioFeedback.playClick();
    if (isCameraActive) {
      cameraService.stopCamera();
      setIsCameraActive(false);
    }

    setSelectedSample(sample);
    setPreviewImage(sample.previewUrl);
    setImageLabel(`Sample: ${sample.title}`);
    showToast('Analyzing Sample Document', `Running Gemini OCR on "${sample.title}"...`, 'info');

    // Run real Gemini OCR on the sample image URL!
    await runOcrAnalysis(sample.previewUrl, false);
  };

  // 9. SIMPLIFY TEXT USING GEMINI
  const handleSimplifyText = async () => {
    if (!ocrResult || !ocrResult.text.trim()) return;

    if (simplifiedText) {
      setShowSimplified(!showSimplified);
      audioFeedback.playClick();
      return;
    }

    setIsSimplifying(true);
    audioFeedback.playClick();
    showToast('Simplifying Text', 'Rewriting into plain-language sentences with Gemini...', 'info');

    try {
      const response = await apiService.simplifyOCRText({
        text: ocrResult.text,
        language: ocrResult.detectedLanguage,
        accessibilityProfile: {
          simplifiedMode: true,
        },
      });

      setSimplifiedText(response.text);
      setShowSimplified(true);
      audioFeedback.playSuccess();
      showToast('Text Simplified', 'Clear, plain-language version is ready.', 'success');
    } catch (err) {
      console.warn('Simplification error:', err);
      showToast('Simplification Notice', 'Could not simplify text at this moment.', 'warning');
    } finally {
      setIsSimplifying(false);
    }
  };

  // 10. MULTILINGUAL TRANSLATION USING GEMINI
  const handleTranslate = async () => {
    if (!ocrResult || !ocrResult.text.trim()) return;
    const textToTranslate = showSimplified && simplifiedText ? simplifiedText : ocrResult.text;

    setIsTranslating(true);
    audioFeedback.playClick();
    const targetLabel = LANGUAGES.find((l) => l.code === selectedLanguage)?.label || selectedLanguage;
    showToast('Translating Text', `Translating accurately into ${targetLabel} with Gemini...`, 'info');

    try {
      const response = await apiService.translateOCRText({
        text: textToTranslate,
        sourceLanguage: ocrResult.detectedLanguage,
        targetLanguage: selectedLanguage,
        accessibilityProfile: {
          simplifiedMode: settings.simplifiedMode,
          language: selectedLanguage,
        },
      });

      setTranslatedText(response.text);
      audioFeedback.playSuccess();
      showToast('Translation Complete', `Translated into ${targetLabel}.`, 'success');
    } catch (err) {
      console.error('Translation error:', err);
      showToast('Translation Error', 'Failed to complete translation. Please retry.', 'warning');
    } finally {
      setIsTranslating(false);
    }
  };

  // 11. READ ORIGINAL / SIMPLIFIED TEXT ALOUD
  const handleToggleReadOriginal = () => {
    if (isReadingOriginal) {
      speechService.stop();
      setIsReadingOriginal(false);
      audioFeedback.playClick();
      return;
    }

    speechService.stop();
    setIsReadingTranslation(false);

    if (!ocrResult) return;
    const textToSpeak = showSimplified && simplifiedText ? simplifiedText : ocrResult.text;
    if (!textToSpeak.trim()) return;

    const langObj = LANGUAGES.find((l) => l.code === ocrResult.detectedLanguage) || LANGUAGES[0];
    audioFeedback.playChime();
    setIsReadingOriginal(true);

    speechService.speak(textToSpeak, {
      rate: settings.speechSpeed,
      lang: langObj.speechCode,
      onEnd: () => setIsReadingOriginal(false),
      onError: () => setIsReadingOriginal(false),
    });
  };

  // 12. READ TRANSLATION ALOUD
  const handleToggleReadTranslation = () => {
    if (!translatedText) return;

    if (isReadingTranslation) {
      speechService.stop();
      setIsReadingTranslation(false);
      audioFeedback.playClick();
      return;
    }

    speechService.stop();
    setIsReadingOriginal(false);

    const langObj = LANGUAGES.find((l) => l.code === selectedLanguage) || LANGUAGES[0];
    audioFeedback.playChime();
    setIsReadingTranslation(true);

    speechService.speak(translatedText, {
      rate: settings.speechSpeed,
      lang: langObj.speechCode,
      onEnd: () => setIsReadingTranslation(false),
      onError: () => setIsReadingTranslation(false),
    });
  };

  // 13. COPY TEXT
  const handleCopyText = (text: string) => {
    navigator.clipboard.writeText(text);
    audioFeedback.playClick();
    setCopied(true);
    showToast('Copied to Clipboard', 'Text copied successfully.', 'success');
    setTimeout(() => setCopied(false), 2000);
  };

  // 14. SAVE TO NOTES
  const handleSaveText = () => {
    audioFeedback.playSuccess();
    setIsSaved(true);
    showToast('Saved to History', 'Document text preserved in local session.', 'success');
  };

  const displayText = ocrResult ? (showSimplified && simplifiedText ? simplifiedText : ocrResult.text) : '';

  return (
    <PageContainer maxWidth="xl" className="space-y-6">
      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/jpg"
        capture="environment"
        className="hidden"
        onChange={(e) => {
          if (e.target.files && e.target.files[0]) {
            handleFileSelected(e.target.files[0]);
          }
        }}
      />

      {/* Top Header & Real-time Live Mode Status */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/70 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs font-bold mb-1">
            <FileText className="w-3.5 h-3.5" />
            <span>REAL-TIME OCR • Gemini Multimodal Vision AI</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-100">
            Read Signs & Documents
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
              <span>LIVE OCR ({facingMode === 'environment' ? 'BACK' : 'FRONT'})</span>
            </div>
          ) : previewImage ? (
            <div className="px-3 py-1.5 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-950/80 dark:text-blue-300 border border-blue-300 dark:border-blue-800 text-xs font-bold flex items-center gap-2">
              <Eye className="w-3.5 h-3.5" />
              <span>IMAGE LOADED</span>
            </div>
          ) : (
            <div className="px-3 py-1.5 rounded-full bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-300 dark:border-slate-700 text-xs font-bold flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-slate-400" />
              <span>SCANNER READY</span>
            </div>
          )}

          {ocrResult && (
            <div className="px-3 py-1.5 rounded-full text-xs font-extrabold border shadow-sm flex items-center gap-1.5 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
              <Server className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span className="text-emerald-700 dark:text-emerald-300">REAL GEMINI DATA</span>
            </div>
          )}
        </div>
      </div>

      {/* Camera Hardware / Iframe Guidance Banner if applicable */}
      {cameraError && !previewImage && (
        <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border-2 border-amber-300 dark:border-amber-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs sm:text-sm text-amber-900 dark:text-amber-200">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
            <div>
              <span className="font-bold">Camera status: </span>
              <span>{cameraError} You can upload any sign or photo, or test with sample documents below.</span>
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
            <AccessibleButton variant="secondary" size="sm" onClick={handleStartCamera}>
              Retry Camera
            </AccessibleButton>
          </div>
        </div>
      )}

      {/* Main Grid: Document Visual Stage & Real Extracted Content */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Camera / Image Viewport & Controls */}
        <div className="lg:col-span-6 space-y-4">
          <div
            className={`relative rounded-3xl overflow-hidden aspect-[4/3] bg-slate-950 border-2 shadow-2xl transition-all ${
              isDragging ? 'border-emerald-500 ring-4 ring-emerald-500/30' : 'border-slate-800'
            }`}
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleFileDrop}
          >
            {/* Live Video Element */}
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className={`w-full h-full object-cover ${isCameraActive && !previewImage ? 'block' : 'hidden'}`}
            />

            {/* Captured or Uploaded Image Preview */}
            {(!isCameraActive || previewImage) && previewImage && (
              <img
                src={previewImage}
                alt="Document preview"
                className="w-full h-full object-contain bg-slate-950"
              />
            )}

            {/* Camera Reticle / Text Alignment Guide */}
            {isCameraActive && !previewImage && !isProcessing && (
              <div className="absolute inset-8 border-2 border-dashed border-white/40 rounded-2xl pointer-events-none flex flex-col justify-between p-3">
                <div className="flex justify-between text-[11px] font-mono font-bold text-white/70">
                  <span>┌ ALIGN TEXT HERE</span>
                  <span>┐</span>
                </div>
                <div className="text-center">
                  <span className="bg-black/60 backdrop-blur-md px-3 py-1 rounded-full text-[11px] font-bold text-white/90">
                    Keep document or sign flat and steady
                  </span>
                </div>
                <div className="flex justify-between text-[11px] font-mono font-bold text-white/70">
                  <span>└</span>
                  <span>┘</span>
                </div>
              </div>
            )}

            {/* Empty Viewport Placeholder when Camera is stopped and no image loaded */}
            {!isCameraActive && !previewImage && (
              <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center text-slate-400 space-y-3">
                <FileText className="w-12 h-12 text-slate-600" />
                <div className="max-w-md">
                  <p className="font-bold text-slate-200 text-base">No active document</p>
                  <p className="text-xs text-slate-400 mt-1">
                    Start your camera, upload a photo, or choose a sample signage image below to extract text with Gemini OCR.
                  </p>
                </div>
                <div className="flex items-center gap-2 pt-2">
                  <AccessibleButton
                    variant="primary"
                    size="md"
                    icon={<Camera className="w-4 h-4" />}
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

            {/* Bounding Box Highlights for Extracted Text Regions */}
            {ocrResult && ocrResult.regions && ocrResult.regions.length > 0 && (
              <div className="absolute inset-0 pointer-events-none p-2">
                {ocrResult.regions.map((reg, idx) => (
                  <div
                    key={idx}
                    className="absolute border border-emerald-400/80 bg-emerald-500/15 rounded transition-all duration-300"
                    style={{
                      left: `${reg.x * 100}%`,
                      top: `${reg.y * 100}%`,
                      width: `${reg.width * 100}%`,
                      height: `${reg.height * 100}%`,
                    }}
                  />
                ))}
              </div>
            )}

            {/* Processing Overlay */}
            {isProcessing && (
              <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center space-y-3 z-20">
                <RefreshCw className="w-10 h-10 text-emerald-400 animate-spin" />
                <div className="space-y-1">
                  <h4 className="text-white font-bold text-base">Reading Document with Gemini AI</h4>
                  <p className="text-slate-300 text-xs font-mono font-semibold">
                    {pipelineStep === 'UPLOADING' && 'Optimizing image frame...'}
                    {pipelineStep === 'EXTRACTING' && 'Transcribing text, symbols & numbers...'}
                    {pipelineStep === 'READY' && 'Transcription complete.'}
                  </p>
                </div>
              </div>
            )}

            {/* Viewport HUD Status */}
            <div className="absolute bottom-3 left-3 right-3 bg-slate-950/85 backdrop-blur-md text-white p-3 rounded-2xl border border-white/10 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2">
                <span className={`w-2.5 h-2.5 rounded-full ${isCameraActive ? 'bg-emerald-400 animate-pulse' : 'bg-slate-400'}`} />
                <span className="font-bold">
                  {previewImage ? imageLabel : isCameraActive ? 'Live OCR Camera' : 'Scanner Idle'}
                </span>
                {ocrResult && ocrResult.text && (
                  <span className="text-emerald-400 font-semibold hidden sm:inline">
                    • {ocrResult.text.split('\n').filter(Boolean).length} lines detected
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2 font-mono text-[11px] text-white/80">
                <span>Model: Gemini OCR</span>
                <span>Language: {ocrResult ? ocrResult.detectedLanguage.toUpperCase() : 'AUTO'}</span>
              </div>
            </div>
          </div>

          {/* Camera & Upload Action Buttons */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {isCameraActive ? (
              <>
                <AccessibleButton
                  variant="primary"
                  size="lg"
                  icon={<Camera className="w-5 h-5" />}
                  onClick={handleCaptureAndExtract}
                  disabled={isProcessing}
                  className="col-span-2 shadow-md shadow-emerald-500/20"
                >
                  Capture & Extract
                </AccessibleButton>

                <AccessibleButton
                  variant={isAutoScanActive ? 'success' : 'outline'}
                  size="lg"
                  icon={isAutoScanActive ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                  onClick={handleToggleAutoScan}
                  disabled={isProcessing && !isAutoScanActive}
                  className="col-span-1"
                >
                  {isAutoScanActive ? 'Auto-Scan ON' : 'Auto-Scan'}
                </AccessibleButton>

                <AccessibleButton
                  variant="secondary"
                  size="lg"
                  icon={<VideoOff className="w-4 h-4" />}
                  onClick={handleStopCamera}
                  className="col-span-1"
                >
                  Stop Video
                </AccessibleButton>
              </>
            ) : (
              <>
                <AccessibleButton
                  variant="primary"
                  size="lg"
                  icon={<Camera className="w-5 h-5" />}
                  onClick={handleStartCamera}
                  disabled={isProcessing}
                  className="col-span-1"
                >
                  Start Camera
                </AccessibleButton>

                <AccessibleButton
                  variant="outline"
                  size="lg"
                  icon={<Upload className="w-5 h-5" />}
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isProcessing}
                  className="col-span-1"
                >
                  Upload Image
                </AccessibleButton>

                {previewImage && (
                  <AccessibleButton
                    variant="secondary"
                    size="lg"
                    icon={<RefreshCw className="w-4 h-4" />}
                    onClick={() => runOcrAnalysis(previewImage)}
                    disabled={isProcessing}
                    className="col-span-1"
                  >
                    Re-extract
                  </AccessibleButton>
                )}

                {previewImage && (
                  <AccessibleButton
                    variant="secondary"
                    size="lg"
                    icon={<RotateCcw className="w-4 h-4" />}
                    onClick={() => {
                      setPreviewImage(null);
                      setOcrResult(null);
                      setTranslatedText(null);
                      setSimplifiedText(null);
                      handleStartCamera();
                    }}
                    className="col-span-1"
                  >
                    Clear
                  </AccessibleButton>
                )}
              </>
            )}
          </div>

          {/* Secondary Toolbar: Flip Camera */}
          {isCameraActive && (
            <div className="flex items-center justify-between pt-1">
              <button
                type="button"
                onClick={handleToggleFacingMode}
                className="px-3 py-1.5 rounded-xl text-xs font-bold border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 flex items-center gap-1.5 transition-colors"
              >
                <FlipHorizontal className="w-3.5 h-3.5" />
                <span>Switch to {facingMode === 'environment' ? 'Front' : 'Back'} Camera</span>
              </button>
            </div>
          )}

          {/* Sample Reference Signage and Documents Bar */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Test With Real Sample Signs:
              </span>
              <span className="text-[11px] text-slate-400">
                Clicking runs live Gemini OCR on the document image
              </span>
            </div>

            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
              {OCR_SAMPLES.map((s) => (
                <button
                  key={s.id}
                  onClick={() => handleSelectSample(s)}
                  className={`px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border flex items-center gap-2 ${
                    selectedSample?.id === s.id && previewImage === s.previewUrl
                      ? 'bg-emerald-600 text-white border-emerald-500 shadow-sm font-bold'
                      : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <img src={s.previewUrl} alt="" className="w-4 h-4 rounded object-cover" />
                  <span>{s.title}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: OCR Results, Simplification & Translation */}
        <div className="lg:col-span-6 space-y-5">
          {/* Extracted Text Card */}
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 shadow-xl space-y-4">
            {/* Header with Title, Language, and Confidence */}
            <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <span className="text-xs uppercase font-extrabold text-slate-400 block mb-0.5">
                  {showSimplified ? 'Simplified Plain-Language Version' : 'Live Extracted Text'}
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-slate-800 dark:text-slate-200">
                    Language:{' '}
                    <span className="font-mono text-emerald-600 dark:text-emerald-400 uppercase">
                      {ocrResult ? ocrResult.detectedLanguage : 'READY'}
                    </span>
                  </span>
                </div>
              </div>

              {ocrResult && (
                <ConfidenceIndicator
                  level={ocrResult.confidenceLevel}
                  percentage={Math.round(ocrResult.confidence * 100)}
                  showDetails={true}
                  size="sm"
                />
              )}
            </div>

            {/* Low confidence warning banner if needed */}
            {ocrResult && ocrResult.confidenceLevel === 'low' && (
              <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 flex items-start gap-2 text-xs text-amber-800 dark:text-amber-300">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>
                  Some characters may be unclear. Please verify important numbers, dates, or medical instructions.
                </span>
              </div>
            )}

            {/* Text Reading Area */}
            <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 min-h-[160px] flex flex-col justify-center">
              {displayText.trim() ? (
                <pre className="font-sans whitespace-pre-wrap text-base sm:text-lg font-semibold text-slate-800 dark:text-slate-100 leading-relaxed break-words">
                  {displayText}
                </pre>
              ) : (
                <div className="text-center py-8 text-slate-400 space-y-2">
                  <FileText className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-600" />
                  <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
                    Ready to extract text
                  </p>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    Capture a photo from your camera, upload an image, or click one of the sample signs below to transcribe original text.
                  </p>
                </div>
              )}
            </div>

            {/* Primary Action Buttons: Read Aloud & Simplify */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <AccessibleButton
                variant="success"
                size="lg"
                fullWidth
                icon={isReadingOriginal ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                onClick={handleToggleReadOriginal}
                disabled={!displayText.trim()}
                className="shadow-md shadow-emerald-500/20"
              >
                {isReadingOriginal ? 'Stop Reading' : '🔊 Read Aloud'}
              </AccessibleButton>

              <AccessibleButton
                variant="secondary"
                size="lg"
                fullWidth
                icon={<Sparkles className="w-5 h-5 text-purple-600" />}
                onClick={handleSimplifyText}
                disabled={!ocrResult || !ocrResult.text.trim() || isSimplifying}
              >
                {isSimplifying ? 'Simplifying...' : showSimplified ? 'Show Original' : 'Simplify Text'}
              </AccessibleButton>
            </div>

            {/* Secondary Actions: Copy, Save, Voice Assistant */}
            <div className="grid grid-cols-3 gap-2.5 pt-1">
              <AccessibleButton
                variant="secondary"
                size="sm"
                icon={copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                onClick={() => handleCopyText(displayText)}
                disabled={!displayText.trim()}
              >
                {copied ? 'Copied' : 'Copy'}
              </AccessibleButton>

              <AccessibleButton
                variant="secondary"
                size="sm"
                icon={isSaved ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <Bookmark className="w-4 h-4" />}
                onClick={handleSaveText}
                disabled={!displayText.trim()}
              >
                {isSaved ? 'Saved' : 'Save'}
              </AccessibleButton>

              <AccessibleButton
                variant="secondary"
                size="sm"
                icon={<Sparkle className="w-4 h-4 text-brand-600" />}
                onClick={() => navigate('/voice')}
              >
                Ask Voice
              </AccessibleButton>
            </div>
          </div>

          {/* Multilingual Translation Panel */}
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 shadow-xl space-y-4">
            <div className="flex items-center justify-between gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Languages className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                <h3 className="font-extrabold text-slate-900 dark:text-slate-100 text-base">
                  Multilingual Translation
                </h3>
              </div>
              <span className="text-xs font-mono font-bold text-slate-500">Gemini Neural Translator</span>
            </div>

            {/* Target Language Buttons */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase text-slate-500 dark:text-slate-400">
                Choose Target Language:
              </label>
              <div className="flex flex-wrap gap-1.5">
                {LANGUAGES.map((lang) => (
                  <button
                    key={lang.code}
                    onClick={() => {
                      audioFeedback.playClick();
                      setSelectedLanguage(lang.code);
                      setLanguage(lang.code);
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                      selectedLanguage === lang.code
                        ? 'bg-emerald-600 text-white border-emerald-500 shadow-sm'
                        : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'
                    }`}
                  >
                    {lang.label} ({lang.native})
                  </button>
                ))}
              </div>
            </div>

            {/* Translate Trigger Button */}
            <AccessibleButton
              variant="primary"
              size="md"
              fullWidth
              icon={<Languages className="w-4 h-4" />}
              onClick={handleTranslate}
              disabled={!ocrResult || !ocrResult.text.trim() || isTranslating}
            >
              {isTranslating
                ? 'Translating with Gemini...'
                : `Translate into ${LANGUAGES.find((l) => l.code === selectedLanguage)?.label}`}
            </AccessibleButton>

            {/* Translated Result Area */}
            {translatedText && (
              <div className="p-4 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 space-y-3 mt-3 animate-fadeIn">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold text-emerald-800 dark:text-emerald-300 uppercase tracking-wider">
                    {LANGUAGES.find((l) => l.code === selectedLanguage)?.label} Translation
                  </span>
                  <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                    Exact numbers & directions preserved
                  </span>
                </div>

                <pre className="font-sans whitespace-pre-wrap text-base font-semibold text-slate-900 dark:text-slate-100 leading-relaxed">
                  {translatedText}
                </pre>

                {/* Read Translation Button */}
                <div className="pt-1 flex flex-wrap items-center justify-between gap-2">
                  <AccessibleButton
                    variant="success"
                    size="md"
                    icon={isReadingTranslation ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                    onClick={handleToggleReadTranslation}
                  >
                    {isReadingTranslation ? 'Stop Speaking' : '🔊 Read Translation'}
                  </AccessibleButton>

                  <p className="text-[11px] text-slate-500 dark:text-slate-400 italic">
                    Always confirm physical details against the original text.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </PageContainer>
  );
};
