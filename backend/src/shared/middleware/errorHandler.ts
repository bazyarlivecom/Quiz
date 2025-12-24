import { Request, Response, NextFunction } from 'express';
import { AppError, ValidationError } from '../utils/errors';
import { sendError } from '../utils/response';
import { logger } from '../utils/logger';

export const errorHandler = (
  err: Error | AppError,
  req: Request,
  res: Response,
  _next: NextFunction
): Response => {
  // Handle ValidationError with detailed errors
  if (err instanceof ValidationError) {
    logger.error('Validation Error:', {
      error: err.message,
      validationErrors: err.errors,
      path: req.path,
      method: req.method,
    });
    return sendError(res, err.message, err.errors, err.statusCode);
  }

  logger.error('Error:', {
    error: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
  });

  if (err instanceof AppError) {
    // Include additional error data if available (e.g., activeSessionId)
    const activeSessionId = (err as any).activeSessionId;
    const errorData = activeSessionId ? [{ activeSessionId }] : undefined;
    return sendError(res, err.message, errorData, err.statusCode);
  }

  if (err.name === 'ValidationError') {
    return sendError(res, 'Validation error', [err.message], 400);
  }

  if (err.name === 'JsonWebTokenError') {
    return sendError(res, 'Invalid token', undefined, 401);
  }

  if (err.name === 'TokenExpiredError') {
    return sendError(res, 'Token expired', undefined, 401);
  }

  return sendError(res, 'Internal server error', undefined, 500);
};

