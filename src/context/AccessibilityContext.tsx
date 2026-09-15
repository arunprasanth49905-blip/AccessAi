import React, { createContext, useContext, useState, useEffect } from 'react';
import { AccessibilitySettings, AccessibilityProfile, TextSize, ContrastMode, LanguageCode } from '../types';
import { accessibilityService, DEFAULT_SETTINGS, DEFAULT_PROFILE } from '../services/accessibilityService';
import { audioFeedback } from '../services/audioFeedbackService';

interface AccessibilityContextType {
  settings: AccessibilitySettings;
  profile: AccessibilityProfile;
  updateSettings: (partial: Partial<AccessibilitySettings>) => void;
  updateProfile: (partial: Partial<AccessibilityProfile>) => void;
  setTextSize: (size: TextSize) => void;
  setContrastMode: (mode: ContrastMode) => void;
  setLanguage: (lang: LanguageCode) => void;
  resetDefaults: () => void;
}

const AccessibilityContext = createContext<AccessibilityContextType | undefined>(undefined);

export const AccessibilityProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettingsState] = useState<AccessibilitySettings>(() => accessibilityService.loadSettings());
  const [profile, setProfileState] = useState<AccessibilityProfile>(() => accessibilityService.loadProfile());

  useEffect(() => {
    accessibilityService.applyToDOM(settings);
  }, [settings]);

  const updateSettings = (partial: Partial<AccessibilitySettings>) => {
    audioFeedback.playClick();
    setSettingsState((prev) => {
      const next = { ...prev, ...partial };
      accessibilityService.saveSettings(next);
      return next;
    });
  };

  const updateProfile = (partial: Partial<AccessibilityProfile>) => {
    audioFeedback.playClick();
    setProfileState((prev) => {
      const next = { ...prev, ...partial };
      accessibilityService.saveProfile(next);

      // Reflect profile toggles directly into active settings
      const settingsPatch: Partial<AccessibilitySettings> = {};
      if (partial.largeText !== undefined) {
        settingsPatch.textSize = partial.largeText ? 'xlarge' : 'medium';
      }
      if (partial.highContrast !== undefined) {
        settingsPatch.contrastMode = partial.highContrast ? 'high-dark' : 'standard';
      }
      if (partial.simplifiedLanguage !== undefined || partial.reducedInterfaceComplexity !== undefined) {
        settingsPatch.simplifiedMode = !!(partial.simplifiedLanguage || partial.reducedInterfaceComplexity);
      }
      if (partial.voiceDescriptions !== undefined || partial.voiceResponses !== undefined) {
        settingsPatch.voiceGuidance = !!(partial.voiceDescriptions || partial.voiceResponses);
      }
      if (Object.keys(settingsPatch).length > 0) {
        updateSettings(settingsPatch);
      }

      return next;
    });
  };

  const setTextSize = (textSize: TextSize) => updateSettings({ textSize });
  const setContrastMode = (contrastMode: ContrastMode) => updateSettings({ contrastMode });
  const setLanguage = (language: LanguageCode) => updateSettings({ language });

  const resetDefaults = () => {
    audioFeedback.playChime();
    setSettingsState(DEFAULT_SETTINGS);
    setProfileState(DEFAULT_PROFILE);
    accessibilityService.saveSettings(DEFAULT_SETTINGS);
    accessibilityService.saveProfile(DEFAULT_PROFILE);
  };

  return (
    <AccessibilityContext.Provider
      value={{
        settings,
        profile,
        updateSettings,
        updateProfile,
        setTextSize,
        setContrastMode,
        setLanguage,
        resetDefaults,
      }}
    >
      {children}
    </AccessibilityContext.Provider>
  );
};

export const useAccessibility = () => {
  const context = useContext(AccessibilityContext);
  if (!context) {
    throw new Error('useAccessibility must be used within an AccessibilityProvider');
  }
  return context;
};
