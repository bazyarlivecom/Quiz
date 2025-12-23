import { pool } from '../../../shared/database/connection';
import { levelService } from './levelService';

export const xpService = {
  async addXP(userId: number, xpAmount: number): Promise<{
    oldLevel: number;
    newLevel: number;
    oldXP: number;
    newXP: number;
    leveledUp: boolean;
  }> {
    // Get current user
    const [userRows] = await pool.query(
      'SELECT xp, level FROM users WHERE id = ?',
      [userId]
    );

    const users = userRows as any[];
    if (users.length === 0) {
      throw new Error('User not found');
    }

    const oldXP = users[0].xp;
    const oldLevel = users[0].level;
    const newXP = oldXP + xpAmount;
    const newLevel = levelService.calculateLevel(newXP);

    // Update user
    await pool.query(
      `UPDATE users
       SET xp = ?, level = ?, updated_at = NOW()
       WHERE id = ?`,
      [newXP, newLevel, userId]
    );

    return {
      oldLevel,
      newLevel,
      oldXP,
      newXP,
      leveledUp: newLevel > oldLevel,
    };
  },
};
