import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { 
  Eye, 
  Target, 
  TrendingUp, 
  Users, 
  Lightbulb, 
  Zap, 
  Globe, 
  CheckCircle,
  AlertCircle,
  Brain,
  Save,
  Info,
  Flag
} from "lucide-react";

interface EnhancedAnalysisResultsProps {
  analysis: {
    analysis: {
      summary: string;
      sentiment: string;
      tone: string;
      keywords: string[];
      confidence: string;
      truthAnalysis: {
        fact: string;
        observation: string;
        insight: string;
        humanTruth: string;
        culturalMoment: string;
        attentionValue: 'high' | 'medium' | 'low';
        platform: string;
        cohortOpportunities: string[];
      };
      cohortSuggestions: string[];
      platformContext: string;
      viralPotential: 'high' | 'medium' | 'low';
      competitiveInsights: string[];
      strategicInsights: string[];
      strategicActions: string[];
    };
    signalId: number;
  };
  originalContent?: {
    content: string;
    title?: string;
    url?: string;
  };
}

export function EnhancedAnalysisResults({ analysis, originalContent }: EnhancedAnalysisResultsProps) {
  const { analysis: data } = analysis;
  const { toast } = useToast();

  // Early return if no data
  if (!data) {
    return (
      <div className="space-y-4">
        <p className="text-center text-gray-500">No analysis data available</p>
      </div>
    );
  }
  const [lengthPreference, setLengthPreference] = useState<'short' | 'medium' | 'long' | 'bulletpoints'>('medium');
  const [isFlagging, setIsFlagging] = useState(false);
  const [isReanalyzing, setIsReanalyzing] = useState(false);
  const [currentAnalysis, setCurrentAnalysis] = useState(data);
  const [analysisCache, setAnalysisCache] = useState<Record<string, any>>({
    medium: data // Cache the initial analysis with medium length
  });

  const handleLengthPreferenceChange = async (newLength: 'short' | 'medium' | 'long' | 'bulletpoints') => {
    setLengthPreference(newLength);
    
    // Check if we already have this analysis cached
    if (analysisCache[newLength]) {
      setCurrentAnalysis(analysisCache[newLength]);
      toast({
        title: "Length Switched",
        description: `Showing ${newLength} analysis from cache.`,
      });
      return;
    }
    
    // If not cached and we have original content, re-analyze
    if (originalContent) {
      setIsReanalyzing(true);
      try {
        const response = await apiRequest("POST", "/api/reanalyze", {
          content: originalContent.content,
          title: originalContent.title,
          url: originalContent.url,
          lengthPreference: newLength
        });
        
        if (!response.ok) {
          throw new Error("Failed to re-analyze content");
        }
        
        const result = await response.json();
        const newAnalysis = result.analysis;
        
        // Cache the new analysis
        setAnalysisCache(prev => ({
          ...prev,
          [newLength]: newAnalysis
        }));
        
        setCurrentAnalysis(newAnalysis);
        
        toast({
          title: "Analysis Updated",
          description: `Generated new ${newLength} analysis.`,
        });
      } catch (error: any) {
        toast({
          title: "Error",
          description: error.message || "Failed to re-analyze content",
          variant: "destructive",
        });
      } finally {
        setIsReanalyzing(false);
      }
    } else {
      // No original content, just update preference
      toast({
        title: "Length Preference Updated",
        description: `Truth analysis will use ${newLength} format for future analyses.`,
      });
    }
  };

  const handleFlagAsPotentialSignal = async () => {
    setIsFlagging(true);
    try {
      const response = await fetch(`/api/signals/${analysis.signalId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          status: 'potential_signal',
          promotionReason: 'User flagged as worth further research',
          userNotes: 'Flagged from analysis results - contains strategic value'
        })
      });

      if (response.ok) {
        toast({
          title: "Flagged as Potential Signal",
          description: "This content has been flagged for further research and moved to your potential signals.",
        });
      } else {
        throw new Error('Failed to flag signal');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to flag as potential signal. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsFlagging(false);
    }
  };

  const getAttentionColor = (value: 'high' | 'medium' | 'low') => {
    switch (value) {
      case 'high':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getViralColor = (value: 'high' | 'medium' | 'low') => {
    switch (value) {
      case 'high':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'medium':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'low':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment?.toLowerCase()) {
      case 'positive':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'negative':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Quick Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            Analysis Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <h4 className="text-lg font-bold text-gray-900">Sentiment</h4>
                <Button variant="ghost" size="sm" className="p-0 h-auto">
                  <Info size={14} className="text-gray-400" />
                </Button>
              </div>
              <Badge className={getSentimentColor(data.sentiment)} variant="secondary">
                {data.sentiment}
              </Badge>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <h4 className="text-lg font-bold text-gray-900">Attention Value</h4>
                <Button variant="ghost" size="sm" className="p-0 h-auto">
                  <Info size={14} className="text-gray-400" />
                </Button>
              </div>
              <Badge className={getAttentionColor(data.truthAnalysis.attentionValue)} variant="secondary">
                {data.truthAnalysis.attentionValue}
              </Badge>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <h4 className="text-lg font-bold text-gray-900">Viral Potential</h4>
                <Button variant="ghost" size="sm" className="p-0 h-auto">
                  <Info size={14} className="text-gray-400" />
                </Button>
              </div>
              <Badge className={getViralColor(data.viralPotential)} variant="secondary">
                {data.viralPotential}
              </Badge>
            </div>
          </div>
          <Separator className="my-4" />
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-700 flex-1">{data.summary}</p>
            <div className="flex items-center gap-2 ml-4">
              <Button 
                size="sm" 
                variant="outline" 
                className="flex items-center gap-2"
                onClick={() => toast({
                  title: "Analysis Saved",
                  description: "This analysis has been saved to your dashboard as a capture.",
                })}
              >
                <Save size={14} />
                Save Analysis
              </Button>
              <Button 
                size="sm" 
                className="bg-blue-600 hover:bg-blue-700 flex items-center gap-2"
                onClick={handleFlagAsPotentialSignal}
                disabled={isFlagging}
              >
                {isFlagging ? (
                  <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                ) : (
                  <Target size={14} />
                )}
                Flag as Worth Researching
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Detailed Analysis Tabs */}
      <Tabs defaultValue="truth" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="truth">Truth Analysis</TabsTrigger>
          <TabsTrigger value="cohorts">Cohorts</TabsTrigger>
          <TabsTrigger value="insights">Insights</TabsTrigger>
          <TabsTrigger value="actions">Actions</TabsTrigger>
        </TabsList>

        <TabsContent value="truth" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Eye className="h-5 w-5" />
                  Truth Framework Analysis
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Label htmlFor="length-preference" className="text-sm">Length:</Label>
                  <Select value={lengthPreference} onValueChange={(value: any) => handleLengthPreferenceChange(value)} disabled={isReanalyzing}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="short">Short</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="long">Long</SelectItem>
                      <SelectItem value="bulletpoints">Bulletpoints</SelectItem>
                    </SelectContent>
                  </Select>
                  {isReanalyzing && (
                    <div className="flex items-center gap-1 text-xs text-gray-600">
                      <LoadingSpinner size="sm" />
                      <span>Re-analyzing...</span>
                    </div>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Fact */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="h-4 w-4 text-blue-600" />
                  <h4 className="font-semibold text-blue-900">Fact</h4>
                </div>
                <p className="text-sm text-gray-700 bg-blue-50 p-3 rounded">
                  {currentAnalysis.truthAnalysis.fact}
                </p>
              </div>

              {/* Observation */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Target className="h-4 w-4 text-green-600" />
                  <h4 className="font-semibold text-green-900">Observation</h4>
                </div>
                <p className="text-sm text-gray-700 bg-green-50 p-3 rounded">
                  {currentAnalysis.truthAnalysis.observation}
                </p>
              </div>

              {/* Insight */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Lightbulb className="h-4 w-4 text-yellow-600" />
                  <h4 className="font-semibold text-yellow-900">Insight</h4>
                </div>
                <p className="text-sm text-gray-700 bg-yellow-50 p-3 rounded">
                  {currentAnalysis.truthAnalysis.insight}
                </p>
              </div>

              {/* Human Truth */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Brain className="h-4 w-4 text-purple-600" />
                  <h4 className="font-semibold text-purple-900">Human Truth</h4>
                </div>
                <p className="text-sm text-gray-700 bg-purple-50 p-3 rounded">
                  {currentAnalysis.truthAnalysis.humanTruth}
                </p>
              </div>

              {/* Cultural Moment */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="h-4 w-4 text-red-600" />
                  <h4 className="font-semibold text-red-900">Cultural Moment</h4>
                </div>
                <p className="text-sm text-gray-700 bg-red-50 p-3 rounded">
                  {currentAnalysis.truthAnalysis.culturalMoment}
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="cohorts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Cohort Opportunities
              </CardTitle>
              <p className="text-sm text-gray-600">
                Specific behavioral audiences who would resonate with this content
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {data.cohortSuggestions.map((cohort, index) => (
                  <div key={index} className="p-3 bg-blue-50 rounded border border-blue-200">
                    <h4 className="font-medium text-blue-900">{cohort}</h4>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                Platform Context
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-gray-50 p-4 rounded">
                <p className="text-sm text-gray-700">{data.platformContext}</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="insights" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lightbulb className="h-5 w-5" />
                Strategic Insights
              </CardTitle>
              <p className="text-sm text-gray-600">
                Why there are business opportunities here
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {data.strategicInsights?.map((insight, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-xs font-bold text-blue-600">{index + 1}</span>
                    </div>
                    <p className="text-sm text-gray-700">{insight}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Strategic Actions
              </CardTitle>
              <p className="text-sm text-gray-600">
                What specific actions brands should take based on these insights
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {data.strategicActions?.map((action, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                    <p className="text-sm text-gray-700">{action}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                Competitive Intelligence
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {data.competitiveInsights.map((insight, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <AlertCircle className="h-4 w-4 text-orange-600 mt-0.5" />
                    <p className="text-sm text-gray-700">{insight}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Keywords & Tone Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Strategic Keywords</h4>
                  <div className="flex flex-wrap gap-2">
                    {data.keywords.map((keyword, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {keyword}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Tone & Confidence</h4>
                  <div className="flex gap-2">
                    <Badge variant="outline">{data.tone}</Badge>
                    <Badge variant="outline">{data.confidence}</Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="actions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Next Actions
              </CardTitle>
              <p className="text-sm text-gray-600">
                Strategic recommendations based on this analysis
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {data.strategicActions?.map((action, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-medium">
                      {index + 1}
                    </div>
                    <p className="text-sm text-gray-700">{action}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}