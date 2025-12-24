import { db } from '../../../shared/database/connection';

export interface LeaderboardEntry {
  userId: number;
  username: string;
  totalScore: number;
  level: number;
  rank: number;
}

export class LeaderboardRepository {
  async getTopUsers(limit: number = 100, offset: number = 0): Promise<LeaderboardEntry[]> {
    const result = await db.query(
      `SELECT 
        u.id as user_id,
        u.username,
        u.total_score,
        u.level,
        ROW_NUMBER() OVER (ORDER BY u.total_score DESC, u.level DESC) as rank
       FROM users u
       WHERE u.is_active = true
       ORDER BY u.total_score DESC, u.level DESC
       LIMIT $1 OFFSET $2`,
      [limit, offset]
    );

    return result.rows.map((row) => ({
      userId: row.user_id,
      username: row.username,
      totalScore: row.total_score,
      level: row.level,
      rank: parseInt(row.rank, 10),
    }));
  }

  async getUserRank(userId: number): Promise<number | null> {
    const result = await db.query(
      `SELECT rank
       FROM (
         SELECT 
           id,
           ROW_NUMBER() OVER (ORDER BY total_score DESC, level DESC) as rank
         FROM users
         WHERE is_active = true
       ) ranked
       WHERE id = $1`,
      [userId]
    );

    if (result.rows.length === 0) {
      return null;
    }

    return parseInt(result.rows[0].rank, 10);
  }

  async getCategoryTopUsers(categoryId: number, limit: number = 100): Promise<LeaderboardEntry[]> {
    const result = await db.query(
      `SELECT 
        u.id as user_id,
        u.username,
        SUM(m.total_score) as total_score,
        u.level,
        ROW_NUMBER() OVER (ORDER BY SUM(m.total_score) DESC) as rank
       FROM users u
       INNER JOIN matches m ON u.id = m.user_id
       WHERE m.category_id = $1 
         AND m.status = 'COMPLETED'
         AND u.is_active = true
       GROUP BY u.id, u.username, u.level
       ORDER BY SUM(m.total_score) DESC
       LIMIT $2`,
      [categoryId, limit]
    );

    return result.rows.map((row) => ({
      userId: row.user_id,
      username: row.username,
      totalScore: parseInt(row.total_score, 10),
      level: row.level,
      rank: parseInt(row.rank, 10),
    }));
  }

  async getWeeklyLeaderboard(limit: number = 100): Promise<LeaderboardEntry[]> {
    const result = await db.query(
      `SELECT 
        u.id as user_id,
        u.username,
        SUM(m.total_score) as total_score,
        u.level,
        ROW_NUMBER() OVER (ORDER BY SUM(m.total_score) DESC) as rank
       FROM users u
       INNER JOIN matches m ON u.id = m.user_id
       WHERE m.status = 'COMPLETED'
         AND m.started_at >= CURRENT_DATE - INTERVAL '7 days'
         AND u.is_active = true
       GROUP BY u.id, u.username, u.level
       ORDER BY SUM(m.total_score) DESC
       LIMIT $1`,
      [limit]
    );

    return result.rows.map((row) => ({
      userId: row.user_id,
      username: row.username,
      totalScore: parseInt(row.total_score, 10),
      level: row.level,
      rank: parseInt(row.rank, 10),
    }));
  }
}

