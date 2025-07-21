import { useState, useEffect } from "react";
import { Brain } from "lucide-react";

interface AnimatedLoadingStateProps {
  title: string;
  subtitle: string;
  progress?: number;
}

export function AnimatedLoadingState({ title, subtitle, progress = 0 }: AnimatedLoadingStateProps) {
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
    <div className="space-y-3 p-8 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200/50 animate-in fade-in-50">
      <div className="text-center space-y-3 floating-animation">
        <div className="flex items-center justify-center gap-2">
          <Brain className="h-6 w-6 text-blue-600 animate-pulse" />
          <span className="text-lg font-medium text-blue-700">
            {title}
          </span>
        </div>
        <p className="text-sm text-gray-600">{subtitle}</p>
        <div className="w-40 bg-blue-200/50 rounded-full h-2 mx-auto">
          <div 
            className="progress-shimmer h-2 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${Math.min(animatedProgress, 100)}%` }}
          />
        </div>
        <div className="text-xs text-blue-600/80 flex items-center justify-center gap-1">
          <div className="animate-pulse">●</div>
          <span>Processing insights...</span>
        </div>
      </div>
    </div>
  );
}