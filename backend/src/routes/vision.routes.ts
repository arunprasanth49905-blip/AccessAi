import { Router } from 'express';
import multer from 'multer';
import { handleVisionAnalyze } from '../controllers/vision.controller.js';

const router = Router();

// Store uploaded files in memory with a 10MB limit
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
});

// Support both multipart/form-data with 'image' field and JSON base64 payloads
router.post('/analyze', upload.single('image'), handleVisionAnalyze);

export default router;
