import React, { useState, useEffect, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { AnimatedLoadingState } from "@/components/ui/animated-loading-state";
import { TrendingUp, ExternalLink, RefreshCw, Globe, MessageSquare, Search, Calendar } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface Topic {
  id: string;
  platform: string;
  title: string;
  summary?: string;
  url: string;
  score?: number;
  fetchedAt: string;
  engagement?: number;
  source?: string;
}

export function TrendingTopics() {
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [analyzingTopics, setAnalyzingTopics] = useState<Set<string>>(new Set());
  const { toast } = useToast();

  // Manual refresh mutation
  const refreshMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('/api/trending/refresh', 'POST');
      return response;
    },
    onSuccess: () => {
      refetch(); // Refetch the trending data query
      toast({
        title: "Trending data refreshed",
        description: "Latest trending topics have been loaded from all platforms"
      });
    },
    onError: (error: any) => {
      toast({
        title: "Refresh failed",
        description: error.message || "Failed to refresh trending data. Please try again.",
        variant: "destructive"
      });
    }
  });

  const { data: trendingData, isLoading, refetch, error } = useQuery<{ 
    success: boolean;
    platforms: Record<string, any>;
    totalItems: number;
    collectedAt: string;
  }>({
    queryKey: ["/api/trending/all"],
    staleTime: 5 * 60 * 1000, // 5 minutes - real-time social data
    refetchInterval: false, // Manual refresh only - no automatic intervals
    retry: 2,
    refetchOnWindowFocus: false,
    gcTime: 15 * 60 * 1000, // 15 minutes cache time
    queryFn: async () => {
      try {
        console.log('🔄 Fetching trending data from Bright Data automation');
        
        const response = await fetch('/api/trending/all', {
          credentials: 'include'
        });
        
        if (!response.ok) {
          throw new Error(`API response ${response.status}`);
        }
        
        const data = await response.json();
        console.log(`✅ Received trending data: ${data.totalItems} items from ${Object.keys(data.platforms).length} platforms`);
        
        return data;
      } catch (error) {
        console.error('Trending data fetch failed:', (error as Error).message);
        // Return minimal fallback structure
        return { 
          success: false,
          platforms: {},
          totalItems: 0,
          collectedAt: new Date().toISOString(),
          notice: 'Connecting to Bright Data...'
        };
      }
    },
  });

  // Transform Bright Data response to topics format with early return
  const topics = useMemo(() => {
    if (!trendingData || !trendingData.platforms || typeof trendingData.platforms !== 'object') {
      return [];
    }
    
    const allTopics: Topic[] = [];
    
    try {
      Object.entries(trendingData.platforms).forEach(([platform, platformItems]: [string, any]) => {
        // Handle direct array format from Bright Data
        if (Array.isArray(platformItems)) {
          platformItems.forEach((item: any, index: number) => {
            allTopics.push({
              id: `${platform}-${index}`,
              platform,
              title: item.title || `${platform} Item ${index + 1}`,
              summary: item.description || item.summary || `Trending ${platform} content with ${item.engagement || 0} interactions`,
              url: item.url || item.link || '#',
              score: item.engagement || 0,
              fetchedAt: item.timestamp || item.created_at || trendingData.collectedAt,
              engagement: item.engagement || 0,
              source: platform
            });
          });
        }
      });
    } catch (error) {
      console.error('Error processing trending data:', error);
      return [];
    }
    
    // Sort by engagement first, then filter
    const sorted = allTopics.sort((a, b) => (b.engagement || 0) - (a.engagement || 0));
    
    // Filter by selected category
    return selectedCategory === "all" 
      ? sorted 
      : sorted.filter(topic => topic.platform === selectedCategory);
  }, [trendingData, selectedCategory]);

  // Enhanced loading state with AnimatedLoadingState
  if (isLoading) {
    return (
      <AnimatedLoadingState 
        title="Loading Trending Topics"
        subtitle="Fetching real-time data from 13+ platforms"
      />
    );
  }
  
  // Topic data summary
  const platforms = Array.from(new Set(topics.map(t => t.platform)));

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refreshMutation.mutateAsync();
    } catch (error) {
      // Error handling is done in the mutation's onError
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleAnalyzeTopic = async (topic: Topic) => {
    setAnalyzingTopics(prev => new Set(prev).add(topic.id));
    
    try {
      const response = await apiRequest("/api/analyze", "POST", {
        content: topic.summary || topic.title,
        title: `Topic Analysis: ${topic.title}`,
        url: topic.url,
        analysisMode: 'deep', // Default to deep analysis for trending topics
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to analyze topic");
      }
      
      await response.json(); // Parse the response
      
      toast({
        title: "Content Captured",
        description: "Content analyzed and saved as a capture. Check the Dashboard to flag as potential signal.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to analyze topic",
        variant: "destructive",
      });
    } finally {
      setAnalyzingTopics(prev => {
        const newSet = new Set(prev);
        newSet.delete(topic.id);
        return newSet;
      });
    }
  };

  const getPlatformIcon = (platform: string) => {
    switch (platform.toLowerCase()) {
      case 'reddit':
        return <MessageSquare className="text-orange-500" size={16} />;
      case 'google':
      case 'google-trends':
        return <Search className="text-blue-500" size={16} />;
      case 'twitter':
        return <MessageSquare className="text-blue-400" size={16} />;
      case 'hackernews':
        return <Globe className="text-orange-600" size={16} />;
      case 'news':
      case 'gnews':
      case 'nytimes':
      case 'currents':
      case 'mediastack':
        return <Globe className="text-green-600" size={16} />;
      case 'youtube':
      case 'youtube-trending':
        return <Globe className="text-red-500" size={16} />;
      case 'tiktok':
      case 'tiktok-trends':
        return <Globe className="text-black" size={16} />;
      case 'instagram':
      case 'instagram-trends':
        return <Globe className="text-pink-600" size={16} />;
      case 'linkedin':
      case 'linkedin-trends':
        return <Globe className="text-blue-700" size={16} />;
      case 'spotify':
      case 'lastfm':
      case 'genius':
        return <Globe className="text-purple-500" size={16} />;
      case 'tmdb':
      case 'tvmaze':
        return <Globe className="text-indigo-500" size={16} />;
      case 'glasp':
        return <Globe className="text-teal-500" size={16} />;
      case 'knowyourmeme':
        return <Globe className="text-pink-500" size={16} />;
      case 'urbandictionary':
        return <Globe className="text-yellow-500" size={16} />;
      case 'reddit-cultural':
        return <MessageSquare className="text-orange-600" size={16} />;
      default:
        return <Globe className="text-gray-500" size={16} />;
    }
  };

  const getPlatformColor = (platform: string) => {
    switch (platform.toLowerCase()) {
      case 'reddit':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'google':
      case 'google-trends':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'twitter':
        return 'bg-sky-100 text-sky-800 border-sky-200';
      case 'hackernews':
        return 'bg-orange-50 text-orange-700 border-orange-200';
      case 'news':
        return 'bg-green-50 text-green-700 border-green-200';
      case 'gnews':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'nytimes':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'currents':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'mediastack':
        return 'bg-teal-100 text-teal-800 border-teal-200';
      case 'youtube':
      case 'youtube-trending':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'tiktok':
      case 'tiktok-trends':
        return 'bg-black text-white border-gray-800';
      case 'instagram':
      case 'instagram-trends':
        return 'bg-pink-100 text-pink-800 border-pink-200';
      case 'linkedin':
      case 'linkedin-trends':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'spotify':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'lastfm':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'genius':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'tmdb':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'tvmaze':
        return 'bg-indigo-100 text-indigo-800 border-indigo-200';
      case 'glasp':
        return 'bg-teal-100 text-teal-800 border-teal-200';
      case 'knowyourmeme':
        return 'bg-pink-100 text-pink-800 border-pink-200';
      case 'urbandictionary':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'reddit-cultural':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getCategoryFromPlatform = (platform: string): string => {
    switch (platform.toLowerCase()) {
      case 'google':
      case 'google-trends':
        return 'search';
      case 'reddit':
      case 'twitter':
      case 'hackernews':
        return 'social';
      case 'news':
      case 'gnews':
      case 'nytimes':
      case 'currents':
      case 'mediastack':
        return 'news';
      case 'youtube':
      case 'youtube-trending':
        return 'video';
      case 'tiktok':
      case 'tiktok-trends':
      case 'instagram':
      case 'instagram-trends':
        return 'social-media';
      case 'linkedin':
      case 'linkedin-trends':
        return 'professional';
      case 'spotify':
      case 'lastfm':
      case 'genius':
        return 'music';
      case 'tmdb':
      case 'tvmaze':
        return 'entertainment';
      case 'glasp':
        return 'knowledge';
      case 'knowyourmeme':
      case 'urbandictionary':
      case 'reddit-cultural':
        return 'cultural';
      default:
        return 'other';
    }
  };

  const filteredTopics = selectedCategory === "all" 
    ? topics 
    : topics.filter(topic => topic.platform === selectedCategory);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-8 bg-gray-200 rounded animate-pulse"></div>
        <div className="h-32 bg-gray-200 rounded animate-pulse"></div>
        <div className="h-32 bg-gray-200 rounded animate-pulse"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Trending Topics</h2>
          <p className="text-sm text-gray-600 mt-1">
            Real-time insights from social media and search trends
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant="secondary" className="text-sm">
            {filteredTopics.length} topics
          </Badge>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing}
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Platform Filter */}
      <div className="flex items-center space-x-4">
        <Label htmlFor="platform-filter">Platform:</Label>
        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">🔥 All Platforms (Bright Data Primary)</SelectItem>
            
            {/* 🔥 BRIGHT DATA SOCIAL INTELLIGENCE */}
            <SelectItem value="instagram">📷 Instagram (Bright Data)</SelectItem>
            <SelectItem value="twitter">🐦 Twitter/X (Bright Data)</SelectItem>
            <SelectItem value="tiktok">🎵 TikTok (Bright Data)</SelectItem>
            <SelectItem value="linkedin">💼 LinkedIn (Bright Data)</SelectItem>
            
            {/* 🔥 BRIGHT DATA WEB SCRAPING */}
            <SelectItem value="google">🔍 Google Trends (Bright Data)</SelectItem>
            <SelectItem value="youtube">📹 YouTube Trending (Bright Data)</SelectItem>
            <SelectItem value="reddit">💬 Reddit (Bright Data)</SelectItem>
            <SelectItem value="news">📰 News Sources (Bright Data)</SelectItem>
            
            {/* ✅ WORKING APIs (Verified) */}
            <SelectItem value="hacker_news">🔶 Hacker News (API)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Debug Info */}
      {selectedCategory !== "all" && (
        <div className="bg-blue-50 p-4 rounded-lg">
          <p className="text-sm text-blue-800">
            Showing {filteredTopics.length} topics from {selectedCategory.charAt(0).toUpperCase() + selectedCategory.slice(1)}
          </p>
        </div>
      )}

      {/* Topics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredTopics.map((topic) => (
          <Card key={topic.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-2">
                  {getPlatformIcon(topic.platform)}
                  <Badge className={getPlatformColor(topic.platform)} variant="secondary">
                    {topic.source || topic.platform}
                  </Badge>
                </div>
                <div className="flex items-center space-x-2">
                  {topic.score && (
                    <Badge variant="outline" className={getScoreColor(topic.score)}>
                      {topic.score}% trending
                    </Badge>
                  )}
                  <TrendingUp className="text-green-500" size={16} />
                </div>
              </div>
              <CardTitle className="text-lg font-semibold text-gray-900 mt-2 break-words leading-tight">
                {topic.title}
              </CardTitle>
              <div className="flex items-center space-x-4 text-sm text-gray-500">
                <div className="flex items-center space-x-1">
                  <Calendar size={12} />
                  <span>{formatDistanceToNow(new Date(topic.fetchedAt), { addSuffix: true })}</span>
                </div>
                {topic.engagement && (
                  <div className="flex items-center space-x-1">
                    <MessageSquare size={12} />
                    <span>{topic.engagement.toLocaleString()} interactions</span>
                  </div>
                )}
              </div>
            </CardHeader>
            
            <CardContent className="space-y-4">
              <p className="text-sm text-gray-700 line-clamp-3 break-words leading-relaxed">
                {topic.summary || "No summary available"}
              </p>

              <div className="flex justify-between items-center">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(topic.url, '_blank')}
                  className="flex items-center space-x-1"
                >
                  <ExternalLink size={12} />
                  <span>View Source</span>
                </Button>
                <Button
                  size="sm"
                  onClick={() => handleAnalyzeTopic(topic)}
                  className="bg-blue-600 hover:bg-blue-700"
                  disabled={analyzingTopics.has(topic.id)}
                  data-tutorial="trend-analyze"
                >
                  {analyzingTopics.has(topic.id) ? (
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-1"></div>
                      Analyzing...
                    </div>
                  ) : (
                    <>
                      <TrendingUp size={12} className="mr-1" />
                      Analyze Topic
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredTopics.length === 0 && (
        <div className="text-center py-12">
          <TrendingUp className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No trending topics found</h3>
          <p className="mt-1 text-sm text-gray-500">
            Try refreshing or selecting a different platform
          </p>
        </div>
      )}
    </div>
  );
}