import { Question } from '../../questions/repositories/questionRepository';

export const scoringService = {
  calculatePoints(question: Question, timeTaken: number): number {
    const basePoints = question.points;
    const difficultyMultiplier = this.getDifficultyMultiplier(question.difficulty);
    const timeBonus = this.calculateTimeBonus(timeTaken);

    return Math.round(basePoints * difficultyMultiplier * timeBonus);
  },

  getDifficultyMultiplier(
    difficulty: 'EASY' | 'MEDIUM' | 'HARD' | 'EXPERT'
  ): number {
    const multipliers = {
      EASY: 1.0,
      MEDIUM: 1.5,
      HARD: 2.0,
      EXPERT: 3.0,
    };
    return multipliers[difficulty] || 1.0;
  },

  calculateTimeBonus(timeTaken: number): number {
    if (timeTaken <= 5) {
      return 1.5; // 50% bonus
    } else if (timeTaken <= 10) {
      return 1.3; // 30% bonus
    } else if (timeTaken <= 20) {
      return 1.1; // 10% bonus
    } else {
      return 1.0; // No bonus
    }
  },

  calculateXP(
    question: Question,
    isCorrect: boolean,
    timeTaken: number
  ): number {
    if (!isCorrect) {
      return 0;
    }

    const baseXP = {
      EASY: 10,
      MEDIUM: 20,
      HARD: 30,
      EXPERT: 50,
    }[question.difficulty] || 10;

    const timeBonus = timeTaken < 5 ? 0.2 : 0;

    return Math.round(baseXP * (1 + timeBonus));
  },
};



