// Centralized, deterministic demo fixtures for AccessAI Interactive Demo Center
// Strictly realistic, repeatable, and grounded for industry hackathon evaluation

export interface DemoObjectItem {
  label: string;
  confidence: number;
  position: 'ahead' | 'left' | 'right' | 'below' | 'center';
  distance: string;
  details: string;
}

export interface DemoSafetyState {
  status: 'safe' | 'caution' | 'warning';
  title: string;
  message: string;
  confidence: number;
  confidenceLevel: 'high' | 'medium' | 'low';
}

export interface DemoWaypoint {
  id: string;
  title: string;
  instruction: string;
  distance: string;
  direction: 'straight' | 'left' | 'right' | 'destination';
  accessibility: string;
  eta: string;
  xPercent: number; // Floorplan SVG coordinate %
  yPercent: number; // Floorplan SVG coordinate %
}

export interface DemoVoiceQA {
  question: string;
  answer: string;
  confidence: number;
  confidenceLevel: 'high' | 'medium' | 'low';
  safetyWarning: boolean;
  simplified: string;
}

export interface JudgeStepData {
  stepNumber: number;
  totalSteps: number;
  title: string;
  capability: string;
  summary: string;
  details: string[];
  actionLabel: string;
  audioPrompt: string;
}

// 1. SCENARIO 1: STREET CROSSING FIXTURE
export const STREET_CROSSING_FIXTURE = {
  id: 'street-crossing',
  title: 'Street Crossing & Obstacle Awareness',
  category: 'Spatial Vision & Safety',
  accessibilityProblem:
    'Navigating complex outdoor intersections with blind spots, approaching vehicles, and curb hazards.',
  capabilities: ['Camera Capture', 'Gemini Vision AI', 'Spatial Depth Reasoning', 'Voice Guidance'],
  imageUrl: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=1200&q=80',
  description:
    'You are standing at a signalized pedestrian crossing on 4th Avenue. The pedestrian signal is showing WALK with 18 seconds remaining. A delivery van is stationary 4.2 meters to your left. A tactile curb ramp is directly ahead 0.8 meters away.',
  objects: [
    {
      label: 'Tactile Curb Ramp',
      confidence: 0.96,
      position: 'ahead',
      distance: '0.8m',
      details: 'Yellow truncated dome warning pavers, 1:12 slope',
    },
    {
      label: 'Pedestrian Signal',
      confidence: 0.98,
      position: 'ahead',
      distance: '6.0m',
      details: 'Illuminated green walking figure with 18s countdown',
    },
    {
      label: 'Delivery Van',
      confidence: 0.92,
      position: 'left',
      distance: '4.2m',
      details: 'Stationary behind painted white stop bar, engine idling',
    },
    {
      label: 'Pedestrian',
      confidence: 0.89,
      position: 'right',
      distance: '2.5m',
      details: 'Waiting on right sidewalk facing crossing',
    },
  ] as DemoObjectItem[],
  safety: {
    status: 'caution',
    title: 'Cross-Traffic Caution Notice',
    message:
      'Vehicle stationary 4.2m on left with engine running. Pedestrian walk signal confirmed active. Please verify cross-traffic pauses before stepping into the roadway.',
    confidence: 0.84,
    confidenceLevel: 'medium',
  } as DemoSafetyState,
  spokenGuidance:
    'Pedestrian signal is green with 18 seconds remaining. A vehicle is stationary on your left. Tactile curb ramp is directly ahead. Please verify cross-traffic before moving.',
};

