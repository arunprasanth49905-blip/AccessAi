import { Request, Response, NextFunction } from 'express';
import { VoiceChatRequestSchema } from '../types/voice.types.js';
import { assistantService } from '../services/assistant.service.js';

export async function handleVoiceChat(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const parseResult = VoiceChatRequestSchema.safeParse(req.body);

    if (!parseResult.success) {
      res.status(400).json({
        error: 'Invalid voice chat request',
        details: parseResult.error.errors,
      });
      return;
    }

    const voiceResponse = await assistantService.processVoiceChat(parseResult.data);
    res.status(200).json(voiceResponse);
  } catch (err) {
    next(err);
  }
}
