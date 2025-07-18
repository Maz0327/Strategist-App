import { Skeleton } from "@/components/ui/skeleton"
import { Progress } from "@/components/ui/progress"
import { Brain, Sparkles, Search, Target, TrendingUp } from "lucide-react"

interface AnalysisSkeletonProps {
  analysisProgress?: {
    stage: string;
    progress: number;
  };
}

export function AnalysisSkeleton({ analysisProgress }: AnalysisSkeletonProps) {
  const getProgressIcon = () => {
    if (analysisProgress?.stage.includes('Extracting')) return <Search className="h-4 w-4" />;
    if (analysisProgress?.stage.includes('Analyzing')) return <Brain className="h-4 w-4" />;
    if (analysisProgress?.stage.includes('Generating')) return <Sparkles className="h-4 w-4" />;
    if (analysisProgress?.stage.includes('Strategic')) return <Target className="h-4 w-4" />;
    if (analysisProgress?.stage.includes('Completing')) return <TrendingUp className="h-4 w-4" />;
    return <Brain className="h-4 w-4" />;
  };

  return (
    <div className="space-y-6 animate-in fade-in-50 duration-700">
      {/* Elegant Progress Bar */}
      {analysisProgress && (
        <div className="space-y-4 p-6 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20 rounded-lg border border-blue-200/50 dark:border-blue-800/50">
          <div className="flex items-center gap-3">
            <div className="animate-pulse text-blue-600 dark:text-blue-400">
              {getProgressIcon()}
            </div>
            <div className="flex-1">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
                  {analysisProgress.stage}
                </span>
                <span className="text-sm text-blue-600 dark:text-blue-400">
                  {Math.round(analysisProgress.progress)}%
                </span>
              </div>
              <div className="w-full bg-blue-100 dark:bg-blue-900/30 rounded-full h-2">
                <div 
                  className="progress-shimmer h-2 rounded-full transition-all duration-500 ease-out"
                  style={{ width: `${analysisProgress.progress}%` }}
                />
              </div>
            </div>
          </div>
          <div className="text-xs text-blue-600/80 dark:text-blue-400/80 flex items-center gap-1">
            <div className="animate-pulse">●</div>
            <span>Processing strategic insights...</span>
          </div>
        </div>
      )}

      {/* Analysis Box with Elegant Animation */}
      <div className="relative overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700">
        {/* Animated gradient background */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-blue-50/50 to-transparent dark:via-blue-950/20 animate-pulse" />
        
        <div className="relative p-6 space-y-6">
          {/* Header with pulsing animation */}
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="animate-pulse">
                <Brain className="h-5 w-5 text-blue-500" />
              </div>
              <Skeleton className="h-5 w-40 animate-pulse" />
            </div>
            <Skeleton className="h-6 w-3/4 animate-pulse [animation-delay:200ms]" />
          </div>

          {/* Sentiment & Tone with staggered animation */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Skeleton className="h-4 w-20 animate-pulse [animation-delay:400ms]" />
              <Skeleton className="h-8 w-24 animate-pulse [animation-delay:600ms]" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-16 animate-pulse [animation-delay:800ms]" />
              <Skeleton className="h-8 w-28 animate-pulse [animation-delay:1000ms]" />
            </div>
          </div>

          {/* Keywords with wave animation */}
          <div className="space-y-2">
            <Skeleton className="h-4 w-20 animate-pulse [animation-delay:1200ms]" />
            <div className="flex flex-wrap gap-2">
              {[...Array(5)].map((_, i) => (
                <Skeleton 
                  key={i} 
                  className="h-6 w-16 animate-pulse" 
                  style={{ animationDelay: `${1400 + i * 100}ms` }}
                />
              ))}
            </div>
          </div>

          {/* Truth Analysis with flowing animation */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-purple-500 animate-pulse" />
              <Skeleton className="h-4 w-28 animate-pulse [animation-delay:1900ms]" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-full animate-pulse [animation-delay:2100ms]" />
              <Skeleton className="h-4 w-5/6 animate-pulse [animation-delay:2300ms]" />
              <Skeleton className="h-4 w-4/5 animate-pulse [animation-delay:2500ms]" />
            </div>
          </div>

          {/* Strategic Insights with final animation */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-green-500 animate-pulse" />
              <Skeleton className="h-4 w-32 animate-pulse [animation-delay:2700ms]" />
            </div>
            <div className="space-y-2">
              {[...Array(3)].map((_, i) => (
                <Skeleton 
                  key={i} 
                  className="h-4 w-full animate-pulse" 
                  style={{ animationDelay: `${2900 + i * 200}ms` }}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Floating action hint */}
      <div className="text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-gray-50 dark:bg-gray-800 rounded-full text-sm text-gray-600 dark:text-gray-400 animate-bounce">
          <div className="animate-pulse">●</div>
          <span>Analyzing strategic insights...</span>
        </div>
      </div>
    </div>
  )
}