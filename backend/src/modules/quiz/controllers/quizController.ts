import { Response, NextFunction } from 'express';
import { quizService, StartQuizDto, SubmitAnswerDto } from '../services/quizService';
import { z } from 'zod';
import { AuthRequest } from '../../../shared/middleware/auth';
import { ValidationError } from '../../../shared/utils/errors';

const startQuizSchema = z.object({
  categoryId: z.number().nullable().default(null),
  difficulty: z.enum(['EASY', 'MEDIUM', 'HARD', 'EXPERT', 'MIXED']).optional(),
  questionsCount: z.number().int().min(1).max(50).optional(),
  gameMode: z.enum(['SINGLE_PLAYER', 'MULTI_PLAYER', 'PRACTICE']).optional(),
});

const submitAnswerSchema = z.object({
  questionId: z.number(),
  selectedOptionId: z.number(),
  timeTaken: z.number().min(0),
});

export const quizController = {
  async startQuiz(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new ValidationError('User not authenticated');
      }

      const validatedData = startQuizSchema.parse(req.body);
      const dto: StartQuizDto = {
        userId: req.user.userId,
        ...validatedData,
      };

      const result = await quizService.startQuiz(dto);

      return res.json({
        success: true,
        data: {
          matchId: result.match.id,
          questions: result.questions,
          gameMode: result.match.game_mode,
          isPractice: result.match.is_practice,
        },
        message: 'Quiz started successfully',
      });
    } catch (error) {
      return next(error);
    }
  },

  async getCurrentQuestion(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new ValidationError('User not authenticated');
      }

      const matchId = parseInt(req.params.matchId);
      if (isNaN(matchId)) {
        throw new ValidationError('Invalid match ID');
      }

      const result = await quizService.getCurrentQuestion(matchId, req.user.userId);

      if (!result) {
        return res.json({
          success: true,
          data: null,
          message: 'All questions answered',
        });
      }

      return res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      return next(error);
    }
  },

  async submitAnswer(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new ValidationError('User not authenticated');
      }

      const matchId = parseInt(req.params.matchId);
      if (isNaN(matchId)) {
        throw new ValidationError('Invalid match ID');
      }

      const validatedData = submitAnswerSchema.parse(req.body);
      const dto: SubmitAnswerDto = {
        matchId,
        ...validatedData,
      };

      const result = await quizService.submitAnswer(dto, req.user.userId);

      return res.json({
        success: true,
        data: result,
        message: result.isComplete ? 'Quiz completed!' : 'Answer submitted',
      });
    } catch (error) {
      return next(error);
    }
  },

  async getResult(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new ValidationError('User not authenticated');
      }

      const matchId = parseInt(req.params.matchId);
      if (isNaN(matchId)) {
        throw new ValidationError('Invalid match ID');
      }

      const result = await quizService.getMatchResult(matchId, req.user.userId);

      return res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      return next(error);
    }
  },
};

