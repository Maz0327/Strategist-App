import React from 'react';
import { AlertCircle, RefreshCw, ExternalLink } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { ErrorMessage, matchErrorPattern, getErrorMessage } from '@/../../shared/error-messages';

interface ErrorDisplayProps {
  error: string | ErrorMessage;
  onRetry?: () => void;
  onDismiss?: () => void;
  showCode?: boolean;
  className?: string;
}

export function ErrorDisplay({ 
  error, 
  onRetry, 
  onDismiss, 
  showCode = false,
  className = ""
}: ErrorDisplayProps) {
  const errorMessage: ErrorMessage = typeof error === 'string' 
    ? matchErrorPattern(error)
    : error;

  return (
    <Alert className={`border-red-200 bg-red-50 ${className}`}>
      <AlertCircle className="h-4 w-4 text-red-600" />
      <AlertDescription className="text-red-800">
        <div className="space-y-2">
          <div className="font-medium">{errorMessage.title}</div>
          <div className="text-sm">{errorMessage.message}</div>
          {errorMessage.solution && (
            <div className="text-sm bg-red-100 p-2 rounded border border-red-200">
              <strong>How to fix:</strong> {errorMessage.solution}
            </div>
          )}
          {showCode && errorMessage.code && (
            <div className="text-xs text-red-600 opacity-75">
              Error Code: {errorMessage.code}
            </div>
          )}
          <div className="flex gap-2 mt-3">
            {onRetry && (
              <Button 
                onClick={onRetry}
                variant="outline"
                size="sm"
                className="border-red-300 text-red-700 hover:bg-red-100"
              >
                <RefreshCw className="h-3 w-3 mr-1" />
                Try Again
              </Button>
            )}
            {onDismiss && (
              <Button 
                onClick={onDismiss}
                variant="ghost"
                size="sm"
                className="text-red-700 hover:bg-red-100"
              >
                Dismiss
              </Button>
            )}
          </div>
        </div>
      </AlertDescription>
    </Alert>
  );
}

interface FormErrorDisplayProps {
  errors: Array<{ field: string; message: string }>;
  className?: string;
}

export function FormErrorDisplay({ errors, className = "" }: FormErrorDisplayProps) {
  if (!errors.length) return null;

  return (
    <Alert className={`border-red-200 bg-red-50 ${className}`}>
      <AlertCircle className="h-4 w-4 text-red-600" />
      <AlertDescription className="text-red-800">
        <div className="space-y-2">
          <div className="font-medium">Please fix these issues:</div>
          <ul className="text-sm space-y-1">
            {errors.map((error, index) => (
              <li key={index} className="flex items-start gap-2">
                <span className="text-red-600">•</span>
                <span>
                  <strong>{error.field}:</strong> {error.message}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </AlertDescription>
    </Alert>
  );
}

interface NetworkErrorDisplayProps {
  onRetry?: () => void;
  className?: string;
}

export function NetworkErrorDisplay({ onRetry, className = "" }: NetworkErrorDisplayProps) {
  return (
    <ErrorDisplay
      error={{
        title: "Connection Problem",
        message: "We're having trouble connecting to our servers.",
        solution: "Check your internet connection and try again",
        code: "NET_001"
      }}
      onRetry={onRetry}
      className={className}
    />
  );
}

interface LoadingErrorDisplayProps {
  feature: string;
  onRetry?: () => void;
  className?: string;
}

export function LoadingErrorDisplay({ feature, onRetry, className = "" }: LoadingErrorDisplayProps) {
  return (
    <ErrorDisplay
      error={{
        title: `Failed to Load ${feature}`,
        message: `We encountered an error while loading ${feature.toLowerCase()}.`,
        solution: "This is usually temporary. Please try again in a moment.",
        code: "LOAD_001"
      }}
      onRetry={onRetry}
      className={className}
    />
  );
}

interface ApiErrorDisplayProps {
  service: string;
  onRetry?: () => void;
  className?: string;
}

export function ApiErrorDisplay({ service, onRetry, className = "" }: ApiErrorDisplayProps) {
  return (
    <ErrorDisplay
      error={{
        title: `${service} Unavailable`,
        message: `The ${service} service is temporarily unavailable.`,
        solution: "Please try again in a few minutes. Some features may be limited.",
        code: "API_001"
      }}
      onRetry={onRetry}
      className={className}
    />
  );
}

// Hook for handling errors consistently
export function useErrorHandler() {
  const handleError = (error: any): ErrorMessage => {
    if (error.response?.status === 401) {
      return getErrorMessage("AUTH_006");
    }
    
    if (error.response?.status === 403) {
      return getErrorMessage("AUTH_007");
    }
    
    if (error.response?.status === 429) {
      return getErrorMessage("API_002");
    }
    
    if (error.response?.status >= 500) {
      return getErrorMessage("GEN_001");
    }
    
    if (error.code === 'NETWORK_ERROR' || error.name === 'NetworkError') {
      return getErrorMessage("NET_001");
    }
    
    if (error.code === 'TIMEOUT') {
      return getErrorMessage("NET_002");
    }
    
    return matchErrorPattern(error.message || error.toString());
  };

  return { handleError };
}