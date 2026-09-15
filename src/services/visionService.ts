// Vision Service - Scene analysis, object detection bounding boxes, and spatial reasoning
import { CameraScene } from '../types';

export const DEMO_SCENES: CameraScene[] = [
  {
    id: 'office-hallway',
    name: 'Indoor Office Corridor',
    description: 'Bright office hallway with doors, chairs, and walking path',
    category: 'indoor',
    imageUrl: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1200&q=80',
    detectedObjects: [
      {
        id: 'obj-door',
        label: 'Doorway',
        confidence: 97,
        box: { top: 22, left: 38, width: 24, height: 56 },
        distanceMeters: 3.0,
        direction: 'ahead',
        dangerLevel: 'safe',
        details: 'Automatic push-button accessible double doors, currently closed.',
      },
      {
        id: 'obj-person',
        label: 'Person',
        confidence: 94,
        box: { top: 32, left: 16, width: 14, height: 48 },
        distanceMeters: 2.2,
        direction: 'left',
        dangerLevel: 'safe',
        details: 'Standing near hallway wall, moving slowly forward.',
      },
      {
        id: 'obj-chair',
        label: 'Chair',
        confidence: 91,
        box: { top: 58, left: 68, width: 22, height: 32 },
        distanceMeters: 1.8,
        direction: 'right',
        dangerLevel: 'caution',
        details: 'Office swivel chair slightly protruding into the walkway.',
      },
      {
        id: 'obj-obstacle',
        label: 'Possible Obstacle (Cart)',
        confidence: 84,
        box: { top: 62, left: 42, width: 18, height: 26 },
        distanceMeters: 1.5,
        direction: 'center',
        dangerLevel: 'warning',
        details: 'Low utility cleaning trolley directly in your central walking path.',
      },
    ],
    aiOverview: 'I can see a doorway approximately 3 meters ahead. A person is standing to your left about 2.2 meters away. There is a chair slightly to your right and a low trolley obstacle near the center of your path.',
    safetyAlert: {
      type: 'warning',
      text: 'An object (cleaning cart) may be blocking your path approximately 1.5 meters ahead. Medium confidence. Please verify before moving.',
      confidence: 'medium',
      verifiedNeeded: true,
    },
  },
  {
    id: 'street-crosswalk',
    name: 'City Street Crosswalk',
    description: 'Urban intersection with marked pedestrian crossing and tactile curb',
    category: 'outdoor',
    imageUrl: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=1200&q=80',
    detectedObjects: [
      {
        id: 'obj-crosswalk',
        label: 'Pedestrian Crosswalk',
        confidence: 96,
        box: { top: 55, left: 15, width: 70, height: 40 },
        distanceMeters: 1.0,
        direction: 'ahead',
        dangerLevel: 'safe',
        details: 'White zebra stripes clearly painted on asphalt with tactile curb ramp.',
      },
      {
        id: 'obj-light',
        label: 'Pedestrian Signal (Walk)',
        confidence: 98,
        box: { top: 12, left: 72, width: 12, height: 22 },
        distanceMeters: 8.0,
        direction: 'right',
        dangerLevel: 'safe',
        details: 'Illuminated walking figure sign with countdown timer.',
      },
      {
        id: 'obj-vehicle',
        label: 'Stopped Vehicle',
        confidence: 92,
        box: { top: 40, left: 4, width: 28, height: 35 },
        distanceMeters: 4.5,
        direction: 'left',
        dangerLevel: 'caution',
        details: 'Silver sedan stopped completely behind the white stop line.',
      },
      {
        id: 'obj-curb',
        label: 'Curb Ramp (Drop)',
        confidence: 95,
        box: { top: 78, left: 32, width: 36, height: 18 },
        distanceMeters: 0.8,
        direction: 'below',
        dangerLevel: 'safe',
        details: 'Gentle curb drop slope equipped with yellow tactile warning tiles.',
      },
    ],
    aiOverview: 'You are at a marked pedestrian crosswalk. The pedestrian signal is green for walking. A vehicle is stationary on your left behind the line. A tactile curb ramp is directly in front of your feet.',
    safetyAlert: {
      type: 'caution',
      text: 'Crosswalk is active and vehicle is stationary. Stay within the tactile crossing path.',
      confidence: 'high',
      verifiedNeeded: false,
    },
  },
  {
    id: 'cafe-interior',
    name: 'Coffee Shop & Order Counter',
    description: 'Indoor cafe with ordering counter, seating, and pickup zone',
    category: 'dining',
    imageUrl: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&w=1200&q=80',
    detectedObjects: [
      {
        id: 'obj-counter',
        label: 'Order Counter',
        confidence: 96,
        box: { top: 35, left: 30, width: 45, height: 45 },
        distanceMeters: 2.8,
        direction: 'ahead',
        dangerLevel: 'safe',
        details: 'Wooden service counter with POS terminal and accessible lowered section.',
      },
      {
        id: 'obj-table',
        label: 'Available Table',
        confidence: 91,
        box: { top: 52, left: 5, width: 26, height: 38 },
        distanceMeters: 1.6,
        direction: 'left',
        dangerLevel: 'safe',
        details: 'Low round wooden table with two clear chairs, wheelchair accessible.',
      },
      {
        id: 'obj-barrier',
        label: 'Queue Stanchion Pole',
        confidence: 89,
        box: { top: 48, left: 75, width: 14, height: 42 },
        distanceMeters: 2.0,
        direction: 'right',
        dangerLevel: 'caution',
        details: 'Velvet queue rope pole positioned on the right boundary.',
      },
    ],
    aiOverview: 'Order counter is directly ahead about 2.8 meters with a lowered accessible section. An empty table is available on your left 1.6 meters away. A queue guide pole is to your right.',
  },
  {
    id: 'subway-station',
    name: 'Accessible Transit Station',
    description: 'Metro station concourse with tactile guide strips and fare gates',
    category: 'transit',
    imageUrl: 'https://images.unsplash.com/photo-1517649763962-0c623266ddc0?auto=format&fit=crop&w=1200&q=80',
    detectedObjects: [
      {
        id: 'obj-tactile',
        label: 'Tactile Ground Surface',
        confidence: 98,
        box: { top: 68, left: 35, width: 30, height: 30 },
        distanceMeters: 0.5,
        direction: 'below',
        dangerLevel: 'safe',
        details: 'Raised directional yellow linear tiles leading toward the accessible gate.',
      },
      {
        id: 'obj-gate',
        label: 'Wide Accessible Gate B',
        confidence: 95,
        box: { top: 30, left: 45, width: 32, height: 50 },
        distanceMeters: 4.2,
        direction: 'ahead',
        dangerLevel: 'safe',
        details: 'Extra-wide glass fare gate with tap sensor at 90cm height.',
      },
      {
        id: 'obj-stairs',
        label: 'Staircase (Avoid)',
        confidence: 93,
        box: { top: 34, left: 10, width: 25, height: 45 },
        distanceMeters: 3.5,
        direction: 'left',
        dangerLevel: 'warning',
        details: 'Down-going stairs without tactile warning strip. Elevator is to the right.',
      },
    ],
    aiOverview: 'Tactile directional tiles are directly beneath you leading straight to Wide Accessible Gate B. Avoid the stairs on the left; the accessible elevator is located 6 meters to your right.',
    safetyAlert: {
      type: 'warning',
      text: 'Descending stairs detected on your left. Please maintain your route along the tactile paving.',
      confidence: 'high',
      verifiedNeeded: false,
    },
  },
];

