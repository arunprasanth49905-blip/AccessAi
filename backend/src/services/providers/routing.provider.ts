// Real-World Routing & Geocoding Provider Abstraction - AccessAI Location Intelligence
// Provides clean decoupling of external providers (OSRM, Nominatim) and Indoor Accessible Graphs

import {
  NavigationRouteRequest,
  NavigationRouteResponse,
  NavStep,
  ResolvedPlace,
  GeoCoordinates,
  AccessibilityStatus,
} from '../../types/navigation.types.js';

export interface IRoutingProvider {
  name: string;
  calculateRoute(request: NavigationRouteRequest): Promise<NavigationRouteResponse | null>;
  resolvePlace(query: string, userCoords?: GeoCoordinates): Promise<ResolvedPlace[]>;
}

// Haversine formula for distance calculation in meters between two lat/lng pairs
export function calculateHaversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371e3; // Earth radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return Math.round(R * c);
}

// OSRM Pedestrian Routing Provider
export class OsrmRoutingProvider implements IRoutingProvider {
  name = 'osrm-pedestrian';

  private USER_AGENT = 'AccessAI-Accessibility-Companion/1.0 (https://accessai.org; contact@accessai.org)';

  async calculateRoute(request: NavigationRouteRequest): Promise<NavigationRouteResponse | null> {
    if (!request.originCoords || !request.destinationCoords) {
      return null;
    }

    const { latitude: oLat, longitude: oLng } = request.originCoords;
    const { latitude: dLat, longitude: dLng } = request.destinationCoords;

    const url = `https://router.project-osrm.org/route/v1/foot/${oLng},${oLat};${dLng},${dLat}?overview=full&geometries=geojson&steps=true`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);

    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': this.USER_AGENT,
          Accept: 'application/json',
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        return null;
      }

      interface OsrmStep {
        maneuver: {
          type: string;
          modifier?: string;
          location: [number, number]; // [lng, lat]
        };
        name: string;
        distance: number;
        duration: number;
        mode: string;
      }

      interface OsrmLeg {
        distance: number;
        duration: number;
        steps: OsrmStep[];
      }

      interface OsrmRoute {
        distance: number;
        duration: number;
        geometry: {
          coordinates: [number, number][]; // [lng, lat]
        };
        legs: OsrmLeg[];
      }

      interface OsrmData {
        code: string;
        routes?: OsrmRoute[];
      }

      const data = (await response.json()) as OsrmData;
      if (data.code !== 'Ok' || !data.routes || data.routes.length === 0) {
        return null;
      }

      const primaryRoute = data.routes[0];
      const leg = primaryRoute.legs[0];
      if (!leg) return null;

      // Extract geometry as [lat, lng] for frontend rendering
      const geometry: [number, number][] = primaryRoute.geometry.coordinates.map(
        ([lng, lat]) => [lat, lng]
      );

      // Check if any steps contain stairs or steps
      let containsReportedStairs = false;
      const normalizedSteps: NavStep[] = [];

      for (let i = 0; i < leg.steps.length; i++) {
        const step = leg.steps[i];
        const stepName = step.name ? step.name.trim() : '';
        const distanceM = Math.round(step.distance);
        const [sLng, sLat] = step.maneuver.location;

        const isStairs =
          stepName.toLowerCase().includes('stairs') ||
          stepName.toLowerCase().includes('steps') ||
          step.maneuver.type === 'stairs';

        if (isStairs) {
          containsReportedStairs = true;
        }

        let instruction = '';
        let maneuverType: NavStep['maneuver'] = 'straight';
        let nodeType: NavStep['nodeType'] = 'continue';

        switch (step.maneuver.type) {
          case 'depart':
            instruction = stepName
              ? `Start walking on ${stepName}`
              : 'Head forward on the pedestrian pathway';
            maneuverType = 'depart';
            nodeType = 'start';
            break;
          case 'arrive':
            instruction = `Arrive at ${request.destination}`;
            maneuverType = 'arrive';
            nodeType = 'destination';
            break;
          case 'turn':
            if (step.maneuver.modifier?.includes('left')) {
              instruction = stepName ? `Turn left onto ${stepName}` : 'Turn left';
              maneuverType = 'turn-left';
              nodeType = 'turn-left';
            } else if (step.maneuver.modifier?.includes('right')) {
              instruction = stepName ? `Turn right onto ${stepName}` : 'Turn right';
              maneuverType = 'turn-right';
              nodeType = 'turn-right';
            } else {
              instruction = stepName ? `Turn onto ${stepName}` : 'Turn';
              maneuverType = 'straight';
              nodeType = 'continue';
            }
            break;
          case 'new name':
          case 'continue':
            instruction = stepName ? `Continue onto ${stepName}` : 'Continue straight';
            maneuverType = 'straight';
            nodeType = 'continue';
            break;
          case 'end of road':
            instruction = step.maneuver.modifier?.includes('left')
              ? `Turn left at the end of the road onto ${stepName || 'the pathway'}`
              : `Turn right at the end of the road onto ${stepName || 'the pathway'}`;
            maneuverType = step.maneuver.modifier?.includes('left') ? 'turn-left' : 'turn-right';
            nodeType = step.maneuver.modifier?.includes('left') ? 'turn-left' : 'turn-right';
            break;
          default:
            instruction = stepName ? `Follow ${stepName}` : 'Continue on pathway';
            maneuverType = 'straight';
            nodeType = 'continue';
            break;
        }

        const distanceText = distanceM > 0 ? `${distanceM} m` : 'Ahead';
        const detail = isStairs
          ? 'Warning: Flight of stairs or steps reported on this segment.'
          : stepName
          ? `Pedestrian route along ${stepName}.`
          : 'Pedestrian walkway segment.';

        normalizedSteps.push({
          id: `step-${i}`,
          instruction,
          detail,
          nodeType,
          maneuver: maneuverType,
          sequence: i + 1,
          streetName: stepName || undefined,
          distance: distanceText,
          distanceMeters: distanceM,
          isAccessible: !isStairs,
          location: [sLat, sLng],
          audioAnnouncement:
            distanceM > 0
              ? `In ${distanceM} meters, ${instruction.toLowerCase()}`
              : instruction,
          accessibilityNotes: isStairs
            ? 'Stairs reported on route. Wheelchair bypass may be required.'
            : undefined,
        });
      }

      const totalDistance = Math.round(primaryRoute.distance);
      const totalDuration = Math.max(1, Math.round((primaryRoute.duration / 60) * 10) / 10);

      // Honest accessibility attribution
      let accessibilityStatus: AccessibilityStatus = 'accessibility_unknown';
      let disclaimer =
        'Real-world OpenStreetMap pedestrian route. Standard footway data does not include verified curb-cut or tactile paving measurements; exercise caution at road crossings.';

      if (containsReportedStairs) {
        accessibilityStatus = 'contains_stairs';
        disclaimer =
          'Caution: Stairs or steps were identified along this pedestrian path. Step-free access cannot be guaranteed.';
      }

      return {
        destination: request.destination,
        destinationName: request.destination,
        originName: request.origin || 'Current Device Location',
        originCoords: request.originCoords,
        destinationCoords: request.destinationCoords,
        distanceMeters: totalDistance,
        durationMinutes: totalDuration,
        stepFree: !containsReportedStairs,
        accessibilityStatus,
        steps: normalizedSteps,
        features: [
          'Real-World OSRM Pedestrian Geometry',
          containsReportedStairs ? 'Stairs Reported on Path' : 'Accessibility Data Unverified',
          'Auditory Waypoint Announcements',
        ],
        tactilePaving: false, // Unverified for open streets
        crowdLevel: 'moderate',
        lighting: 'adequate',
        source: 'osrm-pedestrian',
        geometry,
        gpsAvailable: true,
        disclaimer,
      };
    } catch {
      clearTimeout(timeoutId);
      return null;
    }
  }

  async resolvePlace(query: string, userCoords?: GeoCoordinates): Promise<ResolvedPlace[]> {
    const trimmed = query.trim();
    if (!trimmed) return [];

    // 1. Check if user entered explicit coordinates (e.g., "13.0827, 80.2707")
    const coordMatch = trimmed.match(/^(-?\d{1,2}(?:\.\d+)?)\s*,\s*(-?\d{1,3}(?:\.\d+)?)$/);
    if (coordMatch) {
      const lat = parseFloat(coordMatch[1]);
      const lng = parseFloat(coordMatch[2]);
      if (lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
        const dist = userCoords
          ? calculateHaversineDistance(userCoords.latitude, userCoords.longitude, lat, lng)
          : undefined;

        return [
          {
            id: `coord-${lat}-${lng}`,
            name: `Coordinates (${lat.toFixed(5)}, ${lng.toFixed(5)})`,
            formattedAddress: `Geographic coordinate point: ${lat.toFixed(6)}, ${lng.toFixed(6)}`,
            latitude: lat,
            longitude: lng,
            type: 'coordinate',
            isAccessibleVerified: false,
            distanceMeters: dist,
          },
        ];
      }
    }

    // 2. Query OpenStreetMap Nominatim for real places/addresses
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    try {
      let url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
        trimmed
      )}&limit=5&addressdetails=1`;

      if (userCoords) {
        // Bias search to user's bounding area
        url += `&viewbox=${userCoords.longitude - 0.5},${userCoords.latitude + 0.5},${
          userCoords.longitude + 0.5
        },${userCoords.latitude - 0.5}`;
      }

      const response = await fetch(url, {
        headers: {
          'User-Agent': this.USER_AGENT,
          Accept: 'application/json',
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) return [];

      interface NominatimResult {
        place_id: number;
        display_name: string;
        lat: string;
        lon: string;
        type: string;
      }

      const data = (await response.json()) as NominatimResult[];
      if (!Array.isArray(data)) return [];

      return data.map((item) => {
        const lat = parseFloat(item.lat);
        const lng = parseFloat(item.lon);
        const nameParts = item.display_name.split(',');
        const shortName = nameParts[0].trim();
        const dist = userCoords
          ? calculateHaversineDistance(userCoords.latitude, userCoords.longitude, lat, lng)
          : undefined;

        return {
          id: `osm-${item.place_id}`,
          name: shortName,
          formattedAddress: item.display_name,
          latitude: lat,
          longitude: lng,
          type: 'place',
          isAccessibleVerified: false,
          distanceMeters: dist,
        };
      });
    } catch {
      clearTimeout(timeoutId);
      return [];
    }
  }
}

export const osrmRoutingProvider = new OsrmRoutingProvider();
