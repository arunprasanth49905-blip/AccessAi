import { Router } from 'express';
import multer from 'multer';
import { ocrController } from '../controllers/ocr.controller.js';

const router = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
});

router.post('/extract', upload.single('image'), (req, res, next) => {
  ocrController.extract(req, res, next);
});

router.post('/simplify', (req, res, next) => {
  ocrController.simplify(req, res, next);
});

router.post('/translate', (req, res, next) => {
  ocrController.translate(req, res, next);
});

export default router;
