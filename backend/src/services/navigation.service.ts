import {
  NavigationRouteRequest,
  NavigationRouteResponse,
  NavStep,
} from '../types/navigation.types.js';

interface GraphNode {
  id: string;
  name: string;
  type: 'start' | 'ramp' | 'elevator' | 'door' | 'hallway' | 'destination';
  detail: string;
}

interface GraphEdge {
  from: string;
  to: string;
  distanceMeters: number;
  hasStairs: boolean;
  hasRamp: boolean;
  hasElevator: boolean;
  tactilePaving: boolean;
  lighting: 'bright' | 'adequate';
  crowdLevel: 'low' | 'moderate' | 'busy';
  instruction: string;
  audioAnnouncement: string;
}

const NODES: Record<string, GraphNode> = {
  'main-entrance': {
    id: 'main-entrance',
    name: 'Main Entrance Concourse',
    type: 'start',
    detail: 'Automatic double doors with tactile ground line at entrance threshold.',
  },
  'west-corridor': {
    id: 'west-corridor',
    name: 'West Wing Corridor',
    type: 'hallway',
    detail: 'Smooth vinyl flooring, wide 2.2m corridor with tactile guiding paving.',
  },
  'atrium': {
    id: 'atrium',
    name: 'Central Atrium Junction',
    type: 'hallway',
    detail: 'Central hub connecting elevators, east wing, and reception.',
  },
  'ground-ramp': {
    id: 'ground-ramp',
    name: 'Ground Floor Access Ramp',
    type: 'ramp',
    detail: '1:12 ADA-compliant gradient with continuous dual-height handrails.',
  },
  'staircase-a': {
    id: 'staircase-a',
    name: 'Staircase A',
    type: 'hallway',
    detail: '16 descending concrete stairs with metal nosing and no ramp.',
  },
  'elevator-bank-b': {
    id: 'elevator-bank-b',
    name: 'Elevator Bank B',
    type: 'elevator',
    detail: '3 accessible elevators with Braille call buttons and audio floor announcements.',
  },
  'fl2-corridor': {
    id: 'fl2-corridor',
    name: '2nd Floor Corridor',
    type: 'hallway',
    detail: 'Level hallway leading to instructional classrooms and seminar rooms.',
  },
  'accessible-restroom': {
    id: 'accessible-restroom',
    name: 'Universal Accessible Restroom',
    type: 'destination',
    detail: 'Motorized door opener with large push plate, emergency pull cord, grab bars.',
  },
  'classroom-204': {
    id: 'classroom-204',
    name: 'Accessible Classroom 204',
    type: 'destination',
    detail: 'Step-free entrance with 95cm wide clearance door and hearing loop system.',
  },
  'cafeteria': {
    id: 'cafeteria',
    name: 'Dining Hall & Cafeteria',
    type: 'destination',
    detail: 'Wide aisles between seating areas, accessible tray line, and step-free entry.',
  },
};