class VisionService {
  getScenes(): CameraScene[] {
    return DEMO_SCENES;
  }

  getSceneById(id: string): CameraScene {
    return DEMO_SCENES.find((s) => s.id === id) || DEMO_SCENES[0];
  }

  simulateScan(scene: CameraScene): Promise<{
    scene: CameraScene;
    confidenceSummary: string;
    detectionCount: number;
  }> {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          scene,
          confidenceSummary: 'Visual analysis complete with high safety confidence.',
          detectionCount: scene.detectedObjects.length,
        });
      }, 750);
    });
  }

  answerSceneQuestion(scene: CameraScene, question: string): {
    answer: string;
    confidence: 'high' | 'medium' | 'low';
    safetyNotice?: string;
  } {
    const q = question.toLowerCase();

    if (q.includes('careful') || q.includes('obstacle') || q.includes('hazard') || q.includes('danger') || q.includes('safety')) {
      const cautionObjects = scene.detectedObjects.filter((o) => o.dangerLevel !== 'safe');
      if (cautionObjects.length > 0) {
        const top = cautionObjects[0];
        return {
          answer: `There is a ${top.label} ${top.direction} approximately ${top.distanceMeters} meters away. ${top.details}`,
          confidence: 'medium',
          safetyNotice: 'Medium confidence. Please verify before moving.',
        };
      }
      return {
        answer: 'The path directly ahead appears clear of major obstacles within 2 meters.',
        confidence: 'high',
      };
    }

    if (q.includes('door') || q.includes('exit') || q.includes('entrance')) {
      const door = scene.detectedObjects.find((o) => o.label.toLowerCase().includes('door') || o.label.toLowerCase().includes('gate'));
      if (door) {
        return {
          answer: `I found a ${door.label} located ${door.direction}, roughly ${door.distanceMeters} meters away. ${door.details || ''}`,
          confidence: 'high',
        };
      }
    }

    if (q.includes('chair') || q.includes('sit') || q.includes('table')) {
      const seating = scene.detectedObjects.find((o) => o.label.toLowerCase().includes('chair') || o.label.toLowerCase().includes('table'));
      if (seating) {
        return {
          answer: `I see a ${seating.label} on your ${seating.direction} at a distance of ${seating.distanceMeters} meters.`,
          confidence: 'high',
        };
      }
    }

    if (q.includes('person') || q.includes('people') || q.includes('anyone')) {
      const person = scene.detectedObjects.find((o) => o.label.toLowerCase().includes('person'));
      if (person) {
        return {
          answer: `A person is located on your ${person.direction} at approximately ${person.distanceMeters} meters.`,
          confidence: 'high',
        };
      }
      return {
        answer: 'I do not detect any individuals in your immediate field of vision.',
        confidence: 'high',
      };
    }

    // Default general response
    return {
      answer: scene.aiOverview,
      confidence: 'high',
    };
  }
}

export const visionService = new VisionService();
