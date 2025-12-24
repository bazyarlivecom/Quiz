import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/authService';
import { sendSuccess } from '../../../shared/utils/response';
import { AuthRequest } from '../../../shared/middleware/auth';
import { UserRepository } from '../repositories/userRepository';

export class AuthController {
  private authService: AuthService;
  private userRepository: UserRepository;

  constructor() {
    this.authService = new AuthService();
    this.userRepository = new UserRepository();
  }

  register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await this.authService.registerUser(req.body);
      sendSuccess(res, result, 'User registered successfully', 201);
    } catch (error) {
      next(error);
    }
  };

  login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await this.authService.loginUser(req.body);
      sendSuccess(res, result, 'Login successful');
    } catch (error) {
      next(error);
    }
  };

  getMe = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.userId) {
        throw new Error('User ID not found');
      }

      const user = await this.userRepository.findById(req.userId);
      if (!user) {
        throw new Error('User not found');
      }

      sendSuccess(res, {
        id: user.id,
        username: user.username,
        email: user.email,
        level: user.level,
        xp: user.xp,
        totalScore: user.total_score,
        avatarUrl: user.avatar_url,
      });
    } catch (error) {
      next(error);
    }
  };

  refresh = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { refreshToken } = req.body;
      if (!refreshToken) {
        throw new Error('Refresh token is required');
      }

      const { verifyRefreshToken, generateToken, generateRefreshToken } = await import(
        '../../../shared/utils/jwt'
      );
      const payload = verifyRefreshToken(refreshToken);

      const newToken = generateToken(payload);
      const newRefreshToken = generateRefreshToken(payload);

      sendSuccess(res, {
        token: newToken,
        refreshToken: newRefreshToken,
      });
    } catch (error) {
      next(error);
    }
  };
}

