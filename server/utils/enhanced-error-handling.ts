import { Request, Response } from 'express';
import { debugLogger } from '../services/debug-logger-service';

export interface ErrorContext {
  userId?: number;
  ip?: string;
  userAgent?: string;
  timestamp: Date;
  traceId: string;
  source: string;
}

export interface EnhancedError {
  message: string;
  code: string;
  details?: any;
  suggestions?: string[];
  retryable: boolean;
  context?: ErrorContext;
}

export class ErrorHandler {
  private static generateTraceId(): string {
    return Math.random().toString(36).substr(2, 9);
  }

  private static getErrorContext(req: Request, source: string): ErrorContext {
    return {
      userId: (req as any).session?.userId,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      timestamp: new Date(),
      traceId: this.generateTraceId(),
      source
    };
  }

  static handleContentExtractionError(error: Error, req: Request): EnhancedError {
    const context = this.getErrorContext(req, 'content-extraction');
    
    debugLogger.error('Content extraction failed', error, req);
    
    return {
      message: "Unable to extract content from the provided URL",
      code: 'CONTENT_EXTRACTION_FAILED',
      details: {
        originalError: error.message,
        url: (req as any).body?.url
      },
      suggestions: [
        "Check if the URL is accessible",
        "Try a different URL format",
        "Use direct text input instead"
      ],
      retryable: true,
      context
    };
  }

  static handleAnalysisError(error: Error, req: Request): EnhancedError {
    const context = this.getErrorContext(req, 'content-analysis');
    
    debugLogger.error('Content analysis failed', error, req);
    
    return {
      message: "Content analysis could not be completed",
      code: 'ANALYSIS_FAILED',
      details: {
        originalError: error.message,
        contentLength: (req as any).body?.content?.length
      },
      suggestions: [
        "Try with shorter content",
        "Check your internet connection",
        "Wait a moment and try again"
      ],
      retryable: true,
      context
    };
  }

  static handleAuthenticationError(error: Error, req: Request): EnhancedError {
    const context = this.getErrorContext(req, 'authentication');
    
    debugLogger.error('Authentication failed', error, req);
    
    return {
      message: "Authentication failed",
      code: 'AUTH_FAILED',
      details: {
        originalError: error.message
      },
      suggestions: [
        "Check your login credentials",
        "Clear your browser cookies",
        "Try logging in again"
      ],
      retryable: true,
      context
    };
  }

  static handleRateLimitError(req: Request): EnhancedError {
    const context = this.getErrorContext(req, 'rate-limiting');
    
    return {
      message: "Too many requests - please slow down",
      code: 'RATE_LIMIT_EXCEEDED',
      details: {
        retryAfter: '60 seconds',
        limit: 'See rate limit headers'
      },
      suggestions: [
        "Wait a minute before trying again",
        "Reduce the frequency of your requests"
      ],
      retryable: true,
      context
    };
  }

  static handleValidationError(error: Error, req: Request): EnhancedError {
    const context = this.getErrorContext(req, 'validation');
    
    return {
      message: "Invalid input provided",
      code: 'VALIDATION_ERROR',
      details: {
        originalError: error.message,
        body: (req as any).body
      },
      suggestions: [
        "Check the required fields",
        "Ensure all inputs are in the correct format"
      ],
      retryable: false,
      context
    };
  }

  static handleDatabaseError(error: Error, req: Request): EnhancedError {
    const context = this.getErrorContext(req, 'database');
    
    debugLogger.error('Database operation failed', error, req);
    
    return {
      message: "Database operation failed",
      code: 'DATABASE_ERROR',
      details: {
        originalError: error.message
      },
      suggestions: [
        "Try again in a moment",
        "Contact support if the problem persists"
      ],
      retryable: true,
      context
    };
  }

  static formatErrorResponse(enhancedError: EnhancedError): any {
    return {
      success: false,
      error: enhancedError.message,
      code: enhancedError.code,
      details: enhancedError.details,
      suggestions: enhancedError.suggestions,
      retryable: enhancedError.retryable,
      traceId: enhancedError.context?.traceId,
      timestamp: enhancedError.context?.timestamp
    };
  }

  static sendErrorResponse(res: Response, enhancedError: EnhancedError, statusCode: number = 500): void {
    const errorResponse = this.formatErrorResponse(enhancedError);
    res.status(statusCode).json(errorResponse);
  }
}

// Middleware for handling uncaught errors
export function globalErrorHandler(error: Error, req: Request, res: Response, next: any) {
  const enhancedError = ErrorHandler.handleAnalysisError(error, req);
  ErrorHandler.sendErrorResponse(res, enhancedError, 500);
}