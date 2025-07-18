import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Brain, TrendingUp, Clock, ArrowRight, RefreshCw, ExternalLink } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import type { Signal } from "@shared/schema";

interface TodaysBriefingProps {
  activeSubTab?: string;
  onNavigateToExplore: () => void;
  onNavigateToCapture: () => void;
  onNavigateToBrief: () => void;
  onNavigate?: (tab: string, subTab?: string) => void;
}

export function TodaysBriefing({ 
  activeSubTab, 
  onNavigateToExplore, 
  onNavigateToCapture, 
  onNavigateToBrief, 
  onNavigate 
}: TodaysBriefingProps) {
  const [refreshing, setRefreshing] = useState(false);
  const queryClient = useQueryClient();

  // Fetch recent signals
  const { data: signalsData, isLoading } = useQuery<{ signals: Signal[] }>({
    queryKey: ["/api/signals"],
    staleTime: 5 * 60 * 1000,
    retry: false,
    queryFn: async () => {
      try {
        const response = await fetch('/api/signals', {
          credentials: 'include'
        });
        if (!response.ok) {
          throw new Error("Failed to fetch signals");
        }
        return response.json();
      } catch (error) {
        return { signals: [] };
      }
    },
  });

  const topSignals = signalsData?.signals?.slice(0, 5) || [];

  const statusCounts = {
    total: signalsData?.signals?.length || 0,
    signals: signalsData?.signals?.filter(s => s.status === 'signal')?.length || 0,
    potential: signalsData?.signals?.filter(s => s.status === 'potential_signal')?.length || 0,
    insights: signalsData?.signals?.filter(s => s.status === 'insight')?.length || 0,
  };

  const refreshFeeds = async () => {
    setRefreshing(true);
    try {
      await queryClient.invalidateQueries({ queryKey: ['/api/signals'] });
    } catch (error) {
      console.error('Failed to refresh feeds:', error);
    } finally {
      setRefreshing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="h-8 w-48 bg-gray-200 rounded animate-pulse"></div>
          <div className="h-10 w-24 bg-gray-200 rounded animate-pulse"></div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-24 bg-gray-200 rounded animate-pulse"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Today's Briefing</h1>
        <Button 
          onClick={refreshFeeds} 
          variant="outline" 
          size="sm"
          disabled={refreshing}
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Items</p>
                <p className="text-2xl font-bold">{statusCounts.total}</p>
              </div>
              <Brain className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Validated Signals</p>
                <p className="text-2xl font-bold">{statusCounts.signals}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Potential Signals</p>
                <p className="text-2xl font-bold">{statusCounts.potential}</p>
              </div>
              <Clock className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Insights</p>
                <p className="text-2xl font-bold">{statusCounts.insights}</p>
              </div>
              <ArrowRight className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Signals */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Recent Signals</h3>
          <Button variant="outline" size="sm" onClick={() => onNavigate?.('manage', 'signals')}>
            <ExternalLink className="w-4 h-4 mr-2" />
            View All
          </Button>
        </div>
        
        {topSignals.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-center">
              <p className="text-gray-500 mb-4">No signals captured yet</p>
              <Button onClick={onNavigateToCapture}>
                Capture Your First Signal
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {topSignals.map((signal) => (
              <Card key={signal.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant={
                          signal.status === 'signal' ? 'default' :
                          signal.status === 'potential_signal' ? 'secondary' :
                          'outline'
                        }>
                          {signal.status === 'potential_signal' ? 'Potential Signal' : 
                           signal.status === 'signal' ? 'Signal' :
                           signal.status === 'insight' ? 'Insight' : 'Capture'}
                        </Badge>
                        {signal.confidence && (
                          <span className="text-sm text-gray-500">
                            {Math.round(signal.confidence * 100)}% confidence
                          </span>
                        )}
                      </div>
                      <h4 className="font-medium text-gray-900 mb-1">{signal.title}</h4>
                      <p className="text-sm text-gray-600 mb-2 line-clamp-2">{signal.summary}</p>
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span>{formatDistanceToNow(new Date(signal.createdAt))} ago</span>
                        {signal.tags && signal.tags.length > 0 && (
                          <span>{signal.tags.join(', ')}</span>
                        )}
                      </div>
                    </div>
                    <Button variant="ghost" size="sm" onClick={onNavigateToBrief}>
                      Add to Brief
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={onNavigateToCapture}>
          <CardContent className="p-6 text-center">
            <Brain className="h-8 w-8 text-blue-500 mx-auto mb-3" />
            <h4 className="font-medium text-gray-900 mb-2">Capture New Signal</h4>
            <p className="text-sm text-gray-600">Add content from URL or text</p>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={onNavigateToExplore}>
          <CardContent className="p-6 text-center">
            <TrendingUp className="h-8 w-8 text-green-500 mx-auto mb-3" />
            <h4 className="font-medium text-gray-900 mb-2">Explore Signals</h4>
            <p className="text-sm text-gray-600">Discover trending topics across platforms</p>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={onNavigateToBrief}>
          <CardContent className="p-6 text-center">
            <ArrowRight className="h-8 w-8 text-purple-500 mx-auto mb-3" />
            <h4 className="font-medium text-gray-900 mb-2">Strategic Brief Lab</h4>
            <p className="text-sm text-gray-600">Build strategic briefs from your signals</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}