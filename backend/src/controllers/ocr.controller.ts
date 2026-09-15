import { Request, Response, NextFunction } from 'express';
import { ocrService } from '../services/ocr.service.js';
import {
  OcrExtractInput,
  OcrSimplifyRequestSchema,
  OcrTranslateRequestSchema,
} from '../types/ocr.types.js';

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];

export class OcrController {
  async extract(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      let imageBuffer: Buffer | undefined;
      let imageBase64: string | undefined;
      let mimeType: string = 'image/jpeg';

      // 1. Check if multipart file uploaded
      if (req.file) {
        if (!ALLOWED_MIME_TYPES.includes(req.file.mimetype)) {
          res.status(400).json({
            error: {
              code: 'UNSUPPORTED_FILE_TYPE',
              message: 'Unsupported file type. Please upload a JPEG, PNG, or WebP image.',
            },
          });
          return;
        }

        // Limit to 10MB
        if (req.file.size > 10 * 1024 * 1024) {
          res.status(413).json({
            error: {
              code: 'FILE_TOO_LARGE',
              message: 'Image size exceeds maximum limit of 10MB.',
            },
          });
          return;
        }

        imageBuffer = req.file.buffer;
        mimeType = req.file.mimetype;
      }
      // 2. Check if base64 image passed in JSON body
      else if (req.body && req.body.image) {
        if (typeof req.body.image !== 'string' || !req.body.image.trim()) {
          res.status(400).json({
            error: {
              code: 'INVALID_IMAGE',
              message: 'Image base64 data must be a non-empty string.',
            },
          });
          return;
        }

        const rawImage = req.body.image as string;
        imageBase64 = rawImage;

        // Check for data URL mime type
        const match = rawImage.match(/^data:(image\/[a-z]+);base64,/);
        if (match) {
          mimeType = match[1];
          if (!ALLOWED_MIME_TYPES.includes(mimeType)) {
            res.status(400).json({
              error: {
                code: 'UNSUPPORTED_FILE_TYPE',
                message: 'Unsupported image format. Please use JPEG, PNG, or WebP.',
              },
            });
            return;
          }
        }
      } else {
        res.status(400).json({
          error: {
            code: 'IMAGE_REQUIRED',
            message: 'Image is required for OCR extraction. Please upload an image or provide a base64 string.',
          },
        });
        return;
      }

      // Parse accessibility profile if stringified
      let accessibilityProfile = req.body.accessibilityProfile;
      if (typeof accessibilityProfile === 'string') {
        try {
          accessibilityProfile = JSON.parse(accessibilityProfile);
        } catch {
          accessibilityProfile = undefined;
        }
      }

      // Parse context if stringified
      let context = req.body.context;
      if (typeof context === 'string') {
        try {
          context = JSON.parse(context);
        } catch {
          context = undefined;
        }
      }

      const input: OcrExtractInput = {
        imageBuffer,
        imageBase64,
        mimeType,
        sourceLanguage: req.body.sourceLanguage,
        accessibilityProfile,
        context,
      };

      const result = await ocrService.extractText(input);
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  }

  async simplify(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const parsed = OcrSimplifyRequestSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({
          error: {
            code: 'INVALID_REQUEST',
            message: 'Invalid request body for text simplification.',
            details: parsed.error.format(),
          },
        });
        return;
      }

      const result = await ocrService.simplifyText(parsed.data);
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  }

  async translate(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const parsed = OcrTranslateRequestSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({
          error: {
            code: 'INVALID_REQUEST',
            message: 'Invalid request body for translation.',
            details: parsed.error.format(),
          },
        });
        return;
      }

      const result = await ocrService.translateText(parsed.data);
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  }
}

export const ocrController = new OcrController();
