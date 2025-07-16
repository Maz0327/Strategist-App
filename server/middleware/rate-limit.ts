import rateLimit from 'express-rate-limit';
import { Request, Response } from 'express';

// Rate limiting for OpenAI API calls (analysis endpoints)
export const openaiRateLimit = rateLimit({
  windowMs: 60 * 1000, // 1 minute window
  max: 20, // 20 OpenAI calls per minute per user
  message: {
    error: 'Too many analysis requests. Please wait a minute before trying again.',
    code: 'RATE_LIMIT_EXCEEDED',
    retryAfter: 60
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  keyGenerator: (req: Request) => {
    // Use user ID from session for authenticated users
    const userId = (req as any).session?.userId;
    return userId ? `user_${userId}` : req.ip;
  },
  skip: (req: Request) => {
    // Skip rate limiting for admin users if needed
    return false;
  }
});

// Daily rate limiting for OpenAI API calls
export const dailyOpenaiRateLimit = rateLimit({
  windowMs: 24 * 60 * 60 * 1000, // 24 hours
  max: 500, // 500 analyses per day per user
  message: {
    error: 'Daily analysis limit reached. Your limit will reset tomorrow.',
    code: 'DAILY_LIMIT_EXCEEDED',
    retryAfter: 24 * 60 * 60 // 24 hours in seconds
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req: Request) => {
    const userId = (req as any).session?.userId;
    return userId ? `daily_user_${userId}` : `daily_ip_${req.ip}`;
  }
});

// General API rate limiting (for all endpoints)
export const generalRateLimit = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100, // 100 requests per minute per user
  message: {
    error: 'Too many requests. Please slow down.',
    code: 'GENERAL_RATE_LIMIT_EXCEEDED',
    retryAfter: 60
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req: Request) => {
    const userId = (req as any).session?.userId;
    return userId ? `general_user_${userId}` : `general_ip_${req.ip}`;
  }
});

// Strict rate limiting for registration/login endpoints
export const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 login attempts per 15 minutes
  message: {
    error: 'Too many authentication attempts. Please try again later.',
    code: 'AUTH_RATE_LIMIT_EXCEEDED',
    retryAfter: 15 * 60
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req: Request) => {
    // Use IP for auth attempts to prevent account enumeration
    return req.ip;
  }
});