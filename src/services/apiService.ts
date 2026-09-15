// Centralized Frontend API Service for AccessAI

export interface BackendVoiceRequest {
  text: string;
  context?: {
    currentPage?: string;
    currentScene?: string | null;
    lastOcrText?: string | null;
    activeRoute?: string | null;
  };
  accessibilityProfile?: {
    textSize?: 'small' | 'medium' | 'large' | 'xlarge';
    simplifiedMode?: boolean;
    voiceGuidance?: boolean;
    language?: 'en' | 'ta' | 'hi' | 'ml' | 'te';
    reducedMotion?: boolean;
  };
  conversation?: Array<{
    sender: 'user' | 'assistant';
    text: string;
  }>;
}

export interface BackendVoiceResponse {
  answer: string;
  confidence: number;
  confidenceLevel: 'high' | 'medium' | 'low';
  safetyWarning: boolean;
}

export interface BackendHealthResponse {
  status: string;
  service: string;
  ai?: {
    provider: 'gemini' | 'fallback';
    configured: boolean;
    model: string | null;
    fallbackAvailable: boolean;
  };
  ocr?: {
    available: boolean;
  };
  navigation?: {
    available: boolean;
  };
}

export interface DetectedVisionObject {
  label: string;
  confidence: number;
  position: 'ahead' | 'left' | 'right' | 'below' | 'center';
  box?: {
    top: number;
    left: number;
    width: number;
    height: number;
  };
  details?: string;
}

export interface VisionSafetyAlert {
  riskDetected: boolean;
  message: string;
  confidence: number;
}

export interface VisionResult {
  source: 'ai' | 'demo';
  description: string;
  objects: DetectedVisionObject[];
  safety: VisionSafetyAlert;
  confidence: number;
  confidenceLevel: 'high' | 'medium' | 'low';
}

export interface BackendVisionRequest {
  image: string; // Base64 data URL
  question?: string;
  accessibilityProfile?: {
    textSize?: string;
    simplifiedMode?: boolean;
    voiceGuidance?: boolean;
    language?: string;
    reducedMotion?: boolean;
  };
  context?: {
    currentPage?: string;
    currentScene?: string | null;
  };
}

class ApiService {
  private getBaseUrl(): string {
    const envUrl = import.meta.env.VITE_API_BASE_URL;
    return envUrl && typeof envUrl === 'string' ? envUrl.replace(/\/$/, '') : 'http://localhost:8000';
  }

  // Health check to determine if backend is online
  async checkHealth(): Promise<boolean> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);
      const response = await fetch(`${this.getBaseUrl()}/api/health`, {
        method: 'GET',
        headers: { 'Accept': 'application/json' },
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      if (response.ok) {
        const data = await response.json();
        return data.status === 'ok';
      }
      return false;
    } catch {
      return false;
    }
  }

  // Get detailed backend health report including Gemini and OCR availability
  async getHealthDetails(): Promise<BackendHealthResponse | null> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);
      const response = await fetch(`${this.getBaseUrl()}/api/health`, {
        method: 'GET',
        headers: { 'Accept': 'application/json' },
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      if (response.ok) {
        return (await response.json()) as BackendHealthResponse;
      }
      return null;
    } catch {
      return null;
    }
  }

  // Send voice/text query to the backend Voice API
  async sendVoiceChat(request: BackendVoiceRequest): Promise<BackendVoiceResponse> {
    const url = `${this.getBaseUrl()}/api/voice/chat`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => '');
      throw new Error(`Voice API request failed with status ${response.status}: ${errorText}`);
    }

    return (await response.json()) as BackendVoiceResponse;
  }

  // Send captured image to backend Vision API with a 15-second timeout
  async analyzeVision(request: BackendVisionRequest): Promise<VisionResult> {
    const url = `${this.getBaseUrl()}/api/vision/analyze`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(request),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text().catch(() => '');
        throw new Error(`Vision API request failed with status ${response.status}: ${errorText}`);
      }

      return (await response.json()) as VisionResult;
    } catch (err: unknown) {
      clearTimeout(timeoutId);
      const error = err as Error;
      if (error.name === 'AbortError') {
        throw new Error('Vision analysis timed out after 15 seconds.');
      }
      throw error;
    }
  }

  // Send image to backend OCR API for text extraction with a 15-second timeout
  async extractOCR(request: BackendOcrExtractRequest): Promise<BackendOcrResult> {
    const url = `${this.getBaseUrl()}/api/ocr/extract`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(request),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text().catch(() => '');
        throw new Error(`OCR extraction failed with status ${response.status}: ${errorText}`);
      }

      return (await response.json()) as BackendOcrResult;
    } catch (err: unknown) {
      clearTimeout(timeoutId);
      const error = err as Error;
      if (error.name === 'AbortError') {
        throw new Error('OCR extraction timed out after 15 seconds.');
      }
      throw error;
    }
  }

  // Send extracted text to backend to simplify into plain language
  async simplifyOCRText(request: BackendOcrSimplifyRequest): Promise<BackendOcrSimplifyResponse> {
    const url = `${this.getBaseUrl()}/api/ocr/simplify`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 12000);

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(request),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text().catch(() => '');
        throw new Error(`Simplification failed with status ${response.status}: ${errorText}`);
      }

      return (await response.json()) as BackendOcrSimplifyResponse;
    } catch (err: unknown) {
      clearTimeout(timeoutId);
      const error = err as Error;
      if (error.name === 'AbortError') {
        throw new Error('Simplification request timed out after 12 seconds.');
      }
      throw error;
    }
  }

  // Send extracted text to backend to translate into target language
  async translateOCRText(request: BackendOcrTranslateRequest): Promise<BackendOcrTranslateResponse> {
    const url = `${this.getBaseUrl()}/api/ocr/translate`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 12000);

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(request),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text().catch(() => '');
        throw new Error(`Translation failed with status ${response.status}: ${errorText}`);
      }

      return (await response.json()) as BackendOcrTranslateResponse;
    } catch (err: unknown) {
      clearTimeout(timeoutId);
      const error = err as Error;
      if (error.name === 'AbortError') {
        throw new Error('Translation request timed out after 12 seconds.');
      }
      throw error;
    }
  }

  // Calculate accessible step-free route via backend navigation engine
  async calculateAccessibleRoute(request: BackendNavigationRouteRequest): Promise<BackendNavigationRouteResponse> {
    const url = `${this.getBaseUrl()}/api/navigation/route`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(request),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text().catch(() => '');
        throw new Error(`Navigation route calculation failed with status ${response.status}: ${errorText}`);
      }

      return (await response.json()) as BackendNavigationRouteResponse;
    } catch (err: unknown) {
      clearTimeout(timeoutId);
      const error = err as Error;
      if (error.name === 'AbortError') {
        throw new Error('Navigation request timed out after 10 seconds.');
      }
      throw error;
    }
  }

  // Get available accessible indoor destinations
  async getNavigationDestinations(): Promise<Array<{ id: string; name: string; type: string; stepFree: boolean }>> {
    const url = `${this.getBaseUrl()}/api/navigation/destinations`;

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: { 'Accept': 'application/json' },
      });

      if (response.ok) {
        const data = await response.json();
        return data.destinations || [];
      }
      return [];
    } catch {
      return [];
    }
  }
}

