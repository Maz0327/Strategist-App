import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Activity, Database, Clock, TrendingUp, AlertCircle } from 'lucide-react';

interface PerformanceStats {
  performance: {
    totalRequests: number;
    recentRequests: number;
    averageResponseTime: number;
    errorRate: number;
    cacheHitRate: number;
    slowRequests: number;
    criticalRequests: number;
  };
  cache: {
    analysis: { size: number; hitRate: number };
    cohort: { size: number; hitRate: number };
    competitive: { size: number; hitRate: number };
  };
}

export default function PerformanceMonitor() {
  const [stats, setStats] = useState<PerformanceStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 30000); // Update every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/performance', {
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch performance stats');
      }
      
      const data = await response.json();
      setStats(data);
      setError(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Performance Monitor
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading performance data...</p>
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
            <Activity className="h-5 w-5" />
            Performance Monitor
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-red-600">
            <AlertCircle className="h-8 w-8 mx-auto mb-4" />
            <p>{error}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!stats) return null;

  const { performance, cache } = stats;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Performance Monitor
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium">Avg Response Time</span>
              </div>
              <div className="text-2xl font-bold text-blue-600">
                {Math.round(performance.averageResponseTime)}ms
              </div>
            </div>
            
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="h-4 w-4 text-green-600" />
                <span className="text-sm font-medium">Cache Hit Rate</span>
              </div>
              <div className="text-2xl font-bold text-green-600">
                {Math.round(performance.cacheHitRate)}%
              </div>
            </div>
            
            <div className="bg-purple-50 p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Database className="h-4 w-4 text-purple-600" />
                <span className="text-sm font-medium">Total Requests</span>
              </div>
              <div className="text-2xl font-bold text-purple-600">
                {performance.totalRequests}
              </div>
            </div>
            
            <div className="bg-orange-50 p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle className="h-4 w-4 text-orange-600" />
                <span className="text-sm font-medium">Error Rate</span>
              </div>
              <div className="text-2xl font-bold text-orange-600">
                {Math.round(performance.errorRate)}%
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Cache Performance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <h4 className="font-medium">Analysis Cache</h4>
                <p className="text-sm text-gray-600">Core content analysis results</p>
              </div>
              <div className="text-right">
                <div className="text-lg font-bold">{cache.analysis.size} items</div>
                <Badge variant="outline">
                  {Math.round(cache.analysis.hitRate)}% hit rate
                </Badge>
              </div>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <h4 className="font-medium">Cohort Cache</h4>
                <p className="text-sm text-gray-600">Audience cohort suggestions</p>
              </div>
              <div className="text-right">
                <div className="text-lg font-bold">{cache.cohort.size} items</div>
                <Badge variant="outline">
                  {Math.round(cache.cohort.hitRate)}% hit rate
                </Badge>
              </div>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <h4 className="font-medium">Competitive Cache</h4>
                <p className="text-sm text-gray-600">Competitive intelligence data</p>
              </div>
              <div className="text-right">
                <div className="text-lg font-bold">{cache.competitive.size} items</div>
                <Badge variant="outline">
                  {Math.round(cache.competitive.hitRate)}% hit rate
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {(performance.slowRequests > 0 || performance.criticalRequests > 0) && (
        <Card className="border-orange-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-600">
              <AlertCircle className="h-5 w-5" />
              Performance Alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {performance.slowRequests > 0 && (
                <div className="flex items-center gap-2 text-orange-600">
                  <AlertCircle className="h-4 w-4" />
                  <span>{performance.slowRequests} slow requests detected (&gt;5s)</span>
                </div>
              )}
              {performance.criticalRequests > 0 && (
                <div className="flex items-center gap-2 text-red-600">
                  <AlertCircle className="h-4 w-4" />
                  <span>{performance.criticalRequests} critical requests detected (&gt;10s)</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}