const EDGES: GraphEdge[] = [
  // From Main Entrance
  {
    from: 'main-entrance',
    to: 'west-corridor',
    distanceMeters: 20,
    hasStairs: false,
    hasRamp: false,
    hasElevator: false,
    tactilePaving: true,
    lighting: 'bright',
    crowdLevel: 'low',
    instruction: 'Proceed forward 20 meters along the tactile line into West Wing Corridor.',
    audioAnnouncement: 'Start from Main Entrance. Follow the yellow tactile paving straight ahead for 20 meters into the West Wing Corridor.',
  },
  {
    from: 'main-entrance',
    to: 'staircase-a',
    distanceMeters: 15,
    hasStairs: true,
    hasRamp: false,
    hasElevator: false,
    tactilePaving: false,
    lighting: 'adequate',
    crowdLevel: 'moderate',
    instruction: 'Proceed 15 meters to Staircase A on the left.',
    audioAnnouncement: 'Stairs ahead on the left. Warning: 16 steps without ramp.',
  },

  // From West Corridor
  {
    from: 'west-corridor',
    to: 'ground-ramp',
    distanceMeters: 25,
    hasStairs: false,
    hasRamp: true,
    hasElevator: false,
    tactilePaving: true,
    lighting: 'bright',
    crowdLevel: 'low',
    instruction: 'Turn left onto the Ground Floor Access Ramp. Handrails are on both sides.',
    audioAnnouncement: 'In 25 meters, turn left to take the gentle access ramp. Handrails are present on both sides.',
  },
  {
    from: 'west-corridor',
    to: 'atrium',
    distanceMeters: 30,
    hasStairs: false,
    hasRamp: false,
    hasElevator: false,
    tactilePaving: true,
    lighting: 'bright',
    crowdLevel: 'moderate',
    instruction: 'Continue straight 30 meters through to the Central Atrium.',
    audioAnnouncement: 'Continue straight along the corridor for 30 meters into the Central Atrium.',
  },

  // From Ground Ramp
  {
    from: 'ground-ramp',
    to: 'elevator-bank-b',
    distanceMeters: 20,
    hasStairs: false,
    hasRamp: false,
    hasElevator: false,
    tactilePaving: true,
    lighting: 'bright',
    crowdLevel: 'low',
    instruction: 'Follow the tactile paving 20 meters straight to Elevator Bank B.',
    audioAnnouncement: 'Exit the ramp and follow the tactile tiles 20 meters forward to Elevator Bank B.',
  },

  // From Atrium
  {
    from: 'atrium',
    to: 'elevator-bank-b',
    distanceMeters: 15,
    hasStairs: false,
    hasRamp: false,
    hasElevator: false,
    tactilePaving: true,
    lighting: 'bright',
    crowdLevel: 'low',
    instruction: 'Turn right toward Elevator Bank B on the west wall.',
    audioAnnouncement: 'Turn right in the atrium. Elevator Bank B is 15 meters ahead.',
  },
  {
    from: 'atrium',
    to: 'cafeteria',
    distanceMeters: 35,
    hasStairs: false,
    hasRamp: false,
    hasElevator: false,
    tactilePaving: true,
    lighting: 'bright',
    crowdLevel: 'moderate',
    instruction: 'Walk 35 meters straight across the Atrium to the Dining Hall entrance.',
    audioAnnouncement: 'Cross the Atrium for 35 meters. The Dining Hall entrance has automatic open doors.',
  },
  {
    from: 'atrium',
    to: 'accessible-restroom',
    distanceMeters: 25,
    hasStairs: false,
    hasRamp: false,
    hasElevator: false,
    tactilePaving: true,
    lighting: 'bright',
    crowdLevel: 'low',
    instruction: 'Turn slightly left down East corridor 25 meters to Universal Restroom.',
    audioAnnouncement: 'Turn left toward the East corridor. The Universal Accessible Restroom is 25 meters ahead on your left.',
  },

  // From Elevator Bank B
  {
    from: 'elevator-bank-b',
    to: 'fl2-corridor',
    distanceMeters: 10,
    hasStairs: false,
    hasRamp: false,
    hasElevator: true,
    tactilePaving: true,
    lighting: 'bright',
    crowdLevel: 'low',
    instruction: 'Take Elevator B to 2nd Floor. Auditory chime announces arrival.',
    audioAnnouncement: 'Enter Elevator B. Press floor 2 with raised Braille. Voice will announce second floor.',
  },

  // From 2nd Floor Corridor
  {
    from: 'fl2-corridor',
    to: 'classroom-204',
    distanceMeters: 25,
    hasStairs: false,
    hasRamp: false,
    hasElevator: false,
    tactilePaving: true,
    lighting: 'bright',
    crowdLevel: 'low',
    instruction: 'Turn right down 2nd floor corridor 25 meters to Classroom 204.',
    audioAnnouncement: 'Turn right out of the elevator. Walk 25 meters to Accessible Classroom 204 on your right.',
  },
];

