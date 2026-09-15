import { GoogleGenAI } from '@google/genai';
import { config } from '../../config/env.js';
import {
  OcrExtractInput,
  OcrResult,
  OcrResultSchema,
  OcrSimplifyRequest,
  OcrSimplifyResponse,
  OcrTranslateRequest,
  OcrTranslateResponse,
  OcrConfidenceLevel,
} from '../../types/ocr.types.js';
import { ocrFallbackProvider } from './ocrFallback.provider.js';

export class OcrAiProvider {
  isConfigured(): boolean {
    return config.isGeminiConfigured();
  }

  private getClient(): GoogleGenAI | null {
    if (!config.isGeminiConfigured() || !config.GEMINI_API_KEY) {
      return null;
    }
    return new GoogleGenAI({ apiKey: config.GEMINI_API_KEY });
  }

  private calculateConfidenceLevel(confidence: number): OcrConfidenceLevel {
    if (confidence >= 0.85) return 'high';
    if (confidence >= 0.6) return 'medium';
    return 'low';
  }

  /**
   * Multimodal OCR extraction using Gemini
   */
  async extract(input: OcrExtractInput): Promise<OcrResult> {
    if (!this.isConfigured()) {
      return ocrFallbackProvider.extract(input);
    }

    // Extract base64 image data
    let base64Data = input.imageBase64;
    if (!base64Data && input.imageBuffer) {
      base64Data = input.imageBuffer.toString('base64');
    }

    if (!base64Data) {
      return ocrFallbackProvider.extract(input);
    }

    const ai = this.getClient();
    if (!ai) {
      return ocrFallbackProvider.extract(input);
    }

    const cleanBase64 = base64Data.replace(/^data:image\/[a-z]+;base64,/, '');
    const mimeType = input.mimeType || 'image/jpeg';
    const sourceLanguagePrompt =
      input.sourceLanguage && input.sourceLanguage !== 'auto'
        ? `Expected source language: ${input.sourceLanguage}.`
        : 'Auto-detect source language.';

    const prompt = `You are AccessAI OCR, a high-precision document and signage reader for people with disabilities.
${sourceLanguagePrompt}

Rules:
1. Faithful Extraction: Extract all visible text faithfully. Never invent, extrapolate, or hallucinate text.
2. If text is unclear or partially cut off, write "[unclear]" instead of guessing.
3. Preserve line breaks, paragraphs, lists, and headings where helpful.
4. Numerical Accuracy: Keep all numbers, prices, dates, times, room/platform numbers, and phone numbers EXACT (e.g. "Platform 2", "7:30 PM", "₹500").
5. If there is NO readable text in the image, return text: "", confidence: 0.2, detectedLanguage: "unknown", regions: [].
6. Return reliable bounding coordinates (normalized 0 to 1) for text blocks in "regions" only if confident. Otherwise, return regions: [].

Return strictly valid JSON matching this schema:
{
  "source": "ai",
  "text": string,
  "detectedLanguage": string,
  "confidence": number (0.0 to 1.0),
  "regions": [
    {
      "text": string,
      "confidence": number (0.0 to 1.0),
      "x": number (0.0 to 1.0),
      "y": number (0.0 to 1.0),
      "width": number (0.0 to 1.0),
      "height": number (0.0 to 1.0)
    }
  ]
}`;

    try {
      console.log(`[OCR] Gemini extraction started (model: ${config.GEMINI_MODEL})`);

      // 15-second timeout promise
      const timeoutMs = 15000;
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Gemini OCR extraction timed out')), timeoutMs);
      });

      const generatePromise = ai.models.generateContent({
        model: config.GEMINI_MODEL,
        contents: [
          {
            role: 'user',
            parts: [
              {
                inlineData: {
                  mimeType,
                  data: cleanBase64,
                },
              },
              {
                text: prompt,
              },
            ],
          },
        ],
        config: {
          temperature: 0.1,
          maxOutputTokens: 1000,
          responseMimeType: 'application/json',
        },
      });

      const response = await Promise.race([generatePromise, timeoutPromise]);
      const rawJson = response.text?.trim();

      if (rawJson) {
        try {
          const parsed = JSON.parse(rawJson);
          parsed.source = 'ai';
          const conf = typeof parsed.confidence === 'number' ? Math.max(0, Math.min(1, parsed.confidence)) : 0.85;
          parsed.confidence = conf;
          parsed.confidenceLevel = this.calculateConfidenceLevel(conf);

          // Sanitize regions
          if (!Array.isArray(parsed.regions)) {
            parsed.regions = [];
          } else {
            parsed.regions = parsed.regions
              .filter((r: { text?: string }) => Boolean(r && typeof r.text === 'string'))
              .map((r: { text: string; confidence?: number; x?: number; y?: number; width?: number; height?: number }) => ({
                text: r.text,
                confidence: typeof r.confidence === 'number' ? Math.max(0, Math.min(1, r.confidence)) : conf,
                x: Math.max(0, Math.min(1, r.x ?? 0)),
                y: Math.max(0, Math.min(1, r.y ?? 0)),
                width: Math.max(0, Math.min(1, r.width ?? 0)),
                height: Math.max(0, Math.min(1, r.height ?? 0)),
              }));
          }

          const validated = OcrResultSchema.safeParse(parsed);
          if (validated.success) {
            console.log('[OCR] Gemini extraction completed and validated successfully');
            return validated.data;
          } else {
            console.warn('[OCR] Gemini OCR response failed schema validation, using fallback');
          }
        } catch {
          console.warn('[OCR] Failed to parse JSON from Gemini OCR, using fallback');
        }
      }

