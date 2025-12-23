import { pool } from '../../../shared/database/connection';

export interface LeaderboardEntry {
  id: number;
  username: string;
  level: number;
  xp: number;
  total_score: number;
  rank: number;
}

export const leaderboardService = {
  async getGlobalLeaderboard(limit = 100, offset = 0): Promise<LeaderboardEntry[]> {
    const [rows] = await pool.query(
      `SELECT 
        u.id,
        u.username,
        u.level,
        u.xp,
        u.total_score,
        ROW_NUMBER() OVER (ORDER BY u.total_score DESC, u.xp DESC) as rank
      FROM users u
      WHERE u.is_active = true
      ORDER BY u.total_score DESC, u.xp DESC
      LIMIT ? OFFSET ?`,
      [limit, offset]
    );

    return rows as LeaderboardEntry[];
  },

  async getUserRank(userId: number): Promise<number | null> {
    const [rows] = await pool.query(
      `SELECT rank
       FROM (
         SELECT 
           id,
           ROW_NUMBER() OVER (ORDER BY total_score DESC, xp DESC) as rank
         FROM users
         WHERE is_active = true
       ) ranked
       WHERE id = ?`,
      [userId]
    );

    const result = rows as any[];
    return result[0]?.rank || null;
  },

  async getCategoryLeaderboard(
    categoryId: number,
    limit = 100,
    offset = 0
  ): Promise<LeaderboardEntry[]> {
    const [rows] = await pool.query(
      `SELECT 
        u.id,
        u.username,
        u.level,
        u.xp,
        COALESCE(MAX(us.best_score), 0) as total_score,
        ROW_NUMBER() OVER (ORDER BY COALESCE(MAX(us.best_score), 0) DESC) as rank
      FROM users u
      LEFT JOIN user_stats us ON us.user_id = u.id AND us.category_id = ?
      WHERE u.is_active = true
      GROUP BY u.id, u.username, u.level, u.xp
      ORDER BY COALESCE(MAX(us.best_score), 0) DESC
      LIMIT ? OFFSET ?`,
      [categoryId, limit, offset]
    );

    return rows as LeaderboardEntry[];
  },
};
