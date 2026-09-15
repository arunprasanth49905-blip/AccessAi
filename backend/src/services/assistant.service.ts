import { VoiceChatRequest, VoiceChatResponse } from '../types/voice.types.js';
import { geminiProvider } from './providers/gemini.provider.js';

export class AssistantService {
  async processVoiceChat(request: VoiceChatRequest): Promise<VoiceChatResponse> {
    return geminiProvider.generateVoiceResponse(request);
  }
}

export const assistantService = new AssistantService();
