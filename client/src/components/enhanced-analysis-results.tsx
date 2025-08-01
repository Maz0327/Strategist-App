import { useState, useEffect, lazy, Suspense } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { useToast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";
import { apiRequest } from "@/lib/queryClient";
import ErrorBoundary from "./ErrorBoundary";
import LazyCompetitiveInsights from "./LazyCompetitiveInsights";
import LazyCohortBuilder from "./LazyCohortBuilder";
import LazyStrategicInsights from "./LazyStrategicInsights";
import LazyStrategicActions from "./LazyStrategicActions";

// Lazy load Strategic Recommendations component
const LazyStrategicRecommendations = lazy(() => import('./LazyStrategicRecommendations'));
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
  Flag,
  Hash,
  Palette,
  Sparkles
} from "lucide-react";

// Enhanced Loading Component with animated progress bar
const AnimatedLoadingState = ({ title, subtitle, progress = 0 }: { title: string; subtitle: string; progress?: number }) => {
  const [animatedProgress, setAnimatedProgress] = useState(0);
  
  useEffect(() => {
    const interval = setInterval(() => {
      setAnimatedProgress(prev => {
        if (prev >= 95) return 10; // Reset to keep it moving
        return prev + Math.random() * 15; // Add some randomness
      });
    }, 500);
    
    return () => clearInterval(interval);
  }, []);
  
  return (
    <div className="text-center py-8">
      <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-50 rounded-full mb-4">
        <LoadingSpinner size="lg" />
      </div>
      <h3 className="text-lg font-medium text-gray-900 mb-2">{title}</h3>
      <p className="text-sm text-gray-600 mb-4">{subtitle}</p>
      <div className="w-full max-w-xs mx-auto">
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-blue-600 h-2 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${Math.min(animatedProgress, 100)}%` }}
          ></div>
        </div>
        <p className="text-xs text-gray-500 mt-2">Analyzing content...</p>
      </div>
    </div>
  );
};

interface EnhancedAnalysisResultsProps {
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
    signalId?: number;
  };
  originalContent?: {
    content: string;
    title?: string;
    url?: string;
  };
  currentLengthPreference?: 'short' | 'medium' | 'long' | 'bulletpoints';
  onLengthPreferenceChange?: (newPreference: 'short' | 'medium' | 'long' | 'bulletpoints') => void;
  isReanalyzing?: boolean;
}

export function EnhancedAnalysisResults({ 
  analysis, 
  originalContent, 
  currentLengthPreference = 'medium',
  onLengthPreferenceChange,
  isReanalyzing = false
}: EnhancedAnalysisResultsProps) {
  // Analysis data is passed directly from API response
  const data = analysis;
  const { toast } = useToast();
  const isMobile = useIsMobile();

  // ALL HOOKS MUST BE CALLED BEFORE ANY CONDITIONAL RETURNS
  const [lengthPreference, setLengthPreference] = useState<'short' | 'medium' | 'long' | 'bulletpoints'>(currentLengthPreference);
  const [isFlagging, setIsFlagging] = useState(false);
  const [currentAnalysis, setCurrentAnalysis] = useState(data);
  const [analysisCache, setAnalysisCache] = useState<Record<string, any>>({
    [currentLengthPreference]: data // Cache the initial analysis with current length
  });
  const [showDeepAnalysisDialog, setShowDeepAnalysisDialog] = useState(false);
  const [dontAskAgain, setDontAskAgain] = useState(false);
  
  // Tab-level component state
  const [cohortResults, setCohortResults] = useState<any[]>([]);
  const [insightsResults, setInsightsResults] = useState<any[]>([]);
  const [actionsResults, setActionsResults] = useState<any[]>([]);
  const [competitiveResults, setCompetitiveResults] = useState<any[]>([]);
  const [loadingStates, setLoadingStates] = useState({
    cohorts: false,
    insights: false,
    actions: false,
    competitive: false,
    advancedInsights: false,
    advancedCompetitive: false,
    advancedActions: false,
    visualAnalysis: false
  });

  // Visual Intelligence state
  const [extractedImages, setExtractedImages] = useState<any[]>([]);
  const [visualAnalysisResults, setVisualAnalysisResults] = useState<any>(null);

  // Advanced Analysis Results state
  const [advancedInsightsResults, setAdvancedInsightsResults] = useState<any[]>([]);
  const [advancedCompetitiveResults, setAdvancedCompetitiveResults] = useState<any[]>([]);
  const [advancedActionsResults, setAdvancedActionsResults] = useState<any[]>([]);
  const [insightViewMode, setInsightViewMode] = useState<'insights' | 'aia'>('insights');
  const [showAdvancedInsightsButton, setShowAdvancedInsightsButton] = useState(false);
  const [enhancedKeywords, setEnhancedKeywords] = useState<string[]>([]);

  // Update analysis when new data arrives
  useEffect(() => {
    setCurrentAnalysis(data);
    // Check if visual assets are available in the analysis data - using images field
    if (data.images && data.images.length > 0) {
      // Convert image URLs to proper image objects for display
      const imageObjects = data.images.map((url: string, index: number) => ({
        url,
        alt: `Image ${index + 1}`
      }));
      setExtractedImages(imageObjects);
    } else if (data.visualAssets && data.visualAssets.length > 0) {
      // Fallback to visualAssets if images array is not available
      setExtractedImages(data.visualAssets);
    }
    // Visual analysis will be done on-demand in the Visual tab
  }, [data]);

  // Sync length preference with parent component
  useEffect(() => {
    setLengthPreference(currentLengthPreference);
  }, [currentLengthPreference]);

  // Debug logging for analysis data
  console.log("EnhancedAnalysisResults received analysis:", analysis);
  console.log("Analysis data:", data);
  console.log("Extracted images state:", extractedImages);
  console.log("Data images field:", data.images);
  console.log("Data visualAssets field:", data.visualAssets);

  // Tab-level button handlers
  const handleBuildCohorts = async () => {
    if (!currentAnalysis.truthAnalysis) {
      toast({
        title: "Error",
        description: "Truth analysis required to build cohorts",
        variant: "destructive"
      });
      return;
    }

    setLoadingStates(prev => ({ ...prev, cohorts: true }));
    
    try {
      const response = await apiRequest(
        'POST',
        '/api/cohorts',
        {
          content: originalContent?.content || data.summary || '',
          title: originalContent?.title || 'Content Analysis',
          truthAnalysis: currentAnalysis.truthAnalysis
        }
      );
      
      const responseData = await response.json();
      console.log('Cohort API response:', responseData);
      console.log('Cohort results:', responseData.cohorts);
      setCohortResults(responseData.cohorts || []);
      toast({
        title: "Success",
        description: "Cohort analysis completed",
        duration: 2000
      });
    } catch (error: any) {
      console.error('Cohort building failed:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to build cohorts. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoadingStates(prev => ({ ...prev, cohorts: false }));
    }
  };

  const handleBuildInsights = async () => {
    if (!currentAnalysis.truthAnalysis) {
      toast({
        title: "Error", 
        description: "Truth analysis required to build insights",
        variant: "destructive"
      });
      return;
    }

    setLoadingStates(prev => ({ ...prev, insights: true }));
    
    try {
      const response = await apiRequest(
        'POST',
        '/api/strategic-insights',
        {
          content: originalContent?.content || data.summary || '',
          title: originalContent?.title || 'Content Analysis',
          truthAnalysis: currentAnalysis.truthAnalysis
        }
      );
      
      const responseData = await response.json();
      console.log('Insights API response:', responseData);
      setInsightsResults(responseData.insights || []);
      toast({
        title: "Success",
        description: "Strategic insights completed",
        duration: 2000
      });
    } catch (error: any) {
      console.error('Strategic insights failed:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to build strategic insights. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoadingStates(prev => ({ ...prev, insights: false }));
    }
  };

  const handleBuildAllInsights = async () => {
    if (!currentAnalysis.truthAnalysis) {
      toast({
        title: "Error",
        description: "Truth analysis required to build insights",
        variant: "destructive"
      });
      return;
    }

    setLoadingStates(prev => ({ ...prev, insights: true, competitive: true, actions: true }));
    
    try {
      // Run strategic insights, competitive intelligence, and strategic actions in parallel
      const [strategicResponse, competitiveResponse, actionsResponse] = await Promise.all([
        apiRequest(
          'POST',
          '/api/strategic-insights',
          {
            content: originalContent?.content || data.summary || '',
            title: originalContent?.title || 'Content Analysis',
            truthAnalysis: currentAnalysis.truthAnalysis
          }
        ),
        apiRequest(
          'POST',
          '/api/competitive-intelligence',
          {
            content: originalContent?.content || data.summary || '',
            title: originalContent?.title || 'Content Analysis',
            truthAnalysis: currentAnalysis.truthAnalysis
          }
        ),
        apiRequest(
          'POST',
          '/api/strategic-actions',
          {
            content: originalContent?.content || data.summary || '',
            title: originalContent?.title || 'Content Analysis',
            truthAnalysis: currentAnalysis.truthAnalysis
          }
        )
      ]);
      
      const strategicData = await strategicResponse.json();
      const competitiveData = await competitiveResponse.json();
      const actionsData = await actionsResponse.json();
      
      console.log('Strategic Data:', strategicData);
      console.log('Competitive Data:', competitiveData);
      console.log('Actions Data:', actionsData);
      
      // Force state updates with validation
      const newInsights = strategicData.insights || [];
      const newCompetitive = competitiveData.insights || [];
      const newActions = actionsData.actions || [];
      
      console.log('Setting insights:', newInsights.length);
      console.log('Setting competitive:', newCompetitive.length);
      console.log('Setting actions:', newActions.length);
      
      setInsightsResults(newInsights);
      setCompetitiveResults(newCompetitive);
      setActionsResults(newActions);
      
      // Show advanced insights button after initial insights are generated
      if (newInsights.length > 0) {
        setShowAdvancedInsightsButton(true);
      }
      
      // Force re-render with immediate logging
      setTimeout(() => {
        console.log('Current state after update:');
        console.log('insightsResults length:', newInsights.length);
        console.log('competitiveResults length:', newCompetitive.length);
        console.log('actionsResults length:', newActions.length);
      }, 100);
      
      toast({
        title: "Success",
        description: "All strategic insights, competitive intelligence, and strategic actions completed",
      });
    } catch (error: any) {
      console.error('All insights failed:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to build all insights. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoadingStates(prev => ({ ...prev, insights: false, competitive: false, actions: false }));
    }
  };

  const handleAdvancedInsights = async () => {
    if (!insightsResults.length) {
      toast({
        title: "Error",
        description: "Initial strategic insights required for advanced analysis",
        variant: "destructive"
      });
      return;
    }

    setLoadingStates(prev => ({ ...prev, advancedInsights: true }));
    
    try {
      const response = await apiRequest('POST', '/api/advanced-strategic-insights', {
        content: originalContent?.content || data.content || '',
        title: originalContent?.title || data.title || '',
        truthAnalysis: currentAnalysis.truthAnalysis,
        initialInsights: insightsResults,
        strategicActions: actionsResults,
        competitiveIntelligence: competitiveResults
      });

      const advancedData = await response.json();
      setAdvancedInsightsResults(advancedData.advancedInsights || []);
      
      // Extract enhanced keywords from advanced analysis if available
      if (advancedData.enhancedKeywords && Array.isArray(advancedData.enhancedKeywords)) {
        setEnhancedKeywords(advancedData.enhancedKeywords);
      }
      
      setInsightViewMode('aia'); // Switch to advanced view

      toast({
        title: "Success",
        description: "Advanced strategic analysis completed",
        duration: 2000
      });
    } catch (error: any) {
      console.error('Advanced insights failed:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to generate advanced analysis. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoadingStates(prev => ({ ...prev, advancedInsights: false }));
    }
  };

  const handleAdvancedCompetitive = async () => {
    if (!competitiveResults.length) {
      toast({
        title: "Error",
        description: "Initial competitive intelligence required for advanced analysis",
        variant: "destructive"
      });
      return;
    }

    setLoadingStates(prev => ({ ...prev, advancedCompetitive: true }));
    
    try {
      const response = await apiRequest('POST', '/api/advanced-competitive-intelligence', {
        content: originalContent?.content || data.content || '',
        title: originalContent?.title || data.title || '',
        truthAnalysis: currentAnalysis.truthAnalysis,
        initialCompetitive: competitiveResults
      });

      const advancedData = await response.json();
      setAdvancedCompetitiveResults(advancedData.advancedCompetitive || []);

      toast({
        title: "Success",
        description: "Advanced competitive intelligence completed",
      });
    } catch (error: any) {
      console.error('Advanced competitive failed:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to generate advanced competitive analysis. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoadingStates(prev => ({ ...prev, advancedCompetitive: false }));
    }
  };

  const handleAdvancedActions = async () => {
    if (!actionsResults.length) {
      toast({
        title: "Error",
        description: "Initial strategic actions required for advanced analysis",
        variant: "destructive"
      });
      return;
    }

    setLoadingStates(prev => ({ ...prev, advancedActions: true }));
    
    try {
      const response = await apiRequest('POST', '/api/advanced-strategic-actions', {
        content: originalContent?.content || data.content || '',
        title: originalContent?.title || data.title || '',
        truthAnalysis: currentAnalysis.truthAnalysis,
        initialActions: actionsResults
      });

      const advancedData = await response.json();
      setAdvancedActionsResults(advancedData.advancedActions || []);

      toast({
        title: "Success",
        description: "Advanced strategic actions completed",
      });
    } catch (error: any) {
      console.error('Advanced actions failed:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to generate advanced actions analysis. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoadingStates(prev => ({ ...prev, advancedActions: false }));
    }
  };

  const handleBuildActions = async () => {
    if (!currentAnalysis.truthAnalysis) {
      toast({
        title: "Error",
        description: "Truth analysis required to build actions",
        variant: "destructive"
      });
      return;
    }

    setLoadingStates(prev => ({ ...prev, actions: true }));
    
    try {
      const response = await apiRequest(
        'POST',
        '/api/strategic-actions',
        {
          content: originalContent?.content || data.summary || '',
          title: originalContent?.title || 'Content Analysis',
          truthAnalysis: currentAnalysis.truthAnalysis
        }
      );
      
      const responseData = await response.json();
      console.log('Actions API response:', responseData);
      setActionsResults(responseData.actions || []);
      toast({
        title: "Success",
        description: "Strategic actions completed",
        duration: 2000
      });
    } catch (error: any) {
      console.error('Strategic actions failed:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to build strategic actions. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoadingStates(prev => ({ ...prev, actions: false }));
    }
  };

  // Early return if no data - AFTER all hooks are called
  if (!data) {
    return (
      <div className="space-y-4">
        <p className="text-center text-gray-500">No analysis data available</p>
      </div>
    );
  }

  const handleLengthPreferenceChange = async (newLength: 'short' | 'medium' | 'long' | 'bulletpoints') => {
    setLengthPreference(newLength);
    
    // If parent handler is provided, use it for automatic re-analysis and caching
    if (onLengthPreferenceChange) {
      onLengthPreferenceChange(newLength);
      return;
    }
    
    // Fallback to local handling if no parent handler
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
      }
    } else {
      // No original content, just update preference
      toast({
        title: "Length Preference Updated",
        description: `Truth analysis will use ${newLength} format for future analyses.`,
      });
    }
  };

  // Visual Intelligence handler
  const handleVisualAnalysis = async () => {
    if (!originalContent?.url || !extractedImages || extractedImages.length === 0) {
      toast({
        title: "No Images Available",
        description: "No images found for visual analysis. Try analyzing a URL with visual content.",
        variant: "destructive"
      });
      return;
    }

    setLoadingStates(prev => ({ ...prev, visualAnalysis: true }));
    
    try {
      const response = await Promise.race([
        apiRequest(
          'POST',
          '/api/analyze/visual',
          {
            imageUrls: extractedImages.map(img => img.url),
            content: originalContent.content || '',
            context: `Visual analysis for: ${originalContent.url}`,
            sourceUrl: originalContent.url
          }
        ),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Visual analysis timeout - please try again')), 25000) // Optimized for Gemini
        )
      ]);
      
      const responseData = await response.json();
      console.log('Visual Analysis API response:', responseData);
      setVisualAnalysisResults(responseData.visualAnalysis || responseData);
      toast({
        title: "Success",
        description: "Visual analysis completed successfully",
        duration: 2000
      });
    } catch (error: any) {
      console.error('Visual analysis failed:', error);
      toast({
        title: "Error",
        description: error.message || "Visual analysis failed. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoadingStates(prev => ({ ...prev, visualAnalysis: false }));
    }
  };

  const handleFlagAsPotentialSignal = async () => {
    setIsFlagging(true);
    try {
      // Check if we have a valid signal ID or create temporary flag
      if (!analysis.signalId || isNaN(Number(analysis.signalId))) {
        // Use API to create potential signal flag if no existing signal ID
        const response = await apiRequest('POST', '/api/signals', {
          title: originalContent?.title || 'Flagged Analysis',
          content: originalContent?.content || data.summary,
          url: originalContent?.url || null,
          status: 'potential_signal',
          userNotes: 'Flagged from analysis results - contains strategic value'
        });
        
        const responseData = await response.json();
        if (!response.ok) {
          throw new Error(responseData.message || 'Failed to create signal flag');
        }
        
        toast({
          title: "Flagged for Research",
          description: "This content has been flagged for further research and saved as a potential signal.",
          duration: 2000
        });
        return;
      }

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
          title: "Flagged for Research",
          description: "This content has been flagged for further research and moved to your potential signals.",
          duration: 2000
        });
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to flag signal');
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to flag as potential signal. Please try again.",
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
    <div className="space-y-6 relative">
      {/* Loading overlay when re-analyzing */}
      {isReanalyzing && (
        <div className="absolute inset-0 bg-white/90 backdrop-blur-sm z-50 flex items-center justify-center rounded-lg">
          <AnimatedLoadingState 
            title="Re-analyzing Content"
            subtitle="Updating analysis with new length preference..."
          />
        </div>
      )}
      
      {/* Quick Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            Analysis Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <h4 className="text-base sm:text-lg font-bold text-gray-900">Sentiment</h4>
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
                <h4 className="text-base sm:text-lg font-bold text-gray-900">Attention Value</h4>
                <Button variant="ghost" size="sm" className="p-0 h-auto">
                  <Info size={14} className="text-gray-400" />
                </Button>
              </div>
              <Badge className={getAttentionColor(data.truthAnalysis?.attentionValue || 'medium')} variant="secondary">
                {data.truthAnalysis?.attentionValue || 'medium'}
              </Badge>
            </div>
            <div className="text-center sm:col-span-2 lg:col-span-1">
              <div className="flex items-center justify-center gap-2 mb-2">
                <h4 className="text-base sm:text-lg font-bold text-gray-900">Viral Potential</h4>
                <Button variant="ghost" size="sm" className="p-0 h-auto">
                  <Info size={14} className="text-gray-400" />
                </Button>
              </div>
              <Badge className={getViralColor(data.viralPotential || 'medium')} variant="secondary">
                {data.viralPotential || 'medium'}
              </Badge>
            </div>
          </div>
          <Separator className="my-4" />
          {/* Analysis Overview Summary */}
          <div className="mb-4">
            <p className="text-sm text-gray-700 leading-relaxed">{data.summary}</p>
          </div>
          
          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-2 justify-center">
            <Button 
              size="sm" 
              variant="outline" 
              className="flex items-center gap-2 w-full sm:w-auto"
              onClick={() => toast({
                title: "Analysis Saved",
                description: "This analysis has been saved to your dashboard as a capture.",
              })}
            >
              <Save size={14} />
              <span className="hidden sm:inline">Save Analysis</span>
              <span className="sm:hidden">Save</span>
            </Button>
            <Button 
              size="sm" 
              className="bg-blue-600 hover:bg-blue-700 flex items-center gap-2 w-full sm:w-auto"
              onClick={handleFlagAsPotentialSignal}
              disabled={isFlagging}
            >
              {isFlagging ? (
                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
              ) : (
                <Target size={14} />
              )}
              <span className="hidden sm:inline">Flag for Research</span>
              <span className="sm:hidden">Flag</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Detailed Analysis Tabs */}
      <Tabs defaultValue="truth" className="w-full">
        <div className="overflow-x-auto">
          <TabsList className={`${isMobile ? 'flex w-max' : 'grid w-full grid-cols-4'}`}>
            <TabsTrigger value="truth" className="text-xs sm:text-sm whitespace-nowrap">
              <span className="hidden sm:inline">Truth Analysis</span>
              <span className="sm:hidden">Truth</span>
            </TabsTrigger>
            <TabsTrigger value="cohorts" className="text-xs sm:text-sm whitespace-nowrap">
              <span className="hidden sm:inline">Cohorts</span>
              <span className="sm:hidden">Cohorts</span>
            </TabsTrigger>
            <TabsTrigger value="insights" className="text-xs sm:text-sm whitespace-nowrap">
              <span className="hidden sm:inline">Insights</span>
              <span className="sm:hidden">Insights</span>
            </TabsTrigger>
            <TabsTrigger value="visual" className="text-xs sm:text-sm whitespace-nowrap">
              <span className="hidden sm:inline">Visual Intelligence</span>
              <span className="sm:hidden">Visual</span>
            </TabsTrigger>
            {/* Hide Strategic Recommendations tab temporarily */}
            <TabsTrigger value="strategic-recommendations" className="text-xs sm:text-sm whitespace-nowrap hidden">
              <span className="hidden sm:inline">Strategic Recommendations</span>
              <span className="sm:hidden">Strategic</span>
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="insights" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <CardTitle className="flex items-center gap-2">
                  <Lightbulb className="h-5 w-5" />
                  Strategic Insights
                </CardTitle>
                <div className="flex items-center gap-2">
                  {showAdvancedInsightsButton && (
                    <Button 
                      onClick={handleAdvancedInsights}
                      disabled={loadingStates.advancedInsights}
                      variant="outline"
                      size="sm"
                      className="flex items-center gap-2"
                    >
                      {loadingStates.advancedInsights ? (
                        <>
                          <LoadingSpinner size="sm" />
                          Advanced Analysis...
                        </>
                      ) : (
                        <>
                          <Brain className="h-4 w-4" />
                          Advanced Strategic Analysis
                        </>
                      )}
                    </Button>
                  )}
                  {advancedInsightsResults.length > 0 && (
                    <div className="flex items-center gap-2">
                      <Label htmlFor="insight-view-mode" className="text-sm">View:</Label>
                      <Select value={insightViewMode} onValueChange={(value: any) => setInsightViewMode(value)}>
                        <SelectTrigger className="w-full sm:w-24">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="insights">Insights</SelectItem>
                          <SelectItem value="aia">A.I.A.</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>
              </div>
              <p className="text-sm text-gray-600">
                Why there are business opportunities here
              </p>
            </CardHeader>
            <CardContent>
              {loadingStates.advancedInsights ? (
                <AnimatedLoadingState 
                  title="Advanced Strategic Analysis"
                  subtitle="Generating comprehensive detailed analysis for each strategic insight..."
                />
              ) : (
                <>
                  {insightViewMode === 'insights' ? (
                    insightsResults.length > 0 ? (
                      <div className="space-y-3">
                        {insightsResults.map((insight, index) => (
                          <div key={index} className="flex items-start gap-3">
                            <div className="flex-shrink-0 w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                              <span className="text-xs font-bold text-blue-600">{index + 1}</span>
                            </div>
                            <div className="flex-1">
                              <p className="text-sm text-gray-700 font-medium mb-1">
                                {typeof insight === 'string' ? insight : insight.insight || insight.title || `Strategic Insight ${index + 1}`}
                              </p>
                              {typeof insight === 'object' && (insight.category || insight.priority || insight.impact || insight.confidence || insight.timeframe) && (
                                <div className="flex flex-wrap gap-2 mt-2">
                                  {insight.category && (
                                    <Badge variant="secondary" className="text-xs">
                                      {insight.category}
                                    </Badge>
                                  )}
                                  {insight.priority && (
                                    <Badge variant="outline" className="text-xs">
                                      {insight.priority} priority
                                    </Badge>
                                  )}
                                  {insight.impact && (
                                    <Badge variant="outline" className="text-xs">
                                      {insight.impact} impact
                                    </Badge>
                                  )}
                                  {insight.confidence && (
                                    <Badge variant="outline" className="text-xs">
                                      {insight.confidence} confidence
                                    </Badge>
                                  )}
                                  {insight.timeframe && (
                                    <Badge variant="outline" className="text-xs">
                                      {insight.timeframe}
                                    </Badge>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : loadingStates.insights ? (
                      <AnimatedLoadingState 
                        title="Building Strategic Insights"
                        subtitle="Analyzing content for strategic opportunities..."
                      />
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <Lightbulb className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                        <p>Click "Build Strategic Insights" below to generate initial strategic insights</p>
                      </div>
                    )
                  ) : (
                    advancedInsightsResults.length > 0 ? (
                      <div className="space-y-4">
                        {advancedInsightsResults.map((insight, index) => (
                          <div key={index} className="border rounded-lg p-4 bg-gradient-to-r from-blue-50 to-purple-50">
                            <div className="flex items-start gap-3">
                              <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                                <span className="text-sm font-bold text-white">{index + 1}</span>
                              </div>
                              <div className="flex-1 space-y-2">
                                <h4 className="font-semibold text-gray-900">
                                  {typeof insight === 'string' ? `Advanced Insight ${index + 1}` : insight.title || `Advanced Strategic Insight ${index + 1}`}
                                </h4>
                                <p className="text-sm text-gray-700 leading-relaxed">
                                  {typeof insight === 'string' ? insight : insight.analysis || insight.description || `Advanced analysis for insight ${index + 1}`}
                                </p>
                                {typeof insight === 'object' && (
                                  <div className="flex flex-wrap gap-2 mt-2">
                                    {insight.category && (
                                      <Badge variant="secondary" className="text-xs">
                                        {insight.category}
                                      </Badge>
                                    )}
                                    {insight.priority && (
                                      <Badge variant="outline" className="text-xs">
                                        Priority: {insight.priority}
                                      </Badge>
                                    )}
                                    {insight.impact && (
                                      <Badge variant="outline" className="text-xs">
                                        Impact: {insight.impact}
                                      </Badge>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <Brain className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                        <p>Advanced analysis not yet generated</p>
                      </div>
                    )
                  )}
                </>
              )}
            </CardContent>
          </Card>

          {/* ii. Competitive Intelligence */}
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Competitive Intelligence
                </CardTitle>
                <div className="flex items-center gap-2">
                  {competitiveResults.length > 0 && (
                    <Button 
                      onClick={handleAdvancedCompetitive}
                      disabled={loadingStates.advancedCompetitive}
                      variant="outline"
                      size="sm"
                      className="flex items-center gap-2"
                    >
                      {loadingStates.advancedCompetitive ? (
                        <>
                          <LoadingSpinner size="sm" />
                          Advanced Analysis...
                        </>
                      ) : (
                        <>
                          <Brain className="h-4 w-4" />
                          Advanced Analysis
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </div>
              <p className="text-sm text-gray-600">
                How competitors are positioning in this space
              </p>
            </CardHeader>
            <CardContent>
              {competitiveResults.length > 0 ? (
                <>
                  <div className="space-y-3">
                    {competitiveResults.map((competitive, index) => (
                      <div key={index} className="flex items-start gap-3">
                        <div className="flex-shrink-0 w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                          <span className="text-xs font-bold text-green-600">{index + 1}</span>
                        </div>
                        <div className="flex-1">
                          <p className="text-sm text-gray-700 font-medium mb-1">
                            {typeof competitive === 'string' ? competitive : competitive.insight || competitive.intelligence || competitive.title || `Competitive Intelligence ${index + 1}`}
                          </p>
                          {typeof competitive === 'object' && (competitive.category || competitive.confidence || competitive.timeframe) && (
                            <div className="flex flex-wrap gap-2 mt-2">
                              {competitive.category && (
                                <Badge variant="secondary" className="text-xs">
                                  {competitive.category}
                                </Badge>
                              )}
                              {competitive.confidence && (
                                <Badge variant="outline" className="text-xs">
                                  {competitive.confidence} confidence
                                </Badge>
                              )}
                              {competitive.timeframe && (
                                <Badge variant="outline" className="text-xs">
                                  {competitive.timeframe}
                                </Badge>
                              )}
                              {competitive.actionable !== undefined && (
                                <Badge variant={competitive.actionable ? "default" : "secondary"} className="text-xs">
                                  {competitive.actionable ? "Actionable" : "Info Only"}
                                </Badge>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {/* Advanced Competitive Intelligence Results */}
                  {advancedCompetitiveResults.length > 0 && (
                    <div className="mt-6 pt-6 border-t border-gray-200">
                      <div className="flex items-center gap-2 mb-4">
                        <Brain className="h-4 w-4 text-purple-600" />
                        <h4 className="text-sm font-medium text-gray-900">Advanced Competitive Intelligence</h4>
                      </div>
                      <div className="space-y-4">
                        {advancedCompetitiveResults.map((item, index) => (
                          <div key={index} className="flex items-start gap-3">
                            <div className="flex-shrink-0 w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center">
                              <span className="text-xs font-bold text-purple-600">{index + 1}</span>
                            </div>
                            <div className="flex-1">
                              <p className="text-sm font-medium text-gray-900 mb-2">{item.intelligence}</p>
                              <div className="flex flex-wrap gap-2">
                                <Badge variant="secondary" className="text-xs">{item.category}</Badge>
                                <Badge variant="outline" className="text-xs text-blue-700">{item.confidence} confidence</Badge>
                                <Badge variant="outline" className="text-xs text-green-700">{item.timeframe}</Badge>
                                <Badge variant="outline" className="text-xs text-orange-700">{item.competitiveImpact} impact</Badge>
                              </div>
                              {item.resources && item.resources.length > 0 && (
                                <div className="mt-2">
                                  <span className="text-xs font-medium text-gray-600">Resources: </span>
                                  <span className="text-xs text-gray-500">{item.resources.join(', ')}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              ) : loadingStates.competitive ? (
                <AnimatedLoadingState 
                  title="Building Competitive Intelligence"
                  subtitle="Analyzing competitive positioning and market opportunities..."
                />
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Target className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                  <p>Click "Build Strategic Insights" below to generate competitive intelligence</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* iii. Strategic Actions */}
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5" />
                  Strategic Actions
                </CardTitle>
                <div className="flex items-center gap-2">
                  {actionsResults.length > 0 && (
                    <Button 
                      onClick={handleAdvancedActions}
                      disabled={loadingStates.advancedActions}
                      variant="outline"
                      size="sm"
                      className="flex items-center gap-2"
                    >
                      {loadingStates.advancedActions ? (
                        <>
                          <LoadingSpinner size="sm" />
                          Advanced Analysis...
                        </>
                      ) : (
                        <>
                          <Brain className="h-4 w-4" />
                          Advanced Analysis
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </div>
              <p className="text-sm text-gray-600">
                Actionable recommendations based on insights
              </p>
            </CardHeader>
            <CardContent>
              {actionsResults.length > 0 ? (
                <>
                  <div className="space-y-3">
                  {actionsResults.map((action, index) => (
                    <div key={index} className="flex items-start gap-3">
                      <CheckCircle className="h-4 w-4 text-blue-600 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-sm text-gray-700 font-medium mb-1">
                          {typeof action === 'string' ? action : action.action || action.title || `Strategic Action ${index + 1}`}
                        </p>
                        {typeof action === 'object' && (action.category || action.priority || action.effort || action.impact || action.timeframe || action.confidence) && (
                          <div className="flex flex-wrap gap-2 mt-2">
                            {action.category && (
                              <Badge variant="secondary" className="text-xs">
                                {action.category}
                              </Badge>
                            )}
                            {action.priority && (
                              <Badge variant="outline" className="text-xs">
                                {action.priority} priority
                              </Badge>
                            )}
                            {action.effort && (
                              <Badge variant="outline" className="text-xs">
                                {action.effort} effort
                              </Badge>
                            )}
                            {action.impact && (
                              <Badge variant="outline" className="text-xs">
                                {action.impact} impact
                              </Badge>
                            )}
                            {action.timeframe && (
                              <Badge variant="outline" className="text-xs">
                                {action.timeframe}
                              </Badge>
                            )}
                            {action.confidence && (
                              <Badge variant="outline" className="text-xs">
                                {action.confidence} confidence
                              </Badge>
                            )}
                          </div>
                        )}
                        {action.resources && action.resources.length > 0 && (
                          <div className="mt-2">
                            <span className="text-xs font-medium text-gray-600">Resources: </span>
                            <span className="text-xs text-gray-500">{action.resources.join(', ')}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                  </div>
                  
                  {/* Advanced Strategic Actions Results */}
                  {advancedActionsResults.length > 0 && (
                    <div className="mt-6 pt-6 border-t border-gray-200">
                      <div className="flex items-center gap-2 mb-4">
                        <Brain className="h-4 w-4 text-indigo-600" />
                        <h4 className="text-sm font-medium text-gray-900">Advanced Strategic Actions</h4>
                      </div>
                      <div className="space-y-4">
                        {advancedActionsResults.map((item, index) => (
                          <div key={index} className="flex items-start gap-3">
                            <div className="flex-shrink-0 w-6 h-6 bg-indigo-100 rounded-full flex items-center justify-center">
                              <span className="text-xs font-bold text-indigo-600">{index + 1}</span>
                            </div>
                            <div className="flex-1">
                              <p className="text-sm font-medium text-gray-900 mb-2">{item.action}</p>
                              <div className="flex flex-wrap gap-2 mb-3">
                                <Badge variant="secondary" className="text-xs">{item.category}</Badge>
                                <Badge variant="outline" className="text-xs text-red-700">{item.priority} priority</Badge>
                                <Badge variant="outline" className="text-xs text-yellow-700">{item.effort} effort</Badge>
                                <Badge variant="outline" className="text-xs text-green-700">{item.impact} impact</Badge>
                              </div>
                              {item.resources && item.resources.length > 0 && (
                                <div className="mb-2">
                                  <span className="text-xs font-medium text-gray-600">Resources: </span>
                                  <span className="text-xs text-gray-500">{item.resources.join(', ')}</span>
                                </div>
                              )}
                              {item.successMetrics && item.successMetrics.length > 0 && (
                                <div className="mb-2">
                                  <span className="text-xs font-medium text-gray-600">Success Metrics: </span>
                                  <span className="text-xs text-gray-500">{item.successMetrics.join(', ')}</span>
                                </div>
                              )}
                              {item.implementationSteps && item.implementationSteps.length > 0 && (
                                <div>
                                  <span className="text-xs font-medium text-gray-600">Implementation Steps: </span>
                                  <span className="text-xs text-gray-500">{item.implementationSteps.join(' → ')}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              ) : loadingStates.actions ? (
                <AnimatedLoadingState 
                  title="Building Strategic Actions"
                  subtitle="Generating actionable recommendations..."
                />
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <CheckCircle className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                  <p>Click "Build Strategic Insights" below to generate strategic actions</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* iv. Keywords */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Hash className="h-5 w-5" />
                Keywords
              </CardTitle>
              <p className="text-sm text-gray-600">
                Key terms and enhanced keywords from analysis
              </p>
            </CardHeader>
            <CardContent>
              {(currentAnalysis.keywords && currentAnalysis.keywords.length > 0) || (enhancedKeywords && enhancedKeywords.length > 0) ? (
                <div className="space-y-4">
                  {/* Original Keywords */}
                  {currentAnalysis.keywords && currentAnalysis.keywords.length > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold text-gray-700 mb-2">Original Keywords</h4>
                      <div className="flex flex-wrap gap-2">
                        {currentAnalysis.keywords.map((keyword, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {keyword}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Enhanced Keywords from Advanced Analysis */}
                  {enhancedKeywords && enhancedKeywords.length > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold text-gray-700 mb-2">Enhanced Keywords (Advanced Analysis)</h4>
                      <div className="flex flex-wrap gap-2">
                        {enhancedKeywords.map((keyword, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {keyword}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Hash className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                  <p>Keywords will appear after content analysis</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Build Strategic Insights Button */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Button 
                  onClick={handleBuildAllInsights}
                  disabled={loadingStates.insights || loadingStates.actions || loadingStates.competitive || !currentAnalysis.truthAnalysis}
                  className="flex items-center gap-2"
                >
                  {(loadingStates.insights || loadingStates.actions || loadingStates.competitive) ? (
                    <>
                      <LoadingSpinner size="sm" />
                      Building Strategic Insights...
                    </>
                  ) : (
                    <>
                      <Lightbulb className="h-4 w-4" />
                      Build Strategic Insights
                    </>
                  )}
                </Button>
              </CardTitle>
              <p className="text-sm text-gray-600 text-center mt-4">
                This button generates all 4 subsections above. Advanced Strategic Analysis is in the separate Strategic Recommendations tab.
              </p>
            </CardHeader>
          </Card>
        </TabsContent>

        <TabsContent value="truth" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <CardTitle className="flex items-center gap-2">
                  <Eye className="h-5 w-5" />
                  Truth Framework Analysis
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Label htmlFor="length-preference" className="text-sm">Length:</Label>
                  <Select value={lengthPreference} onValueChange={(value: any) => handleLengthPreferenceChange(value)} disabled={isReanalyzing}>
                    <SelectTrigger className="w-full sm:w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="short">Short (2 sentences)</SelectItem>
                      <SelectItem value="medium">Medium (3-5 sentences)</SelectItem>
                      <SelectItem value="long">Long (5-7 sentences)</SelectItem>
                      <SelectItem value="bulletpoints">Bulletpoints (5-12 points)</SelectItem>
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
              {currentAnalysis.truthAnalysis ? (
                <>
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


                </>
              ) : (
                <div className="text-center py-8">
                  <p className="italic text-gray-500">
                    Truth Analysis unavailable – please retry with more context or content.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="cohorts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Cohort Building Capabilities
              </CardTitle>
              <p className="text-sm text-gray-600">
                Build behavioral audience segments from truth analysis
              </p>
            </CardHeader>
            <CardContent>
              <div className="flex justify-center mb-4">
                <Button 
                  onClick={handleBuildCohorts}
                  disabled={loadingStates.cohorts || !currentAnalysis.truthAnalysis}
                  className="flex items-center gap-2"
                >
                  {loadingStates.cohorts ? (
                    <>
                      <LoadingSpinner size="sm" />
                      Building Cohorts...
                    </>
                  ) : (
                    <>
                      <Users className="h-4 w-4" />
                      Build Cohorts
                    </>
                  )}
                </Button>
              </div>
              
              {loadingStates.cohorts ? (
                <AnimatedLoadingState 
                  title="Building Cohorts"
                  subtitle="Analyzing audience segments and behavioral patterns..."
                />
              ) : cohortResults.length > 0 ? (
                <div className="space-y-3">
                  {cohortResults.map((cohort, index) => (
                    <div key={index} className="p-3 bg-blue-50 rounded border border-blue-200">
                      <h4 className="font-medium text-blue-900 mb-1">{cohort.name}</h4>
                      <p className="text-sm text-gray-700 mb-2">{cohort.description}</p>
                      {cohort.behaviorPatterns && cohort.behaviorPatterns.length > 0 && (
                        <div className="text-xs text-gray-600 mb-1">
                          <strong>Behavior Patterns:</strong> {cohort.behaviorPatterns.join(', ')}
                        </div>
                      )}
                      {cohort.platforms && cohort.platforms.length > 0 && (
                        <div className="text-xs text-gray-600 mb-1">
                          <strong>Platforms:</strong> {cohort.platforms.join(', ')}
                        </div>
                      )}
                      <div className="flex gap-2 mt-2">
                        {cohort.size && (
                          <Badge variant="outline" className="text-xs">
                            Size: {cohort.size}
                          </Badge>
                        )}
                        {cohort.engagement && (
                          <Badge variant="outline" className="text-xs">
                            Engagement: {cohort.engagement}
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Users className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                  <p>Click "Build Cohorts" to analyze audience segments</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="visual" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5" />
                Visual Intelligence
              </CardTitle>
              <p className="text-sm text-gray-600">
                Analyze visual elements for brand insights, cultural moments, and competitive positioning
              </p>
            </CardHeader>
            <CardContent>
              {/* Display extracted images if available */}
              {extractedImages && extractedImages.length > 0 ? (
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-3">Extracted Images ({extractedImages.length})</h4>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
                      {extractedImages.map((image, index) => (
                        <div key={index} className="relative border rounded-lg overflow-hidden">
                          <img 
                            src={image.url} 
                            alt={image.alt || `Image ${index + 1}`}
                            className="w-full h-32 object-cover"
                          />
                          <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white p-1 text-xs">
                            {image.alt || `Image ${index + 1}`}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex justify-center">
                    <Button 
                      onClick={handleVisualAnalysis}
                      disabled={loadingStates.visualAnalysis}
                      className="flex items-center gap-2"
                    >
                      {loadingStates.visualAnalysis ? (
                        <>
                          <LoadingSpinner size="sm" />
                          Analyzing Visuals...
                        </>
                      ) : (
                        <>
                          <Eye className="h-4 w-4" />
                          Analyze Visual Intelligence
                        </>
                      )}
                    </Button>
                  </div>

                  {/* Visual Analysis Results or Loading State */}
                  {loadingStates.visualAnalysis && (
                    <AnimatedLoadingState 
                      title="Analyzing Visual Content"
                      subtitle="Extracting brand elements, cultural moments, and strategic insights from images..."
                    />
                  )}

                  {visualAnalysisResults && (
                    <div className="space-y-6 mt-4">
                      <div className="border-t pt-4">
                        <h4 className="font-medium text-gray-900 mb-4">Visual Intelligence Analysis</h4>
                        
                        {/* Brand Visual Elements */}
                        <div className="mb-6">
                          <div className="flex items-center gap-2 mb-3">
                            <Palette className="h-4 w-4 text-blue-600" />
                            <h4 className="font-semibold text-blue-900">Brand Visual Elements</h4>
                          </div>
                          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                            <p className="text-sm text-gray-700 leading-relaxed">
                              {typeof visualAnalysisResults.brandElements === 'string' 
                                ? visualAnalysisResults.brandElements
                                : (visualAnalysisResults.brandElements || 'No brand elements detected in the visual content.')}
                            </p>
                          </div>
                        </div>

                        {/* Cultural Visual Moments */}
                        <div className="mb-6">
                          <div className="flex items-center gap-2 mb-3">
                            <Sparkles className="h-4 w-4 text-purple-600" />
                            <h4 className="font-semibold text-purple-900">Cultural Visual Moments</h4>
                          </div>
                          <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                            <p className="text-sm text-gray-700 leading-relaxed">
                              {typeof visualAnalysisResults.culturalMoments === 'string'
                                ? visualAnalysisResults.culturalMoments
                                : (visualAnalysisResults.culturalMoments || 'No significant cultural visual moments identified.')}
                            </p>
                          </div>
                        </div>

                        {/* Competitive Visual Positioning */}
                        <div className="mb-6">
                          <div className="flex items-center gap-2 mb-3">
                            <Target className="h-4 w-4 text-green-600" />
                            <h4 className="font-semibold text-green-900">Competitive Visual Positioning</h4>
                          </div>
                          <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                            <p className="text-sm text-gray-700 leading-relaxed">
                              {typeof visualAnalysisResults.competitiveInsights === 'string'
                                ? visualAnalysisResults.competitiveInsights
                                : (visualAnalysisResults.competitiveInsights || 'No competitive visual insights available.')}
                            </p>
                          </div>
                        </div>

                        {/* Visual Strategic Summary */}
                        <div className="mb-6">
                          <div className="flex items-center gap-2 mb-3">
                            <Brain className="h-4 w-4 text-indigo-600" />
                            <h4 className="font-semibold text-indigo-900">Visual Strategic Summary</h4>
                          </div>
                          <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-200">
                            <p className="text-sm text-gray-700 leading-relaxed">
                              {visualAnalysisResults.summary || 'Visual analysis provides insights into brand positioning, cultural relevance, and competitive differentiation through visual elements.'}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Eye className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h4 className="font-medium text-gray-900 mb-2">No Images Available</h4>
                  <p className="text-sm text-gray-600 mb-4">
                    Visual Intelligence requires content with images. Try analyzing:
                  </p>
                  <div className="text-sm text-gray-500 space-y-1">
                    <p>• Social media posts with images</p>
                    <p>• Blog articles with visuals</p>
                    <p>• Product pages</p>
                    <p>• Marketing content</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="strategic-recommendations" className="space-y-4">
          <ErrorBoundary>
            <Suspense fallback={
              <AnimatedLoadingState 
                title="Loading Strategic Recommendations"
                subtitle="Preparing comprehensive strategic analysis..."
              />
            }>
              <LazyStrategicRecommendations
                content={originalContent?.content || data.summary || ''}
                title={originalContent?.title || 'Content Analysis'}
                truthAnalysis={currentAnalysis.truthAnalysis}
                cohorts={cohortResults}
                strategicInsights={insightsResults}
                strategicActions={actionsResults}
                competitiveInsights={competitiveResults}
              />
            </Suspense>
          </ErrorBoundary>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default EnhancedAnalysisResults;