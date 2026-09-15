import { GoogleGenAI } from '@google/genai';
import { config } from '../../config/env.js';
import { VoiceChatRequest, VoiceChatResponse } from '../../types/voice.types.js';
import { VisionAnalyzeInput, VisionResult, VisionResultSchema } from '../../types/vision.types.js';
import { FallbackProvider } from './fallback.provider.js';
import { VisionFallbackProvider } from './visionFallback.provider.js';

export interface IAssistantProvider {
  isConfigured(): boolean;
  generateVoiceResponse(request: VoiceChatRequest): Promise<VoiceChatResponse>;
}

export interface IVisionProvider {
  isConfigured(): boolean;
  analyzeVision(input: VisionAnalyzeInput): Promise<VisionResult>;
}

export class GeminiProvider implements IAssistantProvider, IVisionProvider {
  private fallback = new FallbackProvider();
  private visionFallback = new VisionFallbackProvider();

  isConfigured(): boolean {
    return config.isGeminiConfigured();
  }

  private getClient(): GoogleGenAI | null {
    if (!config.isGeminiConfigured() || !config.GEMINI_API_KEY) {
      return null;
    }
    return new GoogleGenAI({ apiKey: config.GEMINI_API_KEY });
  }

  /**
   * Generates conversational assistance using Gemini, respecting accessibility profiles and visual grounding.
   */
  async generateVoiceResponse(request: VoiceChatRequest): Promise<VoiceChatResponse> {
    if (!this.isConfigured()) {
      return this.fallback.generateResponse(request);
    }

    const ai = this.getClient();
    if (!ai) {
      return this.fallback.generateResponse(request);
    }

    const isSimplified = Boolean(request.accessibilityProfile?.simplifiedMode);
    const language = request.accessibilityProfile?.language || 'en';
    const currentPage = request.context?.currentPage || 'voice';
    const currentScene = request.context?.currentScene || null;

    // Strict AccessAI system instructions
    const systemInstruction = `You are AccessAI, an intelligent multimodal accessibility companion designed to assist people with visual, hearing, and mobility disabilities.
Core Principles:
1. Grounding & Zero Visual Hallucination: If the user asks "What is around me?" or asks to describe surroundings/scene and currentScene is null, say: "I need a camera image or scene information to describe your surroundings." Never invent visual features, objects, or camera details.
2. Location & Navigation: Never pretend active GPS or live outdoor tracking exists unless explicitly provided.
3. Safety: Never claim that a path or surface is 100% definitely safe. For any obstacle, hazard, or movement inquiry, communicate uncertainty and advise: "Please verify before moving."
4. Profile Awareness:
   - simplifiedMode: ${isSimplified ? 'YES. Use short, simple, plain language sentences with direct guidance.' : 'NO. Use natural, warm, conversational language.'}
   - target language: ${language}
   - voiceGuidance: ${Boolean(request.accessibilityProfile?.voiceGuidance)}
   - current page: ${currentPage}
   - current scene: ${currentScene || 'None (no visual input active)'}
5. Do not make medical, legal, or emergency decisions.
6. Core workflow: SEE -> UNDERSTAND -> ASSIST -> RESPOND.`;

    try {
      console.log(`[AI] Gemini voice request started (model: ${config.GEMINI_MODEL})`);

      // 12-second timeout promise
      const timeoutMs = 12000;
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Gemini voice request timed out')), timeoutMs);
      });

      const generatePromise = ai.models.generateContent({
        model: config.GEMINI_MODEL,
        contents: [
          {
            role: 'user',
            parts: [
              {
                text: `${systemInstruction}\n\nUser Question: ${request.text}`,
              },
            ],
          },
        ],
        config: {
          temperature: 0.3,
          maxOutputTokens: 300,
        },
      });

      const response = await Promise.race([generatePromise, timeoutPromise]);
      const answer = response.text?.trim();

