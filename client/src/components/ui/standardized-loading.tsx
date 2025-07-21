import { useState, useEffect } from "react";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

interface StandardizedLoadingProps {
  title: string;
  subtitle: string;
  progress?: number;
}

export const StandardizedLoading = ({ title, subtitle, progress = 0 }: StandardizedLoadingProps) => {
  const [animatedProgress, setAnimatedProgress] = useState(0);
  
  useEffect(() => {
    const interval = setInterval(() => {
      setAnimatedProgress(prev => {
        if (prev >= 95) return 10; // Reset to keep it moving
        return prev + Math.random() * 15; // Add some randomness
      });
    }, 500);
    
    return () => clearInterval(interval);
  }, []);
  
  return (
    <div className="text-center py-8">
      <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-50 rounded-full mb-4">
        <LoadingSpinner size="lg" />
      </div>
      <h3 className="text-lg font-medium text-gray-900 mb-2">{title}</h3>
      <p className="text-sm text-gray-600 mb-4">{subtitle}</p>
      <div className="w-full max-w-xs mx-auto">
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-blue-600 h-2 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${Math.min(animatedProgress, 100)}%` }}
          ></div>
        </div>
        <p className="text-xs text-gray-500 mt-2">Analyzing content...</p>
      </div>
    </div>
  );
};