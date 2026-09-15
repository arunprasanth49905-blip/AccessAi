import { z } from 'zod';

export const DetectedVisionObjectSchema = z.object({
  label: z.string(),
  confidence: z.number().min(0).max(1),
  position: z.enum(['ahead', 'left', 'right', 'below', 'center']),
  box: z
    .object({
      top: z.number().min(0).max(100),
      left: z.number().min(0).max(100),
      width: z.number().min(0).max(100),
      height: z.number().min(0).max(100),
    })
    .optional(),
  details: z.string().optional(),
});

export type DetectedVisionObject = z.infer<typeof DetectedVisionObjectSchema>;

export const VisionSafetyAlertSchema = z.object({
  riskDetected: z.boolean(),
  message: z.string(),
  confidence: z.number().min(0).max(1),
});

export type VisionSafetyAlert = z.infer<typeof VisionSafetyAlertSchema>;

export const VisionResultSchema = z.object({
  source: z.enum(['ai', 'demo']),
  description: z.string(),
  objects: z.array(DetectedVisionObjectSchema),
  safety: VisionSafetyAlertSchema,
  confidence: z.number().min(0).max(1),
  confidenceLevel: z.enum(['high', 'medium', 'low']),
});

export type VisionResult = z.infer<typeof VisionResultSchema>;

export interface VisionAnalyzeInput {
  imageBuffer?: Buffer;
  imageBase64?: string;
  mimeType?: string;
  question?: string;
  accessibilityProfile?: {
    textSize?: 'small' | 'medium' | 'large' | 'xlarge';
    simplifiedMode?: boolean;
    voiceGuidance?: boolean;
    language?: 'en' | 'ta' | 'hi' | 'ml' | 'te';
    reducedMotion?: boolean;
  };
  context?: {
    currentPage?: string;
    currentScene?: string | null;
  };
}
