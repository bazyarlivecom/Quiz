import { JWTPayload } from '../utils/jwt';

declare global {
  namespace Express {
    interface Request {
      userId?: number;
      user?: JWTPayload;
    }
  }
}

export {};

