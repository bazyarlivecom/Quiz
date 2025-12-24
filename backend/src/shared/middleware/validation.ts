import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import { ValidationError } from '../utils/errors';

export const validate = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = schema.parse({
        body: req.body,
        query: req.query,
        params: req.params,
      });

      if (result.body) {
        req.body = result.body;
      }
      if (result.query) {
        req.query = result.query;
      }
      if (result.params) {
        req.params = result.params;
      }

      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const errors = error.errors.map((err) => ({
          path: err.path.join('.'),
          message: err.message,
        }));
        throw new ValidationError('Validation failed', errors);
      }
      next(error);
    }
  };
};

