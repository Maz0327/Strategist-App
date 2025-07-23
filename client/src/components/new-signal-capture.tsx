import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ContentInput } from "@/components/content-input";
import { Button } from "@/components/ui/button";
import { Plus, FileText, Link, Target, ArrowRight } from "lucide-react";
import { AnalysisSkeleton } from "@/components/ui/analysis-skeleton";
import EnhancedAnalysisResults from "@/components/enhanced-analysis-results";
import { FloatingActionButton } from "@/components/ui/floating-action-button";
import { ProgressBreadcrumb } from "@/components/ui/progress-breadcrumb";

interface NewSignalCaptureProps {
  activeSubTab?: string;
  onNavigateToExplore?: () => void;
  onNavigateToBrief?: () => void;
}

export function NewSignalCapture({ activeSubTab, onNavigateToExplore, onNavigateToBrief }: NewSignalCaptureProps) {
  const [activeTab, setActiveTab] = useState(activeSubTab || "capture");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [originalContent, setOriginalContent] = useState<any>(null);
  const [analysisCache, setAnalysisCache] = useState<Map<string, any>>(new Map());
  const [currentAnalysisMode, setCurrentAnalysisMode] = useState<'quick' | 'deep'>('quick');
  const [analysisProgress, setAnalysisProgress] = useState<{stage: string, progress: number}>({ stage: '', progress: 0 });
  
  const handleAnalysisStart = () => {
    setIsAnalyzing(true);
    setAnalysisResult(null);
  };
  
  const handleAnalysisComplete = (result: any, content?: any) => {
    // Cache the result for the current analysis mode
    const cacheKey = `${currentAnalysisMode}:${content?.content || ''}:${content?.url || ''}`;
    setAnalysisCache(prev => new Map(prev).set(cacheKey, result));
    
    setAnalysisResult(result);
    setOriginalContent(content);
    setIsAnalyzing(false);
    
    // Scroll to results
    setTimeout(() => {
      document.getElementById('analysis-results')?.scrollIntoView({ 
        behavior: 'smooth',
        block: 'start'
      });
    }, 100);
  };

  const handleAnalysisModeChange = (newMode: 'quick' | 'deep') => {
    if (newMode === currentAnalysisMode) return;
    
    setCurrentAnalysisMode(newMode);
    
    // Check if we have cached result for this mode
    if (originalContent) {
      const cacheKey = `${newMode}:${originalContent?.content || ''}:${originalContent?.url || ''}`;
      const cachedResult = analysisCache.get(cacheKey);
      
      if (cachedResult) {
        // Use cached result
        setAnalysisResult(cachedResult);
      } else {
        // Trigger new analysis with the new mode
        triggerReanalysis(newMode);
      }
    }
  };

  const triggerReanalysis = async (analysisMode: 'quick' | 'deep') => {
    if (!originalContent) return;
    
    setIsAnalyzing(true);
    setAnalysisResult(null);
    
    try {
      // Import the analysis logic from ContentInput
      const requestData = { 
        ...originalContent, 
        analysisMode, 
        userNotes: ''
      };
      
      const response = await fetch('/api/analyze/stream', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(requestData),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Handle Server-Sent Events streaming response
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let result: any = null;
      
      if (reader) {
        let buffer = '';
        
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';
          
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const eventData = JSON.parse(line.slice(6));
                
                if (eventData.type === 'complete') {
                  handleAnalysisComplete(eventData.data.analysis, originalContent);
                  return;
                }
              } catch (e) {
                // Continue processing
              }
            }
          }
        }
      }
    } catch (error) {
      console.error('Re-analysis failed:', error);
      setIsAnalyzing(false);
    }
  };
  
  const breadcrumbSteps = [
    { label: "Capture", completed: !!analysisResult, active: !analysisResult },
    { label: "Analyze", completed: !!analysisResult, active: isAnalyzing },
    { label: "Brief", active: false }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div className="min-w-0 flex-1">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900">New Signal Capture</h2>
          <p className="text-sm sm:text-base text-gray-600 mt-1">Analyze content and discover strategic insights</p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <Button variant="outline" size="sm" onClick={onNavigateToExplore} className="text-xs sm:text-sm">
            <Target className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
            <span className="hidden sm:inline">Explore Trending</span>
            <span className="sm:hidden">Explore</span>
          </Button>
          <Button variant="outline" size="sm" onClick={onNavigateToBrief} className="text-xs sm:text-sm">
            <FileText className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
            <span className="hidden sm:inline">Brief Lab</span>
            <span className="sm:hidden">Brief</span>
          </Button>
        </div>
      </div>
      
      {/* Progress Breadcrumb */}
      <ProgressBreadcrumb steps={breadcrumbSteps} className="mb-6" />

      {/* Capture Interface */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="capture" className="flex items-center space-x-2">
            <Plus className="h-4 w-4" />
            <span>Content Analysis</span>
          </TabsTrigger>
          <TabsTrigger value="batch" className="flex items-center space-x-2">
            <FileText className="h-4 w-4" />
            <span>Batch Processing</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="capture" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="h-5 w-5" />
                Capture & Analyze Content
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div data-tutorial="content-input">
                <ContentInput 
                  onAnalysisStart={handleAnalysisStart} 
                  onAnalysisComplete={handleAnalysisComplete}
                  onAnalysisProgress={setAnalysisProgress}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="batch" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Batch Processing
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h4 className="font-medium text-gray-900 mb-2">Batch Processing</h4>
                <p className="text-gray-600 mb-4">Process multiple URLs or text blocks at once</p>
                <Button disabled className="bg-gray-300 hover:bg-gray-300 cursor-not-allowed">
                  <FileText className="w-4 h-4 mr-2" />
                  Coming Soon
                </Button>
                <p className="text-xs text-gray-500 mt-2">Multi-URL batch processing will be available in a future update</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Analysis Results */}
      {(isAnalyzing || analysisResult) && (
        <Card id="analysis-results">
          <CardHeader>
            <CardTitle>Analysis Results</CardTitle>
          </CardHeader>
          <CardContent>
            {isAnalyzing ? (
              <AnalysisSkeleton analysisProgress={analysisProgress} />
            ) : analysisResult ? (
              <EnhancedAnalysisResults 
                analysis={analysisResult} 
                originalContent={originalContent}
                currentAnalysisMode={currentAnalysisMode}
                onAnalysisModeChange={handleAnalysisModeChange}
                isReanalyzing={isAnalyzing}
              />
            ) : null}
          </CardContent>
        </Card>
      )}

      {/* Floating Action Button */}
      <FloatingActionButton 
        onNewSignal={() => setActiveTab("capture")}
        onQuickAnalysis={() => setActiveTab("capture")}
        onNewBrief={() => onNavigateToBrief?.()}
      />

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={onNavigateToExplore}>
          <CardContent className="p-6 text-center">
            <Target className="h-8 w-8 text-blue-500 mx-auto mb-3" />
            <h4 className="font-medium text-gray-900 mb-2">Explore Trends</h4>
            <p className="text-sm text-gray-600">Discover trending topics to analyze</p>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:shadow-md transition-shadow">
          <CardContent className="p-6 text-center">
            <Link className="h-8 w-8 text-green-500 mx-auto mb-3" />
            <h4 className="font-medium text-gray-900 mb-2">URL Library</h4>
            <p className="text-sm text-gray-600">Saved URLs for quick analysis</p>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={onNavigateToBrief}>
          <CardContent className="p-6 text-center">
            <ArrowRight className="h-8 w-8 text-purple-500 mx-auto mb-3" />
            <h4 className="font-medium text-gray-900 mb-2">Create Brief</h4>
            <p className="text-sm text-gray-600">Turn signals into strategic briefs</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}