import { Request, Response, NextFunction } from 'express';
import { visionService } from '../services/vision.service.js';
import { VisionAnalyzeInput } from '../types/vision.types.js';

export async function handleVisionAnalyze(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const input: VisionAnalyzeInput = {};

    // 1. Handle multipart/form-data file upload
    if (req.file) {
      input.imageBuffer = req.file.buffer;
      input.mimeType = req.file.mimetype;
    }

    // 2. Handle JSON base64 image or form field
    if (req.body.image && typeof req.body.image === 'string') {
      input.imageBase64 = req.body.image;
    }

    // Check if an image was provided
    if (!input.imageBuffer && !input.imageBase64) {
      res.status(400).json({
        error: 'Image is required for vision analysis. Please provide an image file or base64 string.',
      });
      return;
    }

    // 3. Question
    if (req.body.question && typeof req.body.question === 'string') {
      input.question = req.body.question;
    }

    // 4. Accessibility Profile (support JSON object or serialized string)
    if (req.body.accessibilityProfile) {
      if (typeof req.body.accessibilityProfile === 'string') {
        try {
          input.accessibilityProfile = JSON.parse(req.body.accessibilityProfile);
        } catch {
          // Ignore parse error and keep undefined
        }
      } else if (typeof req.body.accessibilityProfile === 'object') {
        input.accessibilityProfile = req.body.accessibilityProfile;
      }
    }

    // 5. Context
    if (req.body.context) {
      if (typeof req.body.context === 'string') {
        try {
          input.context = JSON.parse(req.body.context);
        } catch {
          // Ignore
        }
      } else if (typeof req.body.context === 'object') {
        input.context = req.body.context;
      }
    }

    const result = await visionService.analyzeScene(input);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}
