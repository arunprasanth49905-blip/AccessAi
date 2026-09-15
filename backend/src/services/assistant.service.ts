import { VoiceChatRequest, VoiceChatResponse } from '../types/voice.types.js';
import { GenericAIProvider } from './providers/ai.provider.js';

export class AssistantService {
  private provider = new GenericAIProvider();

  async processVoiceChat(request: VoiceChatRequest): Promise<VoiceChatResponse> {
    return this.provider.generateResponse(request);
  }
}

export const assistantService = new AssistantService();
