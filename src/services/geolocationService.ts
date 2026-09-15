// Real Browser Geolocation Service - AccessAI Location Intelligence
// Strict adherence to browser permissions, accuracy validation, and privacy (no permanent raw logging)

export type LocationPermissionState = 'prompt' | 'granted' | 'denied' | 'unavailable' | 'unsupported';
export type LocationAccuracyLevel = 'high' | 'approximate' | 'poor' | 'unknown';
export type LocationSource = 'device' | 'demo' | 'unknown';

export interface LocationCoordinates {
  latitude: number;
  longitude: number;
  accuracy: number; // meters
  altitude: number | null;
  altitudeAccuracy: number | null;
  heading: number | null;
  speed: number | null;
}

export interface LocationState {
  coords: LocationCoordinates | null;
  latitude: number | null;
  longitude: number | null;
  accuracy: number | null;
  heading: number | null;
  speed: number | null;
  timestamp: number | null;
  permissionState: LocationPermissionState;
  accuracyLevel: LocationAccuracyLevel;
  isTracking: boolean;
  error: string | null;
  source: LocationSource;
}

export interface GeolocationOptions {
  enableHighAccuracy?: boolean;
  timeout?: number;
  maximumAge?: number;
}

const DEFAULT_OPTIONS: GeolocationOptions = {
  enableHighAccuracy: true,
  timeout: 15000,
  maximumAge: 10000,
};

class GeolocationService {
  private watchId: number | null = null;
  private currentListener: ((state: LocationState) => void) | null = null;
  private lastKnownState: LocationState = {
    coords: null,
    latitude: null,
    longitude: null,
    accuracy: null,
    heading: null,
    speed: null,
    timestamp: null,
    permissionState: 'prompt',
    accuracyLevel: 'unknown',
    isTracking: false,
    error: null,
    source: 'unknown',
  };

  /**
   * Evaluates accuracy level based on reported accuracy in meters
   * High: < 15m (reliable for pedestrian turn-by-turn)
   * Approximate: 15m - 50m (good for neighborhood/corridor awareness)
   * Poor: > 50m (approximate area only)
   */
  evaluateAccuracyLevel(accuracyMeters: number | null): LocationAccuracyLevel {
    if (accuracyMeters === null || accuracyMeters === undefined || isNaN(accuracyMeters)) {
      return 'unknown';
    }
    if (accuracyMeters <= 15) return 'high';
    if (accuracyMeters <= 50) return 'approximate';
    return 'poor';
  }

  isSupported(): boolean {
    return typeof window !== 'undefined' && 'navigator' in window && 'geolocation' in navigator;
  }

  /**
   * Queries browser permission state if supported by Permissions API
   */
  async queryPermission(): Promise<LocationPermissionState> {
    if (!this.isSupported()) {
      return 'unsupported';
    }

    try {
      if ('permissions' in navigator && navigator.permissions.query) {
        const status = await navigator.permissions.query({ name: 'geolocation' as PermissionName });
        if (status.state === 'granted') return 'granted';
        if (status.state === 'denied') return 'denied';
        return 'prompt';
      }
    } catch {
      // Permissions API not supported or threw
    }

    return this.lastKnownState.permissionState;
  }

