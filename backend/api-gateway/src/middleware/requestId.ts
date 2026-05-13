import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';

// Attach a unique request ID to every incoming request
// This enables distributed tracing across microservices
export const attachRequestId = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const requestId =
    (req.headers['x-request-id'] as string) ||
    crypto.randomBytes(8).toString('hex');

  req.headers['x-request-id'] = requestId;
  res.setHeader('x-request-id', requestId);

  next();
};
