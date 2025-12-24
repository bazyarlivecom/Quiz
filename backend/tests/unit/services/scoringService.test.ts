import { ScoringService } from '../../../src/modules/quiz/services/scoringService';

describe('ScoringService', () => {
  let scoringService: ScoringService;

  beforeEach(() => {
    scoringService = new ScoringService();
  });

  describe('calculatePoints', () => {
    it('should calculate points correctly for easy question', () => {
      const question = {
        id: 1,
        difficulty: 'EASY',
        points: 10,
      };

      const points = scoringService.calculatePoints(question, 5);
      expect(points).toBeGreaterThan(0);
    });

    it('should give more points for faster answers', () => {
      const question = {
        id: 1,
        difficulty: 'MEDIUM',
        points: 10,
      };

      const fastPoints = scoringService.calculatePoints(question, 3);
      const slowPoints = scoringService.calculatePoints(question, 30);

      expect(fastPoints).toBeGreaterThan(slowPoints);
    });

    it('should give more points for harder questions', () => {
      const easyQuestion = { id: 1, difficulty: 'EASY', points: 10 };
      const hardQuestion = { id: 2, difficulty: 'HARD', points: 10 };

      const easyPoints = scoringService.calculatePoints(easyQuestion, 10);
      const hardPoints = scoringService.calculatePoints(hardQuestion, 10);

      expect(hardPoints).toBeGreaterThan(easyPoints);
    });
  });

  describe('calculateXP', () => {
    it('should return 0 XP for incorrect answer', () => {
      const question = {
        id: 1,
        difficulty: 'EASY',
      };

      const xp = scoringService.calculateXP(question, false, 5);
      expect(xp).toBe(0);
    });

    it('should give XP for correct answer', () => {
      const question = {
        id: 1,
        difficulty: 'MEDIUM',
      };

      const xp = scoringService.calculateXP(question, true, 5);
      expect(xp).toBeGreaterThan(0);
    });

    it('should give bonus XP for fast answers', () => {
      const question = {
        id: 1,
        difficulty: 'EASY',
      };

      const fastXP = scoringService.calculateXP(question, true, 3);
      const slowXP = scoringService.calculateXP(question, true, 10);

      expect(fastXP).toBeGreaterThan(slowXP);
    });
  });

  describe('calculateLevel', () => {
    it('should calculate level 1 for 0 XP', () => {
      const level = scoringService.calculateLevel(0);
      expect(level).toBe(1);
    });

    it('should calculate level correctly', () => {
      const level1 = scoringService.calculateLevel(0);
      const level2 = scoringService.calculateLevel(100);
      const level3 = scoringService.calculateLevel(400);

      expect(level1).toBe(1);
      expect(level2).toBeGreaterThan(level1);
      expect(level3).toBeGreaterThan(level2);
    });
  });
});