      if (answer) {
        console.log('[AI] Gemini voice request completed successfully');
        const lowerQ = request.text.toLowerCase();
        const lowerA = answer.toLowerCase();
        const isSafetyRelated =
          lowerQ.includes('careful') ||
          lowerQ.includes('obstacle') ||
          lowerQ.includes('danger') ||
          lowerA.includes('verify before moving') ||
          lowerA.includes('caution');

        return {
          answer,
          confidence: isSafetyRelated ? 0.76 : 0.94,
          confidenceLevel: isSafetyRelated ? 'medium' : 'high',
          safetyWarning: isSafetyRelated,
        };
      }

      console.warn('[AI] Gemini returned empty response, using fallback');
      return this.fallback.generateResponse(request);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      console.warn(`[AI] Gemini voice request failed, using fallback: ${errorMessage}`);
      return this.fallback.generateResponse(request);
    }
  }

  /**
   * Analyzes camera frame using Gemini multimodal vision.
   */
  async analyzeVision(input: VisionAnalyzeInput): Promise<VisionResult> {
    if (!this.isConfigured()) {
      return this.visionFallback.analyze(input);
    }

    // Extract base64 image data
    let base64Data = input.imageBase64;
    if (!base64Data && input.imageBuffer) {
      base64Data = input.imageBuffer.toString('base64');
    }

    if (!base64Data) {
      return this.visionFallback.analyze(input);
    }

    const ai = this.getClient();
    if (!ai) {
      return this.visionFallback.analyze(input);
    }

    // Clean base64 header if present
    const cleanBase64 = base64Data.replace(/^data:image\/[a-z]+;base64,/, '');
    const mimeType = input.mimeType || 'image/jpeg';
    const question = input.question?.trim() || 'Describe this scene for an accessibility user';
    const isSimplified = Boolean(input.accessibilityProfile?.simplifiedMode);

    const prompt = `You are AccessAI, an accessibility vision companion for people with visual and mobility disabilities.
Analyze this camera image and answer the user's question: "${question}".

Accessibility Profile:
- simplifiedMode: ${isSimplified ? 'true (keep sentences short, clear, and direct)' : 'false'}
- language: ${input.accessibilityProfile?.language || 'en'}

Priorities:
1. Immediate safety hazards and obstacles in walking path.
2. Doors, exits, ramps, stairs, elevators, pathways.
3. High-visibility objects (chairs, tables, people, signs).
4. Relative spatial position (ahead, left, right, below, center).
5. Never state that a path is 100% safe. If an obstacle exists or vision is uncertain, set riskDetected: true.

Return strictly valid JSON matching this schema:
{
  "source": "ai",
  "description": string,
  "objects": [
    {
      "label": string,
      "confidence": number (0.0 to 1.0),
      "position": "ahead" | "left" | "right" | "below" | "center",
      "box": { "top": number, "left": number, "width": number, "height": number } (optional, 0-100 normalized),
      "details": string (optional)
    }
  ],
  "safety": {
    "riskDetected": boolean,
    "message": string,
    "confidence": number (0.0 to 1.0)
  },
  "confidence": number (0.0 to 1.0),
  "confidenceLevel": "high" | "medium" | "low"
}`;

    try {
      console.log(`[AI] Gemini vision analysis started (model: ${config.GEMINI_MODEL})`);

      // 15-second timeout promise
      const timeoutMs = 15000;
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Gemini vision analysis timed out')), timeoutMs);
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
          temperature: 0.2,
          maxOutputTokens: 800,
          responseMimeType: 'application/json',
        },
      });

      const response = await Promise.race([generatePromise, timeoutPromise]);
      const rawJson = response.text?.trim();

      if (rawJson) {
        try {
          const parsed = JSON.parse(rawJson);
          parsed.source = 'ai';
          const validated = VisionResultSchema.safeParse(parsed);

          if (validated.success) {
            console.log('[AI] Gemini vision analysis completed and validated successfully');
            return validated.data;
          } else {
            console.warn('[AI] Gemini vision response schema mismatch, using fallback');
          }
        } catch {
          console.warn('[AI] Failed to parse JSON from Gemini vision, using fallback');
        }
      }

      return this.visionFallback.analyze(input);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      console.warn(`[AI] Gemini vision analysis failed, using fallback: ${errorMessage}`);
      return this.visionFallback.analyze(input);
    }
  }
}

export const geminiProvider = new GeminiProvider();
