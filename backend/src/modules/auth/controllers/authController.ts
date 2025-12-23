import { Request, Response, NextFunction } from 'express';
import { authService } from '../services/authService';
import { registerSchema, loginSchema } from '../dto/auth.dto';
import { ValidationError } from '../../../shared/utils/errors';
import { AuthRequest } from '../../../shared/middleware/auth';

export const authController = {
  async register(req: Request, res: Response, next: NextFunction) {
    try {
      const validatedData = registerSchema.parse(req.body);
      const result = await authService.register(validatedData);
      
      return res.status(201).json({
        success: true,
        data: result,
        message: 'User registered successfully',
      });
    } catch (error) {
      if (error instanceof ValidationError) {
        return next(error);
      }
      return next(error);
    }
  },

  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const validatedData = loginSchema.parse(req.body);
      const result = await authService.login(validatedData);
      
      return res.json({
        success: true,
        data: result,
        message: 'Login successful',
      });
    } catch (error) {
      return next(error);
    }
  },

  async getMe(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new ValidationError('User not authenticated');
      }

      const user = await authService.getMe(req.user.userId);
      
      return res.json({
        success: true,
        data: {
          id: user.id,
          username: user.username,
          email: user.email,
          level: user.level,
          xp: user.xp,
          totalScore: user.total_score,
          avatarUrl: user.avatar_url,
        },
      });
    } catch (error) {
      return next(error);
    }
  },
};

