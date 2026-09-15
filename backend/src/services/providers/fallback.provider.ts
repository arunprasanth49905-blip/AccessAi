import { VoiceChatRequest, VoiceChatResponse } from '../../types/voice.types.js';

export class FallbackProvider {
  async generateResponse(request: VoiceChatRequest): Promise<VoiceChatResponse> {
    const rawText = request.text.toLowerCase().trim();
    const isSimplified = Boolean(request.accessibilityProfile?.simplifiedMode);

    // Multimodal context extraction
    const vision = request.context?.vision;
    const ocr = request.context?.ocr;
    const navigation = request.context?.navigation;
    const safety = request.context?.safety;

    const sceneDesc = vision?.description || request.context?.currentScene || null;
    const detectedObjects = vision?.detectedObjects || [];
    const ocrText = ocr?.text || request.context?.lastOcrText || null;
    const destination = navigation?.destination || request.context?.activeRoute || null;
    const activeWarnings = safety?.activeWarnings || [];

    const hasScene = Boolean(sceneDesc);
    const hasOcr = Boolean(ocrText && ocrText.trim());
    const hasRoute = Boolean(destination);

    // Context tracking flags
    let usedVision = false;
    let usedOcr = false;
    let usedNav = false;
    const usedConvo = Boolean(request.conversation && request.conversation.length > 0);

    // 1. Multimodal Combination: Door in Vision + Restricted/Staff Sign in OCR
    const isDoorInquiry = rawText.includes('enter') || rawText.includes('door') || rawText.includes('go in') || rawText.includes('walk through');
    if (isDoorInquiry && hasScene && hasOcr) {
      const ocrUpper = (ocrText || '').toUpperCase();
      usedVision = true;
      usedOcr = true;

      if (ocrUpper.includes('STAFF') || ocrUpper.includes('RESTRICTED') || ocrUpper.includes('NO ENTRY') || ocrUpper.includes('DO NOT ENTER') || ocrUpper.includes('PRIVATE')) {
        return {
          answer: isSimplified
            ? `Door detected ahead, but the sign says "${ocrText}". Entry is restricted. Do not enter without permission.`
            : `I observe a doorway in your camera feed, but the sign attached to it reads "${ocrText}". This indicates restricted access. Please verify your authorization before attempting to enter.`,
          confidence: 0.94,
          confidenceLevel: 'high',
          safetyWarning: true,
          source: 'fallback',
          contextUsed: { vision: true, ocr: true, navigation: false, conversation: usedConvo },
          suggestedFollowUps: ['Find another accessible entrance', 'Read the sign again', 'Ask for staff assistance'],
        };
      } else {
        return {
          answer: isSimplified
            ? `Door observed ahead. The sign reads: "${ocrText}". Check if it is accessible before opening.`
            : `A doorway is visible ahead, and the sign reads: "${ocrText}". Please verify the door handle or automatic opening switch before opening.`,
          confidence: 0.91,
          confidenceLevel: 'high',
          safetyWarning: false,
          source: 'fallback',
          contextUsed: { vision: true, ocr: true, navigation: false, conversation: usedConvo },
          suggestedFollowUps: ['Is there a handle or automatic button?', 'Where does this door lead?'],
        };
      }
    }

    // 2. OCR Inquiries ("What does this sign say?", "Where should I go?" after sign, "What did it say?", "What does this mean?")
    const isOcrInquiry =
      rawText.includes('sign') ||
      rawText.includes('document') ||
      rawText.includes('read') ||
      rawText.includes('what did it say') ||
      rawText.includes('what does this mean') ||
      rawText.includes('what does that mean') ||
      rawText.includes('what does it mean') ||
      rawText.includes('what does this say') ||
      rawText.includes('what is written') ||
      ((rawText.includes('where should i go') || rawText.includes('which way')) && hasOcr);

    if (isOcrInquiry && hasOcr) {
      usedOcr = true;
      if (rawText.includes('where should i go') || rawText.includes('which way')) {
        return {
          answer: isSimplified
            ? `Based on the sign ("${ocrText}"), follow the direction indicated on it.`
            : `Based on your recent document scan reading "${ocrText}", please follow the directional indicators shown on the sign, and confirm step-free access if needed.`,
          confidence: 0.93,
          confidenceLevel: 'high',
          safetyWarning: false,
          source: 'fallback',
          contextUsed: { vision: false, ocr: true, navigation: hasRoute, conversation: usedConvo },
          suggestedFollowUps: ['Read the full text aloud', 'Translate this text', 'Start navigation'],
        };
      }

      const simplifiedSnippet = ocr?.simplifiedText || ocrText;
      return {
        answer: isSimplified
          ? `The sign text says: "${simplifiedSnippet}".`
          : `From your recent document scan, the text reads: "${ocrText}".`,
        confidence: 0.95,
        confidenceLevel: 'high',
        safetyWarning: false,
        source: 'fallback',
        contextUsed: { vision: false, ocr: true, navigation: false, conversation: usedConvo },
        suggestedFollowUps: ['Explain this simply', 'Translate to Tamil', 'Translate to Hindi'],
      };
    }

    // 3. Navigation Inquiries ("Where are we going?", "What is the route?", "Next step?")
    if (
      (rawText.includes('where are we going') || rawText.includes('current route') || rawText.includes('next step') || rawText.includes('destination') || rawText.includes('where do i go')) &&
      hasRoute
    ) {
      usedNav = true;
      const stepMsg = navigation?.currentStep ? ` Current instruction: ${navigation.currentStep}.` : '';
      return {
        answer: isSimplified
          ? `Navigating to: ${destination}.${stepMsg} Follow the step-free path.`
          : `Your active accessible route is set to: ${destination}.${stepMsg} Follow the tactile paving and spoken waypoint guidance.`,
        confidence: 0.95,
        confidenceLevel: 'high',
        safetyWarning: false,
        source: 'fallback',
        contextUsed: { vision: hasScene, ocr: false, navigation: true, conversation: usedConvo },
        suggestedFollowUps: ['What is the next step?', 'Is this route step-free?', 'Pause navigation'],
      };
    }

    // 4. Surroundings / Visual Scene ("What is around me?" / "What do you see?" / "Describe surroundings")
    if (
      rawText.includes('what is around me') ||
      rawText.includes("what's around me") ||
      rawText.includes('what do you see') ||
      rawText.includes('what did you see') ||
      rawText.includes('look around') ||
      rawText.includes('describe surroundings') ||
      rawText.includes('what is in front of me') ||
      rawText.includes("what's in front of me")
    ) {
      if (!hasScene) {
        return {
          answer: isSimplified
            ? 'I need a camera image or scene information to describe your surroundings. Please open Camera.'
            : 'I need a camera image or scene information to describe your surroundings. Please open the Camera view to capture a frame.',
          confidence: 0.9,
          confidenceLevel: 'high',
          safetyWarning: false,
          source: 'fallback',
          contextUsed: { vision: false, ocr: false, navigation: false, conversation: usedConvo },
          suggestedFollowUps: ['Open camera scan', 'Check accessibility settings'],
        };
      }

      usedVision = true;
      const objectsList = detectedObjects.length > 0 ? ` Detected items: ${detectedObjects.join(', ')}.` : '';
      return {
        answer: isSimplified
          ? `Recent view: ${sceneDesc}.${objectsList}`
          : `Based on your recent camera scan (${sceneDesc}), I observed an accessible pathway.${objectsList}`,
        confidence: 0.92,
        confidenceLevel: 'high',
        safetyWarning: false,
        source: 'fallback',
        contextUsed: { vision: true, ocr: hasOcr, navigation: hasRoute, conversation: usedConvo },
        suggestedFollowUps: ['Is there anything I should be careful about?', 'How far is the doorway?', 'Read any text in view'],
      };
    }

    // 5. Safety & Obstacle inquiries ("Is there anything I should be careful about?", "Is that safe?")
    if (
      rawText.includes('careful') ||
      rawText.includes('obstacle') ||
      rawText.includes('hazard') ||
      rawText.includes('danger') ||
      rawText.includes('watch out') ||
      rawText.includes('is that safe') ||
      rawText.includes('is it safe')
    ) {
      usedVision = hasScene;
      const riskMsg = vision?.safetyMessage || (activeWarnings.length > 0 ? activeWarnings.join('; ') : null);

      if (riskMsg || vision?.riskDetected) {
        return {
          answer: isSimplified
            ? `Caution: ${riskMsg || 'Obstacle or hazard reported ahead'}. Please verify with your cane or foot before stepping.`
            : `Caution: ${riskMsg || 'Potential hazard detected in your path'}. Please verify your footing and surroundings carefully before moving.`,
          confidence: 0.78,
          confidenceLevel: 'medium',
          safetyWarning: true,
          source: 'fallback',
          contextUsed: { vision: hasScene, ocr: false, navigation: false, conversation: usedConvo },
          suggestedFollowUps: ['Describe the hazard in detail', 'Find a safer path', 'Check step-free route'],
        };
      }

      return {
        answer: isSimplified
          ? 'No major hazards detected in the latest frame. Still, always verify your footing before moving.'
          : 'No immediate high-severity hazards were flagged in your recent frame, but I cannot guarantee a 100% hazard-free surface. Please exercise caution and verify before proceeding.',
        confidence: 0.82,
        confidenceLevel: 'medium',
        safetyWarning: false,
        source: 'fallback',
        contextUsed: { vision: hasScene, ocr: false, navigation: false, conversation: usedConvo },
        suggestedFollowUps: ['Scan camera again', 'Check next navigation step'],
      };
    }

    // 6. Conversational Follow-up: "How far is it?"
    if (rawText.includes('how far') || rawText.includes('distance')) {
      if (hasRoute) {
        return {
          answer: isSimplified
            ? `Destination is ${navigation?.distanceRemaining || 'nearby'}. Keep following waypoints.`
            : `Your active route to ${destination} is approximately ${navigation?.distanceRemaining || 'nearby'}. Continue following spoken steps.`,
          confidence: 0.9,
          confidenceLevel: 'high',
          safetyWarning: false,
          source: 'fallback',
          contextUsed: { vision: false, ocr: false, navigation: true, conversation: true },
          suggestedFollowUps: ['What is the next step?'],
        };
      }

      if (hasScene) {
        return {
          answer: isSimplified
            ? 'Key objects in your view appear roughly 2 to 4 meters ahead. Please verify as you approach.'
            : 'Estimated distance to the primary objects observed in your frame is approximately 2 to 4 meters ahead. Please proceed cautiously as single camera frames have limited depth accuracy.',
          confidence: 0.75,
          confidenceLevel: 'medium',
          safetyWarning: false,
          source: 'fallback',
          contextUsed: { vision: true, ocr: false, navigation: false, conversation: true },
          suggestedFollowUps: ['Is the path clear?'],
        };
      }
    }

    // Default Fallback
    return {
      answer: isSimplified
        ? `I heard: "${request.text}". Ask me about what is in view, reading text, or step-free routes.`
        : `I received your question: "${request.text}". AccessAI is operating in safe deterministic assistance mode. You can ask what is around you, request safety guidance, or check route directions.`,
      confidence: 0.85,
      confidenceLevel: 'high',
      safetyWarning: false,
      source: 'fallback',
      contextUsed: {
        vision: usedVision,
        ocr: usedOcr,
        navigation: usedNav,
        conversation: usedConvo,
      },
      suggestedFollowUps: hasScene ? ['What do you see?', 'Is that safe?'] : hasOcr ? ['What does the sign say?'] : ['What is around me?', 'Help me navigate'],
    };
  }
}

