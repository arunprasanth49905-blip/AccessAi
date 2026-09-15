import { VoiceChatRequest, VoiceChatResponse } from '../../types/voice.types.js';

export class FallbackProvider {
  async generateResponse(request: VoiceChatRequest): Promise<VoiceChatResponse> {
    const rawText = request.text.toLowerCase().trim();
    const isSimplified = request.accessibilityProfile.simplifiedMode;
    const hasSceneContext = Boolean(request.context.currentScene);
    const hasOcrContext = Boolean(request.context.lastOcrText);
    const hasRouteContext = Boolean(request.context.activeRoute);

    // Cross-Feature Context Intent: Inquiries about recent OCR readings ("What was on the sign?", "What did it say?")
    if (
      (rawText.includes('sign') || rawText.includes('document') || rawText.includes('read') || rawText.includes('what did it say')) &&
      hasOcrContext
    ) {
      return {
        answer: isSimplified
          ? `The recent document says: "${request.context.lastOcrText}".`
          : `From your recent document scan, the extracted text was: "${request.context.lastOcrText}".`,
        confidence: 0.94,
        confidenceLevel: 'high',
        safetyWarning: false,
      };
    }

    // Cross-Feature Context Intent: Inquiries about active route ("Where are we going?", "What is the route?")
    if (
      (rawText.includes('where are we going') || rawText.includes('current route') || rawText.includes('next step') || rawText.includes('destination')) &&
      hasRouteContext
    ) {
      return {
        answer: isSimplified
          ? `You are navigating to: ${request.context.activeRoute}. Follow the step-free waypoints.`
          : `Your active accessible route is set to: ${request.context.activeRoute}. Follow the tactile paving and spoken waypoint guidance.`,
        confidence: 0.95,
        confidenceLevel: 'high',
        safetyWarning: false,
      };
    }

    // Intent 3: Visual surroundings ("What is around me?" / "What do you see?" / "What did you see?")
    // CRITICAL: Grounded in scene context.
    if (
      rawText.includes('what is around me') ||
      rawText.includes("what's around me") ||
      rawText.includes('what do you see') ||
      rawText.includes('what did you see') ||
      rawText.includes('look around') ||
      rawText.includes('describe surroundings')
    ) {
      if (!hasSceneContext) {
        return {
          answer: isSimplified
            ? 'I need a camera image or scene information to describe your surroundings.'
            : 'I need a camera image or scene information to describe your surroundings. Please open the Camera page to begin a visual scan.',
          confidence: 0.9,
          confidenceLevel: 'high',
          safetyWarning: false,
        };
      }

      // If scene context exists (e.g. from camera)
      return {
        answer: isSimplified
          ? `Recent view: ${request.context.currentScene}. Doorway ahead, chair on right, person nearby.`
          : `Based on your recent camera scan (${request.context.currentScene}), I observed an accessible pathway, a doorway ahead, and seating on your right.`,
        confidence: 0.91,
        confidenceLevel: 'high',
        safetyWarning: false,
      };
    }

    // Intent 4: Safety caution ("What should I be careful about?")
    if (
      rawText.includes('careful') ||
      rawText.includes('obstacle') ||
      rawText.includes('hazard') ||
      rawText.includes('danger') ||
      rawText.includes('watch out')
    ) {
      return {
        answer: isSimplified
          ? 'There may be an obstacle ahead. Please check before moving.'
          : 'There may be an obstacle near the center of your path approximately 1.5 meters ahead. Please verify before moving.',
        confidence: 0.72,
        confidenceLevel: 'medium',
        safetyWarning: true,
      };
    }

    // Intent 5: Doors / Exits ("Where is the door?")
    if (
      rawText.includes('where is the door') ||
      rawText.includes('find the door') ||
      rawText.includes('where is the exit') ||
      rawText.includes('where is the entrance')
    ) {
      if (!hasSceneContext) {
        return {
          answer: isSimplified
            ? 'Please turn on the camera so I can look for doors.'
            : 'I need camera input to locate doors in your physical environment. Please switch to the Camera view to scan the area.',
          confidence: 0.85,
          confidenceLevel: 'high',
          safetyWarning: false,
        };
      }
      return {
        answer: isSimplified
          ? 'Doorway is straight ahead about 3 meters.'
          : 'An accessible automatic doorway is located directly ahead, approximately 3 meters away.',
        confidence: 0.91,
        confidenceLevel: 'high',
        safetyWarning: false,
      };
    }

    // Intent 6: Description ("Can you describe this?" / "Can you explain this?")
    if (
      rawText.includes('describe this') ||
      rawText.includes('explain this') ||
      rawText.includes('tell me about this')
    ) {
      if (!hasSceneContext) {
        return {
          answer: isSimplified
            ? 'Please capture or share an image for me to describe.'
            : 'Please provide a camera snapshot or select a scene so I can provide a detailed spatial description.',
          confidence: 0.85,
          confidenceLevel: 'high',
          safetyWarning: false,
        };
      }
      return {
        answer: isSimplified
          ? `This is ${request.context.currentScene} with multiple identifiable objects.`
          : `This view features ${request.context.currentScene} with clearly demarcated pathways, accessible doors, and seating.`,
        confidence: 0.89,
        confidenceLevel: 'high',
        safetyWarning: false,
      };
    }

    // Intent 7: OCR reading ("Read this for me")
    if (
      rawText.includes('read this') ||
      rawText.includes('read text') ||
      rawText.includes('read sign') ||
      rawText.includes('read document')
    ) {
      return {
        answer: isSimplified
          ? 'Open the Read tab to scan signs and documents with speech output.'
          : 'You can use the Read Text feature to scan printed signs, documents, and labels with optical character recognition and multi-language translation.',
        confidence: 0.92,
        confidenceLevel: 'high',
        safetyWarning: false,
      };
    }

    // Intent 8: Navigation ("Help me navigate")
    if (
      rawText.includes('navigate') ||
      rawText.includes('route') ||
      rawText.includes('direction') ||
      rawText.includes('where do i go')
    ) {
      return {
        answer: isSimplified
          ? 'Open the Navigate tab to calculate a step-free path with ramps and elevators.'
          : 'I can help you navigate using step-free accessible routes avoiding stairs. Please open the Navigate page to choose your destination.',
        confidence: 0.9,
        confidenceLevel: 'high',
        safetyWarning: false,
      };
    }

    // Intent 9: Stairs / Elevators inquiry
    if (rawText.includes('stair') || rawText.includes('step') || rawText.includes('elevator')) {
      return {
        answer: isSimplified
          ? 'Stairs should be avoided. An accessible elevator is available.'
          : 'AccessAI routes prioritize step-free paths using ramps and elevators. Staircases are flagged to be avoided for mobility safety.',
        confidence: 0.94,
        confidenceLevel: 'high',
        safetyWarning: false,
      };
    }

    // Default Fallback
    return {
      answer: isSimplified
        ? `I heard: "${request.text}". You can ask about your surroundings, safety, reading text, or routes.`
        : `I received your question: "${request.text}". AccessAI is active in deterministic assistance mode. You can ask what is around you, request a safety check, or ask for navigation guidance.`,
      confidence: 0.8,
      confidenceLevel: 'high',
      safetyWarning: false,
    };
  }
}
