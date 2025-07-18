import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Target, TrendingUp, AlertTriangle, CheckCircle, Zap } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface StrategicRecommendation {
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  timeframe: 'immediate' | 'short-term' | 'long-term';
  confidence: number;
  category: 'competitive' | 'cultural' | 'tactical' | 'strategic';
  rationale?: string;
}

interface LazyStrategicRecommendationsProps {
  content: string;
  title: string;
  truthAnalysis: any;
}

export default function LazyStrategicRecommendations({ content, title, truthAnalysis }: LazyStrategicRecommendationsProps) {
  const [recommendations, setRecommendations] = useState<StrategicRecommendation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (!hasLoadedOnce && content && title && truthAnalysis) {
      loadStrategicRecommendations();
      setHasLoadedOnce(true);
    }
  }, [content, title, truthAnalysis, hasLoadedOnce]);

  const loadStrategicRecommendations = async () => {
    if (!content || !title || !truthAnalysis) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await apiRequest('/api/strategic-recommendations', {
        method: 'POST',
        body: JSON.stringify({ content, title, truthAnalysis }),
      });
      
      if (response.ok) {
        const data = await response.json();
        setRecommendations(data.recommendations || []);
      } else {
        throw new Error('Failed to load strategic recommendations');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load strategic recommendations');
      toast({
        title: "Error",
        description: "Failed to load strategic recommendations. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getImpactColor = (impact: 'high' | 'medium' | 'low') => {
    switch (impact) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getTimeframeColor = (timeframe: 'immediate' | 'short-term' | 'long-term') => {
    switch (timeframe) {
      case 'immediate': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'short-term': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'long-term': return 'bg-purple-100 text-purple-800 border-purple-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getCategoryIcon = (category: 'competitive' | 'cultural' | 'tactical' | 'strategic') => {
    switch (category) {
      case 'competitive': return <Target className="h-4 w-4" />;
      case 'cultural': return <TrendingUp className="h-4 w-4" />;
      case 'tactical': return <CheckCircle className="h-4 w-4" />;
      case 'strategic': return <Zap className="h-4 w-4" />;
      default: return <AlertTriangle className="h-4 w-4" />;
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Strategic Recommendations
          </CardTitle>
          <p className="text-sm text-gray-600">
            AI-powered strategic recommendations based on comprehensive analysis
          </p>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="flex items-center gap-3">
              <LoadingSpinner size="md" />
              <div className="text-sm text-gray-600">
                <div className="font-medium">Analyzing strategic opportunities...</div>
                <div className="text-xs text-gray-500 mt-1">Analyzing all components: Truth Analysis → Cohorts → Strategic Insights → Actions → Competitive Intelligence</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-500" />
            Strategic Recommendations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-red-600 mb-4">{error}</p>
            <button
              onClick={loadStrategicRecommendations}
              className="text-blue-600 hover:text-blue-800 underline"
            >
              Try Again
            </button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (recommendations.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Strategic Recommendations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="italic text-gray-500">
              No strategic recommendations available for this content.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="h-5 w-5" />
          Strategic Recommendations
        </CardTitle>
        <p className="text-sm text-gray-600">
          Synthesized recommendations from Truth Analysis, Cohorts, Strategic Insights, Actions, and Competitive Intelligence
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {recommendations.map((rec, index) => (
            <div key={index} className="border rounded-lg p-4 bg-gray-50">
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-center gap-2">
                  {getCategoryIcon(rec.category)}
                  <h4 className="font-medium text-gray-900">{rec.title}</h4>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className={getImpactColor(rec.impact)}>
                    {rec.impact} impact
                  </Badge>
                  <Badge variant="outline" className={getTimeframeColor(rec.timeframe)}>
                    {rec.timeframe}
                  </Badge>
                </div>
              </div>
              <p className="text-sm text-gray-700 mb-3">{rec.description}</p>
              <div className="flex items-center justify-between">
                <Badge variant="secondary" className="text-xs">
                  {rec.category} recommendation
                </Badge>
                <div className="text-xs text-gray-500">
                  {rec.confidence}% confidence
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}