// Accessibility Service - Settings persistence and DOM attributes synchronizer
import { AccessibilitySettings, AccessibilityProfile } from '../types';

export const DEFAULT_SETTINGS: AccessibilitySettings = {
  textSize: 'medium',
  contrastMode: 'standard',
  theme: 'light',
  language: 'en',
  simplifiedMode: false,
  voiceGuidance: true,
  reducedMotion: false,
  hapticFeedback: true,
  autoReadAloud: false,
  speechSpeed: 1.0,
  speechPitch: 1.0,
  responseVerbosity: 'normal',
};

export const DEFAULT_PROFILE: AccessibilityProfile = {
  // Vision
  largeText: false,
  highContrast: false,
  voiceDescriptions: true,
  autoRead: false,
  // Hearing
  liveCaptions: true,
  visualAlerts: true,
  textResponses: true,
  // Mobility
  avoidStairs: true,
  accessibleRoutesOnly: true,
  minimizeWalking: false,
  preferElevators: true,
  preferRamps: true,
  // Cognitive
  simplifiedLanguage: false,
  stepByStepInstructions: true,
  reducedInterfaceComplexity: false,
  // Communication
  voiceResponses: true,
  slowerSpeech: false,
  repeatInstructions: false,
};

const SETTINGS_STORAGE_KEY = 'accessai_settings_v1';
const PROFILE_STORAGE_KEY = 'accessai_profile_v1';

class AccessibilityService {
  loadSettings(): AccessibilitySettings {
    try {
      const stored = localStorage.getItem(SETTINGS_STORAGE_KEY);
      if (stored) {
        return { ...DEFAULT_SETTINGS, ...JSON.parse(stored) };
      }
    } catch (e) {
      console.warn('Failed to load accessibility settings from localStorage', e);
    }
    return DEFAULT_SETTINGS;
  }

  saveSettings(settings: AccessibilitySettings) {
    try {
      localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
    } catch (e) {
      console.warn('Failed to save settings', e);
    }
    this.applyToDOM(settings);
  }

  loadProfile(): AccessibilityProfile {
    try {
      const stored = localStorage.getItem(PROFILE_STORAGE_KEY);
      if (stored) {
        return { ...DEFAULT_PROFILE, ...JSON.parse(stored) };
      }
    } catch (e) {
      console.warn('Failed to load profile from localStorage', e);
    }
    return DEFAULT_PROFILE;
  }

  saveProfile(profile: AccessibilityProfile) {
    try {
      localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profile));
    } catch (e) {
      console.warn('Failed to save profile', e);
    }
  }

  applyToDOM(settings: AccessibilitySettings) {
    if (typeof document === 'undefined') return;
    const root = document.documentElement;

    // Apply text size
    root.setAttribute('data-text-size', settings.textSize);

    // Apply contrast mode
    root.setAttribute('data-contrast', settings.contrastMode);

    // Apply dark/light theme
    root.setAttribute('data-theme', settings.theme);

    // Apply simplified mode
    root.setAttribute('data-simplified', settings.simplifiedMode ? 'true' : 'false');

    // Apply reduced motion
    root.setAttribute('data-reduced-motion', settings.reducedMotion ? 'true' : 'false');

    // Apply lang
    root.setAttribute('lang', settings.language);
  }
}

export const accessibilityService = new AccessibilityService();
