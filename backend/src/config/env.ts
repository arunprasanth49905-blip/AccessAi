import dotenv from 'dotenv';
dotenv.config();

export interface AppConfig {
  PORT: number;
  FRONTEND_URL: string;
  GEMINI_API_KEY?: string;
  GEMINI_MODEL: string;
  isGeminiConfigured: () => boolean;
}

export const config: AppConfig = {
  PORT: process.env.PORT ? parseInt(process.env.PORT, 10) : 8000,
  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:5173',
  GEMINI_API_KEY: process.env.GEMINI_API_KEY?.trim() || undefined,
  GEMINI_MODEL: process.env.GEMINI_MODEL?.trim() || 'gemini-2.5-flash',
  isGeminiConfigured(): boolean {
    return Boolean(this.GEMINI_API_KEY && this.GEMINI_API_KEY.length > 0);
  },
};
