import { Router } from 'express';
import { handleVoiceChat } from '../controllers/voice.controller.js';

const router = Router();

router.post('/chat', handleVoiceChat);

export default router;
