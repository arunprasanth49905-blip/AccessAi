import dotenv from 'dotenv';
dotenv.config();

export interface AppConfig {
  PORT: number;
  FRONTEND_URL: string;
  GEMINI_API_KEY?: string;
  GEMINI_MODEL: string;
  isGeminiConfigured: () => boolean;
}

function resolveValidModel(envModel?: string): string {
  const m = envModel?.trim();
  // Deprecated models that return 404
  if (!m || m === 'gemini-2.5-flash' || m === 'gemini-2.5-flash-lite' || m.startsWith('gemini-1.5') || m.startsWith('gemini-2.0')) {
    return 'gemini-3.5-flash-lite';
  }
  return m;
}

export const config: AppConfig = {
  PORT: process.env.PORT ? parseInt(process.env.PORT, 10) : 3000,
  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:3000',
  GEMINI_API_KEY: process.env.GEMINI_API_KEY?.trim() || undefined,
  GEMINI_MODEL: resolveValidModel(process.env.GEMINI_MODEL),
  isGeminiConfigured(): boolean {
    return Boolean(this.GEMINI_API_KEY && this.GEMINI_API_KEY.length > 0);
  },
};
