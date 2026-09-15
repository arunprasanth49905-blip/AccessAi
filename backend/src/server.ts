import dotenv from 'dotenv';
dotenv.config();

import { app } from './app.js';

const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 8000;

app.listen(PORT, () => {
  console.log(`AccessAI backend server listening on http://localhost:${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/api/health`);
  console.log(`Voice API: http://localhost:${PORT}/api/voice/chat`);
});
