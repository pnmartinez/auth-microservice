import rateLimit from 'express-rate-limit';
import { Request } from 'express';
import { db } from '../config/database';

const WINDOW_MS = parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'); // 15 minutes
const MAX_REQUESTS = parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '5');

// General rate limiter for auth endpoints
export const authRateLimiter = rateLimit({
  windowMs: WINDOW_MS,
  max: MAX_REQUESTS,
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

// Stricter rate limiter for login attempts
export const loginRateLimiter = rateLimit({
  windowMs: WINDOW_MS,
  max: 5,
  message: 'Too many login attempts, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  skip: async (req: Request) => {
    // Check database for recent failed attempts
    const email = req.body?.email;
    if (!email) return false;

    const recentAttempts = await db('login_attempts')
      .where({ email, success: false })
      .where('created_at', '>', new Date(Date.now() - WINDOW_MS))
      .count('* as count')
      .first();

    const count = parseInt(recentAttempts?.count as string || '0');
    return count < MAX_REQUESTS;
  },
});

// Admin endpoints rate limiter
export const adminRateLimiter = rateLimit({
  windowMs: 60000, // 1 minute
  max: 30,
  message: 'Too many admin requests, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

