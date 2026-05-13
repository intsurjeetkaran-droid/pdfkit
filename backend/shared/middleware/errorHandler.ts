import { Request, Response, NextFunction } from 'express';
import logger from '../logger/logger';

// Shape of a structured API error
export interface AppError extends Error {
  statusCode?: number;
  isOperational?: boolean;
}

// Global error handler — must be registered last in Express middleware chain
export const errorHandler = (
  error: AppError,
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  const statusCode = error.statusCode || 500;
  const message = error.isOperational ? error.message : 'Internal Server Error';

  logger.error('Request failed', {
    statusCode,
    message: error.message,
    stack: error.stack,
    method: req.method,
    url: req.originalUrl
  });

  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
  });
};

// Helper to create operational errors with a status code
export const createError = (message: string, statusCode: number): AppError => {
  const error: AppError = new Error(message);
  error.statusCode = statusCode;
  error.isOperational = true;
  return error;
};
