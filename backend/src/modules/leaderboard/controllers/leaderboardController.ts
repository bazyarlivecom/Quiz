import { Request, Response, NextFunction } from 'express';
import { LeaderboardService } from '../services/leaderboardService';
import { sendSuccess } from '../../../shared/utils/response';

export class LeaderboardController {
  private leaderboardService: LeaderboardService;

  constructor() {
    this.leaderboardService = new LeaderboardService();
  }

  getGlobalLeaderboard = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const limit = parseInt(req.query.limit as string, 10) || 100;
      const offset = parseInt(req.query.offset as string, 10) || 0;
      const leaderboard = await this.leaderboardService.getGlobalLeaderboard(limit, offset);
      sendSuccess(res, leaderboard);
    } catch (error) {
      next(error);
    }
  };

  getCategoryLeaderboard = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const categoryId = parseInt(req.params.categoryId, 10);
      const limit = parseInt(req.query.limit as string, 10) || 100;
      const leaderboard = await this.leaderboardService.getCategoryLeaderboard(categoryId, limit);
      sendSuccess(res, leaderboard);
    } catch (error) {
      next(error);
    }
  };

  getWeeklyLeaderboard = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const limit = parseInt(req.query.limit as string, 10) || 100;
      const leaderboard = await this.leaderboardService.getWeeklyLeaderboard(limit);
      sendSuccess(res, leaderboard);
    } catch (error) {
      next(error);
    }
  };

  getUserRank = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = parseInt(req.params.userId, 10);
      const rank = await this.leaderboardService.getUserRank(userId);
      sendSuccess(res, { userId, rank });
    } catch (error) {
      next(error);
    }
  };
}