// 2. SCENARIO 2: READING A SIGN FIXTURE
export const READING_SIGN_FIXTURE = {
  id: 'reading-sign',
  title: 'Reading a Sign & Document OCR',
  category: 'Multimodal OCR & Translation',
  accessibilityProblem:
    'Extracting mission-critical facility instructions, operating hours, and translating them into regional Indian languages.',
  capabilities: ['Multimodal OCR', 'Plain Text Simplification', 'Regional Translation', 'Text-to-Speech'],
  imageUrl: 'https://images.unsplash.com/photo-1541888946425-d0fbb186c5f7?auto=format&fit=crop&w=1200&q=80',
  extractedText: 'MAIN ENTRANCE\nOpen 9:00 AM – 6:00 PM\nReception →\nWheelchair Ramp on Left',
  detectedLanguage: 'en',
  confidence: 0.96,
  confidenceLevel: 'high' as const,
  simplified:
    'Main entrance open 9:00 AM to 6:00 PM. Reception is to the right. Wheelchair ramp is located on the left.',
  translations: {
    en: 'MAIN ENTRANCE\nOpen 9:00 AM – 6:00 PM\nReception →\nWheelchair Ramp on Left',
    ta: 'முதன்மை நுழைவாயில்\nதிறக்கும் நேரம்: காலை 9:00 – மாலை 6:00\nவரவேற்பறை →\nஇடதுபுறம் சக்கர நாற்காலி சாய்வுப் பாதை',
    hi: 'मुख्य प्रवेश द्वार\nसमय: सुबह 9:00 – शाम 6:00\nस्वागत कक्ष →\nबाईं ओर व्हीलचेयर रैंप',
    ml: 'പ്രധാന പ്രവേശന കവാടം\nപ്രവൃത്തി സമയം: രാവിലെ 9:00 – വൈകിട്ട് 6:00\nസ്വീകരണ മുറി →\nഇടതുവശത്ത് വീൽചെയർ റാമ്പ്',
    te: 'ప్రధాన ప్రవేశ ద్వారం\nతెరిచే సమయం: ఉదయం 9:00 – సాయంత్రం 6:00\nరిసెప్షన్ →\nఎడమవైపు వీల్ చైర్ ర్యాంప్',
  },
  spokenSummaries: {
    en: 'Main Entrance. Open 9:00 AM to 6:00 PM. Reception is to the right. Wheelchair ramp on left.',
    ta: 'முதன்மை நுழைவாயில். திறக்கும் நேரம் காலை 9 மணி முதல் மாலை 6 மணி வரை. வரவேற்பறை வலதுபுறம். சக்கர நாற்காலி பாதை இடதுபுறம்.',
    hi: 'मुख्य प्रवेश द्वार। समय सुबह 9 से शाम 6 बजे। स्वागत कक्ष दाईं ओर। व्हीलचेयर रैंप बाईं ओर।',
    ml: 'പ്രധാന പ്രവേശന കവാടം. രാവിലെ 9 മുതൽ വൈകിട്ട് 6 വരെ. റിസപ്ഷൻ വലതുവശത്ത്. വീൽചെയർ റാമ്പ് ഇടതുവശത്ത്.',
    te: 'ప్రధాన ప్రవేశ ద్వారం. ఉదయం 9 నుండి సాయంత్రం 6 వరకు. రిసెప్షన్ కుడివైపున. వీల్ చైర్ ర్యాంప్ ఎడమవైపున.',
  },
};

