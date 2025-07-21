import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  TrendingUp, 
  Zap, 
  AlertTriangle, 
  Clock, 
  Users, 
  Target,
  Brain,
  Lightbulb,
  ArrowRight,
  RefreshCw
} from "lucide-react";
import { AnimatedLoadingState } from "@/components/ui/animated-loading-state";

interface TrendingTopic {
  id: string;
  title: string;
  platform: string;
  category: string;
  description: string;
  url: string;
  engagement: number;
  score: number;
  keywords: string[];
  summary: string;
  timestamp: string;
}

interface Signal {
  id: string;
  title: string;
  platform: string;
  urgency: 'high' | 'medium' | 'low';
  category: string;
  culturalMoment: string;
  attentionScore: number;
  engagementRate: number;
  timeDecay: number;
  cohortOpportunity: string;
  bridgeWorthy: boolean;
  description: string;
  keywords: string[];
  relatedSignals: string[];
}

interface CulturalMoment {
  id: string;
  title: string;
  lifecycle: 'emerging' | 'peak' | 'declining';
  timeToAct: number;
  platforms: string[];
  attentionValue: 'underpriced' | 'fair' | 'overpriced';
  competitorGap: string;
  opportunity: string;
}

export function SignalMiningDashboard() {
  const [signals, setSignals] = useState<Signal[]>([]);
  const [culturalMoments, setCulturalMoments] = useState<CulturalMoment[]>([]);
  const [selectedPlatform, setSelectedPlatform] = useState<string>('all');
  const [selectedUrgency, setSelectedUrgency] = useState<string>('all');
  const [refreshing, setRefreshing] = useState(false);

  // Fetch trending topics from API - OPTIMIZED FOR SPEED
  const { data: trendingData, isLoading, refetch } = useQuery({
    queryKey: ["/api/topics", "mining"],
    staleTime: 15 * 60 * 1000, // 15 minutes - longer cache
    gcTime: 30 * 60 * 1000, // 30 minutes retention
    retry: 1, // Single retry only
    refetchOnWindowFocus: false,
    queryFn: async () => {
      try {
        const response = await fetch('/api/topics', {
          credentials: 'include'
        });
        if (!response.ok) {
          throw new Error("Failed to fetch trending topics");
        }
        return response.json();
      } catch (error) {
        console.warn('Failed to fetch trending topics:', error);
        return { topics: [] };
      }
    },
  });

  // Convert trending topics to signals with AI-powered categorization
  const convertTopicsToSignals = (topics: TrendingTopic[]): Signal[] => {
    return topics.map((topic, index) => {
      const urgency = calculateUrgency(topic);
      const culturalMoment = generateCulturalMoment(topic);
      const bridgeWorthy = calculateBridgeWorthiness(topic);
      
      return {
        id: topic.id || `signal-${index}`,
        title: topic.title,
        platform: topic.platform,
        urgency,
        category: topic.category || 'General',
        culturalMoment,
        attentionScore: Math.min(100, Math.max(1, topic.score)),
        engagementRate: topic.engagement || 0,
        timeDecay: calculateTimeDecay(topic),
        cohortOpportunity: generateCohortOpportunity(topic),
        bridgeWorthy,
        description: topic.description || topic.summary || 'No description available',
        keywords: topic.keywords || [],
        relatedSignals: []
      };
    });
  };

  // Calculate urgency based on engagement and score
  const calculateUrgency = (topic: TrendingTopic): 'high' | 'medium' | 'low' => {
    const score = topic.score || 0;
    const engagement = topic.engagement || 0;
    
    if (score >= 80 || engagement >= 10000) return 'high';
    if (score >= 60 || engagement >= 5000) return 'medium';
    return 'low';
  };

  // Generate cultural moment based on topic content
  const generateCulturalMoment = (topic: TrendingTopic): string => {
    const culturalMoments: Record<string, string> = {
      'Technology': 'Digital transformation acceleration',
      'AI': 'AI integration anxiety and opportunity',
      'Entertainment': 'Content consumption evolution',
      'Business': 'Economic uncertainty navigation',
      'Social': 'Community connection redefinition',
      'Health': 'Wellness culture transformation',
      'Politics': 'Social discourse polarization',
      'Sports': 'Athletic performance celebration',
      'Music': 'Cultural expression evolution',
      'News': 'Information consumption patterns'
    };
    
    return culturalMoments[topic.category] || 'Cultural shift in progress';
  };

  // Calculate bridge worthiness
  const calculateBridgeWorthiness = (topic: TrendingTopic): boolean => {
    const score = topic.score || 0;
    const engagement = topic.engagement || 0;
    const hasKeywords = topic.keywords && topic.keywords.length > 2;
    
    return score >= 75 && engagement >= 7500 && hasKeywords;
  };

  // Calculate time decay
  const calculateTimeDecay = (topic: TrendingTopic): number => {
    const urgency = calculateUrgency(topic);
    const hoursSincePost = topic.timestamp ? 
      Math.floor((Date.now() - new Date(topic.timestamp).getTime()) / (1000 * 60 * 60)) : 0;
    
    if (urgency === 'high') return Math.max(2, 12 - hoursSincePost);
    if (urgency === 'medium') return Math.max(6, 24 - hoursSincePost);
    return Math.max(12, 48 - hoursSincePost);
  };

  // Generate cohort opportunity
  const generateCohortOpportunity = (topic: TrendingTopic): string => {
    const cohortTemplates: Record<string, string> = {
      'Technology': 'Tech-savvy early adopters seeking innovation',
      'AI': 'Professionals navigating AI workplace integration',
      'Entertainment': 'Content creators exploring new formats',
      'Business': 'SMB owners adapting to market changes',
      'Social': 'Community builders fostering connection',
      'Health': 'Wellness enthusiasts optimizing lifestyle',
      'Politics': 'Civic-minded individuals seeking dialogue',
      'Sports': 'Sports fans celebrating achievements',
      'Music': 'Music lovers discovering new artists',
      'News': 'Information seekers staying informed'
    };
    
    return cohortTemplates[topic.category] || 'Engaged audiences seeking relevant content';
  };

  // Generate cultural moments from trending topics
  const generateCulturalMoments = (topics: TrendingTopic[]): CulturalMoment[] => {
    // Group topics by category to identify cultural patterns
    const categoryGroups = topics.reduce((acc, topic) => {
      const category = topic.category || 'General';
      if (!acc[category]) acc[category] = [];
      acc[category].push(topic);
      return acc;
    }, {} as Record<string, TrendingTopic[]>);

    return Object.entries(categoryGroups)
      .filter(([category, topics]) => topics.length >= 2) // Need multiple topics to form a cultural moment
      .map(([category, topics], index) => {
        const avgScore = topics.reduce((sum, t) => sum + (t.score || 0), 0) / topics.length;
        const platforms = Array.from(new Set(topics.map(t => t.platform)));
        
        return {
          id: `cultural-${index}`,
          title: `${category} Cultural Shift`,
          lifecycle: avgScore >= 80 ? 'peak' : avgScore >= 60 ? 'emerging' : 'declining',
          timeToAct: avgScore >= 80 ? 8 : avgScore >= 60 ? 24 : 48,
          platforms,
          attentionValue: avgScore >= 70 ? 'underpriced' : 'fair',
          competitorGap: `Limited ${category.toLowerCase()} content in market`,
          opportunity: `Create authentic ${category.toLowerCase()} content strategy`
        };
      });
  };

  // Process trending data when it loads
  useEffect(() => {
    if (trendingData?.topics) {
      const processedSignals = convertTopicsToSignals(trendingData.topics);
      const processedCulturalMoments = generateCulturalMoments(trendingData.topics);
      
      setSignals(processedSignals);
      setCulturalMoments(processedCulturalMoments);
    }
  }, [trendingData]);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await refetch();
    } catch (error) {
      console.warn('Failed to refresh signals:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getLifecycleColor = (lifecycle: string) => {
    switch (lifecycle) {
      case 'emerging': return 'bg-blue-100 text-blue-800';
      case 'peak': return 'bg-purple-100 text-purple-800';
      case 'declining': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredSignals = signals.filter(signal => {
    const platformMatch = selectedPlatform === 'all' || signal.platform === selectedPlatform;
    const urgencyMatch = selectedUrgency === 'all' || signal.urgency === selectedUrgency;
    return platformMatch && urgencyMatch;
  });

  if (isLoading) {
    return (
      <AnimatedLoadingState 
        title="Loading Signal Mining Dashboard"
        subtitle="Analyzing trending topics across 13+ platforms for strategic intelligence..."
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Signal Mining Dashboard</h2>
          <p className="text-gray-600">
            Real-time cultural intelligence from {trendingData?.topics?.length || 0} trending topics
          </p>
        </div>
        <Button 
          onClick={handleRefresh} 
          disabled={refreshing}
          className="flex items-center gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh Signals
        </Button>
      </div>

      <Tabs defaultValue="signals" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="signals">Active Signals</TabsTrigger>
          <TabsTrigger value="cultural">Cultural Moments</TabsTrigger>
          <TabsTrigger value="bridges">Bridge Opportunities</TabsTrigger>
        </TabsList>

        <TabsContent value="signals" className="space-y-4">
          <div className="flex gap-4 mb-4">
            <Select value={selectedPlatform} onValueChange={setSelectedPlatform}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by platform" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Platforms</SelectItem>
                {/* Core Social Media Platforms */}
                <SelectItem value="TikTok">TikTok</SelectItem>
                <SelectItem value="Twitter">Twitter</SelectItem>
                <SelectItem value="Instagram">Instagram</SelectItem>
                <SelectItem value="LinkedIn">LinkedIn</SelectItem>
                {/* Content Intelligence Platforms */}
                <SelectItem value="Medium">Medium</SelectItem>
                <SelectItem value="Substack">Substack</SelectItem>
                <SelectItem value="Product Hunt">Product Hunt</SelectItem>
                {/* Business Intelligence Platforms */}
                <SelectItem value="Glassdoor">Glassdoor</SelectItem>
                <SelectItem value="Trustpilot">Trustpilot</SelectItem>
                <SelectItem value="G2">G2</SelectItem>
                <SelectItem value="Capterra">Capterra</SelectItem>
                {/* Alternative Social Platforms */}
                <SelectItem value="SoundCloud">SoundCloud</SelectItem>
                <SelectItem value="Mastodon">Mastodon</SelectItem>
                <SelectItem value="Nextdoor">Nextdoor</SelectItem>
              </SelectContent>
            </Select>

            <Select value={selectedUrgency} onValueChange={setSelectedUrgency}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by urgency" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Urgency</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-4">
            {filteredSignals.map((signal) => (
              <Card key={signal.id} className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <CardTitle className="text-lg break-words leading-tight">{signal.title}</CardTitle>
                        {signal.bridgeWorthy && (
                          <Badge variant="secondary" className="bg-purple-100 text-purple-800 flex-shrink-0">
                            <Zap className="h-3 w-3 mr-1" />
                            Bridge-Worthy
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600 flex-wrap">
                        <Badge variant="outline">{signal.platform}</Badge>
                        <Badge className={getUrgencyColor(signal.urgency)}>
                          {signal.urgency.charAt(0).toUpperCase() + signal.urgency.slice(1)}
                        </Badge>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {signal.timeDecay}h to act
                        </span>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="text-2xl font-bold text-blue-600">{signal.attentionScore}</div>
                      <div className="text-xs text-gray-500">Attention Score</div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-gray-700 break-words leading-relaxed">{signal.description}</p>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="min-w-0">
                      <h4 className="font-medium text-sm mb-1">Cultural Moment</h4>
                      <p className="text-xs text-gray-600 break-words">{signal.culturalMoment}</p>
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-medium text-sm mb-1">Cohort Opportunity</h4>
                      <p className="text-xs text-gray-600 break-words">{signal.cohortOpportunity}</p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-1 mt-2">
                    {signal.keywords.map((keyword, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {keyword}
                      </Badge>
                    ))}
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <TrendingUp className="h-3 w-3" />
                        {signal.engagementRate}% engagement
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {signal.category}
                      </span>
                    </div>
                    <Button size="sm" variant="outline">
                      <ArrowRight className="h-3 w-3 mr-1" />
                      Create Brief
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="cultural" className="space-y-4">
          <div className="grid gap-4">
            {culturalMoments.map((moment) => (
              <Card key={moment.id} className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg mb-2">{moment.title}</CardTitle>
                      <div className="flex items-center gap-2 text-sm">
                        <Badge className={getLifecycleColor(moment.lifecycle)}>
                          {moment.lifecycle.charAt(0).toUpperCase() + moment.lifecycle.slice(1)}
                        </Badge>
                        <Badge variant="outline" className="bg-green-50 text-green-700">
                          {moment.attentionValue} attention
                        </Badge>
                        <span className="flex items-center gap-1 text-gray-600">
                          <AlertTriangle className="h-3 w-3" />
                          {moment.timeToAct}h to act
                        </span>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-medium text-sm mb-1 flex items-center gap-1">
                        <Target className="h-3 w-3" />
                        Competitor Gap
                      </h4>
                      <p className="text-xs text-gray-600">{moment.competitorGap}</p>
                    </div>
                    <div>
                      <h4 className="font-medium text-sm mb-1 flex items-center gap-1">
                        <Lightbulb className="h-3 w-3" />
                        Opportunity
                      </h4>
                      <p className="text-xs text-gray-600">{moment.opportunity}</p>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium text-sm mb-1">Active Platforms</h4>
                    <div className="flex flex-wrap gap-1">
                      {moment.platforms.map((platform, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {platform}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <div className="flex items-center gap-2">
                      <Button size="sm" variant="outline">
                        <Brain className="h-3 w-3 mr-1" />
                        Analyze
                      </Button>
                      <Button size="sm" variant="outline">
                        <Users className="h-3 w-3 mr-1" />
                        Build Cohort
                      </Button>
                    </div>
                    <Button size="sm">
                      <ArrowRight className="h-3 w-3 mr-1" />
                      Create Strategy
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="bridges" className="space-y-4">
          <div className="grid gap-4">
            {signals.filter(s => s.bridgeWorthy).map((signal) => (
              <Card key={signal.id} className="border-purple-200 hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg flex items-center gap-2">
                        {signal.title}
                        <Badge className="bg-purple-100 text-purple-800">
                          <Zap className="h-3 w-3 mr-1" />
                          Bridge-Worthy
                        </Badge>
                      </CardTitle>
                      <p className="text-sm text-gray-600 mt-1">{signal.description}</p>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-purple-600">{signal.attentionScore}</div>
                      <div className="text-xs text-gray-500">Viral Potential</div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="bg-purple-50 p-3 rounded-lg">
                    <h4 className="font-medium text-sm mb-1">Amplification Recommendation</h4>
                    <p className="text-xs text-gray-700">
                      This signal shows high engagement and cultural relevance. Consider developing 
                      higher-production content based on this concept for cross-platform scaling.
                    </p>
                  </div>
                  
                  <div className="flex items-center justify-between pt-2">
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span>{signal.engagementRate}% engagement</span>
                      <span>{signal.timeDecay}h urgency</span>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline">
                        Scale Strategy
                      </Button>
                      <Button size="sm">
                        Create Bridge
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}