export interface OcrRegion {
  text: string;
  confidence: number;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface BackendOcrResult {
  source: 'ai' | 'demo';
  text: string;
  detectedLanguage: string;
  confidence: number;
  confidenceLevel: 'high' | 'medium' | 'low';
  regions: OcrRegion[];
}

export interface BackendOcrExtractRequest {
  image: string; // Base64 data URL
  sourceLanguage?: string;
  accessibilityProfile?: {
    textSize?: string;
    contrast?: string;
    simplifiedMode?: boolean;
    voiceGuidance?: boolean;
    language?: string;
    reducedMotion?: boolean;
  };
  context?: {
    currentPage?: string;
  };
}

export interface BackendOcrSimplifyRequest {
  text: string;
  language?: string;
  accessibilityProfile?: {
    simplifiedMode?: boolean;
  };
}

export interface BackendOcrSimplifyResponse {
  text: string;
  confidence: number;
}

export interface BackendOcrTranslateRequest {
  text: string;
  sourceLanguage?: string;
  targetLanguage: 'en' | 'ta' | 'hi' | 'ml' | 'te';
  accessibilityProfile?: {
    simplifiedMode?: boolean;
    language?: string;
  };
}

export interface BackendOcrTranslateResponse {
  sourceLanguage: string;
  targetLanguage: 'en' | 'ta' | 'hi' | 'ml' | 'te';
  text: string;
  confidence: number;
}

export interface BackendNavStep {
  id: string;
  instruction: string;
  detail: string;
  nodeType: 'start' | 'ramp' | 'elevator' | 'door' | 'hallway' | 'destination';
  distance: string;
  distanceMeters: number;
  isAccessible: boolean;
  audioAnnouncement: string;
}

export interface BackendNavigationPreferences {
  avoidStairs: boolean;
  preferRamps: boolean;
  preferElevators: boolean;
  avoidCrowds?: boolean;
  preferWellLit?: boolean;
  stepFreeOnly?: boolean;
  minimizeWalking?: boolean;
}

export interface BackendNavigationRouteRequest {
  origin?: string;
  destination: string;
  preferences?: Partial<BackendNavigationPreferences>;
  accessibilityProfile?: {
    textSize?: string;
    simplifiedMode?: boolean;
    voiceGuidance?: boolean;
    language?: string;
  };
}

export interface BackendNavigationRouteResponse {
  destination: string;
  destinationName: string;
  originName: string;
  distanceMeters: number;
  durationMinutes: number;
  stepFree: boolean;
  steps: BackendNavStep[];
  features: string[];
  tactilePaving: boolean;
  crowdLevel: 'low' | 'moderate' | 'busy';
  lighting: 'bright' | 'adequate';
  source: 'accessible-routing-engine' | 'ai';
  gpsAvailable: false;
  disclaimer: string;
}

export const apiService = new ApiService();