// 3. SCENARIO 3: ACCESSIBLE INDOOR NAVIGATION FIXTURE
export const NAVIGATION_FIXTURE = {
  id: 'indoor-navigation',
  title: 'Accessible Indoor Wayfinding',
  category: 'Step-Free Routing',
  accessibilityProblem:
    'Guiding wheelchair users and low-vision individuals through complex buildings via verified step-free corridors, ramps, and elevators.',
  capabilities: ['Indoor Graph Search', 'Stairs Avoidance', 'Audio Waypoints', 'Floorplan Visualization'],
  destination: 'Classroom 204 (Accessibility Center)',
  totalDistance: '82 meters',
  estimatedTime: '3.5 min',
  stepFree: true,
  waypoints: [
    {
      id: 'wp-1',
      title: 'Main Entrance Concourse',
      instruction: 'Start at Main Entrance. Proceed straight down the central corridor for 20 meters.',
      distance: '20m',
      direction: 'straight',
      accessibility: 'Level terrazzo floor with tactile paving guidance stripe',
      eta: '0 min',
      xPercent: 12,
      yPercent: 78,
    },
    {
      id: 'wp-2',
      title: 'West Wing Access Ramp',
      instruction: 'Approaching gentle 1:12 slope ramp on your left. Turn left to ascend.',
      distance: '15m',
      direction: 'left',
      accessibility: 'Verified ADA ramp with dual handrails and slip-resistant floor',
      eta: '1 min',
      xPercent: 32,
      yPercent: 55,
    },
    {
      id: 'wp-3',
      title: 'Elevator Concourse B',
      instruction: 'Enter Elevator B to the 2nd floor. Audio announcements and low Braille panel active.',
      distance: '12m',
      direction: 'straight',
      accessibility: 'Wide 110cm door opening, voice arrival chimes',
      eta: '2 min',
      xPercent: 52,
      yPercent: 35,
    },
    {
      id: 'wp-4',
      title: '2nd Floor North Corridor',
      instruction: 'Exit elevator and turn right. Continue straight down the quiet north corridor.',
      distance: '22m',
      direction: 'right',
      accessibility: 'Wide 2.4m corridor, high-contrast door frames',
      eta: '2.5 min',
      xPercent: 70,
      yPercent: 35,
    },
    {
      id: 'wp-5',
      title: 'Classroom 204 (Destination)',
      instruction: 'You have arrived at Classroom 204 on your left. Automatic push-button door entry.',
      distance: '13m',
      direction: 'destination',
      accessibility: 'Step-free entrance, acoustic door beacon',
      eta: '3.5 min',
      xPercent: 88,
      yPercent: 20,
    },
  ] as DemoWaypoint[],
};

// 4. SCENARIO 4: VOICE ASSISTANT QA FIXTURES
export const VOICE_QA_FIXTURES: Record<string, DemoVoiceQA> = {
  'what can you see': {
    question: 'What can you see?',
    answer:
      'I can see a bright entrance corridor with level tactile paving. To your left is an accessible ramp, and Elevator B is visible 35 meters straight ahead.',
    confidence: 0.95,
    confidenceLevel: 'high',
    safetyWarning: false,
    simplified: 'Hallway ahead. Ramp on left. Elevator straight ahead.',
  },
  'what should i be careful about': {
    question: 'What should I be careful about?',
    answer:
      'There is a utility cart parked on the right side of the corridor approximately 1.5 meters ahead. The main central pathway is clear, but please verify before moving.',
    confidence: 0.82,
    confidenceLevel: 'medium',
    safetyWarning: true,
    simplified: 'Utility cart on your right. Center path clear. Please check before moving.',
  },
  'read the sign': {
    question: 'Read the sign.',
    answer:
      'The sign reads: Main Entrance. Open 9:00 AM to 6:00 PM. Reception is to the right. Wheelchair ramp is located on the left.',
    confidence: 0.96,
    confidenceLevel: 'high',
    safetyWarning: false,
    simplified: 'Main entrance open 9 to 6. Reception right. Ramp left.',
  },
  'help me navigate': {
    question: 'Help me navigate.',
    answer:
      'I have planned a 100% step-free accessible route to Classroom 204 avoiding all stairs. Waypoint 1 is straight ahead down the central corridor.',
    confidence: 0.94,
    confidenceLevel: 'high',
    safetyWarning: false,
    simplified: 'Step-free route ready. Start by walking straight down the corridor.',
  },
  'what is around me': {
    question: 'What is around me?',
    answer:
      'You are in the ground floor main entrance hall. You have an access ramp 15 meters on your left, reception concourse to your right, and elevator access straight ahead.',
    confidence: 0.93,
    confidenceLevel: 'high',
    safetyWarning: false,
    simplified: 'Entrance hall. Ramp on left, reception on right, elevator ahead.',
  },
  'explain this simply': {
    question: 'Explain this simply.',
    answer:
      'Safe flat floor ahead. Ramp on your left. Elevator straight ahead. Stay in the center to avoid a cart on the right.',
    confidence: 0.97,
    confidenceLevel: 'high',
    safetyWarning: false,
    simplified: 'Flat floor. Ramp on left. Elevator ahead. Stay center.',
  },
};

