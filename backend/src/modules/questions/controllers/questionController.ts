import { Request, Response, NextFunction } from 'express';
import { questionService } from '../services/questionService';
import { z } from 'zod';

const getRandomQuestionsSchema = z.object({
  categoryId: z.number().nullable().default(null),
  difficulty: z.enum(['EASY', 'MEDIUM', 'HARD', 'EXPERT', 'MIXED']).optional(),
  count: z.number().int().min(1).max(50).default(10),
});

export const questionController = {
  async getRandomQuestions(req: Request, res: Response, next: NextFunction) {
    try {
      const { categoryId, difficulty, count } = getRandomQuestionsSchema.parse({
        categoryId: req.query.categoryId
          ? parseInt(req.query.categoryId as string, 10)
          : null,
        difficulty: req.query.difficulty || 'MIXED',
        count: req.query.count
          ? parseInt(req.query.count as string, 10)
          : 10,
      });

      const questions = await questionService.getRandomQuestions(
        categoryId ?? null,
        difficulty || null,
        count
      );

      return res.json({
        success: true,
        data: questions,
      });
    } catch (error) {
      return next(error);
    }
  },

  async getQuestionById(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        throw new Error('Invalid question ID');
      }

      const question = await questionService.getQuestionById(id);
      return res.json({
        success: true,
        data: question,
      });
    } catch (error) {
      return next(error);
    }
  },

  async getCategories(_req: Request, res: Response, next: NextFunction) {
    try {
      const categories = await questionService.getAllCategories();
      return res.json({
        success: true,
        data: categories,
      });
    } catch (error) {
      return next(error);
    }
  },
};

