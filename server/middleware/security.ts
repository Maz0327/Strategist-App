import { Request, Response, NextFunction } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import { debugLogger } from '../services/debug-logger';

// Enhanced CORS configuration
export const corsOptions = {
  origin: function (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:5000',
      'http://localhost:5173',
      'https://localhost:3000',
      'https://localhost:5000',
      'https://localhost:5173'
    ];
    
    // In production, add your deployment URL
    if (process.env.NODE_ENV === 'production') {
      allowedOrigins.push(
        `https://${process.env.REPL_SLUG}.${process.env.REPL_OWNER}.repl.co`,
        `https://${process.env.REPL_SLUG}.${process.env.REPL_OWNER}.replit.app`
      );
    }
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      debugLogger.warn('CORS blocked origin', { origin });
      callback(new Error('Not allowed by CORS'), false);
    }
  },
  credentials: true,
  optionsSuccessStatus: 200
};

// Security headers middleware
export const securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:"],
      scriptSrc: ["'self'"],
      connectSrc: ["'self'", "https://api.openai.com"],
      frameSrc: ["'none'"],
      objectSrc: ["'none'"]
    }
  },
  crossOriginEmbedderPolicy: false, // Disable for API responses
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
});

// Input sanitization middleware
export const sanitizeInput = (req: Request, res: Response, next: NextFunction) => {
  const sanitizeValue = (value: any): any => {
    if (typeof value === 'string') {
      // Remove potentially dangerous characters
      return value
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/javascript:/gi, '')
        .replace(/on\w+\s*=/gi, '')
        .trim();
    }
    if (typeof value === 'object' && value !== null) {
      const sanitized: any = Array.isArray(value) ? [] : {};
      Object.keys(value).forEach(key => {
        sanitized[key] = sanitizeValue(value[key]);
      });
      return sanitized;
    }
    return value;
  };

  if (req.body) {
    req.body = sanitizeValue(req.body);
  }
  if (req.query) {
    req.query = sanitizeValue(req.query);
  }
  if (req.params) {
    req.params = sanitizeValue(req.params);
  }

  next();
};

// Request logging middleware
export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  const startTime = Date.now();
  
  // Log request
  debugLogger.info('Incoming request', {
    method: req.method,
    path: req.path,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    userId: (req.session as any)?.userId
  });

  // Log response when finished
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    debugLogger.info('Request completed', {
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      duration,
      ip: req.ip
    });
  });

  next();
};

// API key validation middleware
export const validateApiKey = (req: Request, res: Response, next: NextFunction) => {
  const apiKey = req.headers['x-api-key'];
  
  if (!apiKey) {
    return res.status(401).json({
      error: 'API key required',
      code: 'MISSING_API_KEY'
    });
  }

  // In production, validate against stored API keys
  const validApiKeys = process.env.API_KEYS?.split(',') || [];
  
  if (validApiKeys.length > 0 && !validApiKeys.includes(apiKey as string)) {
    debugLogger.warn('Invalid API key attempt', { 
      apiKey: (apiKey as string).substring(0, 8) + '...',
      ip: req.ip 
    });
    
    return res.status(401).json({
      error: 'Invalid API key',
      code: 'INVALID_API_KEY'
    });
  }

  next();
};

// IP whitelist middleware
export const ipWhitelist = (allowedIPs: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const clientIP = req.ip || req.socket.remoteAddress;
    
    if (allowedIPs.length > 0 && !allowedIPs.includes(clientIP)) {
      debugLogger.warn('IP blocked', { clientIP, allowedIPs });
      
      return res.status(403).json({
        error: 'IP address not allowed',
        code: 'IP_BLOCKED'
      });
    }
    
    next();
  };
};

// Brute force protection
const loginAttempts = new Map<string, { count: number; lastAttempt: number }>();

export const bruteForceProtection = (maxAttempts: number = 5, windowMs: number = 15 * 60 * 1000) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const key = req.ip || 'unknown';
    const now = Date.now();
    
    const attempts = loginAttempts.get(key);
    
    if (attempts) {
      // Reset if window has passed
      if (now - attempts.lastAttempt > windowMs) {
        loginAttempts.delete(key);
      } else if (attempts.count >= maxAttempts) {
        debugLogger.warn('Brute force attempt blocked', { 
          ip: key, 
          attempts: attempts.count 
        });
        
        return res.status(429).json({
          error: 'Too many failed attempts. Please try again later.',
          code: 'BRUTE_FORCE_BLOCKED',
          retryAfter: Math.ceil((windowMs - (now - attempts.lastAttempt)) / 1000)
        });
      }
    }
    
    // Track failed attempts
    res.on('finish', () => {
      if (res.statusCode === 401) {
        const currentAttempts = loginAttempts.get(key) || { count: 0, lastAttempt: now };
        loginAttempts.set(key, {
          count: currentAttempts.count + 1,
          lastAttempt: now
        });
      } else if (res.statusCode === 200) {
        // Clear on successful login
        loginAttempts.delete(key);
      }
    });
    
    next();
  };
};

// Request size limit middleware
export const requestSizeLimit = (maxSize: string = '10mb') => {
  return (req: Request, res: Response, next: NextFunction) => {
    const contentLength = req.headers['content-length'];
    
    if (contentLength) {
      const sizeInBytes = parseInt(contentLength);
      const maxSizeInBytes = parseRequestSize(maxSize);
      
      if (sizeInBytes > maxSizeInBytes) {
        debugLogger.warn('Request size exceeded', {
          contentLength: sizeInBytes,
          maxSize: maxSizeInBytes,
          ip: req.ip
        });
        
        return res.status(413).json({
          error: 'Request entity too large',
          code: 'REQUEST_TOO_LARGE',
          maxSize
        });
      }
    }
    
    next();
  };
};

// Helper function to parse request size
function parseRequestSize(size: string): number {
  const units: { [key: string]: number } = {
    'b': 1,
    'kb': 1024,
    'mb': 1024 * 1024,
    'gb': 1024 * 1024 * 1024
  };
  
  const match = size.toLowerCase().match(/^(\d+)([a-z]+)$/);
  if (!match) return 1024 * 1024; // Default 1MB
  
  const [, num, unit] = match;
  return parseInt(num) * (units[unit] || 1);
}