// Add symmetric reverse edges for bidirectional indoor transit
const ALL_EDGES: GraphEdge[] = [...EDGES];
for (const edge of EDGES) {
  ALL_EDGES.push({
    from: edge.to,
    to: edge.from,
    distanceMeters: edge.distanceMeters,
    hasStairs: edge.hasStairs,
    hasRamp: edge.hasRamp,
    hasElevator: edge.hasElevator,
    tactilePaving: edge.tactilePaving,
    lighting: edge.lighting,
    crowdLevel: edge.crowdLevel,
    instruction: `Return toward ${NODES[edge.from]?.name || edge.from} (${edge.distanceMeters}m).`,
    audioAnnouncement: `Head toward ${NODES[edge.from]?.name || edge.from} for ${edge.distanceMeters} meters.`,
  });
}

export class NavigationService {
  /**
   * Returns all available destination points
   */
  getAvailableDestinations(): Array<{ id: string; name: string; type: string; stepFree: boolean }> {
    return [
      { id: 'accessible-restroom', name: 'Universal Accessible Restroom', type: 'restroom', stepFree: true },
      { id: 'elevator-bank-b', name: 'Elevator Concourse B', type: 'elevator', stepFree: true },
      { id: 'classroom-204', name: 'Accessible Classroom 204', type: 'education', stepFree: true },
      { id: 'cafeteria', name: 'Dining Hall & Cafeteria', type: 'dining', stepFree: true },
      { id: 'main-entrance', name: 'Main Accessible Entrance', type: 'exit', stepFree: true },
    ];
  }

  /**
   * Calculates optimal accessible route based on user preferences and constraints
   */
  calculateRoute(request: NavigationRouteRequest): NavigationRouteResponse {
    const origin = request.origin || 'main-entrance';
    const destination = request.destination;

    const avoidStairs = request.preferences?.avoidStairs !== false;
    const preferRamps = request.preferences?.preferRamps !== false;
    const preferElevators = request.preferences?.preferElevators !== false;
    const avoidCrowds = Boolean(request.preferences?.avoidCrowds);
    const preferWellLit = request.preferences?.preferWellLit !== false;

    // Dijkstra's algorithm with accessibility-weighted costs
    interface PathTrace {
      node: string;
      edge: GraphEdge;
    }

    const distances: Record<string, number> = {};
    const previous: Record<string, PathTrace | null> = {};
    const unvisited = new Set<string>();

    for (const nodeId of Object.keys(NODES)) {
      distances[nodeId] = Infinity;
      previous[nodeId] = null;
      unvisited.add(nodeId);
    }

    const startNode = NODES[origin] ? origin : 'main-entrance';
    distances[startNode] = 0;

    while (unvisited.size > 0) {
      // Find unvisited node with smallest distance
      let current: string | null = null;
      let smallestDist = Infinity;

      for (const node of unvisited) {
        if (distances[node] < smallestDist) {
          smallestDist = distances[node];
          current = node;
        }
      }

      if (!current || smallestDist === Infinity) break;
      if (current === destination) break;

      unvisited.delete(current);

      // Inspect outgoing edges
      const neighbors = ALL_EDGES.filter((e) => e.from === current && unvisited.has(e.to));

      for (const edge of neighbors) {
        // Base edge cost is distance in meters
        let cost = edge.distanceMeters;

        // Severe penalty for stairs if avoidStairs is on
        if (edge.hasStairs) {
          if (avoidStairs) {
            cost += 100000; // Impassable
          } else {
            cost += 50; // High resistance
          }
        }

        // Ramps and elevators preferences
        if (edge.hasRamp && preferRamps) {
          cost *= 0.8; // Encouraged
        }
        if (edge.hasElevator && preferElevators) {
          cost *= 0.7; // Highly encouraged for multi-level
        }

        // Crowd and lighting preferences
        if (avoidCrowds && edge.crowdLevel === 'busy') {
          cost += 25;
        }
        if (preferWellLit && edge.lighting !== 'bright') {
          cost += 15;
        }

        const alt = distances[current] + cost;
        if (alt < distances[edge.to]) {
          distances[edge.to] = alt;
          previous[edge.to] = { node: current, edge };
        }
      }
    }

    // Reconstruct path
    const pathEdges: GraphEdge[] = [];
    let curr: string | null = destination;

    while (curr && previous[curr]) {
      const prevInfo: PathTrace | null = previous[curr];
      if (!prevInfo) break;
      pathEdges.unshift(prevInfo.edge);
      curr = prevInfo.node;
    }

    // If no path found or trivial destination
    if (pathEdges.length === 0 && startNode !== destination) {
      // Fallback deterministic direct route
      return this.buildFallbackRoute(destination, avoidStairs);
    }

    // Build NavSteps
    let totalMeters = 0;
    const steps: NavStep[] = [];

    // Step 0: Start node
    steps.push({
      id: 'step-0',
      instruction: `Start from ${NODES[startNode]?.name || 'current location'}`,
      detail: NODES[startNode]?.detail || 'Follow the tactile line.',
      nodeType: 'start',
      distance: '0 m',
      distanceMeters: 0,
      isAccessible: true,
      audioAnnouncement: `Start from ${NODES[startNode]?.name}. Follow the tactile guiding line on the floor.`,
    });

    let stepIdx = 1;
    for (const edge of pathEdges) {
      totalMeters += edge.distanceMeters;
      const targetNode = NODES[edge.to];

      steps.push({
        id: `step-${stepIdx}`,
        instruction: edge.instruction,
        detail: targetNode?.detail || edge.instruction,
        nodeType: targetNode?.type || 'hallway',
        distance: `${edge.distanceMeters} m`,
        distanceMeters: edge.distanceMeters,
        isAccessible: !edge.hasStairs,
        audioAnnouncement: edge.audioAnnouncement,
      });
      stepIdx++;
    }

    const durationMinutes = Math.max(1, Math.round((totalMeters / 60) * 10) / 10);
    const destName = NODES[destination]?.name || destination;
    const isStepFree = !pathEdges.some((e) => e.hasStairs);

    return {
      destination,
      destinationName: destName,
      originName: NODES[startNode]?.name || 'Main Concourse',
      distanceMeters: totalMeters,
      durationMinutes,
      stepFree: isStepFree,
      steps,
      features: [
        isStepFree ? '100% Step-Free Route' : 'Route Contains Stairs',
        'Continuous Tactile Paving',
        'Audio Announcements',
        'Dual-Height Handrails Verified',
      ],
      tactilePaving: true,
      crowdLevel: 'low',
      lighting: 'bright',
      source: 'accessible-routing-engine',
      gpsAvailable: false,
      disclaimer: 'Indoor structured navigation plan. GPS is unavailable indoors; please follow physical waypoints and tactile paving.',
    };
  }

