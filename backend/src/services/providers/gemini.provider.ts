import { GoogleGenAI } from '@google/genai';
import { config } from '../../config/env.js';
import { VoiceChatRequest, VoiceChatResponse } from '../../types/voice.types.js';
import { VisionAnalyzeInput, VisionResult, DetectedVisionObject } from '../../types/vision.types.js';
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
   * Generates conversational assistance using Gemini, respecting accessibility profiles and multimodal context.
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

    // Multimodal context extraction with backwards compatibility
    const vision = request.context?.vision;
    const ocr = request.context?.ocr;
    const navigation = request.context?.navigation;
    const safety = request.context?.safety;

    const sceneDesc = vision?.description || request.context?.currentScene || null;
    const detectedObjects = vision?.detectedObjects || [];
    const ocrText = ocr?.text || request.context?.lastOcrText || null;
    const destination = navigation?.destination || request.context?.activeRoute || null;
    const currentStep = navigation?.currentStep || null;
    const nextStep = navigation?.nextStep || null;
    const distanceToNext = navigation?.distanceToNext || null;
    const distanceRemaining = navigation?.distanceRemaining || null;
    const isOffRoute = Boolean(navigation?.isOffRoute);
    const routeSource = navigation?.routeSource || 'unknown';
    const accuracyLevel = navigation?.accuracyLevel || 'unknown';
    const activeWarnings = safety?.activeWarnings || [];
    const riskDetected = Boolean(safety?.riskDetected || vision?.riskDetected);
    const safetyMessage = safety?.latestRisk || vision?.safetyMessage || null;

    // Freshness evaluation (5-minute TTL unless explicitly referenced by user question)
    const now = Date.now();
    const queryLower = request.text.toLowerCase();
    const hasExplicitSignMention = queryLower.includes('sign') || queryLower.includes('text') || queryLower.includes('document') || queryLower.includes('read') || queryLower.includes('say') || queryLower.includes('written');
    const hasExplicitSceneMention = queryLower.includes('see') || queryLower.includes('look') || queryLower.includes('around') || queryLower.includes('front') || queryLower.includes('ahead') || queryLower.includes('door') || queryLower.includes('room');
    const hasExplicitNavMention = queryLower.includes('route') || queryLower.includes('where') || queryLower.includes('go') || queryLower.includes('destination') || queryLower.includes('step') || queryLower.includes('turn') || queryLower.includes('next') || queryLower.includes('repeat') || queryLower.includes('far');
    const hasFollowUpMention = queryLower.includes('that') || queryLower.includes('this') || queryLower.includes('it') || queryLower.includes('how far');

    const isVisionFresh = vision?.timestamp ? (now - vision.timestamp < 300000) : Boolean(sceneDesc);
    const isOcrFresh = ocr?.timestamp ? (now - ocr.timestamp < 300000) : Boolean(ocrText);
    const isNavFresh = navigation?.timestamp ? (now - navigation.timestamp < 600000) : Boolean(destination);

    const relevantScene = (isVisionFresh || hasExplicitSceneMention || hasFollowUpMention) ? sceneDesc : null;
    const relevantOcr = (isOcrFresh || hasExplicitSignMention || hasFollowUpMention) ? ocrText : null;
    const relevantNav = (isNavFresh || hasExplicitNavMention || hasFollowUpMention) ? destination : null;

    // Strict AccessAI system instructions with cross-feature multimodal context
    const systemInstruction = `You are AccessAI, an intelligent multimodal accessibility companion designed to assist people with visual, hearing, and mobility disabilities.
Core Principles:
1. Grounding & Zero Hallucination:
   - If the user asks "What is around me?" or asks to describe surroundings/scene and no visual scene is available in [ACTIVE CONTEXT], state clearly: "I need a camera image or scene information to describe your surroundings. Please open the Camera view to capture a frame."
   - Never invent visual features, objects, distances, or camera details not supported by observed evidence.
   - Never fabricate routes, roads, turns, or coordinates. Only answer navigation questions using provided route facts.
2. Cross-Feature Multimodal Reasoning:
   - [ACTIVE CONTEXT]:
     * Observed Visual Scene: ${relevantScene ? `${relevantScene} (Identified objects: ${detectedObjects.length > 0 ? detectedObjects.join(', ') : 'None specified'})` : 'None currently available'}
     * Observed Text / Sign (OCR): ${relevantOcr ? `"${relevantOcr}" (Detected Language: ${ocr?.detectedLanguage || 'en'}${ocr?.simplifiedText ? `, Plain: ${ocr.simplifiedText}` : ''})` : 'None currently available'}
     * Active Navigation Route: ${relevantNav ? `Destination: ${relevantNav}${currentStep ? ` | Current: ${currentStep}` : ''}${nextStep ? ` | Next: ${nextStep}` : ''}${distanceToNext ? ` | Distance to next turn: ${distanceToNext}` : ''}${distanceRemaining ? ` | Remaining: ${distanceRemaining}` : ''} [Source: ${routeSource}, Accuracy: ${accuracyLevel}${isOffRoute ? ', OFF-ROUTE DETECTED' : ', On Route'}]` : 'None currently active'}
     * Safety Hazard State: ${riskDetected ? `Warning: ${safetyMessage || 'Potential hazard noted'}${activeWarnings.length > 0 ? ` [Warnings: ${activeWarnings.join('; ')}]` : ''}` : 'No immediate hazard reported'}
   - Combine contexts intelligently:
     * If the user asks "How far?", "Where am I going?", or "What is the next turn?": answer clearly and concisely using the Active Navigation Route facts.
     * If the user is marked OFF-ROUTE: inform them that they appear to have departed from the planned path and suggest re-orienting or waiting for recalculation.
     * If the user asks about entering a door or walkway and a restricted sign (such as "STAFF ONLY" or "NO ENTRY") is in the OCR context: point out the door, highlight what the sign says, and advise caution regarding unauthorized access.
     * If the route indicates a turn or door ahead but the camera observes stairs or an obstruction: mention the route instruction but clearly caution them about the observed physical feature.
     * For road crossings: never say "Cross now" based purely on route geometry. Say: "Crossing information is not currently verified. Check traffic conditions before crossing."
3. Safety: Never claim that a path or surface is 100% definitely safe or clear. For any obstacle, hazard, or movement inquiry, communicate uncertainty and advise: "Please verify before moving."
4. Accessibility Profile:
   - simplifiedMode: ${isSimplified ? 'YES. Use short, simple, plain language sentences with direct guidance. Avoid jargon.' : 'NO. Use natural, supportive, conversational tone.'}
   - language: ${language} (CRITICAL: Output your response in this language code: ${language})
   - voiceGuidance: ${Boolean(request.accessibilityProfile?.voiceGuidance)}
   - current page: ${currentPage}
5. Response Format:
   Respond with a valid JSON object matching this schema:
   {
     "answer": "The spoken/text assistance message for the user",
     "contextUsed": {
       "vision": true or false,
       "ocr": true or false,
       "navigation": true or false,
       "conversation": true or false
     },
     "suggestedFollowUps": ["Suggested follow-up question 1", "Suggested follow-up question 2"],
     "safetyWarning": true or false
   }`;

    try {
      console.log(`[AI] Gemini voice request started (model: ${config.GEMINI_MODEL})`);

      // 12-second timeout promise
      const timeoutMs = 12000;
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Gemini voice request timed out')), timeoutMs);
      });

      // Build multi-turn conversational contents
      const contents: Array<{ role: 'user' | 'model'; parts: Array<{ text: string }> }> = [];

      contents.push({
        role: 'user',
        parts: [{ text: `${systemInstruction}\n\n[Session Start]` }],
      });
      contents.push({
        role: 'model',
        parts: [{ text: '{"status":"ready","message":"Understood. I am AccessAI, calibrated to provide grounded multimodal accessibility assistance."}' }],
      });

      // Include recent conversation turns (up to last 6 turns)
      const pastMessages = (request.conversation || []).slice(-6);
      for (const msg of pastMessages) {
        contents.push({
          role: msg.sender === 'user' ? 'user' : 'model',
          parts: [{ text: msg.text }],
        });
      }

      // Append current user question
      contents.push({
        role: 'user',
        parts: [{ text: request.text }],
      });

      const executeCall = async (modelToUse: string) => {
        return ai.models.generateContent({
          model: modelToUse,
          contents,
          config: {
            temperature: 0.2,
            maxOutputTokens: 450,
            responseMimeType: 'application/json',
          },
        });
      };

      let response;
      try {
        response = await Promise.race([executeCall(config.GEMINI_MODEL), timeoutPromise]);
      } catch (firstErr: unknown) {
        if (config.GEMINI_MODEL !== 'gemini-3.5-flash-lite') {
          console.warn(`[AI] Voice primary model ${config.GEMINI_MODEL} failed, retrying with gemini-3.5-flash-lite...`);
          response = await Promise.race([executeCall('gemini-3.5-flash-lite'), timeoutPromise]);
        } else {
          throw firstErr;
        }
      }

      const rawAnswer = response.text?.trim();

      if (rawAnswer) {
        console.log('[AI] Gemini voice request completed successfully');

        // Parse JSON output
        try {
          const cleanJson = rawAnswer.replace(/^```json\s*/, '').replace(/\s*```$/, '').trim();
          const parsed = JSON.parse(cleanJson);

          if (parsed && typeof parsed.answer === 'string' && parsed.answer.trim()) {
            const isSafetyRelated = Boolean(
              parsed.safetyWarning ||
              parsed.answer.toLowerCase().includes('caution') ||
              parsed.answer.toLowerCase().includes('hazard') ||
              parsed.answer.toLowerCase().includes('obstacle') ||
              parsed.answer.toLowerCase().includes('verify before moving')
            );

            return {
              answer: parsed.answer.trim(),
              confidence: isSafetyRelated ? 0.82 : 0.95,
              confidenceLevel: isSafetyRelated ? 'medium' : 'high',
              safetyWarning: isSafetyRelated,
              source: 'gemini',
              contextUsed: {
                vision: Boolean(parsed.contextUsed?.vision ?? Boolean(relevantScene)),
                ocr: Boolean(parsed.contextUsed?.ocr ?? Boolean(relevantOcr)),
                navigation: Boolean(parsed.contextUsed?.navigation ?? Boolean(relevantNav)),
                conversation: Boolean(parsed.contextUsed?.conversation ?? (pastMessages.length > 0)),
              },
              suggestedFollowUps: Array.isArray(parsed.suggestedFollowUps)
                ? parsed.suggestedFollowUps.slice(0, 3).map((s: unknown) => String(s))
                : (relevantScene ? ['Is there anything I should be careful about?', 'How far is it?'] : ['What is around me?']),
            };
          }
        } catch {
          // If JSON parsing was not strict, fallback to raw text extraction
          console.warn('[AI] Gemini output was not strict JSON, extracting response text directly');
        }

        const lowerQ = request.text.toLowerCase();
        const lowerA = rawAnswer.toLowerCase();
        const isSafetyRelated =
          lowerQ.includes('careful') ||
          lowerQ.includes('obstacle') ||
          lowerQ.includes('danger') ||
          lowerA.includes('verify before moving') ||
          lowerA.includes('caution');

        return {
          answer: rawAnswer,
          confidence: isSafetyRelated ? 0.78 : 0.94,
          confidenceLevel: isSafetyRelated ? 'medium' : 'high',
          safetyWarning: isSafetyRelated,
          source: 'gemini',
          contextUsed: {
            vision: Boolean(relevantScene),
            ocr: Boolean(relevantOcr),
            navigation: Boolean(relevantNav),
            conversation: pastMessages.length > 0,
          },
          suggestedFollowUps: relevantScene
            ? ['Is the path clear?', 'Describe any obstacles']
            : ['What is around me?', 'Read text in view'],
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
1. Immediate safety hazards and obstacles in walking path (cords, spills, drop-offs, low objects).
2. Doors, exits, hallways, ramps, stairs, clear walkways.
3. High-visibility objects (chairs, tables, people, signs, devices, furniture).
4. Relative spatial position ('ahead' | 'left' | 'right' | 'below' | 'center').
5. Bounding box coordinates MUST be percentages from 0 to 100:
   "box": { "top": 25.0, "left": 15.0, "width": 30.0, "height": 40.0 }
6. Never state that a path is 100% safe. If an obstacle exists or vision is uncertain, set riskDetected: true.

Return strictly valid JSON matching this schema:
{
  "source": "ai",
  "description": string,
  "objects": [
    {
      "label": string,
      "confidence": number (0.0 to 1.0),
      "position": "ahead" | "left" | "right" | "below" | "center",
      "box": { "top": number, "left": number, "width": number, "height": number },
      "details": string
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

    // Helper to normalize and sanitize raw parsed JSON from Gemini
    const normalizeVisionResponse = (parsed: any): VisionResult => {
      const description =
        typeof parsed.description === 'string' && parsed.description.trim()
          ? parsed.description.trim()
          : 'Visual scene analyzed successfully.';

      const rawObjects = Array.isArray(parsed.objects) ? parsed.objects : [];
      const normalizedObjects: DetectedVisionObject[] = [];

      for (const obj of rawObjects) {
        if (!obj || typeof obj !== 'object') continue;
        const label = String(obj.label || 'Object').trim();

        let conf = Number(obj.confidence);
        if (isNaN(conf) || conf <= 0) conf = 0.85;
        if (conf > 1 && conf <= 100) conf = conf / 100;
        conf = Math.max(0.1, Math.min(1.0, Math.round(conf * 100) / 100));

        let pos: 'ahead' | 'left' | 'right' | 'below' | 'center' = 'ahead';
        const rawPos = String(obj.position || '').toLowerCase();
        if (['ahead', 'left', 'right', 'below', 'center'].includes(rawPos)) {
          pos = rawPos as any;
        } else if (rawPos.includes('left')) pos = 'left';
        else if (rawPos.includes('right')) pos = 'right';
        else if (rawPos.includes('center') || rawPos.includes('mid')) pos = 'center';
        else if (rawPos.includes('low') || rawPos.includes('bottom') || rawPos.includes('ground') || rawPos.includes('floor')) pos = 'below';

        let boxObj: { top: number; left: number; width: number; height: number } | undefined = undefined;
        if (obj.box && typeof obj.box === 'object') {
          let top = Number(obj.box.top ?? obj.box.ymin ?? 0);
          let left = Number(obj.box.left ?? obj.box.xmin ?? 0);
          let width = Number(obj.box.width ?? (obj.box.xmax !== undefined ? obj.box.xmax - left : 20));
          let height = Number(obj.box.height ?? (obj.box.ymax !== undefined ? obj.box.ymax - top : 20));

          // Normalize from 0..1000 if needed
          if (top > 100 || left > 100 || width > 100 || height > 100) {
            top = top / 10;
            left = left / 10;
            width = width / 10;
            height = height / 10;
          } else if (top <= 1 && left <= 1 && width <= 1 && height <= 1 && (top > 0 || left > 0 || width > 0 || height > 0)) {
            top = top * 100;
            left = left * 100;
            width = width * 100;
            height = height * 100;
          }

          // In case model supplied right/bottom instead of width/height
          if (width > left && left + width > 100) {
            width = Math.max(5, width - left);
          }
          if (height > top && top + height > 100) {
            height = Math.max(5, height - top);
          }

          top = Math.max(0, Math.min(95, Math.round(top * 10) / 10));
          left = Math.max(0, Math.min(95, Math.round(left * 10) / 10));
          width = Math.max(5, Math.min(100 - left, Math.round(width * 10) / 10));
          height = Math.max(5, Math.min(100 - top, Math.round(height * 10) / 10));

          boxObj = { top, left, width, height };
        }

        normalizedObjects.push({
          label,
          confidence: conf,
          position: pos,
          box: boxObj,
          details: typeof obj.details === 'string' ? obj.details : undefined,
        });
      }

      const rawSafety = parsed.safety && typeof parsed.safety === 'object' ? parsed.safety : {};
      const riskDetected = Boolean(rawSafety.riskDetected);
      const safetyMessage =
        typeof rawSafety.message === 'string' && rawSafety.message.trim()
          ? rawSafety.message.trim()
          : riskDetected
          ? 'Potential hazard or obstruction detected. Please verify before moving.'
          : 'No immediate hazards detected in the visible path.';

      let overallConf = Number(parsed.confidence);
      if (isNaN(overallConf) || overallConf <= 0) overallConf = 0.9;
      if (overallConf > 1 && overallConf <= 100) overallConf = overallConf / 100;
      overallConf = Math.max(0.1, Math.min(1.0, Math.round(overallConf * 100) / 100));

      const confidenceLevel: 'high' | 'medium' | 'low' =
        overallConf >= 0.8 ? 'high' : overallConf >= 0.5 ? 'medium' : 'low';

      return {
        source: 'ai',
        description,
        objects: normalizedObjects,
        safety: {
          riskDetected,
          message: safetyMessage,
          confidence: riskDetected ? 0.78 : 0.95,
        },
        confidence: overallConf,
        confidenceLevel,
      };
    };

    try {
      console.log(`[AI] Gemini vision analysis started (model: ${config.GEMINI_MODEL})`);

      // 15-second timeout promise
      const timeoutMs = 15000;
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Gemini vision analysis timed out')), timeoutMs);
      });

      const executeCall = async (modelToUse: string) => {
        return ai.models.generateContent({
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
            temperature: 0.2,
            maxOutputTokens: 800,
            responseMimeType: 'application/json',
          },
        });
      };

      let response;
      try {
        response = await Promise.race([executeCall(config.GEMINI_MODEL), timeoutPromise]);
      } catch (firstErr: any) {
        // If 404 or model error, retry with gemini-3.5-flash-lite
        if (config.GEMINI_MODEL !== 'gemini-3.5-flash-lite') {
          console.warn(`[AI] Primary model ${config.GEMINI_MODEL} failed, retrying with gemini-3.5-flash-lite...`);
          response = await Promise.race([executeCall('gemini-3.5-flash-lite'), timeoutPromise]);
        } else {
          throw firstErr;
        }
      }

      const rawJson = response.text?.trim();

      if (rawJson) {
        try {
          const parsed = JSON.parse(rawJson);
          const normalized = normalizeVisionResponse(parsed);
          console.log(`[AI] Gemini vision completed: ${normalized.objects.length} objects detected from image.`);
          return normalized;
        } catch (parseErr) {
          console.warn('[AI] Failed to parse JSON from Gemini vision:', parseErr);
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
