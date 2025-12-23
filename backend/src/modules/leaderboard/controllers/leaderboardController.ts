import { Request, Response, NextFunction } from 'express';
import { leaderboardService } from '../services/leaderboardService';
import { AuthRequest } from '../../../shared/middleware/auth';

export const leaderboardController = {
  async getGlobal(req: Request, res: Response, next: NextFunction) {
    try {
      const limit = parseInt(req.query.limit as string) || 100;
      const offset = parseInt(req.query.offset as string) || 0;

      const leaderboard = await leaderboardService.getGlobalLeaderboard(limit, offset);

      return res.json({
        success: true,
        data: leaderboard,
      });
    } catch (error) {
      return next(error);
    }
  },

  async getUserRank(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new Error('User not authenticated');
      }

      const rank = await leaderboardService.getUserRank(req.user.userId);

      return res.json({
        success: true,
        data: { rank },
      });
    } catch (error) {
      return next(error);
    }
  },

  async getCategory(req: Request, res: Response, next: NextFunction) {
    try {
      const categoryId = parseInt(req.params.categoryId);
      if (isNaN(categoryId)) {
        throw new Error('Invalid category ID');
      }

      const limit = parseInt(req.query.limit as string) || 100;
      const offset = parseInt(req.query.offset as string) || 0;

      const leaderboard = await leaderboardService.getCategoryLeaderboard(
        categoryId,
        limit,
        offset
      );

      return res.json({
        success: true,
        data: leaderboard,
      });
    } catch (error) {
      return next(error);
    }
  },
};

