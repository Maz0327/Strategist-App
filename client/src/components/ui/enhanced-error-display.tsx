import React from 'react';
import { AlertTriangle, RefreshCw, HelpCircle } from 'lucide-react';
import { Button } from './button';
import { Alert, AlertDescription, AlertTitle } from './alert';

interface EnhancedErrorDisplayProps {
  error: {
    message: string;
    code?: string;
    suggestions?: string[];
    retryable?: boolean;
    traceId?: string;
  };
  onRetry?: () => void;
  className?: string;
}

export function EnhancedErrorDisplay({ 
  error, 
  onRetry, 
  className = '' 
}: EnhancedErrorDisplayProps) {
  return (
    <div className={`space-y-4 ${className}`}>
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle className="flex items-center gap-2">
          {error.message}
          {error.traceId && (
            <span className="text-xs font-mono bg-red-100 dark:bg-red-900 px-2 py-1 rounded">
              #{error.traceId}
            </span>
          )}
        </AlertTitle>
        <AlertDescription>
          {error.code && (
            <div className="text-xs text-muted-foreground mb-2">
              Error Code: {error.code}
            </div>
          )}
          
          {error.suggestions && error.suggestions.length > 0 && (
            <div className="mt-3">
              <div className="flex items-center gap-2 mb-2">
                <HelpCircle className="h-3 w-3" />
                <span className="text-sm font-medium">Suggestions:</span>
              </div>
              <ul className="text-sm space-y-1">
                {error.suggestions.map((suggestion, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="text-muted-foreground">•</span>
                    <span>{suggestion}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {error.retryable && onRetry && (
            <div className="mt-4">
              <Button 
                onClick={onRetry}
                variant="outline"
                size="sm"
                className="gap-2"
              >
                <RefreshCw className="h-3 w-3" />
                Try Again
              </Button>
            </div>
          )}
        </AlertDescription>
      </Alert>
    </div>
  );
}

// Hook for handling enhanced errors
export function useEnhancedErrorHandler() {
  const handleError = (error: any, onRetry?: () => void) => {
    // If it's already an enhanced error from our backend
    if (error?.code && error?.suggestions) {
      return {
        message: error.error || error.message,
        code: error.code,
        suggestions: error.suggestions,
        retryable: error.retryable,
        traceId: error.traceId
      };
    }

    // Convert regular errors to enhanced format
    const message = error?.message || error?.error || 'An unexpected error occurred';
    
    return {
      message,
      code: 'UNKNOWN_ERROR',
      suggestions: [
        'Please try again',
        'Check your internet connection',
        'Contact support if the problem persists'
      ],
      retryable: true,
      traceId: undefined
    };
  };

  return { handleError };
}