// Speech Service - Web Speech API (Synthesis & Recognition) with graceful fallbacks

export interface SpeechOptions {
  rate?: number;
  pitch?: number;
  lang?: string;
  onStart?: () => void;
  onEnd?: () => void;
  onError?: (err: unknown) => void;
}

// Browser recognition interface stub
interface IWindowSpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: (event: unknown) => void;
  onerror: (event: unknown) => void;
  onend: () => void;
  onstart: () => void;
}

class SpeechService {
  private synth: SpeechSynthesis | null = null;
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private recognition: IWindowSpeechRecognition | null = null;
  private isRecognizing: boolean = false;

  constructor() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      this.synth = window.speechSynthesis;
    }
  }

  isSpeechSynthesisSupported(): boolean {
    return typeof window !== 'undefined' && 'speechSynthesis' in window;
  }

  isSpeechRecognitionSupported(): boolean {
    if (typeof window === 'undefined') return false;
    return 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window;
  }

  // Speak text with accessibility tuning
  speak(text: string, options: SpeechOptions = {}) {
    if (!this.synth) {
      options.onEnd?.();
      return;
    }

    this.stop(); // Stop previous utterance

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = options.rate || 1.0;
    utterance.pitch = options.pitch || 1.0;
    utterance.lang = options.lang || 'en-US';

    utterance.onstart = () => {
      options.onStart?.();
    };

    utterance.onend = () => {
      this.currentUtterance = null;
      options.onEnd?.();
    };

    utterance.onerror = (e) => {
      console.warn('SpeechSynthesis error:', e);
      this.currentUtterance = null;
      options.onError?.(e);
    };

    this.currentUtterance = utterance;
    this.synth.speak(utterance);
  }

  stop() {
    if (this.synth) {
      this.synth.cancel();
      this.currentUtterance = null;
    }
  }

  isSpeaking(): boolean {
    return !!(this.synth && this.synth.speaking);
  }

  // Start speech recognition
  startListening(
    onResult: (transcript: string, isFinal: boolean) => void,
    onStateChange: (state: 'started' | 'stopped' | 'error', errorMsg?: string) => void,
    lang: string = 'en-US'
  ): boolean {
    if (!this.isSpeechRecognitionSupported()) {
      onStateChange('error', 'Speech recognition not supported in this browser. Demo mode active.');
      return false;
    }

    try {
      const SpeechRecognitionConstructor =
        (window as unknown as { SpeechRecognition?: new () => IWindowSpeechRecognition }).SpeechRecognition ||
        (window as unknown as { webkitSpeechRecognition?: new () => IWindowSpeechRecognition }).webkitSpeechRecognition;

      if (!SpeechRecognitionConstructor) return false;

      this.recognition = new SpeechRecognitionConstructor();
      this.recognition.continuous = false;
      this.recognition.interimResults = true;
      this.recognition.lang = lang;

      this.recognition.onstart = () => {
        this.isRecognizing = true;
        onStateChange('started');
      };

      this.recognition.onresult = (event: unknown) => {
        const evt = event as {
          resultIndex: number;
          results: {
            length: number;
            [index: number]: {
              isFinal: boolean;
              0: { transcript: string };
            };
          };
        };

        let transcript = '';
        let isFinal = false;

        for (let i = evt.resultIndex; i < evt.results.length; ++i) {
          transcript += evt.results[i][0].transcript;
          if (evt.results[i].isFinal) {
            isFinal = true;
          }
        }

        onResult(transcript, isFinal);
      };

      this.recognition.onerror = (event: unknown) => {
        const evt = event as { error?: string };
        this.isRecognizing = false;
        onStateChange('error', evt.error || 'Speech recognition encountered an issue');
      };

      this.recognition.onend = () => {
        this.isRecognizing = false;
        onStateChange('stopped');
      };

      this.recognition.start();
      return true;
    } catch (err) {
      console.warn('Failed to start speech recognition:', err);
      onStateChange('error', 'Microphone unavailable. Demo mode active.');
      return false;
    }
  }

  stopListening() {
    if (this.recognition && this.isRecognizing) {
      try {
        this.recognition.stop();
      } catch {
        // Ignore
      }
      this.isRecognizing = false;
    }
  }
}

export const speechService = new SpeechService();
