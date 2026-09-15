import express from 'express';
import cors from 'cors';
import voiceRoutes from './routes/voice.routes.js';
import { errorHandler } from './middleware/error.middleware.js';

export const app = express();

// CORS configuration for the Vite React frontend
const allowedOrigin = process.env.FRONTEND_URL || 'http://localhost:5173';
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

// JSON body parser
app.use(express.json());

// Health check endpoint
app.get('/api/health', (_req, res) => {
  res.status(200).json({
    status: 'ok',
    service: 'AccessAI backend',
  });
});

// Mount voice routes
app.use('/api/voice', voiceRoutes);

// Error middleware
app.use(errorHandler);

export default app;
