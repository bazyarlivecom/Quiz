import { LevelService } from './levelService';
import { db } from '../../../shared/database/connection';

export class XPService {
  private levelService: LevelService;

  constructor() {
    this.levelService = new LevelService();
  }

  async addXP(userId: number, xpAmount: number): Promise<{
    newXP: number;
    newLevel: number;
    leveledUp: boolean;
    oldLevel: number;
  }> {
    const userResult = await db.query('SELECT xp, level FROM users WHERE id = $1', [userId]);
    if (userResult.rows.length === 0) {
      throw new Error('User not found');
    }

    const oldXP = userResult.rows[0].xp;
    const oldLevel = userResult.rows[0].level;
    const newXP = oldXP + xpAmount;
    const newLevel = this.levelService.calculateLevel(newXP);

    await db.query('UPDATE users SET xp = $1, level = $2 WHERE id = $3', [newXP, newLevel, userId]);

    const leveledUp = newLevel > oldLevel;

    return {
      newXP,
      newLevel,
      leveledUp,
      oldLevel,
    };
  }

  calculateXPForAnswer(question: any, isCorrect: boolean, timeTaken: number): number {
    if (!isCorrect) {
      return 0;
    }

    const baseXP: Record<string, number> = {
      EASY: 10,
      MEDIUM: 20,
      HARD: 30,
      EXPERT: 50,
    };

    const base = baseXP[question.difficulty] || 10;
    const timeBonus = timeTaken < 5 ? 0.2 : 0;

    return Math.round(base * (1 + timeBonus));
  }
}

