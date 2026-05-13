import { Request, Response, NextFunction } from 'express';
import logger from './logger';

// Middleware to log unhandled errors before passing to error handler
export const errorLogger = (
  error: Error,
  req: Request,
  _res: Response,
  next: NextFunction
): void => {
  logger.error('Unhandled error caught', {
    message: error.message,
    stack: error.stack,
    method: req.method,
    url: req.originalUrl,
    ip: req.ip
  });

  next(error);
};
