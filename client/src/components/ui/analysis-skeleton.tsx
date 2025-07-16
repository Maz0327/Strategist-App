import { Skeleton } from "@/components/ui/skeleton"
import { Brain, TrendingUp, Target, Users, Lightbulb, Activity } from "lucide-react"

export function AnalysisSkeleton() {
  return (
    <div className="space-y-6 p-4 bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg border border-blue-200">
      {/* Animated Header */}
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Brain className="h-6 w-6 text-blue-600 animate-pulse" />
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-purple-400 rounded-full animate-ping"></div>
          </div>
          <div className="space-y-1">
            <Skeleton className="h-4 w-48 bg-gradient-to-r from-blue-200 to-purple-200 animate-pulse" />
            <Skeleton className="h-6 w-64 bg-gradient-to-r from-blue-300 to-purple-300 animate-pulse" />
          </div>
        </div>
      </div>

      {/* Sentiment & Tone with Icons */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-green-500 animate-pulse" />
            <Skeleton className="h-4 w-20 bg-green-200 animate-pulse" />
          </div>
          <Skeleton className="h-8 w-24 bg-green-100 animate-pulse" />
        </div>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-orange-500 animate-pulse" />
            <Skeleton className="h-4 w-16 bg-orange-200 animate-pulse" />
          </div>
          <Skeleton className="h-8 w-28 bg-orange-100 animate-pulse" />
        </div>
      </div>

      {/* Keywords with animated pills */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Target className="h-4 w-4 text-blue-500 animate-pulse" />
          <Skeleton className="h-4 w-20 bg-blue-200 animate-pulse" />
        </div>
        <div className="flex flex-wrap gap-2">
          {[...Array(5)].map((_, i) => (
            <Skeleton 
              key={i} 
              className="h-6 w-16 bg-blue-100 animate-pulse rounded-full" 
              style={{ animationDelay: `${i * 0.1}s` }}
            />
          ))}
        </div>
      </div>

      {/* Truth Analysis with flowing animation */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Lightbulb className="h-4 w-4 text-yellow-500 animate-pulse" />
          <Skeleton className="h-4 w-28 bg-yellow-200 animate-pulse" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-4 w-full bg-yellow-100 animate-pulse" />
          <Skeleton className="h-4 w-5/6 bg-yellow-100 animate-pulse" style={{ animationDelay: '0.1s' }} />
          <Skeleton className="h-4 w-4/5 bg-yellow-100 animate-pulse" style={{ animationDelay: '0.2s' }} />
        </div>
      </div>

      {/* Strategic Insights with staggered animation */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-purple-500 animate-pulse" />
          <Skeleton className="h-4 w-32 bg-purple-200 animate-pulse" />
        </div>
        <div className="space-y-2">
          {[...Array(3)].map((_, i) => (
            <Skeleton 
              key={i} 
              className="h-4 w-full bg-purple-100 animate-pulse" 
              style={{ animationDelay: `${i * 0.15}s` }}
            />
          ))}
        </div>
      </div>

      {/* Pulsing processing indicator */}
      <div className="flex items-center justify-center pt-4">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <div className="flex space-x-1">
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
            <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
          </div>
          <span>Generating strategic insights...</span>
        </div>
      </div>
    </div>
  )
}