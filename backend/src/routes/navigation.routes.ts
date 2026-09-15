import { Router } from 'express';
import { navigationController } from '../controllers/navigation.controller.js';

const router = Router();

router.post('/route', (req, res, next) => navigationController.calculateRoute(req, res, next));
router.get('/destinations', (req, res, next) => navigationController.getDestinations(req, res, next));
router.post('/resolve-place', (req, res, next) => navigationController.resolvePlace(req, res, next));

export default router;
