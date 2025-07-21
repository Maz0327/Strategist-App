import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Lightbulb, TrendingUp, AlertTriangle, Clock, Target, Zap } from 'lucide-react';
import { StandardizedLoading } from '@/components/ui/standardized-loading';

interface StrategicInsight {
  insight: string;
  category: 'strategic' | 'tactical' | 'operational';
  priority: 'high' | 'medium' | 'low';
  impact: 'high' | 'medium' | 'low';
  timeframe: 'immediate' | 'short-term' | 'long-term';
}

interface StrategicInsightsImplProps {
  content: string;
  title?: string;
  onClose?: () => void;
  truthAnalysis?: any;
}

const categoryIcons = {
  strategic: Target,
  tactical: Zap,
  operational: TrendingUp
};

const categoryColors = {
  strategic: 'bg-blue-100 text-blue-800',
  tactical: 'bg-purple-100 text-purple-800',
  operational: 'bg-green-100 text-green-800'
};

const priorityColors = {
  high: 'bg-red-100 text-red-800',
  medium: 'bg-yellow-100 text-yellow-800',
  low: 'bg-gray-100 text-gray-800'
};

const impactColors = {
  high: 'bg-green-100 text-green-800',
  medium: 'bg-yellow-100 text-yellow-800',
  low: 'bg-gray-100 text-gray-800'
};

const timeframeColors = {
  immediate: 'bg-red-100 text-red-800',
  'short-term': 'bg-yellow-100 text-yellow-800',
  'long-term': 'bg-blue-100 text-blue-800'
};

export default function StrategicInsightsImpl({ content, title, onClose, truthAnalysis }: StrategicInsightsImplProps) {
  const [insights, setInsights] = useState<StrategicInsight[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (content) {
      fetchStrategicInsights();
    }
  }, [content, title, truthAnalysis]);

  const fetchStrategicInsights = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/strategic-insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ content, title, truthAnalysis })
      });

      if (!response.ok) {
        throw new Error('Failed to fetch strategic insights');
      }

      const data = await response.json();
      setInsights(data.insights || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load strategic insights');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5" />
            Strategic Insights
          </CardTitle>
        </CardHeader>
        <CardContent>
          <StandardizedLoading 
            title="Generating Insights"
            subtitle="Developing strategic intelligence and recommendations"
          />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-500" />
            Strategic Insights
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-red-600 mb-4">{error}</p>
            <button
              onClick={fetchStrategicInsights}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (insights.length === 0) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5" />
            Strategic Insights
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-gray-600">No strategic insights available for this content.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Lightbulb className="h-5 w-5" />
          Strategic Insights
          {truthAnalysis && (
            <Badge variant="outline" className="ml-2">
              Based on Truth Analysis
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {insights.map((insight, index) => {
            const CategoryIcon = categoryIcons[insight.category];
            
            return (
              <div key={index} className="p-4 border rounded-lg bg-gray-50">
                <div className="flex items-start gap-3">
                  <CategoryIcon className="h-5 w-5 text-blue-600 mt-1 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900 mb-2">
                      {insight.insight}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <Badge className={categoryColors[insight.category]}>
                        {insight.category}
                      </Badge>
                      <Badge className={priorityColors[insight.priority]}>
                        {insight.priority} priority
                      </Badge>
                      <Badge className={impactColors[insight.impact]}>
                        {insight.impact} impact
                      </Badge>
                      <Badge className={timeframeColors[insight.timeframe]}>
                        {insight.timeframe}
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}