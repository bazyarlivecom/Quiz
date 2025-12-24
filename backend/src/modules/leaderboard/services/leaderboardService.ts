import { LeaderboardRepository } from '../repositories/leaderboardRepository';
import { getRedisClient } from '../../../infrastructure/cache/redisClient';

export class LeaderboardService {
  private leaderboardRepository: LeaderboardRepository;

  constructor() {
    this.leaderboardRepository = new LeaderboardRepository();
  }

  async getGlobalLeaderboard(limit: number = 100, offset: number = 0) {
    const cacheKey = `leaderboard:global:${limit}:${offset}`;
    const redis = await getRedisClient();

    try {
      const cached = await redis.get(cacheKey);
      if (cached) {
        return JSON.parse(cached);
      }
    } catch (error) {
      console.error('Redis cache error:', error);
    }

    const leaderboard = await this.leaderboardRepository.getTopUsers(limit, offset);

    try {
      await redis.setEx(cacheKey, 300, JSON.stringify(leaderboard));
    } catch (error) {
      console.error('Redis cache error:', error);
    }

    return leaderboard;
  }

  async getCategoryLeaderboard(categoryId: number, limit: number = 100) {
    const cacheKey = `leaderboard:category:${categoryId}:${limit}`;
    const redis = await getRedisClient();

    try {
      const cached = await redis.get(cacheKey);
      if (cached) {
        return JSON.parse(cached);
      }
    } catch (error) {
      console.error('Redis cache error:', error);
    }

    const leaderboard = await this.leaderboardRepository.getCategoryTopUsers(categoryId, limit);

    try {
      await redis.setEx(cacheKey, 300, JSON.stringify(leaderboard));
    } catch (error) {
      console.error('Redis cache error:', error);
    }

    return leaderboard;
  }

  async getWeeklyLeaderboard(limit: number = 100) {
    const cacheKey = `leaderboard:weekly:${limit}`;
    const redis = await getRedisClient();

    try {
      const cached = await redis.get(cacheKey);
      if (cached) {
        return JSON.parse(cached);
      }
    } catch (error) {
      console.error('Redis cache error:', error);
    }

    const leaderboard = await this.leaderboardRepository.getWeeklyLeaderboard(limit);

    try {
      await redis.setEx(cacheKey, 300, JSON.stringify(leaderboard));
    } catch (error) {
      console.error('Redis cache error:', error);
    }

    return leaderboard;
  }

  async getUserRank(userId: number): Promise<number | null> {
    return this.leaderboardRepository.getUserRank(userId);
  }
}

