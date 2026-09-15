import { z } from 'zod';

export const OcrRegionSchema = z.object({
  text: z.string(),
  confidence: z.number().min(0).max(1),
  x: z.number().min(0).max(1),
  y: z.number().min(0).max(1),
  width: z.number().min(0).max(1),
  height: z.number().min(0).max(1),
});

export type OcrRegion = z.infer<typeof OcrRegionSchema>;

export const OcrConfidenceLevelSchema = z.enum(['high', 'medium', 'low']);
export type OcrConfidenceLevel = z.infer<typeof OcrConfidenceLevelSchema>;

export const OcrResultSchema = z.object({
  source: z.enum(['ai', 'demo']),
  text: z.string(),
  detectedLanguage: z.string(),
  confidence: z.number().min(0).max(1),
  confidenceLevel: OcrConfidenceLevelSchema,
  regions: z.array(OcrRegionSchema).default([]),
});

export type OcrResult = z.infer<typeof OcrResultSchema>;

export interface OcrExtractInput {
  imageBuffer?: Buffer;
  imageBase64?: string;
  mimeType?: string;
  sourceLanguage?: string;
  accessibilityProfile?: {
    textSize?: 'small' | 'medium' | 'large' | 'xlarge';
    contrast?: 'standard' | 'high';
    simplifiedMode?: boolean;
    voiceGuidance?: boolean;
    language?: 'en' | 'ta' | 'hi' | 'ml' | 'te';
    reducedMotion?: boolean;
  };
  context?: {
    currentPage?: string;
  };
}

export const OcrSimplifyRequestSchema = z.object({
  text: z.string().min(1),
  accessibilityProfile: z
    .object({
      textSize: z.string().optional(),
      contrast: z.string().optional(),
      simplifiedMode: z.boolean().optional(),
      voiceGuidance: z.boolean().optional(),
      language: z.enum(['en', 'ta', 'hi', 'ml', 'te']).optional(),
      reducedMotion: z.boolean().optional(),
    })
    .optional(),
  language: z.enum(['en', 'ta', 'hi', 'ml', 'te']).default('en'),
});

export type OcrSimplifyRequest = z.infer<typeof OcrSimplifyRequestSchema>;

export const OcrSimplifyResponseSchema = z.object({
  text: z.string(),
  confidence: z.number().min(0).max(1),
});

export type OcrSimplifyResponse = z.infer<typeof OcrSimplifyResponseSchema>;

export const OcrTranslateRequestSchema = z.object({
  text: z.string().min(1),
  sourceLanguage: z.string().default('auto'),
  targetLanguage: z.enum(['en', 'ta', 'hi', 'ml', 'te']),
  accessibilityProfile: z
    .object({
      textSize: z.string().optional(),
      contrast: z.string().optional(),
      simplifiedMode: z.boolean().optional(),
      voiceGuidance: z.boolean().optional(),
      language: z.string().optional(),
      reducedMotion: z.boolean().optional(),
    })
    .optional(),
});

export type OcrTranslateRequest = z.infer<typeof OcrTranslateRequestSchema>;

export const OcrTranslateResponseSchema = z.object({
  sourceLanguage: z.string(),
  targetLanguage: z.enum(['en', 'ta', 'hi', 'ml', 'te']),
  text: z.string(),
  confidence: z.number().min(0).max(1),
});

export type OcrTranslateResponse = z.infer<typeof OcrTranslateResponseSchema>;
