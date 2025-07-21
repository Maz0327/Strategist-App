import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Zap, 
  Clock, 
  TrendingUp, 
  MessageCircle, 
  Send, 
  Lightbulb,
  AlertCircle,
  Target,
  Users
} from "lucide-react";

interface ReactiveOpportunity {
  id: string;
  trigger: string;
  platform: string;
  urgency: 'critical' | 'high' | 'medium';
  timeWindow: number; // hours
  engagement: number;
  audienceSize: number;
  competitorResponse: 'none' | 'weak' | 'strong';
  culturalMoment: string;
  suggestedAngle: string;
  hashtagSuggestions: string[];
  toneRecommendation: 'humorous' | 'informative' | 'empathetic' | 'bold';
  bridgePotential: number; // 1-10 scale
}

interface ContentIdea {
  id: string;
  headline: string;
  description: string;
  platform: string;
  urgency: string;
  estimatedTime: string;
  requirements: string[];
}

export function ReactiveContentBuilder() {
  const [selectedOpportunity, setSelectedOpportunity] = useState<ReactiveOpportunity | null>(null);
  const [contentIdeas, setContentIdeas] = useState<ContentIdea[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [customPrompt, setCustomPrompt] = useState('');
  const [selectedTone, setSelectedTone] = useState<string>('');
  const [selectedPlatform, setSelectedPlatform] = useState<string>('');
  const [reactiveOpportunities, setReactiveOpportunities] = useState<ReactiveOpportunity[]>([]);

  // Fetch trending topics from API
  const { data: trendingData, isLoading } = useQuery({
    queryKey: ["/api/topics"],
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: false,
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

  // Convert trending topics to reactive opportunities
  const convertTopicsToOpportunities = (topics: any[]): ReactiveOpportunity[] => {
    return topics
      .filter(topic => topic.score >= 60) // Only high-scoring topics
      .slice(0, 8) // Limit to top 8 opportunities
      .map((topic, index) => {
        const urgency = topic.score >= 85 ? 'critical' : 
                       topic.score >= 70 ? 'high' : 'medium';
        const timeWindow = urgency === 'critical' ? 2 : 
                          urgency === 'high' ? 6 : 12;
        
        return {
          id: topic.id || `opportunity-${index}`,
          trigger: topic.title,
          platform: topic.platform,
          urgency: urgency as 'critical' | 'high' | 'medium',
          timeWindow,
          engagement: topic.engagement || Math.floor(Math.random() * 15) + 5,
          audienceSize: topic.engagement ? topic.engagement * 100 : Math.floor(Math.random() * 50000) + 10000,
          competitorResponse: Math.random() > 0.7 ? 'strong' : Math.random() > 0.4 ? 'weak' : 'none',
          culturalMoment: generateCulturalMoment(topic.category),
          suggestedAngle: generateSuggestedAngle(topic.category, topic.title),
          hashtagSuggestions: generateHashtags(topic.keywords, topic.category),
          toneRecommendation: generateToneRecommendation(topic.category),
          bridgePotential: Math.min(10, Math.max(1, Math.floor(topic.score / 10)))
        };
      });
  };

  // Generate cultural moment based on category
  const generateCulturalMoment = (category: string): string => {
    const moments = {
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
    return moments[category as keyof typeof moments] || 'Cultural shift in progress';
  };

  // Generate suggested angle based on category and title
  const generateSuggestedAngle = (category: string, title: string): string => {
    const angles = {
      'Technology': 'Position as innovation leader / early adopter advantage',
      'AI': 'Demonstrate AI-human collaboration benefits',
      'Entertainment': 'Connect with cultural moments authentically',
      'Business': 'Show stability and growth mindset',
      'Social': 'Foster community and belonging',
      'Health': 'Promote wellness and self-care',
      'Politics': 'Encourage thoughtful dialogue',
      'Sports': 'Celebrate achievements and teamwork',
      'Music': 'Tap into cultural expression',
      'News': 'Provide valuable context and insights'
    };
    return angles[category as keyof typeof angles] || 'Engage authentically with current conversation';
  };

  // Generate hashtags from keywords and category
  const generateHashtags = (keywords: string[], category: string): string[] => {
    const categoryTags = {
      'Technology': ['#TechTrends', '#Innovation', '#DigitalTransformation'],
      'AI': ['#AI', '#ArtificialIntelligence', '#FutureOfWork'],
      'Entertainment': ['#Entertainment', '#PopCulture', '#Trending'],
      'Business': ['#Business', '#Leadership', '#Growth'],
      'Social': ['#Community', '#Connection', '#SocialImpact'],
      'Health': ['#Wellness', '#HealthTech', '#SelfCare'],
      'Politics': ['#Politics', '#Democracy', '#CivicEngagement'],
      'Sports': ['#Sports', '#Athletics', '#TeamWork'],
      'Music': ['#Music', '#Artists', '#Culture'],
      'News': ['#News', '#CurrentEvents', '#Insights']
    };
    
    const baseTags = categoryTags[category as keyof typeof categoryTags] || ['#Trending', '#News'];
    const keywordTags = keywords.slice(0, 2).map(k => `#${k.replace(/\s+/g, '')}`);
    
    return [...baseTags, ...keywordTags].slice(0, 4);
  };

  // Generate tone recommendation based on category
  const generateToneRecommendation = (category: string): 'humorous' | 'informative' | 'empathetic' | 'bold' => {
    const tones = {
      'Technology': 'informative',
      'AI': 'informative',
      'Entertainment': 'humorous',
      'Business': 'bold',
      'Social': 'empathetic',
      'Health': 'empathetic',
      'Politics': 'informative',
      'Sports': 'bold',
      'Music': 'humorous',
      'News': 'informative'
    };
    return tones[category as keyof typeof tones] as any || 'informative';
  };

  // Process trending data when it loads
  useEffect(() => {
    if (trendingData?.topics) {
      const opportunities = convertTopicsToOpportunities(trendingData.topics);
      setReactiveOpportunities(opportunities);
    }
  }, [trendingData]);

  // Mock opportunities for fallback - remove these after real data is working
  const mockOpportunities: ReactiveOpportunity[] = [
    {
      id: '1',
      trigger: 'Major tech company announces layoffs',
      platform: 'LinkedIn',
      urgency: 'critical',
      timeWindow: 2,
      engagement: 8.7,
      audienceSize: 45000,
      competitorResponse: 'none',
      culturalMoment: 'Economic uncertainty anxiety',
      suggestedAngle: 'Position as stable employer / career pivot opportunity',
      hashtagSuggestions: ['#CareerAdvice', '#TechLayoffs', '#JobSecurity', '#CareerPivot'],
      toneRecommendation: 'empathetic',
      bridgePotential: 7
    },
    {
      id: '2',
      trigger: 'Viral TikTok dance trend emerging',
      platform: 'TikTok',
      urgency: 'high',
      timeWindow: 6,
      engagement: 12.3,
      audienceSize: 890000,
      competitorResponse: 'weak',
      culturalMoment: 'Dance culture participation',
      suggestedAngle: 'Brand personality through trend participation',
      hashtagSuggestions: ['#TrendingDance', '#BrandVibes', '#GenZ', '#Authentic'],
      toneRecommendation: 'humorous',
      bridgePotential: 9
    },
    {
      id: '3',
      trigger: 'Breaking news about climate change',
      platform: 'Twitter',
      urgency: 'medium',
      timeWindow: 12,
      engagement: 6.2,
      audienceSize: 23000,
      competitorResponse: 'strong',
      culturalMoment: 'Environmental responsibility pressure',
      suggestedAngle: 'Sustainability commitment transparency',
      hashtagSuggestions: ['#ClimateAction', '#Sustainability', '#GreenBusiness', '#Transparency'],
      toneRecommendation: 'informative',
      bridgePotential: 5
    }
  ];

  // Use real opportunities if available, otherwise fall back to mock data
  const currentOpportunities = reactiveOpportunities.length > 0 ? reactiveOpportunities : mockOpportunities;

  const generateContentIdeas = async (opportunity: ReactiveOpportunity) => {
    setIsGenerating(true);
    
    // Simulate API call to generate content ideas
    setTimeout(() => {
      const ideas: ContentIdea[] = [
        {
          id: '1',
          headline: 'Behind-the-scenes: How we support our team during uncertain times',
          description: 'Authentic employee testimonials showing company culture and support systems',
          platform: opportunity.platform,
          urgency: opportunity.urgency,
          estimatedTime: '2 hours',
          requirements: ['Employee interviews', 'B-roll footage', 'Company values integration']
        },
        {
          id: '2',
          headline: 'Career pivot guide: Turning uncertainty into opportunity',
          description: 'Educational content helping professionals navigate career transitions',
          platform: opportunity.platform,
          urgency: opportunity.urgency,
          estimatedTime: '1.5 hours',
          requirements: ['Industry research', 'Expert quotes', 'Actionable tips']
        },
        {
          id: '3',
          headline: 'The skills that matter most in 2025 (and how to get them)',
          description: 'Forward-looking content positioning brand as thought leader',
          platform: opportunity.platform,
          urgency: opportunity.urgency,
          estimatedTime: '3 hours',
          requirements: ['Market analysis', 'Trend research', 'Visual infographics']
        }
      ];
      
      setContentIdeas(ideas);
      setIsGenerating(false);
    }, 2000);
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getUrgencyIcon = (urgency: string) => {
    switch (urgency) {
      case 'critical': return <AlertCircle className="h-4 w-4" />;
      case 'high': return <Zap className="h-4 w-4" />;
      case 'medium': return <Clock className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Reactive Content Builder</h2>
          <p className="text-gray-600">
            Turn trending moments into strategic content - {currentOpportunities.length} live opportunities
          </p>
        </div>
        <Button variant="outline" className="flex items-center gap-2">
          <TrendingUp className="h-4 w-4" />
          Refresh Opportunities
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Reactive Opportunities */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                Live Opportunities
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {currentOpportunities.map((opportunity) => (
                <div
                  key={opportunity.id}
                  className={`p-3 rounded-lg border cursor-pointer transition-all ${
                    selectedOpportunity?.id === opportunity.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setSelectedOpportunity(opportunity)}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Badge className={getUrgencyColor(opportunity.urgency)}>
                        {getUrgencyIcon(opportunity.urgency)}
                        {opportunity.urgency}
                      </Badge>
                      <Badge variant="outline">{opportunity.platform}</Badge>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium">{opportunity.timeWindow}h</div>
                      <div className="text-xs text-gray-500">to act</div>
                    </div>
                  </div>
                  
                  <h4 className="font-medium text-sm mb-1">{opportunity.trigger}</h4>
                  <p className="text-xs text-gray-600 mb-2">{opportunity.culturalMoment}</p>
                  
                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                      <TrendingUp className="h-3 w-3" />
                      {opportunity.engagement}% engagement
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      {(opportunity.audienceSize / 1000).toFixed(0)}K reach
                    </span>
                  </div>
                  
                  <div className="mt-2">
                    <div className="text-xs text-gray-500 mb-1">Bridge Potential</div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-purple-600 h-2 rounded-full" 
                        style={{ width: `${opportunity.bridgePotential * 10}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Content Ideas Generator */}
        <div className="lg:col-span-2">
          {selectedOpportunity ? (
            <div className="space-y-4">
              {/* Opportunity Details */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5" />
                    Opportunity Analysis
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <h4 className="font-medium text-sm mb-1">Suggested Angle</h4>
                      <p className="text-sm text-gray-600">{selectedOpportunity.suggestedAngle}</p>
                    </div>
                    <div>
                      <h4 className="font-medium text-sm mb-1">Recommended Tone</h4>
                      <Badge variant="secondary">{selectedOpportunity.toneRecommendation}</Badge>
                    </div>
                  </div>
                  
                  <div className="mb-4">
                    <h4 className="font-medium text-sm mb-2">Suggested Hashtags</h4>
                    <div className="flex flex-wrap gap-1">
                      {selectedOpportunity.hashtagSuggestions.map((tag, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
                    <span>Competitor Response: <strong>{selectedOpportunity.competitorResponse}</strong></span>
                    <span>Bridge Potential: <strong>{selectedOpportunity.bridgePotential}/10</strong></span>
                  </div>
                  
                  <Button 
                    onClick={() => generateContentIdeas(selectedOpportunity)}
                    disabled={isGenerating}
                    className="w-full"
                  >
                    {isGenerating ? (
                      <>
                        <Lightbulb className="h-4 w-4 mr-2 animate-spin" />
                        Generating Ideas...
                      </>
                    ) : (
                      <>
                        <Lightbulb className="h-4 w-4 mr-2" />
                        Generate Content Ideas
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>

              {/* Generated Content Ideas */}
              {contentIdeas.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <MessageCircle className="h-5 w-5" />
                      Content Ideas
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {contentIdeas.map((idea) => (
                        <div key={idea.id} className="border rounded-lg p-4">
                          <div className="flex items-start justify-between mb-2">
                            <h4 className="font-medium">{idea.headline}</h4>
                            <Badge variant="outline">{idea.estimatedTime}</Badge>
                          </div>
                          <p className="text-sm text-gray-600 mb-3">{idea.description}</p>
                          
                          <div className="mb-3">
                            <h5 className="font-medium text-sm mb-1">Requirements:</h5>
                            <ul className="text-xs text-gray-600 space-y-1">
                              {idea.requirements.map((req, index) => (
                                <li key={index} className="flex items-center gap-1">
                                  <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
                                  {req}
                                </li>
                              ))}
                            </ul>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <Button size="sm" variant="outline">
                              Edit Brief
                            </Button>
                            <Button size="sm">
                              <Send className="h-3 w-3 mr-1" />
                              Quick Deploy
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          ) : (
            <Card>
              <CardContent className="flex items-center justify-center h-96">
                <div className="text-center">
                  <Zap className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Select an Opportunity</h3>
                  <p className="text-gray-500">Choose a reactive opportunity to generate content ideas</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}