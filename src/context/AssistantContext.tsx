import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { AssistanceHistoryItem, ConnectionStatus } from '../types';
import { audioFeedback } from '../services/audioFeedbackService';
import { speechService } from '../services/speechService';
import { apiService, BackendHealthResponse } from '../services/apiService';
import { useAccessibility } from './AccessibilityContext';

export interface ToastMessage {
  id: string;
  title: string;
  description?: string;
  type: 'info' | 'success' | 'warning' | 'alert';
}

export interface VisionContextData {
  description: string;
  detectedObjects: string[];
  riskDetected: boolean;
  safetyMessage: string;
  confidence: number;
  confidenceLevel: 'high' | 'medium' | 'low';
  capturedAt: number;
}

export interface OcrContextData {
  text: string;
  detectedLanguage: string;
  confidence: number;
  confidenceLevel: 'high' | 'medium' | 'low';
  simplifiedText?: string;
  translatedText?: string;
  targetLanguage?: string;
  capturedAt: number;
}

export interface NavigationContextData {
  destination: string;
  currentStep: string;
  nextStep?: string;
  distanceToNext?: string;
  distanceRemaining?: string;
  isOffRoute?: boolean;
  routeSource?: string;
  accuracyLevel?: string;
  status?: string;
  stepFree: boolean;
  updatedAt: number;
}

export interface SafetyContextData {
  activeWarnings: string[];
  latestRisk: string | null;
  riskDetected: boolean;
  updatedAt: number;
}

export interface SharedAppContext {
  sessionId: string;
  currentFeature: 'camera' | 'reader' | 'voice' | 'navigation' | 'safety' | 'settings';
  currentPage: string;
  vision: VisionContextData | null;
  ocr: OcrContextData | null;
  navigation: NavigationContextData | null;
  safety: SafetyContextData;
  lastInteraction: number;

  // Backwards compatibility aliases
  lastSceneContext: { description: string; detectedObjects: string[]; timestamp: number } | null;
  lastOcrContext: { text: string; language: string; timestamp: number } | null;
  activeNavigationContext: { destination: string; currentStep: string } | null;
}

interface AssistantContextType {
  connectionStatus: ConnectionStatus;
  healthDetails: BackendHealthResponse | null;
  setConnectionStatus: (status: ConnectionStatus) => void;
  checkConnection: () => Promise<void>;
  recentAssistance: AssistanceHistoryItem[];
  addAssistanceItem: (item: Omit<AssistanceHistoryItem, 'id' | 'timestamp' | 'relativeTime'>) => void;
  clearHistory: () => void;
  sharedContext: SharedAppContext;
  updateVisionResult: (result: { description: string; objects: Array<{ label: string }>; safety?: { riskDetected: boolean; message: string }; confidence?: number; confidenceLevel?: 'high' | 'medium' | 'low' }) => void;
  updateOcrResult: (text: string, language: string, options?: { simplifiedText?: string; translatedText?: string; targetLanguage?: string; confidence?: number; confidenceLevel?: 'high' | 'medium' | 'low' }) => void;
  updateNavigationState: (
    destination: string,
    currentStep: string,
    options?: {
      stepFree?: boolean;
      distanceRemaining?: string;
      nextStep?: string;
      distanceToNext?: string;
      isOffRoute?: boolean;
      routeSource?: string;
      accuracyLevel?: string;
      status?: string;
    }
  ) => void;
  updateSafetyState: (riskDetected: boolean, message?: string, warning?: string) => void;
  clearFeatureContext: (feature: 'vision' | 'ocr' | 'navigation' | 'safety') => void;
  clearSessionContext: () => void;
  setCurrentFeature: (feature: 'camera' | 'reader' | 'voice' | 'navigation' | 'safety' | 'settings', page?: string) => void;
  // Legacy aliases
  updateSceneContext: (description: string, detectedObjects?: string[]) => void;
  updateOcrContext: (text: string, language: string) => void;
  updateNavigationContext: (destination: string, currentStep: string) => void;
  toasts: ToastMessage[];
  showToast: (title: string, description?: string, type?: 'info' | 'success' | 'warning' | 'alert') => void;
  dismissToast: (id: string) => void;
  isEmergencyModalOpen: boolean;
  openEmergencyModal: () => void;
  closeEmergencyModal: () => void;
}

const HISTORY_STORAGE_KEY = 'accessai_history_v1';

const AssistantContext = createContext<AssistantContextType | undefined>(undefined);

let toastCounter = 0;

