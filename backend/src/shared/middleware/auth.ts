import { Request, Response, NextFunction } from 'express';
import { verifyToken, JWTPayload } from '../utils/jwt';
import { UnauthorizedError } from '../utils/errors';

export interface AuthRequest extends Request {
  userId?: number;
  user?: JWTPayload;
}

export const authenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedError('Authentication required');
    }

    const token = authHeader.substring(7);

    if (!token) {
      throw new UnauthorizedError('Token not provided');
    }

    const decoded = verifyToken(token);
    req.userId = decoded.userId;
    req.user = decoded;

    next();
  } catch (error) {
    if (error instanceof Error) {
      throw new UnauthorizedError(error.message);
    }
    throw new UnauthorizedError('Invalid token');
  }
};

