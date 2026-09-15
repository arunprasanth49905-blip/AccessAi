import { VisionAnalyzeInput, VisionResult, VisionResultSchema } from '../../types/vision.types.js';
import { VisionFallbackProvider } from './visionFallback.provider.js';

export interface IVisionProvider {
  isConfigured(): boolean;
  analyze(input: VisionAnalyzeInput): Promise<VisionResult>;
}

export class VisionAiProvider implements IVisionProvider {
  private fallback = new VisionFallbackProvider();

  isConfigured(): boolean {
    return Boolean(process.env.GEMINI_API_KEY || process.env.VISION_API_KEY);
  }

  async analyze(input: VisionAnalyzeInput): Promise<VisionResult> {
    const apiKey = process.env.GEMINI_API_KEY || process.env.VISION_API_KEY;

    if (!apiKey) {
      return this.fallback.analyze(input);
    }

    try {
      // Prepare image base64
      let base64Data = input.imageBase64;
      if (!base64Data && input.imageBuffer) {
        base64Data = input.imageBuffer.toString('base64');
      }

      if (!base64Data) {
        return this.fallback.analyze(input);
      }

      // Strip data:image/...;base64, prefix if present
      const cleanBase64 = base64Data.replace(/^data:image\/[a-z]+;base64,/, '');

      const mimeType = input.mimeType || 'image/jpeg';
      const question = input.question || 'Describe this scene for an accessibility user';
      const isSimplified = Boolean(input.accessibilityProfile?.simplifiedMode);

      const prompt = `You are AccessAI, an accessibility vision companion for people with visual and mobility disabilities.
Analyze this camera image and answer the user's question: "${question}".

Accessibility Profile:
- simplifiedMode: ${isSimplified ? 'true (keep sentences short, clear, and direct)' : 'false'}
- language: ${input.accessibilityProfile?.language || 'en'}

Rules:
1. Prioritize immediate physical safety, obstacles, doors, exits, and walking surfaces.
2. If there are potential obstacles or uncertainties, set riskDetected: true and provide caution advice. Never guarantee that a path is 100% safe.
3. For objects, return high-visibility items (door, chair, person, obstacle, sign, stairs, ramp).
4. If bounding boxes are identifiable, provide normalized percentage coordinates (0-100) for top, left, width, height. If not certain, omit box.
5. Return strictly valid JSON conforming to this schema:
{
  "source": "ai",
  "description": string,
  "objects": [
    {
      "label": string,
      "confidence": number (0.0 to 1.0),
      "position": "ahead" | "left" | "right" | "below" | "center",
      "box": { "top": number, "left": number, "width": number, "height": number } (optional),
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
}
`;

      const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
      const response = await fetch(geminiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
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
                { text: prompt },
              ],
            },
          ],
          generationConfig: {
            maxOutputTokens: 600,
            temperature: 0.2,
            responseMimeType: 'application/json',
          },
        }),
      });

      if (response.ok) {
        const data = (await response.json()) as {
          candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
        };
        const rawJson = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();

        if (rawJson) {
          const parsed = JSON.parse(rawJson);
          parsed.source = 'ai'; // Force source to ai
          const validated = VisionResultSchema.safeParse(parsed);

          if (validated.success) {
            return validated.data;
          }
        }
      }

      // If Gemini call or parsing failed, fallback gracefully
      return this.fallback.analyze(input);
    } catch (err) {
      console.warn('Vision AI Provider failed, falling back to deterministic engine:', err);
      return this.fallback.analyze(input);
    }
  }
}
