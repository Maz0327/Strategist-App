import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Globe2, 
  TrendingUp, 
  Zap, 
  Target, 
  Brain,
  Eye,
  Clock,
  MapPin,
  Activity,
  Sparkles,
  Filter,
  RefreshCw
} from "lucide-react";
import { AnimatedLoadingState } from "@/components/ui/animated-loading-state";

interface TrendIntelligence {
  keyword: string;
  platform: string;
  geo: string;
  engagement: number;
  riseRate: number;
  timeframe: string;
  category: string;
  competitorGap: 'high' | 'medium' | 'low';
  attentionValue: 'underpriced' | 'fair' | 'overpriced';
  extractedAt: string;
}

interface SocialIntelligence {
  platform: string;
  content: string;
  engagement: any;
  profile: any;
  culturalMoment: string;
  viralPotential: number;
  extractionMethod: string;
}

export function EnhancedTrendingIntelligence() {
  const [selectedGeo, setSelectedGeo] = useState('US');
  const [selectedTimeframe, setSelectedTimeframe] = useState('now 1-d');
  const [selectedCategory, setSelectedCategory] = useState('0');
  const [activeTab, setActiveTab] = useState('google-trends');
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Google Trends via Browser API
  const { data: googleTrends, isLoading: googleLoading, refetch: refetchGoogle } = useQuery({
    queryKey: ["/api/trends/google-browser", selectedGeo, selectedTimeframe, selectedCategory],
    staleTime: 10 * 60 * 1000, // 10 minutes
    queryFn: async () => {
      const params = new URLSearchParams({
        geo: selectedGeo,
        timeframe: selectedTimeframe,
        category: selectedCategory
      });
      
      const response = await fetch(`/api/trends/google-browser?${params}`, {
        credentials: 'include'
      });
      
      if (!response.ok) throw new Error('Failed to fetch Google Trends');
      return response.json();
    },
  });

  // Real-time Social Intelligence
  const { data: socialIntel, isLoading: socialLoading, refetch: refetchSocial } = useQuery({
    queryKey: ["/api/trending/all"],
    staleTime: 5 * 60 * 1000, // 5 minutes - more frequent for social
    queryFn: async () => {
      const response = await fetch('/api/trending/all', {
        credentials: 'include'
      });
      
      if (!response.ok) throw new Error('Failed to fetch social intelligence');
      return response.json();
    },
  });

  const geoOptions = [
    { value: 'US', label: '🇺🇸 United States', flag: '🇺🇸' },
    { value: 'GB', label: '🇬🇧 United Kingdom', flag: '🇬🇧' },
    { value: 'CA', label: '🇨🇦 Canada', flag: '🇨🇦' },
    { value: 'DE', label: '🇩🇪 Germany', flag: '🇩🇪' },
    { value: 'FR', label: '🇫🇷 France', flag: '🇫🇷' },
    { value: 'JP', label: '🇯🇵 Japan', flag: '🇯🇵' },
    { value: 'IN', label: '🇮🇳 India', flag: '🇮🇳' },
    { value: 'BR', label: '🇧🇷 Brazil', flag: '🇧🇷' }
  ];

  const timeframeOptions = [
    { value: 'now 1-H', label: 'Past Hour' },
    { value: 'now 4-H', label: 'Past 4 Hours' },
    { value: 'now 1-d', label: 'Past Day' },
    { value: 'now 7-d', label: 'Past Week' },
    { value: 'now 1-M', label: 'Past Month' }
  ];

  const categoryOptions = [
    { value: '0', label: 'All Categories' },
    { value: '12', label: 'Business & Industrial' },
    { value: '174', label: 'Technology' },
    { value: '45', label: 'Health' },
    { value: '3', label: 'Entertainment' },
    { value: '107', label: 'Marketing & Advertising' }
  ];

  const handleRefreshAll = async () => {
    setIsRefreshing(true);
    try {
      await Promise.all([refetchGoogle(), refetchSocial()]);
    } finally {
      setIsRefreshing(false);
    }
  };

  const getAttentionValueColor = (value: string) => {
    switch (value) {
      case 'underpriced': return 'bg-green-100 text-green-800';
      case 'overpriced': return 'bg-red-100 text-red-800';
      default: return 'bg-yellow-100 text-yellow-800';
    }
  };

  const getCompetitorGapColor = (gap: string) => {
    switch (gap) {
      case 'high': return 'bg-blue-100 text-blue-800';
      case 'medium': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Enhanced Controls Header */}
      <div className="bg-white rounded-lg border p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Brain className="h-6 w-6 text-blue-600" />
              Strategic Intelligence Dashboard
            </h2>
            <p className="text-gray-600 mt-1">Real-time trend analysis with geographic and platform intelligence</p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Geographic Filter */}
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-gray-500" />
              <Select value={selectedGeo} onValueChange={setSelectedGeo}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {geoOptions.map(geo => (
                    <SelectItem key={geo.value} value={geo.value}>
                      {geo.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Timeframe Filter */}
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-gray-500" />
              <Select value={selectedTimeframe} onValueChange={setSelectedTimeframe}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {timeframeOptions.map(time => (
                    <SelectItem key={time.value} value={time.value}>
                      {time.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Refresh Button */}
            <Button 
              onClick={handleRefreshAll}
              disabled={isRefreshing}
              variant="outline"
              className="flex items-center gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>
      </div>

      {/* Intelligence Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="google-trends" className="flex items-center gap-2">
            <Globe2 className="h-4 w-4" />
            Google Trends
          </TabsTrigger>
          <TabsTrigger value="social-intel" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Social Intelligence
          </TabsTrigger>
          <TabsTrigger value="cultural-moments" className="flex items-center gap-2">
            <Sparkles className="h-4 w-4" />
            Cultural Moments
          </TabsTrigger>
          <TabsTrigger value="opportunity-radar" className="flex items-center gap-2">
            <Target className="h-4 w-4" />
            Opportunity Radar
          </TabsTrigger>
        </TabsList>

        {/* Google Trends Intelligence */}
        <TabsContent value="google-trends" className="space-y-4">
          {googleLoading ? (
            <AnimatedLoadingState 
              title="Fetching Google Trends"
              subtitle={`Analyzing trends in ${geoOptions.find(g => g.value === selectedGeo)?.label} via Browser API`}
            />
          ) : (
            <div className="grid gap-4">
              {/* Trends Stats */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5 text-green-500" />
                      <div>
                        <p className="text-sm text-gray-600">Total Trends</p>
                        <p className="text-xl font-bold">{googleTrends?.count || 0}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2">
                      <Globe2 className="h-5 w-5 text-blue-500" />
                      <div>
                        <p className="text-sm text-gray-600">Geographic Market</p>
                        <p className="text-xl font-bold">{selectedGeo}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2">
                      <Clock className="h-5 w-5 text-purple-500" />
                      <div>
                        <p className="text-sm text-gray-600">Timeframe</p>
                        <p className="text-sm font-bold">{timeframeOptions.find(t => t.value === selectedTimeframe)?.label}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2">
                      <Eye className="h-5 w-5 text-orange-500" />
                      <div>
                        <p className="text-sm text-gray-600">Method</p>
                        <p className="text-sm font-bold">Browser API</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Trending Keywords */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Live Trending Keywords
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-3">
                    {googleTrends?.trends?.slice(0, 10).map((trend: any, index: number) => (
                      <div key={index} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                        <div className="flex-1">
                          <h4 className="font-medium">{trend.keyword || trend.query}</h4>
                          <p className="text-sm text-gray-600">
                            Category: {trend.category || 'General'} • 
                            Source: {trend.source || 'Google Trends'}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            #{index + 1}
                          </Badge>
                          <Button size="sm" variant="outline">
                            Analyze
                          </Button>
                        </div>
                      </div>
                    )) || (
                      <p className="text-center text-gray-500 py-8">
                        No trending data available for {selectedGeo}
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        {/* Social Intelligence */}
        <TabsContent value="social-intel" className="space-y-4">
          {socialLoading ? (
            <AnimatedLoadingState 
              title="Gathering Social Intelligence"
              subtitle="Analyzing real-time engagement across 13+ platforms"
            />
          ) : (
            <div className="grid gap-4">
              {/* Platform Overview */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {Object.entries(socialIntel?.platforms || {}).map(([platform, data]: [string, any]) => (
                  <Card key={platform}>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2">
                        <Activity className="h-4 w-4 text-blue-500" />
                        <div>
                          <p className="text-sm font-medium capitalize">{platform}</p>
                          <p className="text-xs text-gray-600">{data?.data?.length || 0} signals</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Real-time Social Signals */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="h-5 w-5" />
                    Real-time Social Signals
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {Object.entries(socialIntel?.platforms || {}).slice(0, 6).map(([platform, platformData]: [string, any]) => 
                      platformData?.data?.slice(0, 2).map((item: any, index: number) => (
                        <div key={`${platform}-${index}`} className="border rounded-lg p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <Badge variant="outline" className="text-xs">
                                  {platform.toUpperCase()}
                                </Badge>
                                <Badge className="text-xs bg-green-100 text-green-800">
                                  Live
                                </Badge>
                              </div>
                              <h4 className="font-medium mb-1">{item.title || `${platform} Content`}</h4>
                              <p className="text-sm text-gray-600 line-clamp-2">
                                {item.content?.substring(0, 120)}...
                              </p>
                            </div>
                            <div className="flex flex-col items-end gap-2">
                              <Badge variant="secondary" className="text-xs">
                                {item.engagement || 0} eng.
                              </Badge>
                              <Button size="sm" variant="outline">
                                Deep Analyze
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        {/* Cultural Moments Tab */}
        <TabsContent value="cultural-moments" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5" />
                Emerging Cultural Moments
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-center text-gray-500 py-8">
                Cultural moment detection coming soon...
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Opportunity Radar Tab */}
        <TabsContent value="opportunity-radar" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Strategic Opportunity Radar
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-center text-gray-500 py-8">
                Opportunity detection system coming soon...
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}