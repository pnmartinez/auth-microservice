import winston from 'winston';

const logLevel = process.env.LOG_LEVEL || 'info';

export const logger = winston.createLogger({
  level: logLevel,
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'auth-microservice' },
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      ),
    }),
  ],
});

// Helper to add request ID to logs
export function logWithRequestId(requestId: string | undefined, level: string, message: string, meta?: any) {
  const logData = { ...meta, requestId };
  if (level === 'error') {
    logger.error(message, logData);
  } else if (level === 'warn') {
    logger.warn(message, logData);
  } else {
    logger.info(message, logData);
  }
}

if (process.env.NODE_ENV === 'production') {
  logger.add(
    new winston.transports.File({ filename: 'error.log', level: 'error' })
  );
  logger.add(new winston.transports.File({ filename: 'combined.log' }));
}

