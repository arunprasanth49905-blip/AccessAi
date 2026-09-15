// Accessibility Types
export type TextSize = 'small' | 'medium' | 'large' | 'xlarge';
export type ContrastMode = 'standard' | 'high-dark' | 'high-light';
export type ThemeMode = 'light' | 'dark' | 'system';
export type LanguageCode = 'en' | 'ta' | 'hi' | 'ml' | 'te';
export type AIResponseVerbosity = 'concise' | 'normal' | 'detailed' | 'simple';

export interface AccessibilitySettings {
  textSize: TextSize;
  contrastMode: ContrastMode;
  theme: ThemeMode;
  language: LanguageCode;
  simplifiedMode: boolean;
  voiceGuidance: boolean;
  reducedMotion: boolean;
  hapticFeedback: boolean;
  autoReadAloud: boolean;
  speechSpeed: number; // 0.75, 1.0, 1.25, 1.5
  speechPitch: number;
  responseVerbosity: AIResponseVerbosity;
}

export interface AccessibilityProfile {
  // Vision
  largeText: boolean;
  highContrast: boolean;
  voiceDescriptions: boolean;
  autoRead: boolean;
  // Hearing
  liveCaptions: boolean;
  visualAlerts: boolean;
  textResponses: boolean;
  // Mobility
  avoidStairs: boolean;
  accessibleRoutesOnly: boolean;
  minimizeWalking: boolean;
  preferElevators: boolean;
  preferRamps: boolean;
  // Cognitive
  simplifiedLanguage: boolean;
  stepByStepInstructions: boolean;
  reducedInterfaceComplexity: boolean;
  // Communication
  voiceResponses: boolean;
  slowerSpeech: boolean;
  repeatInstructions: boolean;
}

// Camera & Vision Types
export interface DetectedObject {
  id: string;
  label: string;
  confidence: number; // 0 - 100
  box: {
    top: number;    // %
    left: number;   // %
    width: number;  // %
    height: number; // %
  };
  distanceMeters: number;
  direction: 'ahead' | 'left' | 'right' | 'below' | 'center';
  dangerLevel: 'safe' | 'caution' | 'warning';
  details?: string;
}

export interface CameraScene {
  id: string;
  name: string;
  description: string;
  category: 'indoor' | 'outdoor' | 'transit' | 'dining';
  imageUrl: string;
  detectedObjects: DetectedObject[];
  aiOverview: string;
  safetyAlert?: {
    type: 'warning' | 'caution';
    text: string;
    confidence: 'high' | 'medium' | 'low';
    verifiedNeeded: boolean;
  };
}

// Voice Assistant Types
export type VoiceState = 'idle' | 'listening' | 'processing' | 'responding';

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  confidence?: 'high' | 'medium' | 'low';
  safetyWarning?: string;
  suggestedFollowUps?: string[];
  source?: 'gemini' | 'vision' | 'ocr' | 'navigation' | 'conversation' | 'fallback';
  contextUsed?: {
    vision?: boolean;
    ocr?: boolean;
    navigation?: boolean;
    conversation?: boolean;
  };
}

// OCR & Text Reader Types
export interface OCRSegment {
  id: string;
  text: string;
  category: 'header' | 'instruction' | 'detail' | 'warning';
  box?: {
    top: number;
    left: number;
    width: number;
    height: number;
  };
}

export interface OCRSample {
  id: string;
  title: string;
  category: string;
  previewUrl: string;
  rawText: string;
  segments: OCRSegment[];
  translations: Record<LanguageCode, {
    title: string;
    text: string;
    spokenSummary: string;
  }>;
}

// Navigation Types
export type NavNodeType =
  | 'start'
  | 'ramp'
  | 'elevator'
  | 'door'
  | 'hallway'
  | 'destination'
  | 'turn-left'
  | 'turn-right'
  | 'continue'
  | 'crosswalk';

export interface NavStep {
  id: string;
  instruction: string;
  detail: string;
  nodeType: NavNodeType;
  distance: string;
  distanceMeters?: number;
  isAccessible: boolean;
  audioAnnouncement: string;
  streetName?: string;
  maneuver?: string;
  sequence?: number;
  location?: [number, number];
  accessibilityNotes?: string;
}

export type RouteSourceType = 'osrm-pedestrian' | 'accessible-routing-engine' | 'demo' | 'unknown';
export type RouteAccessibilityStatus = 'verified_step_free' | 'contains_stairs' | 'accessibility_unknown';

export interface AccessibleRoute {
  id: string;
  destination: string;
  destinationName?: string;
  originName?: string;
  originCoords?: { latitude: number; longitude: number };
  destinationCoords?: { latitude: number; longitude: number };
  distanceMeters: number;
  durationMinutes: number;
  stepFree: boolean;
  accessibilityStatus?: RouteAccessibilityStatus;
  accessibilityNotes?: string;
  steps: NavStep[];
  features: string[];
  tactilePaving: boolean;
  crowdLevel: 'low' | 'moderate' | 'busy';
  lighting: 'bright' | 'adequate';
  source?: RouteSourceType;
  geometry?: [number, number][];
  gpsAvailable?: boolean;
  disclaimer?: string;
}

// Safety Center Types
export interface SafetyAlertItem {
  id: string;
  title: string;
  description: string;
  confidence: 'high' | 'medium' | 'low';
  timeAgo: string;
  severity: 'low' | 'medium' | 'high';
  recommendation: string;
  verified: boolean;
}

export interface TrustedContact {
  name: string;
  relation: string;
  phone: string;
  email: string;
  isEmergencyAlertRecipient: boolean;
}

// Assistance History Log
export interface AssistanceHistoryItem {
  id: string;
  type: 'scene' | 'ocr' | 'voice' | 'navigation' | 'safety';
  title: string;
  summary: string;
  timestamp: string;
  relativeTime: string;
  confidence?: 'high' | 'medium' | 'low';
  actionUrl: string;
}

// Connection State
export type ConnectionStatus = 'connected' | 'limited' | 'offline';
