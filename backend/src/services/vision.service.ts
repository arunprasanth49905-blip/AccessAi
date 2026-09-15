import { VisionAnalyzeInput, VisionResult } from '../types/vision.types.js';
import { VisionAiProvider } from './providers/visionAi.provider.js';

export class VisionService {
  private provider = new VisionAiProvider();

  async analyzeScene(input: VisionAnalyzeInput): Promise<VisionResult> {
    const result = await this.provider.analyze(input);

    // Normalize and sanitize bounding boxes if present
    if (result.objects && result.objects.length > 0) {
      result.objects = result.objects.map((obj) => {
        if (!obj.box) return obj;

        const top = Math.max(0, Math.min(100, obj.box.top));
        const left = Math.max(0, Math.min(100, obj.box.left));
        const width = Math.max(0, Math.min(100 - left, obj.box.width));
        const height = Math.max(0, Math.min(100 - top, obj.box.height));

        return {
          ...obj,
          box: { top, left, width, height },
        };
      });
    }

    return result;
  }
}

export const visionService = new VisionService();
