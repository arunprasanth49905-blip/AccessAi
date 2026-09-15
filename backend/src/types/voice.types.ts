import { z } from 'zod';

export const AccessibilityProfileSchema = z.object({
  textSize: z.enum(['small', 'medium', 'large', 'xlarge']).optional().default('medium'),
  simplifiedMode: z.boolean().optional().default(false),
  voiceGuidance: z.boolean().optional().default(true),
  language: z.enum(['en', 'ta', 'hi', 'ml', 'te']).optional().default('en'),
});

export type AccessibilityProfileInput = z.infer<typeof AccessibilityProfileSchema>;

export const VoiceContextSchema = z.object({
  currentPage: z.string().optional().default('voice'),
  currentScene: z.string().nullable().optional().default(null),
});

export type VoiceContext = z.infer<typeof VoiceContextSchema>;

export const ConversationMessageSchema = z.object({
  sender: z.enum(['user', 'assistant']),
  text: z.string(),
});

export type ConversationMessage = z.infer<typeof ConversationMessageSchema>;

export const VoiceChatRequestSchema = z.object({
  text: z.string().min(1, 'Text query cannot be empty'),
  context: VoiceContextSchema.optional().default({ currentPage: 'voice', currentScene: null }),
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
}
