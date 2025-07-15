import winston from 'winston';
import fs from 'fs';
import path from 'path';
import { debugLogger } from './debug-logger';

/**
 * CRITICAL FIX: Structured logging implementation with Winston
 * Replaces console.log with proper structured logging for production
 */
class StructuredLogger {
  private logger: winston.Logger;
  private isProduction: boolean;

  constructor() {
    this.isProduction = process.env.NODE_ENV === 'production';
    
    // Configure Winston logger
    this.logger = winston.createLogger({
      level: this.isProduction ? 'info' : 'debug',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.json()
      ),
      defaultMeta: { 
        service: 'strategist-app',
        environment: process.env.NODE_ENV || 'development'
      },
      transports: [
        // Write all logs with level 'info' and below to console in development
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.colorize(),
            winston.format.simple()
          )
        }),
        
        // Write all logs with level 'error' and below to error.log
        new winston.transports.File({ 
          filename: 'logs/error.log', 
          level: 'error',
          maxsize: 5242880, // 5MB
          maxFiles: 5,
          tailable: true
        }),
        
        // Write all logs with level 'info' and below to combined.log
        new winston.transports.File({ 
          filename: 'logs/combined.log',
          maxsize: 5242880, // 5MB
          maxFiles: 5,
          tailable: true
        })
      ]
    });

    // Ensure logs directory exists
    this.ensureLogsDirectory();
  }

  private ensureLogsDirectory() {
    const logsDir = path.join(process.cwd(), 'logs');
    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir, { recursive: true });
    }
  }

  info(message: string, meta?: any) {
    this.logger.info(message, meta);
  }

  error(message: string, error?: Error, meta?: any) {
    this.logger.error(message, { 
      ...meta,
      error: error ? {
        message: error.message,
        stack: error.stack,
        name: error.name
      } : undefined
    });
  }

  warn(message: string, meta?: any) {
    this.logger.warn(message, meta);
  }

  debug(message: string, meta?: any) {
    this.logger.debug(message, meta);
  }

  // API call logging for better monitoring
  apiCall(method: string, endpoint: string, statusCode: number, duration: number, userId?: number, meta?: any) {
    this.logger.info('API Call', {
      method,
      endpoint,
      statusCode,
      duration,
      userId,
      type: 'api_call',
      ...meta
    });
  }

  // Performance monitoring
  performance(metric: string, value: number, unit: string = 'ms', meta?: any) {
    this.logger.info('Performance Metric', {
      metric,
      value,
      unit,
      type: 'performance',
      ...meta
    });
  }

  // Security events
  security(event: string, userId?: number, meta?: any) {
    this.logger.warn('Security Event', {
      event,
      userId,
      type: 'security',
      ...meta
    });
  }

  // External API calls
  externalApi(service: string, endpoint: string, statusCode: number, duration: number, cost?: number, meta?: any) {
    this.logger.info('External API Call', {
      service,
      endpoint,
      statusCode,
      duration,
      cost,
      type: 'external_api',
      ...meta
    });
  }
}

export const structuredLogger = new StructuredLogger();