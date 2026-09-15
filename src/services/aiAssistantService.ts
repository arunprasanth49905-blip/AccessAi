// AI Assistant Service - Multimodal reasoning with confidence calibration and safety notices
import { ChatMessage } from '../types';

class AIAssistantService {
  private initialMessages: ChatMessage[] = [
    {
      id: 'm-1',
      sender: 'assistant',
      text: 'Hello! I am AccessAI, your multimodal accessibility companion. You can ask me what is around you, request text reading, or ask for an accessible route.',
      timestamp: 'Just now',
      confidence: 'high',
      suggestedFollowUps: [
        "What's around me?",
        "What should I be careful about?",
        "Read the text in front of me",
        "Find an accessible route",
      ],
    },
  ];

  getInitialMessages(): ChatMessage[] {
    return [...this.initialMessages];
  }

  processUserQuery(query: string, contextSceneName?: string): Promise<ChatMessage> {
    const q = query.toLowerCase();

    return new Promise((resolve) => {
      setTimeout(() => {
        let text = '';
        let confidence: 'high' | 'medium' | 'low' = 'high';
        let safetyWarning: string | undefined = undefined;
        const suggestedFollowUps: string[] = [];

        if (q.includes('around') || q.includes('look') || q.includes('surround')) {
          text = contextSceneName
            ? `In the ${contextSceneName}, I can see a doorway approximately 3 meters ahead, a chair on your right, and a person about 2.2 meters away.`
            : 'I can see an accessible doorway ahead, a chair slightly to your right, and a person approximately two meters away.';
          confidence = 'high';
          suggestedFollowUps.push('What should I be careful about?', 'Where is the door?', 'Are there stairs?');
        } else if (q.includes('careful') || q.includes('obstacle') || q.includes('hazard') || q.includes('danger')) {
          text = 'There may be a low utility cart or obstacle near the center of your path approximately 1.5 meters ahead.';
          confidence = 'medium';
          safetyWarning = 'Medium confidence. Please verify before moving.';
          suggestedFollowUps.push('Is there an alternate path?', 'Describe what the obstacle looks like');
        } else if (q.includes('stair') || q.includes('step')) {
          text = 'I do not detect direct stairs in your immediate forward path, but descending steps exist on the far left. The accessible elevator is straight ahead.';
          confidence = 'high';
          suggestedFollowUps.push('Guide me to the elevator', 'Show step-free route');
        } else if (q.includes('read') || q.includes('text') || q.includes('sign')) {
          text = 'I detect signage ahead reading: "MAIN ENTRANCE — Open 9:00 AM to 6:00 PM. Reception to the right. Wheelchair ramp on the left."';
          confidence = 'high';
          suggestedFollowUps.push('Read it aloud in Tamil', 'Translate to Hindi', 'Save this sign');
        } else if (q.includes('route') || q.includes('navigate') || q.includes('go to')) {
          text = 'I have calculated a 100% step-free route (120 meters, ~2 mins) using the accessible ramp and central elevator.';
          confidence = 'high';
          suggestedFollowUps.push('Start step-by-step navigation', 'Avoid crowds');
        } else {
          text = `I understand you asked: "${query}". I am monitoring your camera feed and surroundings. Please verify critical physical paths as AI interpretations are advisory.`;
          confidence = 'medium';
          safetyWarning = 'Please verify physical surroundings before moving.';
          suggestedFollowUps.push("What's around me?", 'What should I be careful about?');
        }

        resolve({
          id: `msg-${Date.now()}`,
          sender: 'assistant',
          text,
          timestamp: 'Just now',
          confidence,
          safetyWarning,
          suggestedFollowUps,
        });
      }, 700);
    });
  }
}

export const aiAssistantService = new AIAssistantService();
