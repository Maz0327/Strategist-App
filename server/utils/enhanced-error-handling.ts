// Enhanced Error Handling Utility
// Provides better error messages and source traceability

import { debugLogger } from '../services/debug-logger-service';

export interface EnhancedError {
  code: string;
  message: string;
  userFriendlyMessage: string;
  source: string;
  timestamp: string;
  traceId?: string;
}

export const ERROR_MESSAGES = {
  ANALYSIS_FAILED: {
    code: "ANALYSIS_FAILED",
    message: "Content analysis failed",
    userFriendlyMessage: "We couldn't analyze this content. This might be due to network issues or content format problems. Please try again with a different URL or text.",
    source: "content_analysis"
  },
  URL_EXTRACTION_FAILED: {
    code: "URL_EXTRACTION_FAILED",
    message: "URL content extraction failed",
    userFriendlyMessage: "We couldn't extract content from this URL. The website might be blocked, require authentication, or have protection systems in place.",
    source: "url_extraction"
  },
  OPENAI_API_ERROR: {
    code: "OPENAI_API_ERROR",
    message: "OpenAI API request failed",
    userFriendlyMessage: "Our AI analysis service is temporarily unavailable. Please wait a moment and try again.",
    source: "openai_service"
  },
  VIDEO_TRANSCRIPTION_FAILED: {
    code: "VIDEO_TRANSCRIPTION_FAILED",
    message: "Video transcription failed",
    userFriendlyMessage: "We couldn't transcribe the video content. The video might be private, region-restricted, or too long to process.",
    source: "video_service"
  },
  DATABASE_ERROR: {
    code: "DATABASE_ERROR",
    message: "Database operation failed",
    userFriendlyMessage: "We're having trouble saving your data. Please try again in a moment.",
    source: "database"
  },
  AUTHENTICATION_ERROR: {
    code: "AUTHENTICATION_ERROR",
    message: "Authentication failed",
    userFriendlyMessage: "Please log in again to continue.",
    source: "auth_service"
  },
  RATE_LIMIT_EXCEEDED: {
    code: "RATE_LIMIT_EXCEEDED",
    message: "Rate limit exceeded",
    userFriendlyMessage: "You're making requests too quickly. Please wait a moment before trying again.",
    source: "rate_limiter"
  },
  INVALID_INPUT: {
    code: "INVALID_INPUT",
    message: "Invalid input data",
    userFriendlyMessage: "The information provided isn't valid. Please check your input and try again.",
    source: "validation"
  }
};

export function createEnhancedError(
  errorType: keyof typeof ERROR_MESSAGES,
  originalError?: Error,
  traceId?: string
): EnhancedError {
  const errorTemplate = ERROR_MESSAGES[errorType];
  
  return {
    ...errorTemplate,
    message: originalError?.message || errorTemplate.message,
    timestamp: new Date().toISOString(),
    traceId: traceId || generateTraceId()
  };
}

export function handleApiError(
  error: any,
  errorType: keyof typeof ERROR_MESSAGES,
  req: any
): EnhancedError {
  const traceId = generateTraceId();
  const enhancedError = createEnhancedError(errorType, error, traceId);
  
  debugLogger.error('Enhanced API error', {
    traceId,
    errorCode: enhancedError.code,
    originalMessage: error?.message,
    source: enhancedError.source
  }, req);
  
  return enhancedError;
}

export function generateTraceId(): string {
  return `trace_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

export function getErrorPattern(errorMessage: string): keyof typeof ERROR_MESSAGES | null {
  if (errorMessage.includes('OpenAI API') || errorMessage.includes('API key')) {
    return 'OPENAI_API_ERROR';
  }
  if (errorMessage.includes('video') || errorMessage.includes('transcription')) {
    return 'VIDEO_TRANSCRIPTION_FAILED';
  }
  if (errorMessage.includes('extraction') || errorMessage.includes('scraping')) {
    return 'URL_EXTRACTION_FAILED';
  }
  if (errorMessage.includes('database') || errorMessage.includes('SQL')) {
    return 'DATABASE_ERROR';
  }
  if (errorMessage.includes('auth') || errorMessage.includes('session')) {
    return 'AUTHENTICATION_ERROR';
  }
  if (errorMessage.includes('rate limit') || errorMessage.includes('too many')) {
    return 'RATE_LIMIT_EXCEEDED';
  }
  return null;
}

// Source traceability for better debugging
export interface AnalysisTrace {
  traceId: string;
  userId: number;
  url?: string;
  title: string;
  timestamp: string;
  steps: {
    step: string;
    status: 'success' | 'error' | 'skipped';
    duration: number;
    details?: any;
  }[];
}

export function createAnalysisTrace(userId: number, title: string, url?: string): AnalysisTrace {
  return {
    traceId: generateTraceId(),
    userId,
    url,
    title,
    timestamp: new Date().toISOString(),
    steps: []
  };
}

export function addTraceStep(
  trace: AnalysisTrace,
  step: string,
  status: 'success' | 'error' | 'skipped',
  duration: number,
  details?: any
) {
  trace.steps.push({
    step,
    status,
    duration,
    details
  });
}