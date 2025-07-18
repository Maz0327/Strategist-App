import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { apiRequest } from "@/lib/queryClient";
import { analyzeContentSchema, type AnalyzeContentData } from "@shared/schema";
import { Edit, Link, Highlighter, Brain, Download, Info, Sparkles, Zap, Search } from "lucide-react";
import { InfoTooltip } from "@/components/ui/info-tooltip";
import { useKeyboardShortcuts } from "@/hooks/use-keyboard-shortcuts";

interface ContentInputProps {
  onAnalysisComplete?: (analysis: any, content?: any) => void;
  onAnalysisStart?: () => void;
}

export function ContentInput({ onAnalysisComplete, onAnalysisStart }: ContentInputProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [charCount, setCharCount] = useState(0);
  const [activeTab, setActiveTab] = useState("text");
  const [lengthPreference, setLengthPreference] = useState<'short' | 'medium' | 'long' | 'bulletpoints'>('medium');
  const [userNotes, setUserNotes] = useState("");
  const [analysisProgress, setAnalysisProgress] = useState({ stage: '', progress: 0 });
  const [useStreaming, setUseStreaming] = useState(true);
  const [analysisMode, setAnalysisMode] = useState<'quick' | 'deep'>('quick');
  const { toast } = useToast();

  // Example content for quick demo
  const exampleContent = `The rise of AI-generated content is creating new challenges for content creators. While tools like ChatGPT can produce text at scale, the real value lies in understanding audience psychology and cultural moments. Brands that win will combine AI efficiency with human insight to create content that resonates authentically. The key is not just what you say, but when and how you say it.`;

  // Keyboard shortcuts
  useKeyboardShortcuts({
    'ctrl+enter': () => {
      if (!isLoading && form.watch("content")?.trim()) {
        form.handleSubmit(handleAnalyze)();
      }
    },
    'ctrl+s': () => {
      // Quick save functionality could be added here
    }
  });

  const form = useForm<AnalyzeContentData>({
    resolver: zodResolver(analyzeContentSchema),
    defaultValues: {
      content: "",
      url: "",
      title: "Content Analysis",
    },
  });

  const handleStreamingAnalysis = async (data: AnalyzeContentData) => {
    setIsLoading(true);
    setAnalysisProgress({ stage: 'Starting analysis...', progress: 0 });
    onAnalysisStart?.();

    try {
      const requestData = { ...data, lengthPreference, userNotes, analysisMode };
      
      // For Deep Analysis, use regular endpoint without streaming
      if (analysisMode === 'deep') {
        const response = await apiRequest("POST", "/api/analyze/deep", requestData);
        const result = await response.json();
        onAnalysisComplete?.(result.analysis, data);
        toast({
          title: "Deep Analysis Complete", 
          description: "Comprehensive strategic analysis completed with detailed insights.",
        });
        return;
      }
      
      // For Quick Analysis, use streaming endpoint
      const response = await fetch('/api/analyze/stream', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to start streaming analysis');
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error('No response stream available');
      }

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const eventData = JSON.parse(line.slice(6));
              
              if (eventData.type === 'progress') {
                setAnalysisProgress({ stage: eventData.stage, progress: eventData.progress });
              } else if (eventData.type === 'complete') {
                console.log('Analysis complete event received:', eventData);
                console.log('Analysis data:', eventData.analysis);
                onAnalysisComplete?.(eventData.analysis, data);
                toast({
                  title: "Analysis Complete", 
                  description: "Content captured and analyzed with real-time progress tracking.",
                });
              } else if (eventData.type === 'error') {
                throw new Error(eventData.message);
              }
            } catch (e) {
              // Skip invalid JSON lines
            }
          }
        }
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to analyze content",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      setAnalysisProgress({ stage: '', progress: 0 });
    }
  };

  const handleAnalyze = async (data: AnalyzeContentData) => {
    if (useStreaming) {
      await handleStreamingAnalysis(data);
    } else {
      // Fallback to regular analysis with auto-retry
      setIsLoading(true);
      onAnalysisStart?.();
      try {
        const requestData = { ...data, lengthPreference, userNotes, analysisMode };
        
        const result = await retryRequest(async () => {
          const endpoint = analysisMode === 'deep' ? "/api/analyze/deep" : "/api/analyze";
          const response = await apiRequest("POST", endpoint, requestData);
          
          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || "Failed to analyze content");
          }
          
          return await response.json();
        });
        
        onAnalysisComplete?.(result, data);
        
        toast({
          title: "Analysis Complete", 
          description: "Content captured and analyzed. Use 'Flag as Worth Researching' below to mark important insights, or check Suggestions tab for AI recommendations.",
        });
      } catch (error: any) {
        toast({
          title: "Error",
          description: error.message || "Failed to analyze content",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleExtractUrl = async () => {
    const url = form.getValues("url");
    if (!url) return;

    setIsLoading(true);
    try {
      const response = await apiRequest("POST", "/api/extract-url", { url });
      const result = await response.json();
      
      form.setValue("content", result.content);
      form.setValue("title", result.title);
      setCharCount(result.content.length);
      
      toast({
        title: "Success",
        description: "Content extracted successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to extract content",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setCharCount(value.length);
    form.setValue("content", value);
  };

  const [selectedText, setSelectedText] = useState("");

  const handleTextSelection = () => {
    const selection = window.getSelection();
    if (selection && selection.toString().trim()) {
      const selected = selection.toString().trim();
      setSelectedText(selected);
      toast({
        title: "Text Selected",
        description: `Selected ${selected.length} characters for analysis`,
      });
    } else {
      setSelectedText("");
    }
  };

  const handleAnalyzeSelection = async () => {
    if (!selectedText) {
      toast({
        title: "Error",
        description: "Please select some text to analyze",
        variant: "destructive",
      });
      return;
    }

    const analysisData = {
      content: selectedText,
      title: "Text Selection Analysis"
    };
    await handleAnalyze(analysisData);
  };

  const handleTryExample = () => {
    form.setValue("content", exampleContent);
    form.setValue("title", "Example Analysis");
    setCharCount(exampleContent.length);
    toast({
      title: "Example Loaded",
      description: "Try analyzing this example to see how the system works",
    });
  };

  // Auto-retry utility for failed requests
  const retryRequest = async (requestFn: () => Promise<any>, maxRetries = 2, delay = 1000) => {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await requestFn();
      } catch (error: any) {
        if (attempt === maxRetries) {
          throw error;
        }
        
        // Check if it's a rate limit error
        if (error.message?.includes('rate limit') || error.message?.includes('429')) {
          await new Promise(resolve => setTimeout(resolve, delay * attempt));
          continue;
        }
        
        // For other errors, don't retry
        throw error;
      }
    }
  };

  return (
    <Card className="card-shadow">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-gray-900">
          Content Analysis
        </CardTitle>
        <p className="text-sm text-gray-600 mt-1">
          Analyze content to create captures for your strategic pipeline
        </p>
        <div className="mt-2 p-2 bg-blue-50 rounded text-xs text-blue-800">
          <strong>Process:</strong> Analysis creates captures → Flag as potential signals → Validate to signals → Use in briefs
        </div>
        <div className="mt-3 space-y-3">
          <div className="flex items-center gap-2">
            <Label htmlFor="analysis-mode" className="text-sm font-medium">Analysis Mode:</Label>
            <InfoTooltip content="Quick Analysis: 2-3 seconds, focused insights. Deep Analysis: 8-15 seconds, comprehensive strategic analysis with richer context." />
            <Select value={analysisMode} onValueChange={(value: any) => setAnalysisMode(value)}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="quick">
                  <div className="flex items-center gap-2">
                    <Zap size={14} />
                    Quick (2-3s)
                  </div>
                </SelectItem>
                <SelectItem value="deep">
                  <div className="flex items-center gap-2">
                    <Search size={14} />
                    Deep (8-15s)
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex items-center gap-2">
            <Label htmlFor="analysis-length" className="text-sm font-medium">Response Length:</Label>
            <InfoTooltip content="Choose how detailed you want the strategic insights to be. Short for quick overviews, Long for comprehensive analysis." />
            <Select value={lengthPreference} onValueChange={(value: any) => setLengthPreference(value)}>
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
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="text" className="flex items-center gap-2">
              <Edit size={16} />
              Manual Text
            </TabsTrigger>
            <TabsTrigger value="url" className="flex items-center gap-2">
              <Link size={16} />
              URL Analysis
            </TabsTrigger>
            <TabsTrigger value="selection" className="flex items-center gap-2">
              <Highlighter size={16} />
              Text Selection
            </TabsTrigger>
          </TabsList>

          <TabsContent value="text" className="space-y-4">
            <form onSubmit={(e) => {
              console.log("Form submit event triggered");
              console.log("Form validation errors:", form.formState.errors);
              console.log("Form values:", form.getValues());
              form.handleSubmit(handleAnalyze, (errors) => {
                console.log("Form validation failed:", errors);
              })(e);
            }} className="space-y-4">
              {/* Analysis Mode Toggle */}
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2">
                  {analysisMode === 'quick' ? (
                    <Zap className="h-4 w-4 text-blue-600" />
                  ) : (
                    <Search className="h-4 w-4 text-purple-600" />
                  )}
                  <span className="text-sm font-medium">
                    {analysisMode === 'quick' ? 'Quick Analysis' : 'Deep Analysis'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="text-xs text-gray-500">
                    Est. {analysisMode === 'quick' ? '2-3 seconds' : '8-15 seconds'}
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setAnalysisMode(analysisMode === 'quick' ? 'deep' : 'quick')}
                    className="h-8 px-3"
                  >
                    {analysisMode === 'quick' ? 'Switch to Deep' : 'Switch to Quick'}
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Label htmlFor="manual-text">Enter content to analyze</Label>
                  <InfoTooltip content="Paste any text content here for AI analysis. The system will analyze sentiment, tone, keywords, and provide strategic insights." />
                </div>
                <div className="flex gap-2 mb-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleTryExample}
                    className="flex items-center gap-2"
                  >
                    <Sparkles className="h-4 w-4" />
                    Try Example
                  </Button>
                </div>
                <Textarea
                  id="manual-text"
                  rows={8}
                  placeholder="Paste your content here for AI analysis..."
                  {...form.register("content")}
                  onChange={handleTextareaChange}
                  disabled={isLoading}
                />
              </div>
              
              {/* User Notes Section */}
              <div className="space-y-2">
                <Label htmlFor="user-notes">Your Notes (Optional)</Label>
                <Textarea
                  id="user-notes"
                  rows={3}
                  placeholder="Add your own observations, context, or specific things to focus on during analysis..."
                  value={userNotes}
                  onChange={(e) => setUserNotes(e.target.value)}
                  disabled={isLoading}
                />
                <p className="text-xs text-gray-500">
                  These notes will be saved with your analysis and can help provide context for your strategic insights.
                </p>
              </div>
              
              {/* Progress indicator for streaming analysis */}
              {isLoading && useStreaming && analysisProgress.stage && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">{analysisProgress.stage}</span>
                    <span className="text-gray-500">{analysisProgress.progress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300 ease-out"
                      style={{ width: `${analysisProgress.progress}%` }}
                    ></div>
                  </div>
                </div>
              )}

              <div className="flex justify-between items-center">
                <span className={`text-sm ${charCount > 4500 ? 'text-warning' : 'text-gray-500'}`}>
                  {charCount}/5000 characters
                </span>
                <div className="flex items-center gap-2">
                  <InfoTooltip content="Keyboard shortcut: Ctrl+Enter to analyze" />
                  <Button 
                    type="submit" 
                    disabled={isLoading || !form.watch("content")?.trim()}
                    data-tutorial="analyze-button"
                  >
                    {isLoading ? (
                      <div className="flex items-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        {useStreaming && analysisProgress.stage ? 'Processing...' : 'Analyzing...'}
                      </div>
                    ) : (
                      <>
                        <Brain size={16} className="mr-2" />
                        Analyze Content
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </form>
          </TabsContent>

          <TabsContent value="url" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="url-field">Website URL</Label>
              <div className="flex space-x-2">
                <Input
                  id="url-field"
                  type="url"
                  placeholder="https://example.com/article"
                  {...form.register("url")}
                  disabled={isLoading}
                />
                <Button onClick={handleExtractUrl} disabled={isLoading || !form.watch("url")}>
                  {isLoading ? <LoadingSpinner size="sm" /> : (
                    <>
                      <Download size={16} className="mr-2" />
                      Extract
                    </>
                  )}
                </Button>
              </div>
            </div>
            
            <div className="bg-gray-50 rounded-md p-4">
              <p className="text-sm text-gray-600 flex items-center gap-2">
                <Info size={16} />
                We'll extract and analyze the main content from the webpage automatically.
              </p>
            </div>
            
            {form.watch("content") && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Extracted Content</Label>
                  <Textarea
                    value={form.watch("content")}
                    readOnly
                    rows={4}
                    className="bg-gray-50"
                  />
                </div>
                
                {/* User Notes Section */}
                <div className="space-y-2">
                  <Label htmlFor="url-user-notes">Your Notes (Optional)</Label>
                  <Textarea
                    id="url-user-notes"
                    rows={3}
                    placeholder="Add your own observations, context, or specific things to focus on during analysis..."
                    value={userNotes}
                    onChange={(e) => setUserNotes(e.target.value)}
                    disabled={isLoading}
                  />
                  <p className="text-xs text-gray-500">
                    These notes will be saved with your analysis and can help provide context for your strategic insights.
                  </p>
                </div>
                
                <Button onClick={form.handleSubmit(handleAnalyze)} disabled={isLoading}>
                  {isLoading ? <LoadingSpinner size="sm" /> : (
                    <>
                      <Brain size={16} className="mr-2" />
                      Analyze Content
                    </>
                  )}
                </Button>
              </div>
            )}
          </TabsContent>

          <TabsContent value="selection" className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
              <div className="flex items-center gap-2">
                <Highlighter className="text-blue-600" size={16} />
                <p className="text-sm text-blue-800">
                  Paste your content below, then highlight specific portions by selecting text with your mouse. Only the selected text will be analyzed.
                </p>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="selection-content">Content for Text Selection</Label>
              <Textarea
                id="selection-content"
                rows={8}
                placeholder="Paste your content here, then select specific portions to analyze..."
                value={form.watch("content")}
                onChange={(e) => {
                  const value = e.target.value;
                  form.setValue("content", value);
                  setCharCount(value.length);
                }}
                onMouseUp={handleTextSelection}
                onKeyUp={handleTextSelection}
                disabled={isLoading}
                className="font-mono text-sm"
              />
              <div className="flex justify-between items-center">
                <span className={`text-sm ${charCount > 4500 ? 'text-warning' : 'text-gray-500'}`}>
                  {charCount}/5000 characters
                </span>
                <span className="text-xs text-gray-500">
                  {selectedText ? `${selectedText.length} characters selected` : 'No text selected'}
                </span>
              </div>
            </div>
            
            {selectedText && (
              <div className="bg-orange-50 border border-orange-200 rounded-md p-4">
                <h4 className="text-sm font-medium text-orange-900 mb-2">Selected Text for Analysis:</h4>
                <p className="text-sm text-orange-800 bg-white p-2 rounded border italic">
                  "{selectedText}"
                </p>
              </div>
            )}
            
            <div className="flex justify-end">
              <Button 
                onClick={handleAnalyzeSelection} 
                disabled={isLoading || !selectedText}
                className="bg-orange-600 hover:bg-orange-700"
              >
                {isLoading ? <LoadingSpinner size="sm" /> : (
                  <>
                    <Brain size={16} className="mr-2" />
                    Analyze Selection
                  </>
                )}
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
