// Centralized Frontend API Service for AccessAI

export interface BackendVoiceRequest {
  text: string;
  context?: {
    currentPage?: string;
    currentScene?: string | null;
  };
  accessibilityProfile?: {
    textSize?: 'small' | 'medium' | 'large' | 'xlarge';
    simplifiedMode?: boolean;
    voiceGuidance?: boolean;
    language?: 'en' | 'ta' | 'hi' | 'ml' | 'te';
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

class ApiService {
  private getBaseUrl(): string {
    const envUrl = import.meta.env.VITE_API_BASE_URL;
    return envUrl && typeof envUrl === 'string' ? envUrl.replace(/\/$/, '') : 'http://localhost:8000';
  }

  // Health check to determine if backend is online
  async checkHealth(): Promise<boolean> {
    try {
      const response = await fetch(`${this.getBaseUrl()}/api/health`, {
        method: 'GET',
        headers: { 'Accept': 'application/json' },
      });
      if (response.ok) {
        const data = await response.json();
        return data.status === 'ok';
      }
      return false;
    } catch {
      return false;
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
}

export const apiService = new ApiService();
