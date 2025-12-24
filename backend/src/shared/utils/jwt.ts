import jwt from 'jsonwebtoken';
import { env } from '../config/env';

export interface JWTPayload {
  userId: number;
  email: string;
}

export const generateToken = (payload: JWTPayload): string => {
  const expiresIn = env.jwt.expiresIn;
  return jwt.sign(payload, env.jwt.secret, {
    expiresIn: typeof expiresIn === 'string' ? expiresIn : String(expiresIn),
  } as jwt.SignOptions);
};

export const generateRefreshToken = (payload: JWTPayload): string => {
  const expiresIn = env.jwt.refreshExpiresIn;
  return jwt.sign(payload, env.jwt.refreshSecret, {
    expiresIn: typeof expiresIn === 'string' ? expiresIn : String(expiresIn),
  } as jwt.SignOptions);
};

export const verifyToken = (token: string): JWTPayload => {
  try {
    const decoded = jwt.verify(token, env.jwt.secret);
    if (typeof decoded === 'string' || !decoded) {
      throw new Error('Invalid token payload');
    }
    return decoded as JWTPayload;
  } catch (error) {
    throw new Error('Invalid or expired token');
  }
};

export const verifyRefreshToken = (token: string): JWTPayload => {
  try {
    const decoded = jwt.verify(token, env.jwt.refreshSecret);
    if (typeof decoded === 'string' || !decoded) {
      throw new Error('Invalid token payload');
    }
    return decoded as JWTPayload;
  } catch (error) {
    throw new Error('Invalid or expired refresh token');
  }
};

export const decodeToken = (token: string): JWTPayload | null => {
  try {
    const decoded = jwt.decode(token);
    if (typeof decoded === 'string' || !decoded) {
      return null;
    }
    return decoded as JWTPayload;
  } catch (error) {
    return null;
  }
};
