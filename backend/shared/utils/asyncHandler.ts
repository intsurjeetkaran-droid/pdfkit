import { Request, Response, NextFunction } from 'express';

// Wraps async route handlers to automatically forward errors to Express error handler
// Eliminates repetitive try/catch in every controller
export const asyncHandler = (
  fn: (req: Request, res: Response, next: NextFunction) => Promise<void>
) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    fn(req, res, next).catch(next);
  };
};
