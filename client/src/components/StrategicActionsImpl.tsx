import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Clock, TrendingUp, AlertTriangle, Users, Target } from 'lucide-react';
import { StandardizedLoading } from '@/components/ui/standardized-loading';

interface StrategicAction {
  action: string;
  category: 'immediate' | 'short-term' | 'long-term';
  priority: 'high' | 'medium' | 'low';
  effort: 'high' | 'medium' | 'low';
  impact: 'high' | 'medium' | 'low';
  resources: string[];
}

interface StrategicActionsImplProps {
  content: string;
  title?: string;
  onClose?: () => void;
  truthAnalysis?: any;
}

const categoryIcons = {
  immediate: AlertTriangle,
  'short-term': Clock,
  'long-term': TrendingUp
};

const categoryColors = {
  immediate: 'bg-red-100 text-red-800',
  'short-term': 'bg-yellow-100 text-yellow-800',
  'long-term': 'bg-blue-100 text-blue-800'
};

const priorityColors = {
  high: 'bg-red-100 text-red-800',
  medium: 'bg-yellow-100 text-yellow-800',
  low: 'bg-gray-100 text-gray-800'
};

const effortColors = {
  high: 'bg-purple-100 text-purple-800',
  medium: 'bg-blue-100 text-blue-800',
  low: 'bg-green-100 text-green-800'
};

const impactColors = {
  high: 'bg-green-100 text-green-800',
  medium: 'bg-yellow-100 text-yellow-800',
  low: 'bg-gray-100 text-gray-800'
};

export default function StrategicActionsImpl({ content, title, onClose, truthAnalysis }: StrategicActionsImplProps) {
  const [actions, setActions] = useState<StrategicAction[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (content) {
      fetchStrategicActions();
    }
  }, [content, title, truthAnalysis]);

  const fetchStrategicActions = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/strategic-actions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ content, title, truthAnalysis })
      });

      if (!response.ok) {
        throw new Error('Failed to fetch strategic actions');
      }

      const data = await response.json();
      setActions(data.actions || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load strategic actions');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Strategic Actions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <StandardizedLoading 
            title="Strategic Analysis"
            subtitle="Generating actionable strategic recommendations"
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
            Strategic Actions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-red-600 mb-4">{error}</p>
            <button
              onClick={fetchStrategicActions}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (actions.length === 0) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Strategic Actions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-gray-600">No strategic actions available for this content.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="h-5 w-5" />
          Strategic Actions
          {truthAnalysis && (
            <Badge variant="outline" className="ml-2">
              Based on Truth Analysis
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {actions.map((action, index) => {
            const CategoryIcon = categoryIcons[action.category];
            
            return (
              <div key={index} className="p-4 border rounded-lg bg-gray-50">
                <div className="flex items-start gap-3">
                  <CategoryIcon className="h-5 w-5 text-blue-600 mt-1 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900 mb-2">
                      {action.action}
                    </p>
                    <div className="flex flex-wrap gap-2 mb-2">
                      <Badge className={categoryColors[action.category]}>
                        {action.category}
                      </Badge>
                      <Badge className={priorityColors[action.priority]}>
                        {action.priority} priority
                      </Badge>
                      <Badge className={effortColors[action.effort]}>
                        {action.effort} effort
                      </Badge>
                      <Badge className={impactColors[action.impact]}>
                        {action.impact} impact
                      </Badge>
                    </div>
                    {action.resources && action.resources.length > 0 && (
                      <div className="flex items-center gap-2 mt-2">
                        <Users className="h-4 w-4 text-gray-500" />
                        <div className="flex flex-wrap gap-1">
                          {action.resources.map((resource, idx) => (
                            <Badge key={idx} variant="outline" className="text-xs">
                              {resource}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
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