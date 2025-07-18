import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Lightbulb, TrendingUp, AlertTriangle, Clock, Target } from 'lucide-react';

interface CompetitiveInsight {
  insight: string;
  category: 'opportunity' | 'threat' | 'trend' | 'gap';
  confidence: 'high' | 'medium' | 'low';
  actionable: boolean;
  timeframe: 'immediate' | 'short-term' | 'long-term';
}

interface CompetitiveInsightsImplProps {
  content: string;
  title?: string;
  onClose?: () => void;
}

const categoryIcons = {
  opportunity: Target,
  threat: AlertTriangle,
  trend: TrendingUp,
  gap: Lightbulb
};

const categoryColors = {
  opportunity: 'bg-green-100 text-green-800',
  threat: 'bg-red-100 text-red-800',
  trend: 'bg-blue-100 text-blue-800',
  gap: 'bg-yellow-100 text-yellow-800'
};

const confidenceColors = {
  high: 'bg-green-100 text-green-800',
  medium: 'bg-yellow-100 text-yellow-800',
  low: 'bg-gray-100 text-gray-800'
};

const timeframeColors = {
  immediate: 'bg-red-100 text-red-800',
  'short-term': 'bg-yellow-100 text-yellow-800',
  'long-term': 'bg-blue-100 text-blue-800'
};

export default function CompetitiveInsightsImpl({ content, title, onClose }: CompetitiveInsightsImplProps) {
  const [insights, setInsights] = useState<CompetitiveInsight[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (content) {
      fetchCompetitiveInsights();
    }
  }, [content, title]);

  const fetchCompetitiveInsights = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/competitive-intelligence', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ content, title, truthAnalysis })
      });

      if (!response.ok) {
        throw new Error('Failed to analyze competitive intelligence');
      }

      const data = await response.json();
      setInsights(data.insights || []);
    } catch (err: any) {
      setError(err.message || 'Failed to analyze competitive intelligence');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Competitive Intelligence
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Analyzing competitive landscape...</p>
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
            <Target className="h-5 w-5" />
            Competitive Intelligence
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-red-600">
            <AlertTriangle className="h-8 w-8 mx-auto mb-4" />
            <p>{error}</p>
            <button 
              onClick={fetchCompetitiveInsights}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Try Again
            </button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="h-5 w-5" />
          Competitive Intelligence
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {insights.map((insight, index) => {
            const CategoryIcon = categoryIcons[insight.category];
            
            return (
              <div key={index} className="border-l-4 border-blue-500 bg-blue-50 p-4 rounded-r-lg">
                <div className="flex items-start gap-3">
                  <CategoryIcon className="h-5 w-5 text-blue-600 mt-1 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-gray-900 mb-3">{insight.insight}</p>
                    <div className="flex flex-wrap gap-2">
                      <Badge className={categoryColors[insight.category]}>
                        {insight.category}
                      </Badge>
                      <Badge className={confidenceColors[insight.confidence]}>
                        {insight.confidence} confidence
                      </Badge>
                      <Badge className={timeframeColors[insight.timeframe]}>
                        <Clock className="h-3 w-3 mr-1" />
                        {insight.timeframe}
                      </Badge>
                      {insight.actionable && (
                        <Badge className="bg-green-100 text-green-800">
                          Actionable
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
          
          {insights.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <Target className="h-8 w-8 mx-auto mb-4" />
              <p>No competitive insights available for this content.</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}