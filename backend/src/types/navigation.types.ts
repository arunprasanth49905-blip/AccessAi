import { z } from 'zod';

export interface NavStep {
  id: string;
  instruction: string;
  detail: string;
  nodeType: 'start' | 'ramp' | 'elevator' | 'door' | 'hallway' | 'destination';
  distance: string;
  distanceMeters: number;
  isAccessible: boolean;
  audioAnnouncement: string;
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

export interface NavigationRouteRequest {
  origin?: string;
  destination: string;
  preferences?: Partial<NavigationPreferences>;
  accessibilityProfile?: {
    textSize?: string;
    simplifiedMode?: boolean;
    voiceGuidance?: boolean;
    language?: string;
  };
}

export interface NavigationRouteResponse {
  destination: string;
  destinationName: string;
  originName: string;
  distanceMeters: number;
  durationMinutes: number;
  stepFree: boolean;
  steps: NavStep[];
  features: string[];
  tactilePaving: boolean;
  crowdLevel: 'low' | 'moderate' | 'busy';
  lighting: 'bright' | 'adequate';
  source: 'accessible-routing-engine' | 'ai';
  gpsAvailable: false;
  disclaimer: string;
}

export const NavigationRouteRequestSchema = z.object({
  origin: z.string().optional(),
  destination: z.string().min(1, 'Destination is required'),
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
