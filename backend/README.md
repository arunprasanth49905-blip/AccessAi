# AccessAI Backend

Node.js + Express.js + TypeScript backend for AccessAI Multimodal Accessibility Companion.

AccessAI uses **Google Gemini** as its only external AI provider, paired with an integrated deterministic fallback engine.

## AI Provider Architecture

```
User Voice / Camera Capture
             ↓
     Express Backend
             ↓
        AI Service
      ┌──────┴──────┐
      ↓             ↓
Google Gemini    Deterministic Fallback
(Only external)  (Free demo / offline / fail-safe)
```

- **Primary Provider:** Google Gemini (configured via `GEMINI_API_KEY` and `GEMINI_MODEL`).
- **Fail-Safe Fallback:** If `GEMINI_API_KEY` is not provided, or if the Gemini API call fails, times out, or encounters rate limits at runtime, AccessAI automatically and seamlessly falls back to its deterministic local engine.
- **Privacy & Security:** API keys are backend-only, loaded from `backend/.env`, and never exposed to the frontend, browser logs, or git.

## Environment Configuration

Create a `.env` file in the `backend/` directory:

```env
PORT=8000
FRONTEND_URL=http://localhost:5173

# Gemini AI (Only external AI provider)
# If provided, responses will be generated via Google Gemini.
# If omitted or unavailable, AccessAI automatically uses the deterministic fallback engine.
GEMINI_API_KEY=
GEMINI_MODEL=gemini-2.5-flash
```

## Endpoints

- `GET /api/health` — Health check endpoint (reports service, AI provider, and OCR status safely without exposing secrets)
- `POST /api/voice/chat` — Voice assistant reasoning endpoint with accessibility profile awareness
- `POST /api/vision/analyze` — Multimodal vision analysis endpoint for camera frames
- `POST /api/ocr/extract` — Multimodal OCR extraction for signage, labels, and documents (accepts multipart/form-data or Base64)
- `POST /api/ocr/simplify` — Plain-language text simplification for cognitive accessibility
- `POST /api/ocr/translate` — Multilingual translation preserving numbers, dates, times, and prices (en, ta, hi, ml, te)

## Privacy & Data Handling

Raw camera captures and uploaded images are processed in memory and are **never stored permanently** or logged to disk by AccessAI.

## Getting Started

```bash
cd backend
npm install
npm run dev
```

Server listens on `http://localhost:8000`.
