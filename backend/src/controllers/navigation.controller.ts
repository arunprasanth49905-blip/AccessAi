import { Request, Response, NextFunction } from 'express';
import {
  NavigationRouteRequestSchema,
  ResolvePlaceRequestSchema,
} from '../types/navigation.types.js';
import { navigationService } from '../services/navigation.service.js';

export class NavigationController {
  /**
   * POST /api/navigation/route
   * Calculates accessible route based on real OSRM coordinates or topological indoor graph
   */
  async calculateRoute(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const parseResult = NavigationRouteRequestSchema.safeParse(req.body);
      if (!parseResult.success) {
        res.status(400).json({
          error: 'VALIDATION_ERROR',
          message: 'Invalid navigation route request',
          details: parseResult.error.issues,
        });
        return;
      }

      const result = await navigationService.calculateRoute(parseResult.data);
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/navigation/destinations
   * Returns list of supported accessible indoor waypoints
   */
  async getDestinations(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const destinations = navigationService.getAvailableDestinations();
      res.status(200).json({ destinations });
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/navigation/resolve-place
   * Resolves address, place name, or coordinate query using OpenStreetMap Nominatim or indoor waypoints
   */
  async resolvePlace(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const parseResult = ResolvePlaceRequestSchema.safeParse(req.body);
      if (!parseResult.success) {
        res.status(400).json({
          error: 'VALIDATION_ERROR',
          message: 'Invalid place search query',
          details: parseResult.error.issues,
        });
        return;
      }

      const places = await navigationService.resolvePlace(parseResult.data);
      res.status(200).json({
        query: parseResult.data.query,
        count: places.length,
        places,
      });
    } catch (err) {
      next(err);
    }
  }
}

export const navigationController = new NavigationController();
