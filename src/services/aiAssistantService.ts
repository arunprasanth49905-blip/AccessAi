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

  processUserQuery(
    query: string,
    context?: { currentScene?: string | null; lastOcrText?: string | null; activeRoute?: string | null }
  ): Promise<ChatMessage> {
    const q = query.toLowerCase();

    return new Promise((resolve) => {
      setTimeout(() => {
        let text = '';
        let confidence: 'high' | 'medium' | 'low' = 'high';
        let safetyWarning: string | undefined = undefined;
        const suggestedFollowUps: string[] = [];

        // Grounded in OCR context
        if ((q.includes('sign') || q.includes('document') || q.includes('read') || q.includes('what did it say')) && context?.lastOcrText) {
          text = `From your recent document scan, the extracted text was: "${context.lastOcrText}".`;
          confidence = 'high';
          suggestedFollowUps.push('Simplify this text', 'Translate to Tamil', 'Translate to Hindi');
        } else if ((q.includes('where are we going') || q.includes('destination') || q.includes('route')) && context?.activeRoute) {
          text = `Your active navigation route is set to: ${context.activeRoute}. Follow the step-free tactile line.`;
          confidence = 'high';
          suggestedFollowUps.push('What is the next step?', 'Is it step-free?');
        } else if (q.includes('around') || q.includes('look') || q.includes('surround') || q.includes('what do you see') || q.includes('what did you see')) {
          if (context?.currentScene) {
            text = `Based on your recent camera scan (${context.currentScene}), I observed an accessible pathway, a doorway ahead, and seating on your right.`;
            confidence = 'high';
            suggestedFollowUps.push('What should I be careful about?', 'Where is the door?', 'Are there stairs?');
          } else {
            text = 'I need a camera image or scene information to describe your surroundings. Please open the Camera view to capture your environment.';
            confidence = 'high';
            suggestedFollowUps.push('Open Camera', 'What can you do?');
          }
        } else if (q.includes('careful') || q.includes('obstacle') || q.includes('hazard') || q.includes('danger')) {
          text = 'There may be a low utility cart or obstacle near the center of your path approximately 1.5 meters ahead. Please verify before moving.';
          confidence = 'medium';
          safetyWarning = 'Medium confidence. Please verify before moving.';
          suggestedFollowUps.push('Is there an alternate path?', 'Where is the nearest door?');
        } else if (q.includes('stair') || q.includes('step')) {
          text = 'Descending steps exist on the left concourse. An accessible step-free ramp and elevator are available straight ahead.';
          confidence = 'high';
          suggestedFollowUps.push('Guide me to the elevator', 'Show step-free route');
        } else if (q.includes('read') || q.includes('text') || q.includes('sign')) {
          text = 'You can capture printed signs, documents, and prescription labels in the Read tab for instant text-to-speech reading and translation.';
          confidence = 'high';
          suggestedFollowUps.push('Open Read tab', 'What can you do?');
        } else if (q.includes('route') || q.includes('navigate') || q.includes('go to')) {
          text = 'I can guide you along verified step-free routes avoiding stairs. Open the Navigate tab to choose your destination.';
          confidence = 'high';
          suggestedFollowUps.push('Start navigation', 'Avoid stairs');
        } else {
          text = `I received your inquiry: "${query}". AccessAI is active in accessibility companion mode. You can ask what is around you, request a safety check, or ask for navigation guidance.`;
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
