# AccessAI Backend

Node.js + Express.js + TypeScript backend for AccessAI Multimodal Accessibility Companion.

## Architecture

- **Server:** Express.js on port 8000
- **Validation:** Zod request schema validation
- **Provider Abstraction:** Decoupled AI provider architecture with deterministic intent-aware fallback
- **Accessibility Aware:** Adapts phrasing for `simplifiedMode` and respects language/voice preferences

## Endpoints

- `GET /api/health` — Health check endpoint
- `POST /api/voice/chat` — Voice chat reasoning endpoint

## Getting Started

```bash
cd backend
npm install
npm run dev
```
