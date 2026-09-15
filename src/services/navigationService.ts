// Navigation Service - Accessible route planning, step-free navigation, and audio announcements
import { AccessibleRoute } from '../types';

export const ACCESSIBLE_ROUTES: Record<string, AccessibleRoute> = {
  'accessible-entrance': {
    id: 'accessible-entrance',
    destination: 'Accessible Main Entrance',
    distanceMeters: 120,
    durationMinutes: 2,
    stepFree: true,
    features: ['100% Step-Free', 'Tactile Paving', 'Wide Doors (95cm)', 'Audio Beacons'],
    tactilePaving: true,
    crowdLevel: 'low',
    lighting: 'bright',
    steps: [
      {
        id: 's1',
        instruction: 'Start from your current location',
        detail: 'Face north along the corridor. Yellow tactile guiding line is at your feet.',
        nodeType: 'start',
        distance: '15 m',
        isAccessible: true,
        audioAnnouncement: 'Start facing north along the corridor. Follow the tactile guiding line on the floor.',
      },
      {
        id: 's2',
        instruction: 'Approach Gentle Access Ramp',
        detail: '1:12 gradient with dual-height continuous handrails. Avoid the 4 steps on the right.',
        nodeType: 'ramp',
        distance: '35 m',
        isAccessible: true,
        audioAnnouncement: 'In 15 meters, take the gentle access ramp on your left. Dual handrails are present.',
      },
      {
        id: 's3',
        instruction: 'Take Elevator to Ground Floor',
        detail: 'Braille buttons, auditory floor announcements, and 120cm wide elevator car.',
        nodeType: 'elevator',
        distance: '40 m',
        isAccessible: true,
        audioAnnouncement: 'Enter Elevator B straight ahead. Press the ground floor button, which has raised Braille marking.',
      },
      {
        id: 's4',
        instruction: 'Arrive at Accessible Entrance',
        detail: 'Automatic motion-activated glass sliding doors with tactile door thresholds.',
        nodeType: 'destination',
        distance: '30 m',
        isAccessible: true,
        audioAnnouncement: 'You have arrived at the Accessible Main Entrance. Automatic doors will open ahead.',
      },
    ],
  },
  'accessible-restroom': {
    id: 'accessible-restroom',
    destination: 'Accessible Universal Restroom',
    distanceMeters: 85,
    durationMinutes: 1.5,
    stepFree: true,
    features: ['Step-Free', 'Emergency Cord', 'Automatic Door Opener', 'Grab Bars'],
    tactilePaving: true,
    crowdLevel: 'low',
    lighting: 'bright',
    steps: [
      {
        id: 'r1',
        instruction: 'Walk straight along East Wing corridor',
        detail: 'Wide unobstructed hallway with smooth non-slip vinyl flooring.',
        nodeType: 'hallway',
        distance: '45 m',
        isAccessible: true,
        audioAnnouncement: 'Walk straight along the East Wing corridor for 45 meters.',
      },
      {
        id: 'r2',
        instruction: 'Turn slightly left at corridor junction',
        detail: 'Wall tactile sign with Braille indicates Universal Restroom.',
        nodeType: 'door',
        distance: '25 m',
        isAccessible: true,
        audioAnnouncement: 'Turn slightly left at the junction. Braille indicator is at chest height on the left wall.',
      },
      {
        id: 'r3',
        instruction: 'Arrive at Accessible Restroom',
        detail: 'Push blue square button at 90cm to trigger motorized door.',
        nodeType: 'destination',
        distance: '15 m',
        isAccessible: true,
        audioAnnouncement: 'Accessible restroom reached. Push the large blue square button to unlock and open.',
      },
    ],
  },
  'elevator-concourse': {
    id: 'elevator-concourse',
    destination: 'Elevator Concourse B',
    distanceMeters: 45,
    durationMinutes: 1,
    stepFree: true,
    features: ['Step-Free', 'Audio Beacons', 'Voice Annunciators'],
    tactilePaving: true,
    crowdLevel: 'low',
    lighting: 'bright',
    steps: [
      {
        id: 'e1',
        instruction: 'Follow yellow tactile ground tiles',
        detail: 'Head south for 30 meters toward the central atrium.',
        nodeType: 'start',
        distance: '30 m',
        isAccessible: true,
        audioAnnouncement: 'Follow the tactile ground line straight for 30 meters.',
      },
      {
        id: 'e2',
        instruction: 'Reach Elevator Bank B',
        detail: 'Bank of 3 accessible elevators with audible arrival chimes.',
        nodeType: 'destination',
        distance: '15 m',
        isAccessible: true,
        audioAnnouncement: 'Elevator Bank B is on your right. Audible chimes will sound when cars arrive.',
      },
    ],
  },
};

class NavigationService {
  getRoutes(): AccessibleRoute[] {
    return Object.values(ACCESSIBLE_ROUTES);
  }

  getRoute(destinationKey: string): AccessibleRoute {
    return ACCESSIBLE_ROUTES[destinationKey] || ACCESSIBLE_ROUTES['accessible-entrance'];
  }
}

export const navigationService = new NavigationService();
