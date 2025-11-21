import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger.util';
import { AppError, ValidationError } from '../utils/errors';
import { TracingRequest } from './tracing.middleware';

export function errorHandler(
  err: Error,
  req: TracingRequest,
  res: Response,
  _next: NextFunction
): void {
  const requestId = req.requestId;

  // Handle known application errors
  if (err instanceof AppError) {
    logger.warn('Application error:', {
      message: err.message,
      statusCode: err.statusCode,
      path: req.path,
      method: req.method,
      name: err.name,
      requestId,
    });

    res.status(err.statusCode).json({
      error: err.message,
      requestId,
      ...(err instanceof ValidationError && { fields: err.fields }),
    });
    return;
  }

  // Handle unknown errors
  logger.error('Unexpected error:', {
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    name: err.name,
    requestId,
  });

  const isDevelopment = process.env.NODE_ENV === 'development';
  
  res.status(500).json({
    error: isDevelopment ? err.message : 'Internal server error',
    requestId,
    ...(isDevelopment && { stack: err.stack }),
  });
}

// Re-export for convenience
export { ValidationError } from '../utils/errors';

export function notFoundHandler(
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  res.status(404).json({ error: 'Route not found' });
}

