import { app } from './app.js';
import { config } from './config/env.js';

const PORT = config.PORT;

app.listen(PORT, () => {
  console.log(`AccessAI backend server listening on http://localhost:${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/api/health`);
  console.log(`Voice API:    http://localhost:${PORT}/api/voice/chat`);
  console.log(`Vision API:   http://localhost:${PORT}/api/vision/analyze`);
  console.log(`OCR API:      http://localhost:${PORT}/api/ocr/extract`);
  if (config.isGeminiConfigured()) {
    console.log(`[AI] Google Gemini provider active (model: ${config.GEMINI_MODEL})`);
  } else {
    console.log(`[AI] Google Gemini not configured; deterministic fallback engine active`);
  }
});
