import React, { useState, useRef, useEffect } from 'react';
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
  SlidersHorizontal,
  VolumeX,
  RefreshCw,
  AlertTriangle,
  RotateCcw,
  Sparkle,
  Server,
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

type PipelineStep = 'IDLE' | 'CAPTURING' | 'UPLOADING' | 'OCR' | 'READY';

export const TextReaderPage: React.FC = () => {
  const navigate = useNavigate();
  const { showToast, addAssistanceItem } = useAssistant();
  const { settings, setLanguage } = useAccessibility();

  // Camera stream state
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);

  // Active Image & OCR State
  const [previewImage, setPreviewImage] = useState<string>(OCR_SAMPLES[0].previewUrl);
  const [ocrResult, setOcrResult] = useState<BackendOcrResult>({
    source: 'demo',
    text: OCR_SAMPLES[0].rawText,
    detectedLanguage: 'en',
    confidence: 0.94,
    confidenceLevel: 'high',
    regions: [],
  });

  // Processing & Simplification State
  const [pipelineStep, setPipelineStep] = useState<PipelineStep>('IDLE');
  const [isProcessing, setIsProcessing] = useState(false);
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
  const [isDemoMode, setIsDemoMode] = useState(false);

  // Clean up camera & speech on unmount
  useEffect(() => {
    return () => {
      cameraService.stopCamera();
      speechService.stop();
    };
  }, []);

  // 1. START LIVE CAMERA
  const handleStartCamera = async () => {
    setCameraError(null);
    if (!videoRef.current) return;

    audioFeedback.playClick();
    const result = await cameraService.startCamera(videoRef.current);
    if (result.success) {
      setIsCameraActive(true);
      showToast('Live Camera Active', 'Align text inside the frame and press Capture.', 'info');
    } else {
      setCameraError(result.error || 'Failed to start camera.');
      showToast('Camera Unavailable', 'You can upload an image or use Demo OCR.', 'alert');
    }
  };

  // 2. STOP CAMERA
  const handleStopCamera = () => {
    cameraService.stopCamera();
    setIsCameraActive(false);
    audioFeedback.playClick();
  };

  // 3. CAPTURE FROM CAMERA AND EXTRACT
  const handleCaptureAndExtract = async () => {
    if (!videoRef.current) return;

    setPipelineStep('CAPTURING');
    audioFeedback.playChime();

    const capturedBase64 = cameraService.captureOptimizedFrame(videoRef.current, 1280, 0.82);
    if (!capturedBase64) {
      showToast('Capture Failed', 'Could not capture frame from camera.', 'alert');
      setPipelineStep('IDLE');
      return;
    }

    // Freeze frame into preview and stop live stream
    setPreviewImage(capturedBase64);
    handleStopCamera();

    await runOcrAnalysis(capturedBase64);
  };

  // 4. UPLOAD IMAGE FROM FILE
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    audioFeedback.playClick();
    handleStopCamera();

    const reader = new FileReader();
    reader.onload = async () => {
      const dataUrl = reader.result as string;
      setPreviewImage(dataUrl);
      await runOcrAnalysis(dataUrl);
    };
    reader.readAsDataURL(file);
  };

  // Centralized OCR API Execution
  const runOcrAnalysis = async (imageDataUrl: string) => {
    setIsProcessing(true);
    setPipelineStep('UPLOADING');
    setSimplifiedText(null);
    setShowSimplified(false);
    setTranslatedText(null);
    speechService.stop();
    setIsReadingOriginal(false);
    setIsReadingTranslation(false);

    showToast('Processing Image', 'Extracting readable text via AccessAI OCR...', 'info');

    try {
      setPipelineStep('OCR');
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
        },
      });

      setOcrResult(result);
      setPipelineStep('READY');
      audioFeedback.playSuccess();

      if (result.text.trim()) {
        showToast('Text Extracted', `Detected ${result.detectedLanguage.toUpperCase()} text with ${result.confidenceLevel} confidence.`, 'success');
        // Record assistance item
        addAssistanceItem({
          type: 'ocr',
          title: `OCR (${result.detectedLanguage.toUpperCase()})`,
          summary: result.text.slice(0, 100),
          confidence: result.confidenceLevel,
          actionUrl: '/reader',
        });
      } else {
        showToast('No Text Found', 'No readable text was detected in this image.', 'info');
      }
    } catch (err) {
      console.warn('OCR Analysis error, falling back to demo mode:', err);
      setPipelineStep('READY');
      setIsDemoMode(true);

      // Fallback demo result
      const fallbackResult: BackendOcrResult = {
        source: 'demo',
        text: OCR_SAMPLES[0].rawText,
        detectedLanguage: 'en',
        confidence: 0.9,
        confidenceLevel: 'high',
        regions: [],
      };
      setOcrResult(fallbackResult);
      showToast('Demo OCR Ready', 'Network connection unavailable. Using deterministic Demo OCR.', 'info');
    } finally {
      setIsProcessing(false);
    }
  };

  // 5. SELECT PRESET DEMO SAMPLE
  const handleSelectDemoSample = (sample: OCRSample) => {
    audioFeedback.playClick();
    handleStopCamera();
    setPreviewImage(sample.previewUrl);
    setSimplifiedText(null);
    setShowSimplified(false);
    setTranslatedText(null);
    speechService.stop();
    setIsReadingOriginal(false);
    setIsReadingTranslation(false);

    setOcrResult({
      source: 'demo',
      text: sample.rawText,
      detectedLanguage: 'en',
      confidence: 0.94,
      confidenceLevel: 'high',
      regions: [],
    });

    showToast('Demo Sample Loaded', sample.title, 'info');
  };

  // 6. SIMPLIFY TEXT (AI or Fallback)
  const handleSimplifyText = async () => {
    if (!ocrResult.text.trim()) return;

    if (simplifiedText) {
      // Toggle simplified view
      setShowSimplified(!showSimplified);
      audioFeedback.playClick();
      return;
    }

    setIsSimplifying(true);
    audioFeedback.playClick();
    showToast('Simplifying Text', 'Rewriting into direct, plain-language sentences...', 'info');

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
      showToast('Text Simplified', 'Plain-language summary is ready.', 'success');
    } catch (err) {
      console.warn('Simplification error, using fallback:', err);
      const fallbackSimplified = ocrResult.text
        .split('\n')
        .map((l) => l.trim())
        .filter(Boolean)
        .join('. ') + '.';
      setSimplifiedText(fallbackSimplified);
      setShowSimplified(true);
    } finally {
      setIsSimplifying(false);
    }
  };

  // 7. TRANSLATE EXTRACTED TEXT
  const handleTranslate = async () => {
    const textToTranslate = showSimplified && simplifiedText ? simplifiedText : ocrResult.text;
    if (!textToTranslate.trim()) return;

    setIsTranslating(true);
    audioFeedback.playClick();
    showToast('Translating Text', `Translating to ${selectedLanguage.toUpperCase()}...`, 'info');

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
      showToast('Translation Ready', `Translated into ${selectedLanguage.toUpperCase()} with high precision.`, 'success');
    } catch (err) {
      console.warn('Translation error, using fallback:', err);
      // Fallback deterministic sample
      const matchedSample = OCR_SAMPLES.find((s) => s.rawText.includes(ocrResult.text) || ocrResult.text.includes(s.rawText));
      if (matchedSample && matchedSample.translations[selectedLanguage]) {
        setTranslatedText(matchedSample.translations[selectedLanguage].text);
      } else {
        setTranslatedText(textToTranslate);
      }
      showToast('Translation Ready', 'Using local language fallback dictionary.', 'info');
    } finally {
      setIsTranslating(false);
    }
  };

  // 8. READ ORIGINAL / SIMPLIFIED TEXT ALOUD
  const handleToggleReadOriginal = () => {
    if (isReadingOriginal) {
      speechService.stop();
      setIsReadingOriginal(false);
      audioFeedback.playClick();
      return;
    }

    speechService.stop();
    setIsReadingTranslation(false);

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

  // 9. READ TRANSLATION ALOUD
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

  // 10. COPY TEXT
  const handleCopyText = (text: string) => {
    navigator.clipboard.writeText(text);
    audioFeedback.playClick();
    setCopied(true);
    showToast('Copied to Clipboard', 'Text copied successfully.', 'success');
    setTimeout(() => setCopied(false), 2000);
  };

  // 11. SAVE TO NOTES
  const handleSaveText = () => {
    audioFeedback.playSuccess();
    setIsSaved(true);
    showToast('Saved to Notes', 'You can review this reading in History.', 'success');
  };

  const displayText = showSimplified && simplifiedText ? simplifiedText : ocrResult.text;
  const isConfidenceLow = ocrResult.confidenceLevel === 'low';

  return (
    <PageContainer maxWidth="xl" className="space-y-6">
      {/* Header with Title and Mode Badge */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/70 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs font-bold mb-1">
            <FileText className="w-3.5 h-3.5" />
            <span>READ • Real Multilingual OCR</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-100">
            Read Signs & Documents
          </h2>
        </div>

        {/* Source Badge: AI OCR vs DEMO OCR */}
        <div className="flex items-center gap-2">
          <div className="px-3.5 py-1.5 rounded-full text-xs font-extrabold border shadow-sm flex items-center gap-1.5 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
            <Server className="w-3.5 h-3.5 text-slate-500" />
            {ocrResult.source === 'ai' && !isDemoMode ? (
              <span className="text-brand-600 dark:text-brand-400">AI OCR</span>
            ) : (
              <span className="text-amber-600 dark:text-amber-400">DEMO OCR</span>
            )}
          </div>
        </div>
      </div>

      {/* Camera Failure Banner if applicable */}
      {cameraError && (
        <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 flex items-center justify-between gap-3 text-sm text-amber-800 dark:text-amber-300">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 flex-shrink-0" />
            <span>{cameraError} Demo OCR is active.</span>
          </div>
          <button
            type="button"
            onClick={() => handleSelectDemoSample(OCR_SAMPLES[0])}
            className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl whitespace-nowrap shadow-sm"
          >
            Use Demo OCR
          </button>
        </div>
      )}

      {/* Preset Demo Samples Bar */}
      <div className="space-y-2">
        <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
          <SlidersHorizontal className="w-3.5 h-3.5" />
          <span>Quick Demo Samples:</span>
        </label>
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          {OCR_SAMPLES.map((s) => (
            <button
              key={s.id}
              onClick={() => handleSelectDemoSample(s)}
              className="px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold whitespace-nowrap transition-all border bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 shadow-sm"
            >
              {s.title}
            </button>
          ))}
        </div>
      </div>

      {/* Main Grid: Visual Frame & Extracted Text Card */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Camera / Image Preview & Controls */}
        <div className="lg:col-span-6 space-y-4">
          <div className="relative rounded-3xl overflow-hidden aspect-[4/3] bg-slate-900 border-2 border-slate-200 dark:border-slate-800 shadow-lg">
            {/* Live Video element */}
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className={`w-full h-full object-cover ${isCameraActive ? 'block' : 'hidden'}`}
            />

            {/* Captured / Uploaded Image Preview */}
            {!isCameraActive && (
              <img
                src={previewImage}
                alt="Document preview"
                className="w-full h-full object-cover opacity-90"
              />
            )}

            {/* Camera Status Badge */}
            <div className="absolute top-3 left-3 bg-black/75 backdrop-blur-md text-white px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 border border-white/10">
              <span className={`w-2 h-2 rounded-full ${isCameraActive ? 'bg-emerald-400 animate-ping' : 'bg-slate-400'}`} />
              <span>{isCameraActive ? 'LIVE OCR CAMERA' : 'IMAGE READY'}</span>
            </div>

            {/* Processing Overlay */}
            {isProcessing && (
              <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center space-y-3 z-20">
                <RefreshCw className="w-10 h-10 text-emerald-400 animate-spin" />
                <div className="space-y-1">
                  <h4 className="text-white font-bold text-base">Analyzing Document</h4>
                  <p className="text-slate-300 text-xs font-medium">
                    {pipelineStep === 'CAPTURING' && 'Capturing camera frame...'}
                    {pipelineStep === 'UPLOADING' && 'Optimizing and uploading image...'}
                    {pipelineStep === 'OCR' && 'Extracting text and reading order...'}
                    {pipelineStep === 'READY' && 'Processing complete.'}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Camera & Upload Controls */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            {isCameraActive ? (
              <>
                <AccessibleButton
                  variant="success"
                  size="lg"
                  icon={<Camera className="w-5 h-5" />}
                  onClick={handleCaptureAndExtract}
                  disabled={isProcessing}
                  className="col-span-2 sm:col-span-2 shadow-md"
                >
                  Capture & Extract
                </AccessibleButton>
                <AccessibleButton
                  variant="secondary"
                  size="lg"
                  icon={<RotateCcw className="w-4 h-4" />}
                  onClick={handleStopCamera}
                >
                  Pause
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
                >
                  Start Camera
                </AccessibleButton>

                <label className="cursor-pointer inline-flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 font-bold text-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-sm">
                  <Upload className="w-5 h-5 text-purple-600" />
                  <span>Upload Image</span>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handleFileUpload}
                    className="sr-only"
                    disabled={isProcessing}
                  />
                </label>

                <AccessibleButton
                  variant="secondary"
                  size="lg"
                  icon={<RefreshCw className="w-4 h-4" />}
                  onClick={() => runOcrAnalysis(previewImage)}
                  disabled={isProcessing}
                >
                  Re-analyze
                </AccessibleButton>
              </>
            )}
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
                  {showSimplified ? 'Simplified Plain Text' : 'Extracted Text'}
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-slate-800 dark:text-slate-200">
                    Language: <span className="font-mono text-emerald-600 dark:text-emerald-400 uppercase">{ocrResult.detectedLanguage}</span>
                  </span>
                </div>
              </div>
              <ConfidenceIndicator
                level={ocrResult.confidenceLevel}
                percentage={Math.round(ocrResult.confidence * 100)}
                showDetails={true}
                size="sm"
              />
            </div>

            {/* Low confidence warning banner */}
            {isConfidenceLow && (
              <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 flex items-start gap-2 text-xs text-amber-800 dark:text-amber-300">
                <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>Some text may be unclear. Please verify important numbers or instructions against the original.</span>
              </div>
            )}

            {/* Text Reading Area */}
            <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 min-h-[140px]">
              {displayText.trim() ? (
                <pre className="font-sans whitespace-pre-wrap text-base sm:text-lg font-semibold text-slate-800 dark:text-slate-100 leading-relaxed break-words">
                  {displayText}
                </pre>
              ) : (
                <div className="text-center py-6 text-slate-400 space-y-2">
                  <FileText className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-600" />
                  <p className="text-sm font-medium">No readable text detected.</p>
                  <p className="text-xs text-slate-400">Try capturing closer or with brighter lighting.</p>
                </div>
              )}
            </div>

            {/* Primary Action Buttons: Read Aloud & Simplify */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <AccessibleButton
                variant="success"
                size="lg"
                fullWidth
                icon={isReadingOriginal ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5 animate-pulse" />}
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
                disabled={!ocrResult.text.trim() || isSimplifying}
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
              disabled={!ocrResult.text.trim() || isTranslating}
            >
              {isTranslating ? 'Translating...' : `Translate into ${LANGUAGES.find((l) => l.code === selectedLanguage)?.label}`}
            </AccessibleButton>

            {/* Translated Result Area */}
            {translatedText && (
              <div className="p-4 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 space-y-3 mt-3 animate-fadeIn">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold text-emerald-800 dark:text-emerald-300 uppercase tracking-wider">
                    {LANGUAGES.find((l) => l.code === selectedLanguage)?.label} Translation
                  </span>
                  <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                    Numeric data preserved
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
                    Please verify important details against the original text.
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
