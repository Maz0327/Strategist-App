import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Brain, TrendingUp, Clock, ArrowRight, RefreshCw, Bookmark, CheckCircle, BarChart3, Rss, Zap, ExternalLink, Settings, Users, HelpCircle } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import type { Signal } from "@shared/schema";
import { TopicPreferences } from "./topic-preferences";
import { FeedSourceManager } from "./feed-source-manager";

interface TodaysBriefingProps {
  activeSubTab?: string;
  onNavigateToExplore: () => void;
  onNavigateToCapture: () => void;
  onNavigateToBrief: () => void;
  onNavigate?: (tab: string, subTab?: string) => void;
}

export function TodaysBriefing({ activeSubTab, onNavigateToExplore, onNavigateToCapture, onNavigateToBrief, onNavigate }: TodaysBriefingProps) {
  const [refreshing, setRefreshing] = useState(false);
  const [isPreferencesOpen, setIsPreferencesOpen] = useState(false);
  const [isSourcesOpen, setIsSourcesOpen] = useState(false);
  const queryClient = useQueryClient();

  // Fetch recent signals for today's briefing
  const { data: signalsData, isLoading, refetch } = useQuery<{ signals: Signal[] }>({
    queryKey: ["/api/signals"],
    staleTime: 5 * 60 * 1000, // 5 minutes
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

  // Fetch feed data for the three separate feeds
  const { data: projectData, isLoading: projectLoading } = useQuery({
    queryKey: ['/api/feeds/items', 'project_data'],
    queryFn: async () => {
      const response = await fetch('/api/feeds/items?feedType=project_data&limit=10', {
        credentials: 'include'
      });
      if (!response.ok) {
        return { feedItems: [] };
      }
      return response.json();
    },
  });

  const { data: customFeedData, isLoading: customLoading } = useQuery({
    queryKey: ['/api/feeds/items', 'custom_feed'],
    queryFn: async () => {
      const response = await fetch('/api/feeds/items?feedType=custom_feed&limit=10', {
        credentials: 'include'
      });
      if (!response.ok) {
        return { feedItems: [] };
      }
      return response.json();
    },
  });

  const { data: intelligenceData, isLoading: intelligenceLoading } = useQuery({
    queryKey: ['/api/feeds/items', 'intelligence_feed'],
    queryFn: async () => {
      const response = await fetch('/api/feeds/items?feedType=intelligence_feed&limit=10', {
        credentials: 'include'
      });
      if (!response.ok) {
        return { feedItems: [] };
      }
      return response.json();
    },
  });

  const signals = signalsData?.signals || [];
  
  // Get top 3-5 most recent or high-scoring signals
  const topSignals = signals
    .sort((a, b) => {
      // Sort by creation date (most recent first) and confidence score
      const dateA = new Date(a.createdAt).getTime();
      const dateB = new Date(b.createdAt).getTime();
      if (dateA !== dateB) return dateB - dateA;
      return (b.confidence || 0) - (a.confidence || 0);
    })
    .slice(0, 5);

  // Get status counts
  const statusCounts = {
    total: signals.length,
    signals: signals.filter(s => s.status === 'signal').length,
    potential: signals.filter(s => s.status === 'potential_signal').length,
    insights: signals.filter(s => s.status === 'insight').length,
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await refetch();
    } finally {
      setRefreshing(false);
    }
  };

  // Utility functions for feed actions
  const markAsRead = async (feedItemId: number) => {
    try {
      const response = await fetch(`/api/feeds/items/${feedItemId}/read`, {
        method: 'PUT',
        credentials: 'include'
      });
      if (response.ok) {
        // Refresh the relevant feed data
        await refetch();
      }
    } catch (error) {
      console.error('Failed to mark item as read:', error);
    }
  };

  const bookmarkItem = async (feedItemId: number) => {
    try {
      const response = await fetch(`/api/feeds/items/${feedItemId}/bookmark`, {
        method: 'PUT',
        credentials: 'include'
      });
      if (response.ok) {
        // Refresh the relevant feed data
        await refetch();
      }
    } catch (error) {
      console.error('Failed to bookmark item:', error);
    }
  };

  const refreshFeeds = async () => {
    try {
      const response = await fetch('/api/feeds/refresh', {
        method: 'POST',
        credentials: 'include'
      });
      if (response.ok) {
        // Refresh all feed data
        await refetch();
        // Also refresh the feed items queries
        await queryClient.invalidateQueries({ queryKey: ['/api/feeds/items'] });
      }
    } catch (error) {
      console.error('Failed to refresh feeds:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-24" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    );
  }

  // Render different content based on activeSubTab
  const renderFeedContent = () => {
    switch (activeSubTab) {
      case "client-feeds":
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Client Pulse</h3>
                <p className="text-gray-600">Project data, analytics, and client performance metrics</p>
              </div>
              <Button onClick={refreshFeeds} variant="outline" size="sm">
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
            </div>
            
            {projectLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => (
                  <Card key={i} className="animate-pulse">
                    <CardContent className="p-4">
                      <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : projectData?.feedItems?.length > 0 ? (
              <div className="space-y-3">
                {projectData.feedItems.map((item: any) => (
                  <Card key={item.id} className="border-l-4 border-blue-500">
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start">
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-gray-900 mb-1 break-words leading-tight">{item.title}</h4>
                          <p className="text-sm text-gray-600 mb-2 break-words leading-relaxed">{item.summary}</p>
                          <div className="flex items-center gap-2 text-xs text-gray-500">
                            <Badge variant="outline">{item.urgencyLevel}</Badge>
                            <span>•</span>
                            <span>{formatDistanceToNow(new Date(item.publishedAt))} ago</span>
                          </div>
                        </div>
                        <div className="flex gap-2 flex-shrink-0">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => bookmarkItem(item.id)}
                            className="h-8 w-8 p-0"
                          >
                            <Bookmark className="w-4 h-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => markAsRead(item.id)}
                            className="h-8 w-8 p-0"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h4 className="font-medium text-gray-900 mb-2">No Client Data</h4>
                <p className="text-gray-600 mb-4">Connect to client analytics and project management tools</p>
                <Button 
                  variant="outline" 
                  className="mb-6"
                  onClick={() => alert('Integration setup coming soon! This will allow you to connect Google Analytics, Tracer, and other tools.')}
                >
                  <Settings className="w-4 h-4 mr-2" />
                  Connect 3rd Party Integrations
                </Button>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mx-auto">
                  <Card>
                    <CardContent className="p-4">
                      <h4 className="font-medium mb-2">Analytics & Data</h4>
                      <ul className="text-sm text-gray-600 space-y-1">
                        <li>• Google Analytics</li>
                        <li>• Social Media Insights</li>
                        <li>• Email Marketing Data</li>
                        <li>• Customer Support Metrics</li>
                      </ul>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <h4 className="font-medium mb-2">Project Tools</h4>
                      <ul className="text-sm text-gray-600 space-y-1">
                        <li>• Tracer Analytics</li>
                        <li>• HubSpot CRM</li>
                        <li>• Salesforce Data</li>
                        <li>• Custom APIs</li>
                      </ul>
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}
          </div>
        );
      case "custom-feeds":
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Custom Watch</h3>
                <p className="text-gray-600">Your RSS feeds, newsletters, and custom data sources</p>
              </div>
              <div className="flex items-center gap-2">
                <Button 
                  onClick={() => setIsSourcesOpen(true)} 
                  variant="outline" 
                  size="sm"
                >
                  <Settings className="w-4 h-4 mr-2" />
                  Manage Sources
                </Button>
                <Button onClick={refreshFeeds} variant="outline" size="sm">
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Refresh
                </Button>
              </div>
            </div>
            
            {customLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => (
                  <Card key={i} className="animate-pulse">
                    <CardContent className="p-4">
                      <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : customFeedData?.feedItems?.length > 0 ? (
              <div className="space-y-3">
                {customFeedData.feedItems.map((item: any) => (
                  <Card key={item.id} className="border-l-4 border-green-500">
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start">
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-gray-900 mb-1 break-words leading-tight">{item.title}</h4>
                          <p className="text-sm text-gray-600 mb-2 break-words leading-relaxed">{item.summary}</p>
                          <div className="flex items-center gap-2 text-xs text-gray-500">
                            <Badge variant="outline">{item.urgencyLevel}</Badge>
                            <span>•</span>
                            <span>{formatDistanceToNow(new Date(item.publishedAt))} ago</span>
                            {item.url && (
                              <>
                                <span>•</span>
                                <a href={item.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 hover:text-blue-600">
                                  <ExternalLink className="w-3 h-3" />
                                  Read More
                                </a>
                              </>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-2 flex-shrink-0">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => bookmarkItem(item.id)}
                            className="h-8 w-8 p-0"
                          >
                            <Bookmark className="w-4 h-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => markAsRead(item.id)}
                            className="h-8 w-8 p-0"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Rss className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h4 className="font-medium text-gray-900 mb-2">No Custom Feeds</h4>
                <p className="text-gray-600 mb-4">Add RSS feeds and custom data sources to track specific content</p>
                <Button 
                  variant="outline" 
                  className="mb-6"
                  onClick={() => setIsSourcesOpen(true)}
                >
                  <Settings className="w-4 h-4 mr-2" />
                  Manage RSS Sources
                </Button>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mx-auto">
                  <Card>
                    <CardContent className="p-4">
                      <h4 className="font-medium mb-2">RSS Feed Options</h4>
                      <ul className="text-sm text-gray-600 space-y-1">
                        <li>• Industry publications and blogs</li>
                        <li>• Competitor news feeds</li>
                        <li>• Trade publication updates</li>
                        <li>• Thought leader content</li>
                      </ul>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <h4 className="font-medium mb-2">Custom Sources</h4>
                      <ul className="text-sm text-gray-600 space-y-1">
                        <li>• Newsletter archives</li>
                        <li>• Research reports</li>
                        <li>• Internal documents</li>
                        <li>• Bookmark collections</li>
                      </ul>
                    </CardContent>
                  </Card>
                </div>
                <p className="text-sm text-gray-500 mt-4">
                  Set up RSS feeds and custom data source monitoring
                </p>
              </div>
            )}
            
            {/* Sources Dialog for Custom Feeds */}
            <Dialog open={isSourcesOpen} onOpenChange={setIsSourcesOpen}>
              <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Manage Feed Sources</DialogTitle>
                </DialogHeader>
                <FeedSourceManager onSourcesChange={() => setIsSourcesOpen(false)} />
              </DialogContent>
            </Dialog>
          </div>
        );
      case "project-feeds":
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Market Intelligence</h3>
                <p className="text-gray-600">Personalized filtered intelligence from integrated platforms</p>
              </div>
              <Button onClick={refreshFeeds} variant="outline" size="sm">
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
            </div>
            
            {intelligenceLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => (
                  <Card key={i} className="animate-pulse">
                    <CardContent className="p-4">
                      <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : intelligenceData?.feedItems?.length > 0 ? (
              <div className="space-y-3">
                {intelligenceData.feedItems.map((item: any) => (
                  <Card key={item.id} className="border-l-4 border-purple-500">
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start">
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-gray-900 mb-1 break-words leading-tight">{item.title}</h4>
                          <p className="text-sm text-gray-600 mb-2 break-words leading-relaxed">{item.summary}</p>
                          <div className="flex items-center gap-2 text-xs text-gray-500">
                            <Badge variant="outline">{item.urgencyLevel}</Badge>
                            <span>•</span>
                            <span>{formatDistanceToNow(new Date(item.publishedAt))} ago</span>
                            {item.relevanceScore && (
                              <>
                                <span>•</span>
                                <span>Relevance: {item.relevanceScore}%</span>
                              </>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-2 flex-shrink-0">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => bookmarkItem(item.id)}
                            className="h-8 w-8 p-0"
                          >
                            <Bookmark className="w-4 h-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => markAsRead(item.id)}
                            className="h-8 w-8 p-0"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Zap className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h4 className="font-medium text-gray-900 mb-2">No Intelligence Data</h4>
                <p className="text-gray-600 mb-4">Smart filtering from integrated platforms based on your interests</p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-4xl mx-auto">
                  <Card>
                    <CardContent className="p-4">
                      <h4 className="font-medium mb-2">Social Intelligence</h4>
                      <ul className="text-sm text-gray-600 space-y-1">
                        <li>• Reddit trending discussions</li>
                        <li>• Twitter/X viral content</li>
                        <li>• YouTube trending videos</li>
                        <li>• TikTok cultural moments</li>
                      </ul>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <h4 className="font-medium mb-2">News & Trends</h4>
                      <ul className="text-sm text-gray-600 space-y-1">
                        <li>• Google Trends data</li>
                      <li>• Breaking news alerts</li>
                      <li>• Industry publications</li>
                      <li>• Market intelligence</li>
                    </ul>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <h4 className="font-medium mb-2">Cultural Signals</h4>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>• Music trends (Spotify, Last.fm)</li>
                      <li>• Entertainment buzz (TMDb, TVMaze)</li>
                      <li>• Tech discussions (Hacker News)</li>
                      <li>• Knowledge curation (Glasp)</li>
                    </ul>
                  </CardContent>
                </Card>
              </div>
              <Button onClick={onNavigateToExplore} className="mt-4">
                Explore Live Intelligence <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
            )}
          </div>
        );
      default:
        return (
          <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Today's Briefing</h2>
                <p className="text-gray-600 mt-1">Your strategic intelligence for today</p>
              </div>
              <div className="flex items-center gap-3">
                <Dialog open={isPreferencesOpen} onOpenChange={setIsPreferencesOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm" data-tutorial="settings-button">
                      <Settings className="h-4 w-4 mr-2" />
                      Preferences
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Intelligence Preferences</DialogTitle>
                    </DialogHeader>
                    <TopicPreferences onComplete={() => setIsPreferencesOpen(false)} />
                  </DialogContent>
                </Dialog>
                
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm">
                      <HelpCircle className="h-4 w-4 mr-2" />
                      Help
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>Getting Started</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-medium mb-2">Today's Briefing</h4>
                        <p className="text-sm text-gray-600 mb-3">Your daily starting point for strategic intelligence</p>
                        <ul className="text-sm space-y-1">
                          <li>• <strong>Client Channels:</strong> Industry updates and competitive intelligence</li>
                          <li>• <strong>Custom Feeds:</strong> Your RSS feeds and curated sources</li>
                          <li>• <strong>Project Intelligence:</strong> Market trends and strategic insights</li>
                        </ul>
                      </div>
                      
                      <div>
                        <h4 className="font-medium mb-2">Workflow</h4>
                        <p className="text-sm text-gray-600 mb-3">Follow the natural progression:</p>
                        <ol className="text-sm space-y-1">
                          <li>1. <strong>Capture:</strong> Analyze content from URLs or text</li>
                          <li>2. <strong>Review:</strong> Manage signals in your dashboard</li>
                          <li>3. <strong>Refine:</strong> Promote signals to insights</li>
                          <li>4. <strong>Brief:</strong> Create strategic deliverables</li>
                        </ol>
                      </div>
                      
                      <div>
                        <h4 className="font-medium mb-2">Tips</h4>
                        <ul className="text-sm space-y-1">
                          <li>• Use the collapsible sidebar (←) for more working space</li>
                          <li>• Chrome extension: Ctrl+Shift+C for quick capture</li>
                          <li>• Click trending topics to navigate to explore section</li>
                          <li>• Use "one tool, one place" philosophy - everything has a home</li>
                        </ul>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
                
                <Dialog open={isSourcesOpen} onOpenChange={setIsSourcesOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm">
                      <Rss className="h-4 w-4 mr-2" />
                      Sources
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Manage Feed Sources</DialogTitle>
                    </DialogHeader>
                    <FeedSourceManager onSourcesChange={() => setIsSourcesOpen(false)} />
                  </DialogContent>
                </Dialog>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRefresh}
                  disabled={refreshing}
                  data-tutorial="refresh-button"
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
              </div>
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

      {/* Daily Intelligence Channels */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {/* Client Channels */}
        <Card 
          className="card-shadow cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => onNavigate?.('briefing', 'client-feeds')}
        >
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold text-gray-900 flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                <Users className="h-4 w-4 text-blue-600" />
              </div>
              Client Channels
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-3">
              Latest updates from your client's industry and competitive landscape
            </p>
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500">
                {projectData?.feedItems?.length || 0} new updates
              </span>
              <ArrowRight className="h-4 w-4 text-gray-400" />
            </div>
          </CardContent>
        </Card>

        {/* Custom Feeds */}
        <Card 
          className="card-shadow cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => onNavigate?.('briefing', 'custom-feeds')}
        >
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold text-gray-900 flex items-center gap-2">
              <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                <Rss className="h-4 w-4 text-green-600" />
              </div>
              Custom Feeds
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-3">
              Your curated RSS feeds and custom data sources
            </p>
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500">
                {customFeedData?.feedItems?.length || 0} new articles
              </span>
              <ArrowRight className="h-4 w-4 text-gray-400" />
            </div>
          </CardContent>
        </Card>

        {/* Project Intelligence */}
        <Card 
          className="card-shadow cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => onNavigate?.('briefing', 'project-intelligence')}
        >
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold text-gray-900 flex items-center gap-2">
              <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="h-4 w-4 text-purple-600" />
              </div>
              Project Intelligence
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-3">
              Market intelligence and trending insights for strategic planning
            </p>
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500">
                {intelligenceData?.feedItems?.length || 0} insights
              </span>
              <ArrowRight className="h-4 w-4 text-gray-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Quick Actions</h3>
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
  };

  return renderFeedContent();
}