      return ocrFallbackProvider.extract(input);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      console.warn(`[OCR] Gemini OCR extraction failed, using fallback: ${errorMessage}`);
      return ocrFallbackProvider.extract(input);
    }
  }

  /**
   * Text simplification using Gemini
   */
  async simplify(input: OcrSimplifyRequest): Promise<OcrSimplifyResponse> {
    if (!this.isConfigured()) {
      return ocrFallbackProvider.simplify(input);
    }

    const ai = this.getClient();
    if (!ai) {
      return ocrFallbackProvider.simplify(input);
    }

    const prompt = `You are AccessAI Reader Simplifier.
Simplify this extracted text for a reader with cognitive or visual accessibility needs.
Language: ${input.language || 'en'}.

Rules:
1. Preserve essential facts: dates, times, numbers, room/platform numbers, prices, instructions, and warnings.
2. Use short, clear, plain-language sentences.
3. Remove redundant formatting and jargon.
4. Do NOT invent new information.
5. Return strictly valid JSON:
{
  "text": string,
  "confidence": number (0.0 to 1.0)
}

Original Text:
${input.text}`;

    try {
      console.log('[OCR] Gemini text simplification started');
      const timeoutMs = 12000;
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Gemini simplification timed out')), timeoutMs);
      });

      const generatePromise = ai.models.generateContent({
        model: config.GEMINI_MODEL,
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        config: {
          temperature: 0.2,
          maxOutputTokens: 500,
          responseMimeType: 'application/json',
        },
      });

      const response = await Promise.race([generatePromise, timeoutPromise]);
      const rawJson = response.text?.trim();

      if (rawJson) {
        const parsed = JSON.parse(rawJson);
        if (typeof parsed.text === 'string' && parsed.text.trim()) {
          return {
            text: parsed.text.trim(),
            confidence: typeof parsed.confidence === 'number' ? parsed.confidence : 0.92,
          };
        }
      }

      return ocrFallbackProvider.simplify(input);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      console.warn(`[OCR] Gemini simplification failed, using fallback: ${errorMessage}`);
      return ocrFallbackProvider.simplify(input);
    }
  }

  /**
   * Multilingual translation using Gemini
   */
  async translate(input: OcrTranslateRequest): Promise<OcrTranslateResponse> {
    if (!this.isConfigured()) {
      return ocrFallbackProvider.translate(input);
    }

    const ai = this.getClient();
    if (!ai) {
      return ocrFallbackProvider.translate(input);
    }

    const languageNames: Record<string, string> = {
      en: 'English',
      ta: 'Tamil (தமிழ்)',
      hi: 'Hindi (हिन्दी)',
      ml: 'Malayalam (മലയാളം)',
      te: 'Telugu (తెలుగు)',
    };

    const targetName = languageNames[input.targetLanguage] || input.targetLanguage;

    const prompt = `You are AccessAI Translator, specialized in accessibility translation.
Translate the following text accurately into ${targetName} (language code: ${input.targetLanguage}).

Rules:
1. NEVER alter numbers, dates, times, prices, platform/room numbers, units, or codes (e.g. "Platform 2", "7:30 PM", "₹500", "Room 204" must be preserved exactly).
2. Translate signage and instructions naturally, respecting accessibility context.
3. Do NOT add extra commentary.
4. Return strictly valid JSON:
{
  "sourceLanguage": string,
  "targetLanguage": "${input.targetLanguage}",
  "text": string,
  "confidence": number (0.0 to 1.0)
}

Text to Translate:
${input.text}`;

    try {
      console.log(`[OCR] Gemini translation started to ${input.targetLanguage}`);
      const timeoutMs = 12000;
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Gemini translation timed out')), timeoutMs);
      });

      const generatePromise = ai.models.generateContent({
        model: config.GEMINI_MODEL,
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        config: {
          temperature: 0.2,
          maxOutputTokens: 800,
          responseMimeType: 'application/json',
        },
      });

      const response = await Promise.race([generatePromise, timeoutPromise]);
      const rawJson = response.text?.trim();

      if (rawJson) {
        const parsed = JSON.parse(rawJson);
        if (typeof parsed.text === 'string' && parsed.text.trim()) {
          return {
            sourceLanguage: parsed.sourceLanguage || input.sourceLanguage || 'auto',
            targetLanguage: input.targetLanguage,
            text: parsed.text.trim(),
            confidence: typeof parsed.confidence === 'number' ? parsed.confidence : 0.94,
          };
        }
      }

      return ocrFallbackProvider.translate(input);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      console.warn(`[OCR] Gemini translation failed, using fallback: ${errorMessage}`);
      return ocrFallbackProvider.translate(input);
    }
  }
}

export const ocrAiProvider = new OcrAiProvider();
