import { z } from 'zod';

export type NavNodeType =
  | 'start'
  | 'ramp'
  | 'elevator'
  | 'door'
  | 'hallway'
  | 'destination'
  | 'turn-left'
  | 'turn-right'
  | 'continue'
  | 'crosswalk';

export type NavManeuver =
  | 'depart'
  | 'straight'
  | 'turn-left'
  | 'turn-right'
  | 'slight-left'
  | 'slight-right'
  | 'ramp'
  | 'elevator'
  | 'cross'
  | 'arrive';

export interface NavStep {
  id: string;
  instruction: string;
  detail: string;
  nodeType: NavNodeType;
  distance: string;
  distanceMeters: number;
  isAccessible: boolean;
  audioAnnouncement: string;
  streetName?: string;
  maneuver?: NavManeuver;
  sequence?: number;
  location?: [number, number]; // [lat, lng]
  accessibilityNotes?: string;
}

export interface NavigationPreferences {
  avoidStairs: boolean;
  preferRamps: boolean;
  preferElevators: boolean;
  avoidCrowds?: boolean;
  preferWellLit?: boolean;
  stepFreeOnly?: boolean;
  minimizeWalking?: boolean;
}

export interface GeoCoordinates {
  latitude: number;
  longitude: number;
}

export interface NavigationRouteRequest {
  origin?: string;
  originCoords?: GeoCoordinates;
  destination: string;
  destinationCoords?: GeoCoordinates;
  preferences?: Partial<NavigationPreferences>;
  accessibilityProfile?: {
    textSize?: string;
    simplifiedMode?: boolean;
    voiceGuidance?: boolean;
    language?: string;
  };
}

export type RouteSource = 'osrm-pedestrian' | 'accessible-routing-engine' | 'demo' | 'unknown';
export type AccessibilityStatus = 'verified_step_free' | 'contains_stairs' | 'accessibility_unknown';

export interface NavigationRouteResponse {
  destination: string;
  destinationName: string;
  originName: string;
  originCoords?: GeoCoordinates;
  destinationCoords?: GeoCoordinates;
  distanceMeters: number;
  durationMinutes: number;
  stepFree: boolean;
  accessibilityStatus: AccessibilityStatus;
  accessibilityNotes?: string;
  steps: NavStep[];
  features: string[];
  tactilePaving: boolean;
  crowdLevel: 'low' | 'moderate' | 'busy';
  lighting: 'bright' | 'adequate';
  source: RouteSource;
  geometry?: [number, number][]; // Array of [lat, lng] for real route lines
  gpsAvailable: boolean;
  disclaimer: string;
}

export interface ResolvedPlace {
  id: string;
  name: string;
  formattedAddress: string;
  latitude: number;
  longitude: number;
  type: 'indoor-waypoint' | 'place' | 'address' | 'coordinate';
  isAccessibleVerified: boolean;
  distanceMeters?: number;
}

export interface ResolvePlaceRequest {
  query: string;
  userCoords?: GeoCoordinates;
}

export const GeoCoordinatesSchema = z.object({
  latitude: z.number().min(-90, 'Latitude must be >= -90').max(90, 'Latitude must be <= 90'),
  longitude: z.number().min(-180, 'Longitude must be >= -180').max(180, 'Longitude must be <= 180'),
});

export const NavigationRouteRequestSchema = z.object({
  origin: z.string().optional(),
  originCoords: GeoCoordinatesSchema.optional(),
  destination: z.string().min(1, 'Destination is required'),
  destinationCoords: GeoCoordinatesSchema.optional(),
  preferences: z
    .object({
      avoidStairs: z.boolean().optional(),
      preferRamps: z.boolean().optional(),
      preferElevators: z.boolean().optional(),
      avoidCrowds: z.boolean().optional(),
      preferWellLit: z.boolean().optional(),
      stepFreeOnly: z.boolean().optional(),
      minimizeWalking: z.boolean().optional(),
    })
    .optional(),
  accessibilityProfile: z
    .object({
      textSize: z.string().optional(),
      simplifiedMode: z.boolean().optional(),
      voiceGuidance: z.boolean().optional(),
      language: z.string().optional(),
    })
    .optional(),
});

export const ResolvePlaceRequestSchema = z.object({
  query: z.string().min(1, 'Search query is required').max(200),
  userCoords: GeoCoordinatesSchema.optional(),
});
