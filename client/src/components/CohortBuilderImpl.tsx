import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, Target, BarChart3, Globe } from 'lucide-react';

interface CohortSuggestion {
  name: string;
  description: string;
  behaviorPatterns: string[];
  platforms: string[];
  size: 'small' | 'medium' | 'large';
  engagement: 'high' | 'medium' | 'low';
}

interface CohortBuilderImplProps {
  content: string;
  title?: string;
  onClose?: () => void;
  truthAnalysis?: any;
}

const sizeColors = {
  small: 'bg-yellow-100 text-yellow-800',
  medium: 'bg-blue-100 text-blue-800',
  large: 'bg-green-100 text-green-800'
};

const engagementColors = {
  high: 'bg-green-100 text-green-800',
  medium: 'bg-yellow-100 text-yellow-800',
  low: 'bg-gray-100 text-gray-800'
};

export default function CohortBuilderImpl({ content, title, onClose, truthAnalysis }: CohortBuilderImplProps) {
  const [cohorts, setCohorts] = useState<CohortSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (content) {
      fetchCohorts();
    }
  }, [content, title, truthAnalysis]);

  const fetchCohorts = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/cohorts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ content, title, truthAnalysis })
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Please log in to access cohort analysis');
        }
        throw new Error('Failed to analyze cohorts');
      }

      const data = await response.json();
      setCohorts(data.cohorts || []);
    } catch (err: any) {
      setError(err.message || 'Failed to analyze cohorts');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Cohort Builder
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Building audience cohorts...</p>
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
            <Users className="h-5 w-5" />
            Cohort Builder
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-red-600">
            <Target className="h-8 w-8 mx-auto mb-4" />
            <p>{error}</p>
            <button 
              onClick={fetchCohorts}
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
          <Users className="h-5 w-5" />
          Cohort Builder
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {cohorts.map((cohort, index) => (
            <div key={index} className="border rounded-lg p-4 bg-white shadow-sm">
              <div className="flex items-start gap-3 mb-3">
                <Users className="h-5 w-5 text-blue-600 mt-1 flex-shrink-0" />
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900 mb-2">{cohort.name}</h4>
                  <p className="text-gray-600 text-sm mb-3">{cohort.description}</p>
                  
                  <div className="space-y-3">
                    <div>
                      <h5 className="text-xs font-medium text-gray-500 mb-1">Behavior Patterns</h5>
                      <div className="flex flex-wrap gap-1">
                        {cohort.behaviorPatterns.map((pattern, i) => (
                          <Badge key={i} variant="outline" className="text-xs">
                            {pattern}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    
                    <div>
                      <h5 className="text-xs font-medium text-gray-500 mb-1">Platforms</h5>
                      <div className="flex flex-wrap gap-1">
                        {cohort.platforms.map((platform, i) => (
                          <Badge key={i} variant="outline" className="text-xs">
                            <Globe className="h-3 w-3 mr-1" />
                            {platform}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <Badge className={sizeColors[cohort.size]}>
                        <BarChart3 className="h-3 w-3 mr-1" />
                        {cohort.size} audience
                      </Badge>
                      <Badge className={engagementColors[cohort.engagement]}>
                        <Target className="h-3 w-3 mr-1" />
                        {cohort.engagement} engagement
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
          
          {cohorts.length === 0 && (
            <div className="col-span-full text-center py-8 text-gray-500">
              <Users className="h-8 w-8 mx-auto mb-4" />
              <p>No cohort suggestions available for this content.</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}