// 5. SCENARIO 5: FULL MULTIMODAL JOURNEY PHASES
export const FULL_JOURNEY_STAGES = [
  {
    phase: 'SEE',
    title: '1. Vision Scan: Scene Grounding',
    category: 'Spatial Vision',
    icon: 'camera',
    description: 'User enters an unfamiliar public university building and lifts AccessAI to survey the scene.',
    result:
      'Vision AI identifies: Main concourse doorway ahead (3m), wheelchair access ramp on left, and a cleaning trolley on right.',
    badge: 'Vision Grounded',
    confidence: 0.94,
  },
  {
    phase: 'UNDERSTAND',
    title: '2. Safety Reasoning: Obstacle Verification',
    category: 'Safety Guard',
    icon: 'shield',
    description: 'System detects a cleaning trolley near the right walkway and issues a cautious guidance prompt.',
    result:
      'Safety Guard flags trolley obstacle 1.5m ahead on right. Advises maintaining central corridor alignment.',
    badge: 'Caution Alert Active',
    confidence: 0.84,
  },
  {
    phase: 'READ',
    title: '3. Multimodal OCR: Signage Extraction',
    category: 'OCR Reader',
    icon: 'file-text',
    description: 'User points camera at directional wall signage to confirm location.',
    result: 'OCR extracts: "MAIN ENTRANCE • Open 9:00 AM – 6:00 PM • Reception → • Wheelchair Ramp on Left"',
    badge: 'Text Extracted',
    confidence: 0.96,
  },
  {
    phase: 'TRANSLATE',
    title: '4. Regional Translation: Tamil Language',
    category: 'Translation',
    icon: 'languages',
    description: 'User requests Tamil translation. System produces natural phrasing preserving numbers and arrows.',
    result:
      'Translated: "முதன்மை நுழைவாயில் • திறக்கும் நேரம்: காலை 9:00 – மாலை 6:00 • வரவேற்பறை → • இடதுபுறம் சக்கர நாற்காலி சாய்வுப் பாதை"',
    badge: 'Tamil Native Audio',
    confidence: 0.95,
  },
  {
    phase: 'NAVIGATE',
    title: '5. Accessible Routing: Step-Free Path',
    category: 'Step-Free Navigation',
    icon: 'compass',
    description: 'User requests route to Classroom 204. Architectural graph bypasses 2 flights of stairs.',
    result: 'Route calculated: Main Entrance → West Ramp (1:12 slope) → Elevator B to Floor 2 → Classroom 204.',
    badge: '100% Step-Free',
    confidence: 0.98,
  },
  {
    phase: 'RESPOND',
    title: '6. Audio Guidance & Arrival',
    category: 'Voice Assistant',
    icon: 'volume-2',
    description: 'AccessAI delivers spoken arrival confirmation and provides audio push-button door guidance.',
    result: '"You have arrived at Classroom 204. Push-button automatic door opener is located 1 meter on your left."',
    badge: 'Journey Complete',
    confidence: 0.99,
  },
];

