import React, { createContext, useContext, useState, useEffect } from 'react';
import { AssistanceHistoryItem, ConnectionStatus } from '../types';
import { audioFeedback } from '../services/audioFeedbackService';
import { speechService } from '../services/speechService';
import { useAccessibility } from './AccessibilityContext';

export interface ToastMessage {
  id: string;
  title: string;
  description?: string;
  type: 'info' | 'success' | 'warning' | 'alert';
}

interface AssistantContextType {
  connectionStatus: ConnectionStatus;
  setConnectionStatus: (status: ConnectionStatus) => void;
  recentAssistance: AssistanceHistoryItem[];
  addAssistanceItem: (item: Omit<AssistanceHistoryItem, 'id' | 'timestamp' | 'relativeTime'>) => void;
  toasts: ToastMessage[];
  showToast: (title: string, description?: string, type?: 'info' | 'success' | 'warning' | 'alert') => void;
  dismissToast: (id: string) => void;
  isEmergencyModalOpen: boolean;
  openEmergencyModal: () => void;
  closeEmergencyModal: () => void;
}

const INITIAL_HISTORY: AssistanceHistoryItem[] = [
  {
    id: 'h-1',
    type: 'scene',
    title: 'Scene described',
    summary: 'Detected doorway 3m ahead, chair on right, person approaching from left.',
    timestamp: new Date(Date.now() - 1000 * 60 * 18).toISOString(),
    relativeTime: '18 mins ago',
    confidence: 'high',
    actionUrl: '/camera',
  },
  {
    id: 'h-2',
    type: 'ocr',
    title: 'Restaurant menu read',
    summary: 'Read Artisan Cafe beverage list with allergen note for gluten-free options.',
    timestamp: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    relativeTime: '45 mins ago',
    confidence: 'high',
    actionUrl: '/reader',
  },
  {
    id: 'h-3',
    type: 'safety',
    title: 'Obstacle detected',
    summary: 'Identified low utility cart in central walking corridor (1.5m). Caution recommended.',
    timestamp: new Date(Date.now() - 1000 * 60 * 95).toISOString(),
    relativeTime: '1.5 hours ago',
    confidence: 'medium',
    actionUrl: '/camera',
  },
  {
    id: 'h-4',
    type: 'navigation',
    title: 'Accessible route created',
    summary: 'Guided 120m step-free route via East Wing Ramp to Ground Entrance.',
    timestamp: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
    relativeTime: '3 hours ago',
    confidence: 'high',
    actionUrl: '/navigation',
  },
];

const HISTORY_STORAGE_KEY = 'accessai_history_v1';

const AssistantContext = createContext<AssistantContextType | undefined>(undefined);

export const AssistantProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { settings } = useAccessibility();
  const [connectionStatus, setConnectionStatusState] = useState<ConnectionStatus>('connected');
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [isEmergencyModalOpen, setIsEmergencyModalOpen] = useState(false);

  const [recentAssistance, setRecentAssistance] = useState<AssistanceHistoryItem[]>(() => {
    try {
      const stored = localStorage.getItem(HISTORY_STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch {
      // Fallback
    }
    return INITIAL_HISTORY;
  });

  useEffect(() => {
    try {
      localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(recentAssistance));
    } catch {
      // Ignore
    }
  }, [recentAssistance]);

  const setConnectionStatus = (status: ConnectionStatus) => {
    setConnectionStatusState(status);
    if (status === 'offline') {
      showToast('Offline Mode Active', 'Using local computer vision & speech fallbacks.', 'warning');
      audioFeedback.playAlert();
    } else if (status === 'connected') {
      showToast('System Connected', 'Full multimodal AI assistance active.', 'success');
      audioFeedback.playSuccess();
    } else {
      showToast('Limited Connection', 'Reduced bandwidth profile engaged.', 'info');
      audioFeedback.playChime();
    }
  };

  const showToast = (title: string, description?: string, type: 'info' | 'success' | 'warning' | 'alert' = 'info') => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
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
      id: `h-${Date.now()}`,
      timestamp: new Date().toISOString(),
      relativeTime: 'Just now',
    };
    setRecentAssistance((prev) => [newItem, ...prev.slice(0, 19)]);
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
        setConnectionStatus,
        recentAssistance,
        addAssistanceItem,
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