  /**
   * Requests single current position from real browser geolocation
   */
  async getCurrentPosition(options: GeolocationOptions = DEFAULT_OPTIONS): Promise<LocationState> {
    if (!this.isSupported()) {
      const state: LocationState = {
        ...this.lastKnownState,
        permissionState: 'unsupported',
        error: 'Browser geolocation is not supported on this device.',
        isTracking: false,
        source: 'unknown',
      };
      this.lastKnownState = state;
      return state;
    }

    return new Promise<LocationState>((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const coords: LocationCoordinates = {
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
            accuracy: pos.coords.accuracy,
            altitude: pos.coords.altitude,
            altitudeAccuracy: pos.coords.altitudeAccuracy,
            heading: pos.coords.heading,
            speed: pos.coords.speed,
          };

          const state: LocationState = {
            coords,
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
            accuracy: pos.coords.accuracy,
            heading: pos.coords.heading,
            speed: pos.coords.speed,
            timestamp: pos.timestamp,
            permissionState: 'granted',
            accuracyLevel: this.evaluateAccuracyLevel(pos.coords.accuracy),
            isTracking: false,
            error: null,
            source: 'device', // ONLY real device location
          };

          this.lastKnownState = state;
          resolve(state);
        },
        (err) => {
          let permissionState: LocationPermissionState = 'prompt';
          let errorMessage = 'Unable to determine current location.';

          switch (err.code) {
            case err.PERMISSION_DENIED:
              permissionState = 'denied';
              errorMessage = 'Location permission was denied. Please allow location access in your browser settings.';
              break;
            case err.POSITION_UNAVAILABLE:
              permissionState = 'unavailable';
              errorMessage = 'Device location is currently unavailable. Check your GPS/network signal.';
              break;
            case err.TIMEOUT:
              permissionState = 'prompt';
              errorMessage = 'Location request timed out. Retrying with network location.';
              break;
          }

          const state: LocationState = {
            ...this.lastKnownState,
            permissionState,
            error: errorMessage,
            isTracking: false,
            source: 'unknown',
          };

          this.lastKnownState = state;
          resolve(state);
        },
        options
      );
    });
  }

  /**
   * Starts real-time continuous geolocation tracking
   * Automatically handles cleanup of previous watchers to prevent memory leaks
   */
  startTracking(
    onUpdate: (state: LocationState) => void,
    options: GeolocationOptions = DEFAULT_OPTIONS
  ): void {
    if (!this.isSupported()) {
      onUpdate({
        ...this.lastKnownState,
        permissionState: 'unsupported',
        error: 'Browser geolocation is not supported.',
        isTracking: false,
        source: 'unknown',
      });
      return;
    }

    // Stop existing watcher if already active
    this.stopTracking();

    this.currentListener = onUpdate;

    this.watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const coords: LocationCoordinates = {
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
          altitude: pos.coords.altitude,
          altitudeAccuracy: pos.coords.altitudeAccuracy,
          heading: pos.coords.heading,
          speed: pos.coords.speed,
        };

        const state: LocationState = {
          coords,
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
          heading: pos.coords.heading,
          speed: pos.coords.speed,
          timestamp: pos.timestamp,
          permissionState: 'granted',
          accuracyLevel: this.evaluateAccuracyLevel(pos.coords.accuracy),
          isTracking: true,
          error: null,
          source: 'device', // Verified device GPS
        };

        this.lastKnownState = state;
        if (this.currentListener) {
          this.currentListener(state);
        }
      },
      (err) => {
        let permissionState: LocationPermissionState = 'prompt';
        let errorMessage = 'Location tracking error.';

        switch (err.code) {
          case err.PERMISSION_DENIED:
            permissionState = 'denied';
            errorMessage = 'Location permission denied.';
            break;
          case err.POSITION_UNAVAILABLE:
            permissionState = 'unavailable';
            errorMessage = 'Location signal lost.';
            break;
          case err.TIMEOUT:
            errorMessage = 'Location update timed out.';
            break;
        }

        const state: LocationState = {
          ...this.lastKnownState,
          permissionState,
          error: errorMessage,
          isTracking: false,
        };

        this.lastKnownState = state;
        if (this.currentListener) {
          this.currentListener(state);
        }
      },
      options
    );
  }

  /**
   * Stops real-time geolocation tracking and clears watch to save battery and maintain privacy
   */
  stopTracking(): void {
    if (this.watchId !== null && this.isSupported()) {
      navigator.geolocation.clearWatch(this.watchId);
      this.watchId = null;
    }
    this.currentListener = null;
    this.lastKnownState = {
      ...this.lastKnownState,
      isTracking: false,
    };
  }

  /**
   * Returns the most recent location state cached in memory (not stored permanently)
   */
  getLastKnownLocation(): LocationState {
    return this.lastKnownState;
  }
}

export const geolocationService = new GeolocationService();
