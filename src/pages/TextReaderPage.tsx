import React, { useState } from 'react';
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
} from 'lucide-react';
import { PageContainer } from '../components/layout/PageContainer';
import { AccessibleButton } from '../components/common/AccessibleButton';
import { ConfidenceIndicator } from '../components/common/ConfidenceIndicator';
import { ocrService, OCR_SAMPLES } from '../services/ocrService';
import { speechService } from '../services/speechService';
import { audioFeedback } from '../services/audioFeedbackService';
import { useAssistant } from '../context/AssistantContext';
import { useAccessibility } from '../context/AccessibilityContext';
import { OCRSample, LanguageCode } from '../types';

const LANGUAGES: { code: LanguageCode; label: string; native: string; speechCode: string }[] = [
  { code: 'en', label: 'English', native: 'English', speechCode: 'en-US' },
  { code: 'ta', label: 'Tamil', native: 'தமிழ்', speechCode: 'ta-IN' },
  { code: 'hi', label: 'Hindi', native: 'हिन्दी', speechCode: 'hi-IN' },
  { code: 'ml', label: 'Malayalam', native: 'മലയാളം', speechCode: 'ml-IN' },
  { code: 'te', label: 'Telugu', native: 'తెలుగు', speechCode: 'te-IN' },
];

export const TextReaderPage: React.FC = () => {
  const navigate = useNavigate();
  const { showToast, addAssistanceItem } = useAssistant();
  const { settings, setLanguage } = useAccessibility();

  const [samples] = useState<OCRSample[]>(() => ocrService.getSamples());
  const [currentSample, setCurrentSample] = useState<OCRSample>(() => OCR_SAMPLES[0]);
  const [selectedLanguage, setSelectedLanguage] = useState<LanguageCode>(settings.language || 'en');
  const [isReading, setIsReading] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [copied, setCopied] = useState(false);

  // Switch sample
  const handleSelectSample = (sample: OCRSample) => {
    audioFeedback.playClick();
    setCurrentSample(sample);
    setIsSaved(false);
    speechService.stop();
    setIsReading(false);
  };

  // Upload image handler
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    audioFeedback.playChime();
    showToast('Processing Uploaded Image', 'Extracting text and translating...', 'info');

    const result = await ocrService.simulateImageOCR(file);
    setCurrentSample(result);
    audioFeedback.playSuccess();
    showToast('OCR Complete', 'Text parsed and ready to read.', 'success');
  };

  // Read Aloud Primary Action
  const handleReadAloud = () => {
    if (isReading) {
      speechService.stop();
      setIsReading(false);
      audioFeedback.playClick();
      return;
    }

    const currentTranslation = currentSample.translations[selectedLanguage] || currentSample.translations.en;
    const textToSpeak = currentTranslation.spokenSummary || currentTranslation.text;

    const langObj = LANGUAGES.find((l) => l.code === selectedLanguage);

    audioFeedback.playChime();
    setIsReading(true);

    speechService.speak(textToSpeak, {
      rate: settings.speechSpeed,
      lang: langObj?.speechCode || 'en-US',
      onEnd: () => setIsReading(false),
      onError: () => setIsReading(false),
    });

    // Record assistance item
    addAssistanceItem({
      type: 'ocr',
      title: `OCR: ${currentSample.title}`,
      summary: textToSpeak,
      confidence: 'high',
      actionUrl: '/reader',
    });
  };

  // Copy text
  const handleCopyText = () => {
    const text = currentSample.translations[selectedLanguage]?.text || currentSample.rawText;
    navigator.clipboard.writeText(text);
    audioFeedback.playClick();
    setCopied(true);
    showToast('Copied to Clipboard', 'Extracted text is ready to paste.', 'success');
    setTimeout(() => setCopied(false), 2000);
  };

  // Save to saved reads
  const handleSaveText = () => {
    audioFeedback.playSuccess();
    setIsSaved(true);
    showToast('Saved to Offline Notes', 'You can review this reading anytime.', 'success');
  };

  const activeTranslation = currentSample.translations[selectedLanguage] || currentSample.translations.en;

  return (
    <PageContainer maxWidth="xl" className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/70 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs font-bold mb-1">
            <FileText className="w-3.5 h-3.5" />
            <span>READ • Optical Character Recognition (OCR)</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-100">
            Read Signs & Text
          </h2>
        </div>

        {/* Input Mode Switchers */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => navigate('/camera')}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-bold hover:bg-slate-50 transition-colors shadow-sm"
          >
            <Camera className="w-4 h-4 text-brand-600" />
            <span>Live Camera</span>
          </button>

          <label className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-bold hover:bg-slate-50 cursor-pointer transition-colors shadow-sm">
            <Upload className="w-4 h-4 text-purple-600" />
            <span>Upload Image</span>
            <input type="file" accept="image/*" onChange={handleFileUpload} className="sr-only" />
          </label>
        </div>
      </div>

      {/* Preset OCR Samples Bar */}
      <div className="space-y-2">
        <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
          <SlidersHorizontal className="w-3.5 h-3.5" />
          <span>Select Document / Sign Sample:</span>
        </label>
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          {samples.map((s) => (
            <button
              key={s.id}
              onClick={() => handleSelectSample(s)}
              className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold whitespace-nowrap transition-all border ${
                currentSample.id === s.id
                  ? 'bg-emerald-600 text-white border-emerald-500 shadow-sm font-bold'
                  : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:bg-slate-100'
              }`}
            >
              {s.title}
            </button>
          ))}
        </div>
      </div>

      {/* Language Selector Bar */}
      <div className="p-4 rounded-2xl bg-slate-100 dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300">
          <Languages className="w-4 h-4 text-emerald-600" />
          <span>Translate To:</span>
        </div>

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
                  ? 'bg-emerald-600 text-white border-emerald-500 shadow'
                  : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50'
              }`}
            >
              {lang.label} ({lang.native})
            </button>
          ))}
        </div>
      </div>

      {/* Main OCR Display Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Document Visual Preview with Bounding Box overlays */}
        <div className="lg:col-span-6 relative rounded-3xl overflow-hidden aspect-[4/3] bg-slate-900 border-2 border-slate-200 dark:border-slate-800 shadow-lg">
          <img
            src={currentSample.previewUrl}
            alt={currentSample.title}
            className="w-full h-full object-cover opacity-85"
          />

          {/* OCR text bounding boxes */}
          <div className="absolute inset-0 p-3 pointer-events-none" aria-hidden="true">
            {currentSample.segments.map((seg) => {
              if (!seg.box) return null;
              return (
                <div
                  key={seg.id}
                  className="absolute border-2 border-emerald-400 bg-emerald-500/20 rounded-lg flex items-center px-2 py-0.5 shadow-sm backdrop-blur-[1px]"
                  style={{
                    top: `${seg.box.top}%`,
                    left: `${seg.box.left}%`,
                    width: `${seg.box.width}%`,
                    height: `${seg.box.height}%`,
                  }}
                >
                  <span className="text-[10px] font-bold bg-black/80 text-emerald-300 px-1.5 py-0.5 rounded truncate">
                    {seg.text}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="absolute bottom-3 left-3 right-3 bg-black/80 backdrop-blur-md text-white p-3 rounded-2xl text-xs flex items-center justify-between">
            <span className="font-bold truncate">{currentSample.title}</span>
            <span className="font-mono text-emerald-400">High Resolution OCR</span>
          </div>
        </div>

        {/* Extracted Text & Translation Card */}
        <div className="lg:col-span-6 space-y-4">
          <div className="p-6 sm:p-7 rounded-3xl bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 shadow-xl space-y-5">
            <div className="flex items-center justify-between gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <span className="text-xs uppercase font-bold text-slate-400 block mb-0.5">
                  Extracted & Translated Text
                </span>
                <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                  {activeTranslation.title}
                </h3>
              </div>
              <ConfidenceIndicator level="high" percentage={98} showDetails={false} size="sm" />
            </div>

            {/* Extracted Text Content */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
              <pre className="font-sans whitespace-pre-wrap text-base sm:text-lg font-semibold text-slate-800 dark:text-slate-100 leading-relaxed">
                {activeTranslation.text}
              </pre>
            </div>

            {/* Large Primary Action: 🔊 READ ALOUD */}
            <div>
              <AccessibleButton
                variant="success"
                size="xl"
                fullWidth
                icon={isReading ? <VolumeX className="w-6 h-6" /> : <Volume2 className="w-6 h-6 animate-pulse" />}
                onClick={handleReadAloud}
                className="shadow-lg shadow-emerald-500/25"
              >
                {isReading ? 'Stop Reading' : '🔊 Read Aloud'}
              </AccessibleButton>
            </div>

            {/* Action Buttons: Copy, Save, Ask AI */}
            <div className="grid grid-cols-3 gap-2.5 pt-2">
              <AccessibleButton
                variant="secondary"
                size="md"
                icon={copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                onClick={handleCopyText}
              >
                {copied ? 'Copied' : 'Copy'}
              </AccessibleButton>

              <AccessibleButton
                variant="secondary"
                size="md"
                icon={isSaved ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <Bookmark className="w-4 h-4" />}
                onClick={handleSaveText}
              >
                {isSaved ? 'Saved' : 'Save'}
              </AccessibleButton>

              <AccessibleButton
                variant="secondary"
                size="md"
                icon={<Sparkles className="w-4 h-4 text-purple-600" />}
                onClick={() => navigate('/voice')}
              >
                Ask AI
              </AccessibleButton>
            </div>
          </div>
        </div>
      </div>
    </PageContainer>
  );
};
