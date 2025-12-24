import { Response, NextFunction } from 'express';
import { UserRepository } from '../../auth/repositories/userRepository';
import { sendSuccess } from '../../../shared/utils/response';
import { AuthRequest } from '../../../shared/middleware/auth';
import { NotFoundError } from '../../../shared/utils/errors';

export class UserController {
  private userRepository: UserRepository;

  constructor() {
    this.userRepository = new UserRepository();
  }

  getProfile = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.userId) {
        throw new Error('User ID not found');
      }

      const user = await this.userRepository.findById(req.userId);
      if (!user) {
        throw new NotFoundError('User not found');
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

  updateProfile = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.userId) {
        throw new Error('User ID not found');
      }

      const updates: any = {};
      if (req.body.username) updates.username = req.body.username;
      if (req.body.avatarUrl !== undefined) updates.avatar_url = req.body.avatarUrl;

      const user = await this.userRepository.update(req.userId, updates);
      sendSuccess(res, {
        id: user.id,
        username: user.username,
        email: user.email,
        level: user.level,
        xp: user.xp,
        totalScore: user.total_score,
        avatarUrl: user.avatar_url,
      }, 'Profile updated successfully');
    } catch (error) {
      next(error);
    }
  };
}

