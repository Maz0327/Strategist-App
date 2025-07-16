import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface FallbackIndicatorProps {
  isVisible: boolean;
  className?: string;
}

export const FallbackIndicator: React.FC<FallbackIndicatorProps> = ({ 
  isVisible, 
  className = '' 
}) => {
  if (!isVisible) return null;

  return (
    <Alert className={`border-orange-200 bg-orange-50 dark:bg-orange-900/20 dark:border-orange-800 ${className}`}>
      <AlertTriangle className="h-4 w-4 text-orange-600 dark:text-orange-400" />
      <AlertDescription className="text-orange-800 dark:text-orange-300">
        <span className="font-medium">Fallback Mode Active:</span> Using GPT-4o-mini due to primary model limitations. 
        Analysis quality may be reduced.
      </AlertDescription>
    </Alert>
  );
};

export default FallbackIndicator;