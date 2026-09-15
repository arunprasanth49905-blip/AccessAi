import {
  OcrExtractInput,
  OcrResult,
  OcrSimplifyRequest,
  OcrSimplifyResponse,
  OcrTranslateRequest,
  OcrTranslateResponse,
  OcrConfidenceLevel,
} from '../types/ocr.types.js';
import { ocrAiProvider } from './providers/ocrAi.provider.js';
import { ocrFallbackProvider } from './providers/ocrFallback.provider.js';
import { config } from '../config/env.js';

export class OcrService {
  private calculateConfidenceLevel(confidence: number): OcrConfidenceLevel {
    if (confidence >= 0.85) return 'high';
    if (confidence >= 0.6) return 'medium';
    return 'low';
  }

  /**
   * Extract text from image using AI with graceful deterministic fallback
   */
  async extractText(input: OcrExtractInput): Promise<OcrResult> {
    let result: OcrResult;

    if (config.isGeminiConfigured()) {
      result = await ocrAiProvider.extract(input);
    } else {
      result = await ocrFallbackProvider.extract(input);
    }

    // Ensure confidence level is strictly standardized
    const normalizedConfidence = Math.max(0, Math.min(1, result.confidence));
    const confidenceLevel = this.calculateConfidenceLevel(normalizedConfidence);

    // Sanitize regions: clamp coordinates between 0 and 1
    const sanitizedRegions = (result.regions || []).map((r) => ({
      text: r.text,
      confidence: Math.max(0, Math.min(1, r.confidence)),
      x: Math.max(0, Math.min(1, r.x)),
      y: Math.max(0, Math.min(1, r.y)),
      width: Math.max(0, Math.min(1 - r.x, r.width)),
      height: Math.max(0, Math.min(1 - r.y, r.height)),
    }));

    return {
      ...result,
      confidence: normalizedConfidence,
      confidenceLevel,
      regions: sanitizedRegions,
    };
  }

  /**
   * Simplify extracted text
   */
  async simplifyText(input: OcrSimplifyRequest): Promise<OcrSimplifyResponse> {
    if (config.isGeminiConfigured()) {
      return ocrAiProvider.simplify(input);
    }
    return ocrFallbackProvider.simplify(input);
  }

  /**
   * Translate extracted text
   */
  async translateText(input: OcrTranslateRequest): Promise<OcrTranslateResponse> {
    if (config.isGeminiConfigured()) {
      return ocrAiProvider.translate(input);
    }
    return ocrFallbackProvider.translate(input);
  }
}

export const ocrService = new OcrService();
