import React, { useState, useEffect, useRef } from 'react';
import {
  Mic,
  MicOff,
  VolumeX,
  Copy,
  RotateCcw,
  Send,
  AlertTriangle,
  Check,
  Radio,
  Server,
  AlertCircle,
} from 'lucide-react';
import { PageContainer } from '../components/layout/PageContainer';
import { AccessibleButton } from '../components/common/AccessibleButton';
import { VoiceWaveform } from '../components/common/VoiceWaveform';
import { ConfidenceIndicator } from '../components/common/ConfidenceIndicator';
import { speechService } from '../services/speechService';
import { aiAssistantService } from '../services/aiAssistantService';
import { apiService } from '../services/apiService';
import { audioFeedback } from '../services/audioFeedbackService';
import { useAssistant } from '../context/AssistantContext';
import { useAccessibility } from '../context/AccessibilityContext';
import { VoiceState, ChatMessage } from '../types';

export const VoiceAssistantPage: React.FC = () => {
  const { showToast, addAssistanceItem } = useAssistant();
  const { settings } = useAccessibility();

  const [voiceState, setVoiceState] = useState<VoiceState>('idle');
  const [messages, setMessages] = useState<ChatMessage[]>(() => aiAssistantService.getInitialMessages());
  const [inputText, setInputText] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isBackendConnected, setIsBackendConnected] = useState<boolean | null>(null);
  const [isMicAvailable, setIsMicAvailable] = useState(true);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, voiceState]);

  // Initial check of backend health
  useEffect(() => {
    let mounted = true;
    apiService.checkHealth().then((healthy) => {
      if (mounted) {
        setIsBackendConnected(healthy);
      }
    });
    return () => {
      mounted = false;
    };
  }, []);

  // Voice State labels
  const stateLabels: Record<VoiceState, { label: string; sub: string }> = {
    idle: { label: 'Tap to speak', sub: 'Ask about your surroundings, signs, or directions' },
    listening: { label: 'Listening...', sub: 'Speak clearly into your microphone' },
    processing: { label: 'Understanding...', sub: 'AccessAI multimodal engine reasoning' },
    responding: { label: 'AccessAI is responding...', sub: 'Synthesizing voice and spatial assistance' },
  };

  // Toggle speech recognition
  const handleToggleListening = () => {
    if (voiceState === 'listening') {
      speechService.stopListening();
      setVoiceState('idle');
      audioFeedback.playClick();
      return;
    }

    if (voiceState === 'responding') {
      speechService.stop();
      setVoiceState('idle');
      return;
    }

    audioFeedback.playChime();
    setVoiceState('listening');
    setInterimTranscript('');

    const started = speechService.startListening(
      (transcript, isFinal) => {
        setInterimTranscript(transcript);
        if (isFinal && transcript.trim()) {
          handleSendQuery(transcript);
        }
      },
      (state, errMsg) => {
        if (state === 'error') {
          setIsMicAvailable(false);
          showToast('Voice Input Notice', errMsg || 'Voice input unavailable. Use text or sample prompts.', 'info');
          setVoiceState('idle');
        } else if (state === 'stopped') {
          setVoiceState((prev) => (prev === 'listening' ? 'idle' : prev));
        }
      }
    );

    if (!started) {
      setIsMicAvailable(false);
      showToast('Voice input unavailable', 'Please use text or the sample prompts below.', 'info');
      setVoiceState('idle');
    }
  };

  // Send user query (via voice transcript, text box, or prompt chip)
  const handleSendQuery = async (queryText: string) => {
    if (!queryText.trim()) return;

    speechService.stopListening();
    setInterimTranscript('');
    setVoiceState('processing');

    const userMsg: ChatMessage = {
      id: `usr-${Date.now()}`,
      sender: 'user',
      text: queryText,
      timestamp: 'Just now',
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText('');

    let aiAnswer = '';
    let confidenceLevel: 'high' | 'medium' | 'low' = 'high';
    let safetyWarning = false;

    try {
      // Send to the Express Backend API
      const conversationHistory = messages.map((m) => ({
        sender: m.sender,
        text: m.text,
      }));

      const backendResponse = await apiService.sendVoiceChat({
        text: queryText,
        context: {
          currentPage: 'voice',
          currentScene: null,
        },
        accessibilityProfile: {
          textSize: settings.textSize,
          simplifiedMode: settings.simplifiedMode,
          voiceGuidance: settings.voiceGuidance,
          language: settings.language,
        },
        conversation: conversationHistory,
      });

      aiAnswer = backendResponse.answer;
      confidenceLevel = backendResponse.confidenceLevel;
      safetyWarning = backendResponse.safetyWarning;
      setIsBackendConnected(true);
    } catch {
      // Backend unavailable or network error: fall back to local deterministic engine
      setIsBackendConnected(false);
      const localResult = await aiAssistantService.processUserQuery(queryText);
      aiAnswer = localResult.text;
      confidenceLevel = localResult.confidence || 'high';
      safetyWarning = Boolean(localResult.safetyWarning);
    }

    const aiMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      sender: 'assistant',
      text: aiAnswer,
      timestamp: 'Just now',
      confidence: confidenceLevel,
      safetyWarning: safetyWarning
        ? 'Medium confidence. Please verify before moving.'
        : undefined,
      suggestedFollowUps: [
        "What can you do?",
        "What should I be careful about?",
        "Help me navigate",
        "What is around me?",
      ],
    };

    setVoiceState('responding');
    setMessages((prev) => [...prev, aiMsg]);

    // Record assistance item
    addAssistanceItem({
      type: 'voice',
      title: `Voice: "${queryText}"`,
      summary: aiAnswer,
      confidence: confidenceLevel,
      actionUrl: '/voice',
    });

    // Voice response
    if (settings.voiceGuidance) {
      speechService.speak(aiAnswer, {
        rate: settings.speechSpeed,
        pitch: settings.speechPitch,
        onEnd: () => {
          setVoiceState('idle');
        },
        onError: () => {
          setVoiceState('idle');
        },
      });
    } else {
      setTimeout(() => {
        setVoiceState('idle');
      }, 1500);
    }
  };

  // Repeat last AI message
  const handleRepeat = (text: string) => {
    audioFeedback.playChime();
    setVoiceState('responding');
    speechService.speak(text, {
      rate: settings.speechSpeed,
      onEnd: () => setVoiceState('idle'),
      onError: () => setVoiceState('idle'),
    });
  };

  // Stop speaking
  const handleStopSpeaking = () => {
    speechService.stop();
    setVoiceState('idle');
    audioFeedback.playClick();
  };

  // Copy message text
  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    audioFeedback.playClick();
    showToast('Copied to Clipboard', 'Text copied successfully.', 'success');
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <PageContainer maxWidth="lg" className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-50 dark:bg-purple-950/70 border border-purple-200 dark:border-purple-800 text-purple-700 dark:text-purple-300 text-xs font-bold mb-1">
            <Radio className="w-3.5 h-3.5" />
            <span>TALK • Real Multimodal Voice Assistant</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-100">
            Voice Companion
          </h2>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Subtle Backend Status indicator */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border shadow-sm bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
            <Server className="w-3.5 h-3.5 text-slate-500" />
            {isBackendConnected === false ? (
              <span className="text-amber-600 dark:text-amber-400 font-bold">Demo Mode</span>
            ) : (
              <span className="text-emerald-600 dark:text-emerald-400 font-bold">Live Backend</span>
            )}
          </div>

          {voiceState === 'responding' && (
            <AccessibleButton
              variant="outline"
              size="sm"
              icon={<VolumeX className="w-4 h-4 text-red-500" />}
              onClick={handleStopSpeaking}
            >
              Stop Voice
            </AccessibleButton>
          )}
        </div>
      </div>

      {/* Voice Interaction Central Stage */}
      <div className="rounded-3xl p-6 sm:p-8 bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 shadow-xl text-center space-y-6">
        {/* State Label */}
        <div>
          <div className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100 mb-1">
            {stateLabels[voiceState].label}
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            {interimTranscript ? `"${interimTranscript}"` : stateLabels[voiceState].sub}
          </p>
        </div>

        {/* Dynamic Voice Waveform */}
        <VoiceWaveform state={voiceState} height={85} />

        {/* Big Central Tactile Microphone Button */}
        <div className="flex items-center justify-center">
          <button
            type="button"
            onClick={handleToggleListening}
            aria-label={voiceState === 'listening' ? 'Stop listening' : 'Tap to speak to AccessAI'}
            className={`
              w-24 h-24 sm:w-28 sm:h-28 rounded-full flex items-center justify-center transition-all duration-300 shadow-xl focus-visible:ring-4 focus-visible:ring-brand-500
              ${
                voiceState === 'listening'
                  ? 'bg-red-600 text-white animate-pulse scale-105 shadow-red-500/40'
                  : voiceState === 'processing'
                  ? 'bg-purple-600 text-white animate-bounce shadow-purple-500/40'
                  : voiceState === 'responding'
                  ? 'bg-emerald-600 text-white shadow-emerald-500/40'
                  : 'bg-brand-600 hover:bg-brand-700 text-white hover:scale-105 shadow-brand-500/30'
              }
            `}
          >
            {voiceState === 'listening' ? (
              <MicOff className="w-10 h-10 sm:w-12 sm:h-12" />
            ) : (
              <Mic className="w-10 h-10 sm:w-12 sm:h-12" />
            )}
          </button>
        </div>

        {/* Microphone Fallback Notice if unavailable */}
        {!isMicAvailable && (
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 dark:bg-amber-950/50 border border-amber-300 dark:border-amber-800 text-amber-800 dark:text-amber-200 text-xs font-semibold">
            <AlertCircle className="w-3.5 h-3.5" />
            <span>Voice input unavailable — please select a sample prompt or type below</span>
          </div>
        )}

        {/* Suggested Quick Conversational Prompts (routes through POST /api/voice/chat) */}
        <div className="pt-2">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-2">
            Try Asking AccessAI:
          </span>
          <div className="flex flex-wrap items-center justify-center gap-2">
            {[
              "What can you do?",
              "What should I be careful about?",
              "Help me navigate.",
              "What is around me?",
            ].map((prompt) => (
              <button
                key={prompt}
                onClick={() => handleSendQuery(prompt)}
                disabled={voiceState === 'processing'}
                className="px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 transition-colors border border-slate-200 dark:border-slate-700"
              >
                {prompt}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Conversation History Feed */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Radio className="w-4 h-4 text-brand-600" />
            <span>Conversation Transcript</span>
          </h3>
          <span className="text-xs text-slate-400 font-mono">
            {messages.length} messages
          </span>
        </div>

        <div className="space-y-3">
          {messages.map((msg) => {
            const isAI = msg.sender === 'assistant';

            return (
              <div
                key={msg.id}
                className={`p-4 sm:p-5 rounded-3xl border transition-all ${
                  isAI
                    ? 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm'
                    : 'bg-brand-50 dark:bg-brand-950/50 border-brand-200 dark:border-brand-800 text-brand-950 dark:text-brand-100 ml-4 sm:ml-12'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                      {isAI ? 'AccessAI' : 'You'}
                    </span>
                    <span className="text-xs text-slate-400">• {msg.timestamp}</span>
                  </div>

                  {isAI && msg.confidence && (
                    <ConfidenceIndicator level={msg.confidence} showDetails={false} size="sm" />
                  )}
                </div>

                <p className="text-sm sm:text-base font-medium leading-relaxed mb-3">
                  {msg.text}
                </p>

                {/* Safety Warning if present */}
                {msg.safetyWarning && (
                  <div className="mb-3 p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/50 border border-amber-300 dark:border-amber-800 text-xs font-semibold text-amber-900 dark:text-amber-200 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600" />
                    <span>{msg.safetyWarning}</span>
                  </div>
                )}

                {/* Follow-up suggestion chips */}
                {msg.suggestedFollowUps && msg.suggestedFollowUps.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1 border-t border-slate-100 dark:border-slate-800 mt-2">
                    {msg.suggestedFollowUps.map((fu) => (
                      <button
                        key={fu}
                        onClick={() => handleSendQuery(fu)}
                        className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-brand-100 text-slate-700 dark:text-slate-300 transition-colors"
                      >
                        ↳ {fu}
                      </button>
                    ))}
                  </div>
                )}

                {/* AI Message Action Controls */}
                {isAI && (
                  <div className="flex items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 mt-2 text-xs">
                    <button
                      type="button"
                      onClick={() => handleRepeat(msg.text)}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 font-medium"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Repeat</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleCopy(msg.id, msg.text)}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 font-medium"
                    >
                      {copiedId === msg.id ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedId === msg.id ? 'Copied' : 'Copy'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleSendQuery(msg.text)}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-brand-600 dark:text-brand-400 font-medium ml-auto"
                    >
                      <span>Ask again</span>
                    </button>
                  </div>
                )}
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>

        {/* Text Input Fallback (Requirement 13) */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendQuery(inputText);
          }}
          className="flex items-center gap-2 pt-2"
        >
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Ask AccessAI..."
            className="flex-1 px-4 py-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 shadow-sm"
          />
          <AccessibleButton
            type="submit"
            variant="primary"
            size="md"
            icon={<Send className="w-4 h-4" />}
            disabled={!inputText.trim() || voiceState === 'processing'}
          >
            Send
          </AccessibleButton>
        </form>
      </div>
    </PageContainer>
  );
};
