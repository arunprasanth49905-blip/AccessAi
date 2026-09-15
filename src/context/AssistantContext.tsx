import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
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

export interface SharedAppContext {
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
  const [sharedContext, setSharedContext] = useState<SharedAppContext>({
    lastSceneContext: null,
    lastOcrContext: null,
    activeNavigationContext: null,
  });

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

  const hasCheckedRef = useRef(false);

  useEffect(() => {
    if (!hasCheckedRef.current) {
      hasCheckedRef.current = true;
      checkConnection();
    }

    const intervalId = setInterval(checkConnection, 15000);

    const handleOnline = () => checkConnection();
    const handleOffline = () => setConnectionStatusState('offline');

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      clearInterval(intervalId);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [checkConnection]);

  const setConnectionStatus = (status: ConnectionStatus) => {
    setConnectionStatusState(status);
  };

  const updateSceneContext = (description: string, detectedObjects: string[] = []) => {
    setSharedContext((prev) => ({
      ...prev,
      lastSceneContext: {
        description,
        detectedObjects,
        timestamp: Date.now(),
      },
    }));
  };

  const updateOcrContext = (text: string, language: string) => {
    setSharedContext((prev) => ({
      ...prev,
      lastOcrContext: {
        text,
        language,
        timestamp: Date.now(),
      },
    }));
  };

  const updateNavigationContext = (destination: string, currentStep: string) => {
    setSharedContext((prev) => ({
      ...prev,
      activeNavigationContext: {
        destination,
        currentStep,
      },
    }));
  };

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
