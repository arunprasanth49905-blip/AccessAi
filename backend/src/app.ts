import express from 'express';
import cors from 'cors';
import { config } from './config/env.js';
import voiceRoutes from './routes/voice.routes.js';
import visionRoutes from './routes/vision.routes.js';
import ocrRoutes from './routes/ocr.routes.js';
import { errorHandler } from './middleware/error.middleware.js';

export const app = express();

// CORS configuration for the Vite React frontend
const allowedOrigin = config.FRONTEND_URL;
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g. mobile apps, curl, server-to-server) or matching origin
      if (!origin || origin === allowedOrigin || origin.startsWith('http://localhost:')) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
  })
);

// JSON and URL-encoded body parser with 10MB limit for image uploads
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check endpoint (safe status reporting with zero secret exposure)
app.get('/api/health', (_req, res) => {
  const isConfigured = config.isGeminiConfigured();
  res.status(200).json({
    status: 'ok',
    service: 'AccessAI backend',
    ai: {
      provider: isConfigured ? 'gemini' : 'fallback',
      configured: isConfigured,
      model: isConfigured ? config.GEMINI_MODEL : null,
      fallbackAvailable: true,
    },
    ocr: {
      available: true,
    },
  });
});

// Mount routes
app.use('/api/voice', voiceRoutes);
app.use('/api/vision', visionRoutes);
app.use('/api/ocr', ocrRoutes);

// Error middleware
app.use(errorHandler);

export default app;
