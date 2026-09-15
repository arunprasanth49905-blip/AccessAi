import { VoiceChatRequest, VoiceChatResponse } from '../../types/voice.types.js';
import { FallbackProvider } from './fallback.provider.js';

export interface IAIProvider {
  isConfigured(): boolean;
  generateResponse(request: VoiceChatRequest): Promise<VoiceChatResponse>;
}

export class GenericAIProvider implements IAIProvider {
  private fallback = new FallbackProvider();

  isConfigured(): boolean {
    return Boolean(process.env.GEMINI_API_KEY || process.env.OPENAI_API_KEY);
  }

  async generateResponse(request: VoiceChatRequest): Promise<VoiceChatResponse> {
    const apiKey = process.env.GEMINI_API_KEY || process.env.OPENAI_API_KEY;

    if (!apiKey) {
      return this.fallback.generateResponse(request);
    }

    try {
      // If a Gemini API key is configured, invoke Gemini REST API
      if (process.env.GEMINI_API_KEY) {
        const systemPrompt = `You are AccessAI, an intelligent multimodal accessibility companion.
Your goal is to assist people with disabilities understand their surroundings, navigate, read text, and stay safe.
Rules:
1. Grounding: If the user asks "What is around me?" or asks to describe surroundings and currentScene is null, say: "I need a camera image or scene information to describe your surroundings." Do NOT hallucinate visual elements.
2. Safety: For physical navigation or obstacles, never sound 100% guaranteed. State advice with caution and advise verifying before moving.
3. Accessibility Profile:
- simplifiedMode: ${request.accessibilityProfile.simplifiedMode ? 'YES (use very short, simple, plain language sentences)' : 'NO (use standard natural language)'}
- language: ${request.accessibilityProfile.language}
- voiceGuidance: ${request.accessibilityProfile.voiceGuidance}
Current Page: ${request.context.currentPage || 'voice'}
Current Scene: ${request.context.currentScene || 'None'}
`;

        const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`;
        const response = await fetch(geminiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [
              {
                role: 'user',
                parts: [{ text: `${systemPrompt}\n\nUser Question: ${request.text}` }],
              },
            ],
            generationConfig: {
              maxOutputTokens: 250,
              temperature: 0.3,
            },
          }),
        });

        if (response.ok) {
          const data = (await response.json()) as {
            candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
          };
          const answer = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();

          if (answer) {
            const isSafetyRelated =
              request.text.toLowerCase().includes('careful') ||
              request.text.toLowerCase().includes('obstacle') ||
              answer.toLowerCase().includes('verify before moving');

            return {
              answer,
              confidence: isSafetyRelated ? 0.75 : 0.92,
              confidenceLevel: isSafetyRelated ? 'medium' : 'high',
              safetyWarning: isSafetyRelated,
            };
          }
        }
      }

      // If remote provider call was skipped or failed, fallback gracefully
      return this.fallback.generateResponse(request);
    } catch (err) {
      console.warn('AI Provider generation failed, falling back to deterministic local engine:', err);
      return this.fallback.generateResponse(request);
    }
  }
}
