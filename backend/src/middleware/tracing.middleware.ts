import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';

export interface TracingRequest extends Request {
  requestId?: string;
}

export function tracingMiddleware(
  req: TracingRequest,
  res: Response,
  next: NextFunction
): void {
  // Generate request ID
  const requestId = uuidv4();
  req.requestId = requestId;

  // Add to response header
  res.setHeader('X-Request-ID', requestId);

  next();
}

