import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Lightbulb, Target, Users, Eye, CheckCircle, Zap, AlertCircle, Brain, BarChart3, TrendingUp, MapPin, Compass, Share2 } from 'lucide-react';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { useToast } from '@/hooks/use-toast';

// Enhanced Loading Component with animated progress bar
const AnimatedLoadingState = ({ title, subtitle, progress = 0 }) => {
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
  analysis: any;
  isLoading: boolean;
  signalId?: number;
  onAnalysisUpdate?: (analysis: any) => void;
}

const EnhancedAnalysisResults: React.FC<EnhancedAnalysisResultsProps> = ({ 
  analysis, 
  isLoading, 
  signalId,
  onAnalysisUpdate 
}) => {
  const [currentAnalysis, setCurrentAnalysis] = useState(analysis || {});
  const [activeTab, setActiveTab] = useState('strategic-insights');
  const [lengthPreference, setLengthPreference] = useState('medium');
  const [isReanalyzing, setIsReanalyzing] = useState(false);
  const [showAdvancedInsightsButton, setShowAdvancedInsightsButton] = useState(false);
  const [insightsMode, setInsightsMode] = useState<'insights' | 'advanced'>('insights');
  const { toast } = useToast();

  // Results states
  const [insightsResults, setInsightsResults] = useState<any[]>([]);
  const [actionsResults, setActionsResults] = useState<any[]>([]);
  const [competitiveResults, setCompetitiveResults] = useState<any[]>([]);
  const [cohortResults, setCohortResults] = useState<any[]>([]);
  const [strategicRecommendations, setStrategicRecommendations] = useState<any[]>([]);
  const [advancedInsightsResults, setAdvancedInsightsResults] = useState<any[]>([]);

  // Loading states
  const [loadingStates, setLoadingStates] = useState({
    insights: false,
    actions: false,
    competitive: false,
    cohorts: false,
    strategicRecommendations: false,
    advancedInsights: false
  });

  const resetLoadingState = (key: keyof typeof loadingStates) => {
    setLoadingStates(prev => ({ ...prev, [key]: false }));
  };

  // Update analysis when prop changes
  useEffect(() => {
    if (analysis) {
      setCurrentAnalysis(analysis);
      console.log('EnhancedAnalysisResults received analysis:', analysis);
      
      // Check if we should show advanced insights button
      if (analysis.strategicInsights && analysis.strategicInsights.length > 0) {
        setShowAdvancedInsightsButton(true);
      }
    }
  }, [analysis]);

  // Handle length preference change
  const handleLengthPreferenceChange = async (newPreference: string) => {
    if (!signalId) return;
    
    setLengthPreference(newPreference);
    setIsReanalyzing(true);
    
    try {
      const response = await fetch(`/api/reanalyze/${signalId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          lengthPreference: newPreference,
          analysisMode: 'deep'
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to reanalyze');
      }

      const data = await response.json();
      
      if (data.success) {
        setCurrentAnalysis(data.analysis);
        if (onAnalysisUpdate) {
          onAnalysisUpdate(data.analysis);
        }
        toast({
          title: "Analysis Updated",
          description: "Content has been reanalyzed with new length preference.",
        });
      }
    } catch (error) {
      console.error('Error reanalyzing:', error);
      toast({
        title: "Error",
        description: "Failed to reanalyze content. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsReanalyzing(false);
    }
  };

  // Handle strategic insights generation
  const handleBuildAllInsights = async () => {
    if (!signalId) return;
    
    setLoadingStates(prev => ({ ...prev, insights: true, actions: true, competitive: true }));
    
    try {
      // Build strategic insights
      const insightsResponse = await fetch(`/api/strategic-insights/${signalId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ truthAnalysis: currentAnalysis.truthAnalysis }),
      });

      if (insightsResponse.ok) {
        const insightsData = await insightsResponse.json();
        setInsightsResults(insightsData.insights || []);
        setShowAdvancedInsightsButton(true);
      }

      // Build strategic actions
      const actionsResponse = await fetch(`/api/strategic-actions/${signalId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ truthAnalysis: currentAnalysis.truthAnalysis }),
      });

      if (actionsResponse.ok) {
        const actionsData = await actionsResponse.json();
        setActionsResults(actionsData.actions || []);
      }

      // Build competitive intelligence
      const competitiveResponse = await fetch(`/api/competitive-intelligence/${signalId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ truthAnalysis: currentAnalysis.truthAnalysis }),
      });

      if (competitiveResponse.ok) {
        const competitiveData = await competitiveResponse.json();
        setCompetitiveResults(competitiveData.intelligence || []);
      }

      toast({
        title: "Strategic Insights Generated",
        description: "All strategic insights have been generated successfully.",
      });
    } catch (error) {
      console.error('Error building strategic insights:', error);
      toast({
        title: "Error",
        description: "Failed to generate strategic insights. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoadingStates(prev => ({ ...prev, insights: false, actions: false, competitive: false }));
    }
  };

  // Handle advanced insights generation
  const handleAdvancedInsights = async () => {
    if (!signalId) return;
    
    setLoadingStates(prev => ({ ...prev, advancedInsights: true }));
    
    try {
      const response = await fetch(`/api/advanced-strategic-insights/${signalId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          truthAnalysis: currentAnalysis.truthAnalysis,
          strategicInsights: insightsResults,
          strategicActions: actionsResults,
          competitiveIntelligence: competitiveResults
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setAdvancedInsightsResults(data.insights || []);
        setInsightsMode('advanced');
        
        toast({
          title: "Advanced Strategic Analysis Generated",
          description: "Comprehensive strategic analysis has been generated successfully.",
        });
      }
    } catch (error) {
      console.error('Error generating advanced insights:', error);
      toast({
        title: "Error",
        description: "Failed to generate advanced strategic analysis. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoadingStates(prev => ({ ...prev, advancedInsights: false }));
    }
  };

  // Handle cohort building
  const handleBuildCohorts = async () => {
    if (!signalId) return;
    
    setLoadingStates(prev => ({ ...prev, cohorts: true }));
    
    try {
      const response = await fetch(`/api/cohorts/${signalId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ truthAnalysis: currentAnalysis.truthAnalysis }),
      });

      if (response.ok) {
        const data = await response.json();
        setCohortResults(data.cohorts || []);
        
        toast({
          title: "Cohorts Generated",
          description: "Audience cohorts have been generated successfully.",
        });
      }
    } catch (error) {
      console.error('Error building cohorts:', error);
      toast({
        title: "Error",
        description: "Failed to generate cohorts. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoadingStates(prev => ({ ...prev, cohorts: false }));
    }
  };

  const handleTabChange = (value: string) => {
    setActiveTab(value);
  };

  if (isLoading) {
    return (
      <Card className="w-full">
        <CardContent className="p-6">
          <AnimatedLoadingState title="Analyzing Content" subtitle="Please wait while we process your content..." />
        </CardContent>
      </Card>
    );
  }

  if (!currentAnalysis || Object.keys(currentAnalysis).length === 0) {
    return (
      <Card className="w-full">
        <CardContent className="p-6">
          <div className="text-center py-8 text-gray-500">
            <Lightbulb className="h-8 w-8 mx-auto mb-2 text-gray-400" />
            <p>No analysis data available</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="w-full max-w-none">
      <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="strategic-insights" className="flex items-center gap-2">
            <Lightbulb className="h-4 w-4" />
            <span className="hidden sm:inline">Strategic Insights</span>
          </TabsTrigger>
          <TabsTrigger value="cohorts" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            <span className="hidden sm:inline">Cohorts</span>
          </TabsTrigger>
          <TabsTrigger value="truth" className="flex items-center gap-2">
            <Eye className="h-4 w-4" />
            <span className="hidden sm:inline">Truth Analysis</span>
          </TabsTrigger>
          <TabsTrigger value="strategic-recommendations" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            <span className="hidden sm:inline">Strategic Recommendations</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="strategic-insights" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lightbulb className="h-5 w-5" />
                Strategic Insights
              </CardTitle>
              <p className="text-sm text-gray-600">
                What specific strategic insights brands should know about this content
              </p>
            </CardHeader>
            <CardContent>
              {!showAdvancedInsightsButton ? (
                <div className="text-center py-8 text-gray-500">
                  <Lightbulb className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                  <p>Click "Build Strategic Insights" below to generate insights</p>
                </div>
              ) : (
                <>
                  {insightsMode === 'insights' ? (
                    insightsResults.length > 0 ? (
                      <div className="space-y-3">
                        {insightsResults.map((insight, index) => (
                          <div key={index} className="flex items-start gap-3">
                            <Lightbulb className="h-4 w-4 text-blue-600 mt-0.5" />
                            <div className="flex-1">
                              <p className="text-sm text-gray-700 font-medium mb-1">
                                {typeof insight === 'string' ? insight : insight.insight || insight.title || `Strategic Insight ${index + 1}`}
                              </p>
                              {typeof insight === 'object' && insight.category && (
                                <div className="text-xs text-gray-600">
                                  <strong>Category:</strong> {insight.category} 
                                  {insight.priority && ` | Priority: ${insight.priority}`}
                                  {insight.impact && ` | Impact: ${insight.impact}`}
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

          {/* Main Action Button */}
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
                This button generates insights for the upper sections only. Advanced Strategic Analysis is in the separate Strategic Recommendations tab.
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
                      <Users className="h-4 w-4 text-purple-600" />
                      <h4 className="font-semibold text-purple-900">Human Truth</h4>
                    </div>
                    <p className="text-sm text-gray-700 bg-purple-50 p-3 rounded">
                      {currentAnalysis.truthAnalysis.humanTruth}
                    </p>
                  </div>

                  {/* Cultural Moment */}
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Zap className="h-4 w-4 text-orange-600" />
                      <h4 className="font-semibold text-orange-900">Cultural Moment</h4>
                    </div>
                    <p className="text-sm text-gray-700 bg-orange-50 p-3 rounded">
                      {currentAnalysis.truthAnalysis.culturalMoment}
                    </p>
                  </div>
                </>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Eye className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                  <p>No truth analysis available</p>
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
                Audience Cohorts
              </CardTitle>
              <p className="text-sm text-gray-600">
                Behavioral segments that would engage with this content
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

              {cohortResults.length > 0 ? (
                <div className="space-y-3">
                  {cohortResults.map((cohort, index) => (
                    <div key={index} className="border rounded-lg p-4">
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-sm font-bold text-blue-600">{index + 1}</span>
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900 mb-1">
                            {typeof cohort === 'string' ? `Cohort ${index + 1}` : cohort.name || `Cohort ${index + 1}`}
                          </h4>
                          <p className="text-sm text-gray-700 mb-2">
                            {typeof cohort === 'string' ? cohort : cohort.description || `Description for cohort ${index + 1}`}
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {typeof cohort === 'object' && cohort.category && (
                              <Badge variant="secondary" className="text-xs">
                                {cohort.category}
                              </Badge>
                            )}
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

        <TabsContent value="strategic-recommendations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Strategic Recommendations
              </CardTitle>
              <p className="text-sm text-gray-600">
                Comprehensive strategic recommendations based on all analysis
              </p>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-gray-500">
                <TrendingUp className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                <p>Strategic recommendations will be generated here</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default EnhancedAnalysisResults;