// 6. ONE-CLICK JUDGE GUIDED DEMO (7 STEPS)
export const JUDGE_DEMO_STEPS: JudgeStepData[] = [
  {
    stepNumber: 1,
    totalSteps: 7,
    title: 'Spatial Vision & Obstacle Detection',
    capability: 'Real Camera & Gemini Vision AI',
    summary:
      'AccessAI identifies objects in 3D space, estimates distances, and maps navigable paths in real time.',
    details: [
      'Live or simulated camera stream analysis',
      'Spatial classification: Pedestrians, vehicles, ramps, and doors',
      'Directional depth coordinates: (ahead, left, right, below)',
      'Grounding check: Zero visual hallucination when image is unavailable',
    ],
    actionLabel: 'Analyze Scene',
    audioPrompt: 'Step 1: Spatial Vision. AccessAI identifies obstacles and paths in real time.',
  },
  {
    stepNumber: 2,
    totalSteps: 7,
    title: 'Accessibility Safety Reasoning',
    capability: 'Confidence & Uncertainty Verification',
    summary:
      'AccessAI treats safety as a first-class feature, communicating calibrated confidence rather than false certainty.',
    details: [
      'Calibrated confidence levels: High (>=85%), Medium (60-84%), Low (<60%)',
      'Automated caution flags for moving vehicles and walkway obstructions',
      'Preserves human judgment: Always advises verification before moving',
      'Never makes false "100% safe" guarantees',
    ],
    actionLabel: 'Evaluate Safety Risk',
    audioPrompt: 'Step 2: Safety Reasoning. Cautious verification advice is generated.',
  },
  {
    stepNumber: 3,
    totalSteps: 7,
    title: 'Contextual Voice Assistant',
    capability: 'Conversational Multimodal AI',
    summary:
      'Natural voice dialog that uses live scene context to answer questions about the immediate environment.',
    details: [
      'Integrated with Web Speech API for voice in and audio out',
      'Scene-grounded conversational reasoning via Google Gemini',
      'Supports simplified phrasing for cognitive accessibility',
      'Fallback resilience: Works with typed questions if microphone is unavailable',
    ],
    actionLabel: 'Ask AccessAI',
    audioPrompt: 'Step 3: Conversational Voice. Context-aware natural speech answers.',
  },
  {
    stepNumber: 4,
    totalSteps: 7,
    title: 'Multimodal Document & Signage OCR',
    capability: 'High-Precision Text Extraction',
    summary:
      'Points camera at signs, labels, menus, or forms to extract faithful text with reading order intact.',
    details: [
      '1280px optimized image compression before upload',
      'Preserves numbers, prices, times, and platform numbers exactly',
      'Flags ambiguous text with [unclear] tags instead of guessing',
      'Zero visual hallucination when text is absent',
    ],
    actionLabel: 'Extract Sign Text',
    audioPrompt: 'Step 4: Optical Character Recognition. Reads signage with preserved numbers.',
  },
  {
    stepNumber: 5,
    totalSteps: 7,
    title: 'Multilingual Regional Translation',
    capability: 'Tamil, Hindi, Malayalam, Telugu',
    summary:
      'Instant translation into major Indian languages preserving numbers, units, and directions for audio read-aloud.',
    details: [
      'Target languages: English, Tamil, Hindi, Malayalam, Telugu',
      'Strict numerical invariance: ₹120, 7:30 PM, and Platform 2 remain untouched',
      'Native regional speech synthesis voices for audio playback',
      'Plain-language simplification toggle for complex official notices',
    ],
    actionLabel: 'Translate to Tamil',
    audioPrompt: 'Step 5: Regional Translation into Tamil with native voice synthesis.',
  },
  {
    stepNumber: 6,
    totalSteps: 7,
    title: 'Step-Free Accessible Navigation',
    capability: 'Architectural Graph & Stair Avoidance',
    summary:
      'Guiding users along 100% step-free routes incorporating ramps, elevators, and wide corridors.',
    details: [
      'Indoor waypoint graph avoiding staircases and narrow doors',
      'Turn-by-turn spoken prompts and visual architectural floorplan',
      'Tactile paving and Braille elevator button annotations',
      'Real-time waypoint progression controls (Next, Pause, Restart)',
    ],
    actionLabel: 'Start Navigation',
    audioPrompt: 'Step 6: Step-Free Navigation. Safe route calculated avoiding stairs.',
  },
  {
    stepNumber: 7,
    totalSteps: 7,
    title: 'Evaluation Summary & Impact',
    capability: 'SEE → UNDERSTAND → ASSIST → RESPOND',
    summary:
      'AccessAI unites vision, speech, OCR, translation, and navigation into one cohesive accessibility companion.',
    details: [
      'Production-ready TypeScript stack (React + Vite + Express + Node)',
      'Strict Gemini-only AI architecture with zero external secrets in browser',
      '100% fail-safe deterministic offline fallbacks for guaranteed hackathon demos',
      'Universal design compliant: High contrast, screen reader ready, mobile responsive',
    ],
    actionLabel: 'Complete Evaluation',
    audioPrompt: 'Step 7: Evaluation Complete. AccessAI connects all 5 capabilities.',
  },
];