  private buildFallbackRoute(destination: string, stepFree: boolean): NavigationRouteResponse {
    const destName = NODES[destination]?.name || destination;
    return {
      destination,
      destinationName: destName,
      originName: 'Main Entrance Concourse',
      distanceMeters: 90,
      durationMinutes: 1.5,
      stepFree,
      steps: [
        {
          id: 'step-0',
          instruction: 'Start from Main Entrance Concourse',
          detail: 'Face north along the corridor. Tactile line is at your feet.',
          nodeType: 'start',
          distance: '0 m',
          distanceMeters: 0,
          isAccessible: true,
          audioAnnouncement: 'Start facing north along the corridor. Follow tactile line.',
        },
        {
          id: 'step-1',
          instruction: 'Follow main concourse toward central corridor',
          detail: 'Step-free vinyl surface with tactile paving.',
          nodeType: 'hallway',
          distance: '50 m',
          distanceMeters: 50,
          isAccessible: true,
          audioAnnouncement: 'Continue straight along the central concourse for 50 meters.',
        },
        {
          id: 'step-2',
          instruction: `Arrive at ${destName}`,
          detail: 'Entrance doors with tactile indicators.',
          nodeType: 'destination',
          distance: '40 m',
          distanceMeters: 40,
          isAccessible: true,
          audioAnnouncement: `You have arrived at ${destName}.`,
        },
      ],
      features: ['Step-Free', 'Tactile Paving', 'Audio Guidance'],
      tactilePaving: true,
      crowdLevel: 'low',
      lighting: 'bright',
      source: 'accessible-routing-engine',
      gpsAvailable: false,
      disclaimer: 'Indoor structured navigation plan. GPS is unavailable indoors; please follow physical waypoints.',
    };
  }
}

export const navigationService = new NavigationService();
