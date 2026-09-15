import { Request, Response, NextFunction } from 'express';
import { NavigationRouteRequestSchema } from '../types/navigation.types.js';
import { navigationService } from '../services/navigation.service.js';

export class NavigationController {
  /**
   * POST /api/navigation/route
   * Calculates accessible route based on topological indoor graph and preferences
   */
  async calculateRoute(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const parseResult = NavigationRouteRequestSchema.safeParse(req.body);
      if (!parseResult.success) {
        res.status(400).json({
          error: 'VALIDATION_ERROR',
          message: 'Invalid navigation route request',
          details: parseResult.error.errors,
        });
        return;
      }

      const result = navigationService.calculateRoute(parseResult.data);
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
}

export const navigationController = new NavigationController();
