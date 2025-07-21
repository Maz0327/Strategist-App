import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Brain, TrendingUp, Clock, ArrowRight, RefreshCw, ExternalLink, Target, Rss, Users, Globe } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import type { Signal } from "@shared/schema";
import { StandardizedLoading } from "@/components/ui/standardized-loading";
import { useRssArticles, useRssFeedStats } from "@/hooks/use-rss-feeds";

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

  // Fetch RSS articles for each category
  const { data: clientArticles, isLoading: clientLoading } = useRssArticles('client', 3);
  const { data: customArticles, isLoading: customLoading } = useRssArticles('custom', 3);
  const { data: projectArticles, isLoading: projectLoading } = useRssArticles('project', 3);
  const { data: feedStats } = useRssFeedStats();

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
      // Refresh all data sources
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['/api/signals'] }),
        queryClient.invalidateQueries({ queryKey: ['/api/rss-feeds'] }),
        fetch('/api/rss-feeds/refresh', { method: 'POST', credentials: 'include' })
      ]);
    } catch (error) {
      console.error('Failed to refresh feeds:', error);
    } finally {
      setRefreshing(false);
    }
  };

  if (isLoading || clientLoading || customLoading || projectLoading) {
    return (
      <div className="space-y-6">
        <StandardizedLoading 
          title="Loading Briefing"
          subtitle="Gathering today's strategic intelligence"
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Today's Briefing</h1>
          <p className="text-gray-600 mt-1">Your strategic intelligence overview</p>
        </div>
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

      {/* Four Intelligence Channels */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Client Channels Section */}
        <Card className="h-fit">
          <CardHeader>
            <CardTitle className="flex items-center justify-between text-lg">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-blue-600" />
                Client Channels
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onNavigate?.("feeds", "client-feeds")}
                className="flex items-center gap-1"
              >
                <ExternalLink className="h-3 w-3" />
                View All
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-gray-600">Industry intelligence and competitive monitoring</p>
            {clientArticles?.articles?.length === 0 ? (
              <div className="text-center py-4">
                <Users className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-600 mb-3">No client feeds configured</p>
                <Button onClick={() => onNavigate?.("feeds", "client-feeds")} size="sm">
                  <Rss className="h-3 w-3 mr-1" />
                  Add Client Feed
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                {clientArticles?.articles?.slice(0, 3).map((article, index) => (
                  <div key={article.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-md">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{article.title}</p>
                      <p className="text-xs text-gray-600">
                        {article.author && `${article.author} • `}
                        {article.publishedAt ? formatDistanceToNow(new Date(article.publishedAt), { addSuffix: true }) : 'Recently'}
                      </p>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => window.open(article.url, '_blank')}>
                      <ExternalLink className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Custom Feeds Section */}
        <Card className="h-fit">
          <CardHeader>
            <CardTitle className="flex items-center justify-between text-lg">
              <div className="flex items-center gap-2">
                <Brain className="h-5 w-5 text-green-600" />
                Custom Feeds
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onNavigate?.("feeds", "custom-feeds")}
                className="flex items-center gap-1"
              >
                <ExternalLink className="h-3 w-3" />
                View All
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-gray-600">Curated RSS feeds and data sources</p>
            {customArticles?.articles?.length === 0 ? (
              <div className="text-center py-4">
                <Rss className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-600 mb-3">No custom feeds configured</p>
                <Button onClick={() => onNavigate?.("feeds", "custom-feeds")} size="sm">
                  <Rss className="h-3 w-3 mr-1" />
                  Add RSS Feed
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                {customArticles?.articles?.slice(0, 3).map((article) => (
                  <div key={article.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-md">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{article.title}</p>
                      <p className="text-xs text-gray-600">
                        {article.author && `${article.author} • `}
                        {article.publishedAt ? formatDistanceToNow(new Date(article.publishedAt), { addSuffix: true }) : 'Recently'}
                      </p>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => window.open(article.url, '_blank')}>
                      <ExternalLink className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Project Intelligence Section */}
        <Card className="h-fit">
          <CardHeader>
            <CardTitle className="flex items-center justify-between text-lg">
              <div className="flex items-center gap-2">
                <Target className="h-5 w-5 text-purple-600" />
                Project Intelligence
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onNavigate?.("feeds", "project-feeds")}
                className="flex items-center gap-1"
              >
                <ExternalLink className="h-3 w-3" />
                View All
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-gray-600">Market trends for active projects</p>
            {projectArticles?.articles?.length === 0 ? (
              <div className="text-center py-4">
                <Globe className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-600 mb-3">No project feeds configured</p>
                <Button onClick={() => onNavigate?.("feeds", "project-feeds")} size="sm">
                  <Target className="h-3 w-3 mr-1" />
                  Add Project Feed
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                {projectArticles?.articles?.slice(0, 3).map((article) => (
                  <div key={article.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-md">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{article.title}</p>
                      <p className="text-xs text-gray-600">
                        {article.author && `${article.author} • `}
                        {article.publishedAt ? formatDistanceToNow(new Date(article.publishedAt), { addSuffix: true }) : 'Recently'}
                      </p>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => window.open(article.url, '_blank')}>
                      <ExternalLink className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Signals Section */}
        <Card className="h-fit">
          <CardHeader>
            <CardTitle className="flex items-center justify-between text-lg">
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-orange-600" />
                Recent Signals
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onNavigate?.("manage", "dashboard")}
                className="flex items-center gap-1"
              >
                <ExternalLink className="h-3 w-3" />
                View All
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-gray-600">Recently analyzed content signals</p>
            {topSignals.length === 0 ? (
              <div className="text-center py-4">
                <Brain className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-600 mb-3">No signals yet</p>
                <Button onClick={onNavigateToCapture} size="sm">
                  <ExternalLink className="h-3 w-3 mr-1" />
                  Analyze Content
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                {topSignals.slice(0, 3).map((signal) => (
                  <div key={signal.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-md">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{signal.title}</p>
                      <p className="text-xs text-gray-600">
                        {signal.createdAt ? formatDistanceToNow(new Date(signal.createdAt), { addSuffix: true }) : 'Recently added'}
                      </p>
                    </div>
                    <Badge variant={
                      signal.status === 'signal' ? 'default' :
                      signal.status === 'potential_signal' ? 'secondary' :
                      'outline'
                    } className="text-xs">
                      {signal.status === 'potential_signal' ? 'Potential' : 
                       signal.status === 'signal' ? 'Signal' :
                       signal.status === 'insight' ? 'Insight' : 'Capture'}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
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