export const AssistantProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { settings } = useAccessibility();
  const [connectionStatus, setConnectionStatusState] = useState<ConnectionStatus>('limited');
  const [healthDetails, setHealthDetails] = useState<BackendHealthResponse | null>(null);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [isEmergencyModalOpen, setIsEmergencyModalOpen] = useState(false);

  // Shared Cross-Feature Context (Camera -> OCR -> Voice -> Navigation)
  const [sharedContext, setSharedContext] = useState<SharedAppContext>(() => ({
    sessionId: `session_${Date.now()}`,
    currentFeature: 'voice',
    currentPage: '/voice',
    vision: null,
    ocr: null,
    navigation: null,
    safety: {
      activeWarnings: [],
      latestRisk: null,
      riskDetected: false,
      updatedAt: null,
    },
    lastInteraction: Date.now(),
    lastSceneContext: null,
    lastOcrContext: null,
    activeNavigationContext: null,
  }));

  // Assistance History - ONLY real stored interactions from local storage
  const [recentAssistance, setRecentAssistance] = useState<AssistanceHistoryItem[]>(() => {
    try {
      const stored = localStorage.getItem(HISTORY_STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch {
      // Fallback
    }
    return [];
  });

  useEffect(() => {
    try {
      localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(recentAssistance));
    } catch {
      // Ignore storage errors
    }
  }, [recentAssistance]);

  // Real connection status verifier
  const checkConnection = useCallback(async () => {
    try {
      const health = await apiService.getHealthDetails();
      if (health && health.status === 'ok') {
        setHealthDetails(health);
        if (health.ai?.configured) {
          setConnectionStatusState('connected');
        } else {
          setConnectionStatusState('limited');
        }
      } else {
        setHealthDetails(null);
        setConnectionStatusState('offline');
      }
    } catch {
      setHealthDetails(null);
      setConnectionStatusState('offline');
    }
  }, []);

  useEffect(() => {
    checkConnection();
    // Fast retries on initial mount in case server is booting
    const timer1 = setTimeout(checkConnection, 1200);
    const timer2 = setTimeout(checkConnection, 3500);

    const intervalId = setInterval(checkConnection, 12000);

    const handleOnline = () => checkConnection();
    const handleOffline = () => setConnectionStatusState('offline');

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearInterval(intervalId);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [checkConnection]);

  const setConnectionStatus = (status: ConnectionStatus) => {
    setConnectionStatusState(status);
  };

  const updateVisionResult = useCallback((result: {
    description: string;
    objects: Array<{ label: string }>;
    safety?: { riskDetected: boolean; message: string };
    confidence?: number;
    confidenceLevel?: 'high' | 'medium' | 'low';
  }) => {
    const timestamp = Date.now();
    const visionData: VisionContextData = {
      description: result.description,
      detectedObjects: result.objects.map((o) => o.label),
      riskDetected: Boolean(result.safety?.riskDetected),
      safetyMessage: result.safety?.message || '',
      confidence: result.confidence || 0.9,
      confidenceLevel: result.confidenceLevel || 'high',
      capturedAt: timestamp,
    };

    setSharedContext((prev) => ({
      ...prev,
      vision: visionData,
      lastInteraction: timestamp,
      lastSceneContext: {
        description: result.description,
        detectedObjects: visionData.detectedObjects,
        timestamp,
      },
      safety: result.safety?.riskDetected
        ? {
            activeWarnings: Array.from(new Set([...prev.safety.activeWarnings, result.safety.message])),
            latestRisk: result.safety.message,
            riskDetected: true,
            updatedAt: timestamp,
          }
        : prev.safety,
    }));
  }, []);

  const updateOcrResult = useCallback((
    text: string,
    language: string,
    options?: {
      simplifiedText?: string;
      translatedText?: string;
      targetLanguage?: string;
      confidence?: number;
      confidenceLevel?: 'high' | 'medium' | 'low';
    }
  ) => {
    const timestamp = Date.now();
    const ocrData: OcrContextData = {
      text,
      detectedLanguage: language,
      confidence: options?.confidence || 0.92,
      confidenceLevel: options?.confidenceLevel || 'high',
      simplifiedText: options?.simplifiedText,
      translatedText: options?.translatedText,
      targetLanguage: options?.targetLanguage,
      capturedAt: timestamp,
    };

    setSharedContext((prev) => ({
      ...prev,
      ocr: ocrData,
      lastInteraction: timestamp,
      lastOcrContext: {
        text,
        language,
        timestamp,
      },
    }));
  }, []);

  const updateNavigationState = useCallback((
    destination: string,
    currentStep: string,
    options?: {
      stepFree?: boolean;
      distanceRemaining?: string;
      nextStep?: string;
      distanceToNext?: string;
      isOffRoute?: boolean;
      routeSource?: string;
      accuracyLevel?: string;
      status?: string;
    }
  ) => {
    const timestamp = Date.now();
    const navData: NavigationContextData = {
      destination,
      currentStep,
      nextStep: options?.nextStep,
      distanceToNext: options?.distanceToNext,
      distanceRemaining: options?.distanceRemaining,
      isOffRoute: options?.isOffRoute,
      routeSource: options?.routeSource,
      accuracyLevel: options?.accuracyLevel,
      status: options?.status,
      stepFree: options?.stepFree ?? true,
      updatedAt: timestamp,
    };

    setSharedContext((prev) => ({
      ...prev,
      navigation: navData,
      lastInteraction: timestamp,
      activeNavigationContext: {
        destination,
        currentStep,
      },
    }));
  }, []);

  const updateSafetyState = useCallback((riskDetected: boolean, message?: string, warning?: string) => {
    const timestamp = Date.now();
    setSharedContext((prev) => ({
      ...prev,
      safety: {
        activeWarnings: warning
          ? Array.from(new Set([...prev.safety.activeWarnings, warning]))
          : prev.safety.activeWarnings,
        latestRisk: message || prev.safety.latestRisk,
        riskDetected,
        updatedAt: timestamp,
      },
      lastInteraction: timestamp,
    }));
  }, []);

  const clearFeatureContext = useCallback((feature: 'vision' | 'ocr' | 'navigation' | 'safety') => {
    setSharedContext((prev) => {
      switch (feature) {
        case 'vision':
          return { ...prev, vision: null, lastSceneContext: null };
        case 'ocr':
          return { ...prev, ocr: null, lastOcrContext: null };
        case 'navigation':
          return { ...prev, navigation: null, activeNavigationContext: null };
        case 'safety':
          return {
            ...prev,
            safety: { activeWarnings: [], latestRisk: null, riskDetected: false, updatedAt: Date.now() },
          };
      }
    });
  }, []);

  const clearSessionContext = useCallback(() => {
    setSharedContext({
      sessionId: `session_${Date.now()}`,
      currentFeature: 'voice',
      currentPage: '/voice',
      vision: null,
      ocr: null,
      navigation: null,
      safety: { activeWarnings: [], latestRisk: null, riskDetected: false, updatedAt: null },
      lastInteraction: Date.now(),
      lastSceneContext: null,
      lastOcrContext: null,
      activeNavigationContext: null,
    });
  }, []);

  const setCurrentFeature = useCallback((feature: 'camera' | 'reader' | 'voice' | 'navigation' | 'safety' | 'settings', page?: string) => {
    setSharedContext((prev) => ({
      ...prev,
      currentFeature: feature,
      currentPage: page || `/${feature}`,
      lastInteraction: Date.now(),
    }));
  }, []);

  // Backwards compatibility legacy wrappers
  const updateSceneContext = useCallback((description: string, detectedObjects: string[] = []) => {
    updateVisionResult({
      description,
      objects: detectedObjects.map((label) => ({ label })),
    });
  }, [updateVisionResult]);

  const updateOcrContext = useCallback((text: string, language: string) => {
    updateOcrResult(text, language);
  }, [updateOcrResult]);

  const updateNavigationContext = useCallback((destination: string, currentStep: string) => {
    updateNavigationState(destination, currentStep);
  }, [updateNavigationState]);

  const showToast = (title: string, description?: string, type: 'info' | 'success' | 'warning' | 'alert' = 'info') => {
    toastCounter++;
    const id = `toast-${Date.now()}-${toastCounter}`;
    setToasts((prev) => [...prev, { id, title, description, type }]);

    if (type === 'warning' || type === 'alert') {
      audioFeedback.playAlert();
    } else if (type === 'success') {
      audioFeedback.playSuccess();
    } else {
      audioFeedback.playClick();
    }

    if (settings.voiceGuidance && settings.autoReadAloud) {
      speechService.speak(`${title}. ${description || ''}`);
    }

    setTimeout(() => {
      dismissToast(id);
    }, 4000);
  };

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const addAssistanceItem = (item: Omit<AssistanceHistoryItem, 'id' | 'timestamp' | 'relativeTime'>) => {
    const newItem: AssistanceHistoryItem = {
      ...item,
      id: `h-${Date.now()}-${++toastCounter}`,
      timestamp: new Date().toISOString(),
      relativeTime: 'Just now',
    };
    setRecentAssistance((prev) => [newItem, ...prev.slice(0, 29)]);
  };

  const clearHistory = () => {
    audioFeedback.playClick();
    setRecentAssistance([]);
    try {
      localStorage.removeItem(HISTORY_STORAGE_KEY);
    } catch {
      // Ignore
    }
  };

  const openEmergencyModal = () => {
    audioFeedback.playAlert();
    setIsEmergencyModalOpen(true);
  };

  const closeEmergencyModal = () => {
    setIsEmergencyModalOpen(false);
  };

  return (
    <AssistantContext.Provider
      value={{
        connectionStatus,
        healthDetails,
        setConnectionStatus,
        checkConnection,
        recentAssistance,
        addAssistanceItem,
        clearHistory,
        sharedContext,
        updateVisionResult,
        updateOcrResult,
        updateNavigationState,
        updateSafetyState,
        clearFeatureContext,
        clearSessionContext,
        setCurrentFeature,
        updateSceneContext,
        updateOcrContext,
        updateNavigationContext,
        toasts,
        showToast,
        dismissToast,
        isEmergencyModalOpen,
        openEmergencyModal,
        closeEmergencyModal,
      }}
    >
      {children}
    </AssistantContext.Provider>
  );
};

export const useAssistant = () => {
  const context = useContext(AssistantContext);
  if (!context) {
    throw new Error('useAssistant must be used within an AssistantProvider');
  }
  return context;
};
