import { z } from 'zod';

export const AccessibilityProfileSchema = z.object({
  textSize: z.enum(['small', 'medium', 'large', 'xlarge']).optional().default('medium'),
  simplifiedMode: z.boolean().optional().default(false),
  voiceGuidance: z.boolean().optional().default(true),
  language: z.enum(['en', 'ta', 'hi', 'ml', 'te']).optional().default('en'),
});

export type AccessibilityProfileInput = z.infer<typeof AccessibilityProfileSchema>;

export const VisionContextSummarySchema = z.object({
  description: z.string().optional(),
  detectedObjects: z.array(z.string()).optional().default([]),
  confidence: z.number().optional(),
  confidenceLevel: z.enum(['high', 'medium', 'low']).optional(),
  riskDetected: z.boolean().optional(),
  safetyMessage: z.string().optional(),
  timestamp: z.number().optional(),
});

export type VisionContextSummary = z.infer<typeof VisionContextSummarySchema>;

export const OcrContextSummarySchema = z.object({
  text: z.string().optional(),
  detectedLanguage: z.string().optional(),
  confidence: z.number().optional(),
  confidenceLevel: z.enum(['high', 'medium', 'low']).optional(),
  simplifiedText: z.string().optional(),
  translatedText: z.string().optional(),
  targetLanguage: z.string().optional(),
  timestamp: z.number().optional(),
});

export type OcrContextSummary = z.infer<typeof OcrContextSummarySchema>;

export const NavigationContextSummarySchema = z.object({
  destination: z.string().optional(),
  currentStep: z.string().optional(),
  stepFree: z.boolean().optional(),
  distanceRemaining: z.string().optional(),
  timestamp: z.number().optional(),
});

export type NavigationContextSummary = z.infer<typeof NavigationContextSummarySchema>;

export const SafetyContextSummarySchema = z.object({
  activeWarnings: z.array(z.string()).optional().default([]),
  latestRisk: z.string().optional(),
  riskDetected: z.boolean().optional().default(false),
  timestamp: z.number().optional(),
});

export type SafetyContextSummary = z.infer<typeof SafetyContextSummarySchema>;

export const VoiceContextSchema = z.object({
  currentPage: z.string().optional().default('voice'),
  currentFeature: z.enum(['camera', 'reader', 'voice', 'navigation', 'safety', 'settings']).optional().default('voice'),
  sessionId: z.string().optional(),
  currentScene: z.string().nullable().optional().default(null),
  lastOcrText: z.string().nullable().optional().default(null),
  activeRoute: z.string().nullable().optional().default(null),
  vision: VisionContextSummarySchema.optional(),
  ocr: OcrContextSummarySchema.optional(),
  navigation: NavigationContextSummarySchema.optional(),
  safety: SafetyContextSummarySchema.optional(),
  lastInteraction: z.number().optional(),
});

export type VoiceContext = z.infer<typeof VoiceContextSchema>;

export const ConversationMessageSchema = z.object({
  sender: z.enum(['user', 'assistant']),
  text: z.string(),
});

export type ConversationMessage = z.infer<typeof ConversationMessageSchema>;

export const VoiceChatRequestSchema = z.object({
  text: z.string().min(1, 'Text query cannot be empty'),
  context: VoiceContextSchema.optional().default({
    currentPage: 'voice',
    currentFeature: 'voice',
    currentScene: null,
    lastOcrText: null,
    activeRoute: null,
  }),
  accessibilityProfile: AccessibilityProfileSchema.optional().default({
    textSize: 'medium',
    simplifiedMode: false,
    voiceGuidance: true,
    language: 'en',
  }),
  conversation: z.array(ConversationMessageSchema).optional().default([]),
});

export type VoiceChatRequest = z.infer<typeof VoiceChatRequestSchema>;

export type ConfidenceLevel = 'high' | 'medium' | 'low';

export interface VoiceChatResponse {
  answer: string;
  confidence: number;
  confidenceLevel: ConfidenceLevel;
  safetyWarning: boolean;
  source: 'gemini' | 'vision' | 'ocr' | 'navigation' | 'conversation' | 'fallback';
  contextUsed?: {
    vision?: boolean;
    ocr?: boolean;
    navigation?: boolean;
    conversation?: boolean;
  };
  suggestedFollowUps?: string[];
}
