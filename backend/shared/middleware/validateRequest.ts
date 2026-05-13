import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import logger from '../logger/logger';

// Generic Zod validation middleware factory
export const validateRequest = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      // Validate request body against the provided Zod schema
      schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const issues = error.errors.map((e) => ({
          field: e.path.join('.'),
          message: e.message
        }));

        logger.warn('Validation failed', { issues, url: req.originalUrl });

        res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: issues
        });
        return;
      }

      next(error);
    }
  };
};
