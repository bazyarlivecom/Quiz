import { Response, NextFunction } from 'express';
import { QuizService } from '../services/quizService';
import { sendSuccess } from '../../../shared/utils/response';
import { AuthRequest } from '../../../shared/middleware/auth';

export class QuizController {
  private quizService: QuizService;

  constructor() {
    this.quizService = new QuizService();
  }

  startGame = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.userId) {
        throw new Error('User ID not found');
      }

      const session = await this.quizService.startGame(req.userId, req.body);
      sendSuccess(res, { sessionId: session.id, status: session.status }, 'Game started successfully', 201);
    } catch (error) {
      next(error);
    }
  };

  getCurrentQuestion = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.userId) {
        throw new Error('User ID not found');
      }

      const sessionId = parseInt(req.params.sessionId, 10);
      const question = await this.quizService.getCurrentQuestion(sessionId, req.userId);
      sendSuccess(res, question);
    } catch (error) {
      next(error);
    }
  };

  submitAnswer = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.userId) {
        throw new Error('User ID not found');
      }

      const sessionId = parseInt(req.params.sessionId, 10);
      const result = await this.quizService.submitAnswer(sessionId, req.userId, req.body);
      sendSuccess(res, result, 'Answer submitted successfully');
    } catch (error) {
      next(error);
    }
  };

  endGame = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.userId) {
        throw new Error('User ID not found');
      }

      const sessionId = parseInt(req.params.sessionId, 10);
      const result = await this.quizService.endGame(sessionId, req.userId);
      sendSuccess(res, result, 'Game ended successfully');
    } catch (error) {
      next(error);
    }
  };
}

