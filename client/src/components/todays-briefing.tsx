import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Brain, TrendingUp, Clock, ArrowRight, RefreshCw, ExternalLink, Target } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import type { Signal } from "@shared/schema";
import { StandardizedLoading } from "@/components/ui/standardized-loading";

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
            <div className="space-y-2">
              {[
                { title: "Tech Industry Shifts", source: "TechCrunch", time: "2h ago", priority: "High" },
                { title: "Market Volatility Signals", source: "Reuters", time: "4h ago", priority: "Medium" },
                { title: "Consumer Behavior Changes", source: "Harvard Business", time: "6h ago", priority: "High" }
              ].map((item, index) => (
                <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded-md">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{item.title}</p>
                    <p className="text-xs text-gray-600">{item.source} • {item.time}</p>
                  </div>
                  <Badge variant={item.priority === "High" ? "destructive" : "secondary"} className="text-xs">
                    {item.priority}
                  </Badge>
                </div>
              ))}
            </div>
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
            <div className="space-y-2">
              {[
                { title: "AI Marketing Trends", source: "Marketing Land", time: "1h ago", type: "RSS" },
                { title: "Startup Funding Rounds", source: "Crunchbase", time: "3h ago", type: "RSS" },
                { title: "Design System Updates", source: "Design Systems", time: "5h ago", type: "RSS" }
              ].map((item, index) => (
                <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded-md">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{item.title}</p>
                    <p className="text-xs text-gray-600">{item.source} • {item.time}</p>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {item.type}
                  </Badge>
                </div>
              ))}
            </div>
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
            <div className="space-y-2">
              {[
                { title: "Gen Z Shopping Patterns", project: "E-commerce Strategy", time: "1h ago", insights: 12 },
                { title: "Voice Search Adoption", project: "SEO Roadmap", time: "2h ago", insights: 8 },
                { title: "Sustainability Messaging", project: "Brand Positioning", time: "4h ago", insights: 15 }
              ].map((item, index) => (
                <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded-md">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{item.title}</p>
                    <p className="text-xs text-gray-600">{item.project} • {item.time}</p>
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    {item.insights} insights
                  </Badge>
                </div>
              ))}
            </div>
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
                        {formatDistanceToNow(new Date(signal.createdAt), { addSuffix: true })}
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