import React from "react";
import { AlertCircle, RefreshCw, ExternalLink } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface EnhancedErrorDisplayProps {
  error: {
    code?: string;
    message: string;
    userFriendlyMessage?: string;
    source?: string;
    traceId?: string;
  };
  onRetry?: () => void;
  onSupport?: () => void;
  className?: string;
}

export function EnhancedErrorDisplay({ 
  error, 
  onRetry, 
  onSupport, 
  className = "" 
}: EnhancedErrorDisplayProps) {
  const getErrorSeverity = (code?: string) => {
    switch (code) {
      case 'RATE_LIMIT_EXCEEDED':
      case 'OPENAI_API_ERROR':
        return 'warning';
      case 'AUTHENTICATION_ERROR':
      case 'DATABASE_ERROR':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  const getErrorIcon = (code?: string) => {
    switch (code) {
      case 'RATE_LIMIT_EXCEEDED':
        return <RefreshCw className="h-5 w-5" />;
      default:
        return <AlertCircle className="h-5 w-5" />;
    }
  };

  const getRetryDelay = (code?: string) => {
    switch (code) {
      case 'RATE_LIMIT_EXCEEDED':
        return 'Please wait 30 seconds before trying again';
      case 'OPENAI_API_ERROR':
        return 'Please wait a moment and try again';
      default:
        return null;
    }
  };

  return (
    <Card className={`border-red-200 bg-red-50 ${className}`}>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="text-red-600 mt-0.5">
            {getErrorIcon(error.code)}
          </div>
          
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-2">
              <h4 className="font-medium text-red-900">
                Something went wrong
              </h4>
              {error.code && (
                <Badge variant={getErrorSeverity(error.code)} className="text-xs">
                  {error.code}
                </Badge>
              )}
            </div>
            
            <p className="text-sm text-red-800">
              {error.userFriendlyMessage || error.message}
            </p>

            {getRetryDelay(error.code) && (
              <p className="text-xs text-red-700 italic">
                {getRetryDelay(error.code)}
              </p>
            )}

            <div className="flex items-center gap-2 pt-2">
              {onRetry && (
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={onRetry}
                  className="text-red-700 border-red-300 hover:bg-red-100"
                >
                  <RefreshCw className="h-3 w-3 mr-1" />
                  Try Again
                </Button>
              )}
              
              {onSupport && (
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={onSupport}
                  className="text-red-600 hover:bg-red-100"
                >
                  <ExternalLink className="h-3 w-3 mr-1" />
                  Get Help
                </Button>
              )}
            </div>

            {/* Technical details for debugging (collapsible) */}
            {error.traceId && (
              <details className="text-xs text-red-600 mt-2">
                <summary className="cursor-pointer hover:text-red-800">
                  Technical Details
                </summary>
                <div className="mt-1 p-2 bg-red-100 rounded text-xs font-mono">
                  <div>Trace ID: {error.traceId}</div>
                  {error.source && <div>Source: {error.source}</div>}
                  <div>Message: {error.message}</div>
                </div>
              </details>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}