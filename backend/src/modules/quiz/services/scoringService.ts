export interface ScoreCalculation {
  basePoints: number;
  difficultyMultiplier: number;
  timeBonus: number;
  finalPoints: number;
}

export interface XPCalculation {
  baseXP: number;
  timeBonus: number;
  finalXP: number;
}

export class ScoringService {
  calculatePoints(question: any, timeTaken: number): number {
    if (!question) {
      return 0;
    }

    const basePoints = question.points || 10;
    const difficultyMultiplier = this.getDifficultyMultiplier(question.difficulty);
    const timeBonus = this.calculateTimeBonus(timeTaken);

    return Math.round(basePoints * difficultyMultiplier * timeBonus);
  }

  calculatePointsDetailed(question: any, timeTaken: number): ScoreCalculation {
    const basePoints = question.points || 10;
    const difficultyMultiplier = this.getDifficultyMultiplier(question.difficulty);
    const timeBonus = this.calculateTimeBonus(timeTaken);
    const finalPoints = Math.round(basePoints * difficultyMultiplier * timeBonus);

    return {
      basePoints,
      difficultyMultiplier,
      timeBonus,
      finalPoints,
    };
  }

  calculateXP(question: any, isCorrect: boolean, timeTaken: number): number {
    if (!isCorrect || !question) {
      return 0;
    }

    const baseXP = this.getBaseXP(question.difficulty);
    const timeBonus = timeTaken < 5 ? 0.2 : 0;

    return Math.round(baseXP * (1 + timeBonus));
  }

  calculateXPDetailed(question: any, isCorrect: boolean, timeTaken: number): XPCalculation {
    if (!isCorrect || !question) {
      return {
        baseXP: 0,
        timeBonus: 0,
        finalXP: 0,
      };
    }

    const baseXP = this.getBaseXP(question.difficulty);
    const timeBonus = timeTaken < 5 ? 0.2 : 0;
    const finalXP = Math.round(baseXP * (1 + timeBonus));

    return {
      baseXP,
      timeBonus,
      finalXP,
    };
  }

  calculateLevel(xp: number): number {
    return Math.floor(Math.sqrt(xp / 100)) + 1;
  }

  getXPForLevel(level: number): number {
    return Math.pow(level - 1, 2) * 100;
  }

  getXPForNextLevel(currentLevel: number): number {
    const nextLevel = currentLevel + 1;
    return this.getXPForLevel(nextLevel);
  }

  private getDifficultyMultiplier(difficulty: string): number {
    const multipliers: Record<string, number> = {
      EASY: 1.0,
      MEDIUM: 1.5,
      HARD: 2.0,
      EXPERT: 3.0,
    };
    return multipliers[difficulty] || 1.0;
  }

  private calculateTimeBonus(timeTaken: number): number {
    if (timeTaken <= 5) {
      return 2.0;
    }
    if (timeTaken <= 10) {
      return 1.5;
    }
    if (timeTaken <= 15) {
      return 1.3;
    }
    if (timeTaken <= 20) {
      return 1.1;
    }
    if (timeTaken <= 25) {
      return 1.0;
    }
    return 0.8;
  }

  private getBaseXP(difficulty: string): number {
    const baseXP: Record<string, number> = {
      EASY: 10,
      MEDIUM: 20,
      HARD: 30,
      EXPERT: 50,
    };
    return baseXP[difficulty] || 10;
  }
}

