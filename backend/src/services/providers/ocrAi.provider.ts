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

function cleanJsonString(str: string): string {
  let cleaned = str.trim();
  if (cleaned.startsWith('```json')) {
    cleaned = cleaned.slice(7);
  } else if (cleaned.startsWith('```')) {
    cleaned = cleaned.slice(3);
  }
  if (cleaned.endsWith('```')) {
    cleaned = cleaned.slice(0, -3);
  }
  return cleaned.trim();
}

async function fetchImageAsBase64(url: string): Promise<{ base64: string; mimeType: string }> {
  const resp = await fetch(url);
  if (!resp.ok) {
    throw new Error(`Failed to fetch image from URL: ${resp.status}`);
  }
  const contentType = resp.headers.get('content-type') || 'image/jpeg';
  const arrayBuffer = await resp.arrayBuffer();
  const base64 = Buffer.from(arrayBuffer).toString('base64');
  return { base64, mimeType: contentType };
}

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
   * Multimodal OCR extraction using Gemini with retry logic
   */
  async extract(input: OcrExtractInput): Promise<OcrResult> {
    if (!this.isConfigured()) {
      return ocrFallbackProvider.extract(input);
    }

    // 1. Resolve base64 image data (including remote URL support)
    let base64Data = input.imageBase64;
    let mimeType = input.mimeType || 'image/jpeg';

    if (!base64Data && input.imageBuffer) {
      base64Data = input.imageBuffer.toString('base64');
    }

    if (base64Data && (base64Data.startsWith('http://') || base64Data.startsWith('https://'))) {
      try {
        const fetched = await fetchImageAsBase64(base64Data);
        base64Data = fetched.base64;
        mimeType = fetched.mimeType;
      } catch (err) {
        console.warn('[OCR] Failed to fetch remote image URL:', err);
        base64Data = undefined;
      }
    }

    if (!base64Data) {
      return ocrFallbackProvider.extract(input);
    }

    const ai = this.getClient();
    if (!ai) {
      return ocrFallbackProvider.extract(input);
    }

    const cleanBase64 = base64Data.replace(/^data:image\/[a-z]+;base64,/, '');
    const sourceLanguagePrompt =
      input.sourceLanguage && input.sourceLanguage !== 'auto'
        ? `Expected source language: ${input.sourceLanguage}.`
        : 'Auto-detect source language.';

    const prompt = `You are AccessAI OCR, a high-precision document, label, and signage reader designed for accessibility.
${sourceLanguagePrompt}

Rules:
1. Faithful Extraction: Transcribe all visible text faithfully and accurately. Never hallucinate, extrapolate, or invent text that is not in the image.
2. If text is blurry or partially obscured, transcribe what is readable and use "[unclear]" for illegible portions.
3. Preserve line breaks, paragraphs, lists, and headings in logical reading order.
4. Numerical Accuracy: Keep all numbers, prices, dates, times, room/platform numbers, and phone numbers EXACT (e.g. "Platform 2", "7:30 PM", "₹500", "Room 402").
5. If there is NO readable text in the image, return:
   {"source": "ai", "text": "", "detectedLanguage": "en", "confidence": 0.3, "regions": []}
6. Provide bounding box regions (normalized coordinates from 0.0 to 1.0) for major text blocks if visible.

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

    // Execute with model fallback
    const tryModels = [config.GEMINI_MODEL, 'gemini-3.5-flash-lite'].filter(
      (m, idx, arr) => arr.indexOf(m) === idx
    );

    for (const modelToUse of tryModels) {
      try {
        console.log(`[OCR] Gemini extraction attempt using model: ${modelToUse}`);

        const timeoutMs = 15000;
        const timeoutPromise = new Promise<never>((_, reject) => {
          setTimeout(() => reject(new Error('Gemini OCR extraction timed out')), timeoutMs);
        });

        const generatePromise = ai.models.generateContent({
          model: modelToUse,
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
            maxOutputTokens: 1500,
            responseMimeType: 'application/json',
          },
        });

        const response = await Promise.race([generatePromise, timeoutPromise]);
        const rawText = response.text?.trim();

        if (rawText) {
          const cleanedJson = cleanJsonString(rawText);
          try {
            const parsed = JSON.parse(cleanedJson);
            parsed.source = 'ai';
            const conf = typeof parsed.confidence === 'number' ? Math.max(0, Math.min(1, parsed.confidence)) : 0.92;
            parsed.confidence = conf;
            parsed.confidenceLevel = this.calculateConfidenceLevel(conf);
            parsed.text = typeof parsed.text === 'string' ? parsed.text : '';
            parsed.detectedLanguage = typeof parsed.detectedLanguage === 'string' ? parsed.detectedLanguage : 'en';

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
              console.log('[OCR] Gemini OCR extraction succeeded with model:', modelToUse);
              return validated.data;
            } else {
              // Return sanitized parsed even if strict zod failed minor details
              return {
                source: 'ai',
                text: parsed.text,
                detectedLanguage: parsed.detectedLanguage,
                confidence: conf,
                confidenceLevel: this.calculateConfidenceLevel(conf),
                regions: parsed.regions,
              };
            }
          } catch {
            // If response was direct text rather than JSON
            console.log('[OCR] Model returned plain text, constructing valid OCR result');
            return {
              source: 'ai',
              text: rawText,
              detectedLanguage: 'en',
              confidence: 0.88,
              confidenceLevel: 'high',
              regions: [],
            };
          }
        }
      } catch (err) {
        console.warn(`[OCR] Gemini extraction error with model ${modelToUse}:`, err instanceof Error ? err.message : err);
      }
    }

    console.warn('[OCR] All Gemini model attempts failed, falling back to local OCR');
    return ocrFallbackProvider.extract(input);
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

    const tryModels = [config.GEMINI_MODEL, 'gemini-3.5-flash-lite'].filter(
      (m, idx, arr) => arr.indexOf(m) === idx
    );

    for (const modelToUse of tryModels) {
      try {
        const timeoutMs = 12000;
        const timeoutPromise = new Promise<never>((_, reject) => {
          setTimeout(() => reject(new Error('Gemini simplification timed out')), timeoutMs);
        });

        const generatePromise = ai.models.generateContent({
          model: modelToUse,
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          config: {
            temperature: 0.2,
            maxOutputTokens: 600,
            responseMimeType: 'application/json',
          },
        });

        const response = await Promise.race([generatePromise, timeoutPromise]);
        const rawJson = response.text?.trim();

        if (rawJson) {
          const cleaned = cleanJsonString(rawJson);
          try {
            const parsed = JSON.parse(cleaned);
            if (typeof parsed.text === 'string' && parsed.text.trim()) {
              return {
                text: parsed.text.trim(),
                confidence: typeof parsed.confidence === 'number' ? parsed.confidence : 0.94,
              };
            }
          } catch {
            return {
              text: rawJson,
              confidence: 0.88,
            };
          }
        }
      } catch (err) {
        console.warn(`[OCR] Simplification error with model ${modelToUse}:`, err instanceof Error ? err.message : err);
      }
    }

    return ocrFallbackProvider.simplify(input);
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
2. Translate signage, directions, and instructions naturally and idiomatically.
3. Do NOT add extra conversational commentary.
4. Return strictly valid JSON:
{
  "sourceLanguage": string,
  "targetLanguage": "${input.targetLanguage}",
  "text": string,
  "confidence": number (0.0 to 1.0)
}

Text to Translate:
${input.text}`;

    const tryModels = [config.GEMINI_MODEL, 'gemini-3.5-flash-lite'].filter(
      (m, idx, arr) => arr.indexOf(m) === idx
    );

    for (const modelToUse of tryModels) {
      try {
        const timeoutMs = 12000;
        const timeoutPromise = new Promise<never>((_, reject) => {
          setTimeout(() => reject(new Error('Gemini translation timed out')), timeoutMs);
        });

        const generatePromise = ai.models.generateContent({
          model: modelToUse,
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          config: {
            temperature: 0.2,
            maxOutputTokens: 900,
            responseMimeType: 'application/json',
          },
        });

        const response = await Promise.race([generatePromise, timeoutPromise]);
        const rawJson = response.text?.trim();

        if (rawJson) {
          const cleaned = cleanJsonString(rawJson);
          try {
            const parsed = JSON.parse(cleaned);
            if (typeof parsed.text === 'string' && parsed.text.trim()) {
              return {
                sourceLanguage: parsed.sourceLanguage || input.sourceLanguage || 'auto',
                targetLanguage: input.targetLanguage,
                text: parsed.text.trim(),
                confidence: typeof parsed.confidence === 'number' ? parsed.confidence : 0.95,
              };
            }
          } catch {
            return {
              sourceLanguage: input.sourceLanguage || 'auto',
              targetLanguage: input.targetLanguage,
              text: rawJson,
              confidence: 0.9,
            };
          }
        }
      } catch (err) {
        console.warn(`[OCR] Translation error with model ${modelToUse}:`, err instanceof Error ? err.message : err);
      }
    }

    return ocrFallbackProvider.translate(input);
  }
}

export const ocrAiProvider = new OcrAiProvider();
