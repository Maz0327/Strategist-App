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
import { Edit, Link, Highlighter, Brain, Download, Info, Sparkles, Zap, Search, Mic, Settings } from "lucide-react";
import { InfoTooltip } from "@/components/ui/info-tooltip";
import { useKeyboardShortcuts } from "@/hooks/use-keyboard-shortcuts";
import { SectionedContentDisplay } from "@/components/sectioned-content-display";

interface ContentInputProps {
  onAnalysisComplete?: (analysis: any, content?: any) => void;
  onAnalysisStart?: () => void;
  onAnalysisProgress?: (progress: { stage: string; progress: number }) => void;
}

export function ContentInput({ onAnalysisComplete, onAnalysisStart, onAnalysisProgress }: ContentInputProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [charCount, setCharCount] = useState(0);
  const [activeTab, setActiveTab] = useState("text");
  const [lengthPreference, setLengthPreference] = useState<'short' | 'medium' | 'long' | 'bulletpoints'>('medium');
  const [userNotes, setUserNotes] = useState("");
  const [analysisProgress, setAnalysisProgress] = useState({ stage: '', progress: 0 });
  const [useStreaming, setUseStreaming] = useState(true);
  const [analysisMode, setAnalysisMode] = useState<'quick' | 'deep'>('quick');
  
  // Audio upload states
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [audioTitle, setAudioTitle] = useState("");
  const [audioLanguage, setAudioLanguage] = useState("auto");
  const [audioPrompt, setAudioPrompt] = useState("");
  const [isTranscribing, setIsTranscribing] = useState(false);
  
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
              
              if (eventData.type === 'status') {
                const progressData = { stage: eventData.message, progress: eventData.progress };
                setAnalysisProgress(progressData);
                onAnalysisProgress?.(progressData);
              } else if (eventData.type === 'analysis') {
                // Handle analysis result
                console.log('Analysis data received:', eventData);
                onAnalysisComplete?.(eventData.data, data);
              } else if (eventData.type === 'complete') {
                console.log('Analysis complete event received:', eventData);
                setAnalysisProgress({ stage: 'Complete!', progress: 100 });
                onAnalysisProgress?.({ stage: 'Complete!', progress: 100 });
                
                // eventData.data contains { analysis, signalId }
                onAnalysisComplete?.(eventData.data.analysis, data);
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
      onAnalysisProgress?.({ stage: '', progress: 0 });
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
        
        // result contains { success: true, analysis, signalId }
        onAnalysisComplete?.(result.analysis, data);
        
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

  const [extractedSections, setExtractedSections] = useState<any>(null);
  const [useSectionedDisplay, setUseSectionedDisplay] = useState(true); // Feature toggle

  const handleExtractUrl = async () => {
    const url = form.getValues("url");
    if (!url) return;

    setIsLoading(true);
    try {
      const response = await apiRequest("POST", "/api/extract-url", { url });
      const result = await response.json();
      
      // Store sections for new UI
      if (result.sections) {
        setExtractedSections(result.sections);
      }
      
      // Set form values (backward compatibility)
      form.setValue("content", result.content);
      form.setValue("title", result.title);
      setCharCount(result.content.length);
      
      toast({
        title: "Success",
        description: result.sections ? "Content extracted with structured sections" : "Content extracted successfully",
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

  const handleAudioUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Check file type
    const supportedTypes = ['audio/mp3', 'audio/mpeg', 'audio/wav', 'audio/m4a', 'audio/mp4', 'audio/webm'];
    if (!supportedTypes.some(type => file.type.includes(type.split('/')[1]))) {
      toast({
        title: "Unsupported File Type",
        description: "Please upload an audio file (mp3, wav, m4a, mp4, webm)",
        variant: "destructive",
      });
      return;
    }

    // Check file size (limit to 25MB for Whisper API)
    if (file.size > 25 * 1024 * 1024) {
      toast({
        title: "File Too Large",
        description: "Audio files must be under 25MB",
        variant: "destructive",
      });
      return;
    }

    setAudioFile(file);
    if (!audioTitle) {
      setAudioTitle(file.name.replace(/\.[^/.]+$/, ""));
    }
  };

  const handleAudioAnalyze = async () => {
    if (!audioFile) {
      toast({
        title: "Error",
        description: "Please select an audio file to analyze",
        variant: "destructive",
      });
      return;
    }

    setIsTranscribing(true);
    setIsLoading(true);
    onAnalysisStart?.();
    
    try {
      // Convert file to base64
      const audioBuffer = await audioFile.arrayBuffer();
      const uint8Array = new Uint8Array(audioBuffer);
      const base64Audio = btoa(String.fromCharCode.apply(null, Array.from(uint8Array)));

      // Prepare request data
      const requestData = {
        title: audioTitle || audioFile.name,
        audioFile: base64Audio,
        filename: audioFile.name,
        userNotes: userNotes,
        language: audioLanguage === "auto" ? undefined : audioLanguage,
        prompt: audioPrompt || undefined
      };

      const response = await apiRequest("POST", "/api/signals/audio", requestData);
      const result = await response.json();

      onAnalysisComplete?.(result.analysis, { 
        content: result.transcription,
        title: audioTitle || audioFile.name,
        url: null,
        isAudio: true,
        audioFile: audioFile.name,
        estimatedCost: result.estimatedCost
      });

      toast({
        title: "Audio Analysis Complete",
        description: `Transcription and analysis completed. Estimated cost: $${result.estimatedCost?.toFixed(4) || '0.00'}`,
      });

    } catch (error: any) {
      toast({
        title: "Audio Analysis Failed",
        description: error.message || "Failed to analyze audio content",
        variant: "destructive",
      });
    } finally {
      setIsTranscribing(false);
      setIsLoading(false);
    }
  };

  return (
    <Card className="card-shadow">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg sm:text-xl font-semibold text-gray-900">
          Content Analysis
        </CardTitle>
        <p className="text-sm text-gray-600 mt-1">
          Analyze content to create captures for your strategic pipeline
        </p>
        <div className="mt-2 p-3 bg-blue-50 rounded-lg text-xs sm:text-sm text-blue-800">
          <strong>Process:</strong> Analysis creates captures → Flag as potential signals → Validate to signals → Use in briefs
        </div>
        <div className="mt-4 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="analysis-mode" className="text-sm font-medium">Analysis Mode:</Label>
              <div className="flex items-center gap-2">
                <InfoTooltip content="Quick: Fast analysis with focused insights. Deep: Comprehensive strategic analysis with richer context." />
                <Select value={analysisMode} onValueChange={(value: any) => setAnalysisMode(value)}>
                  <SelectTrigger className="w-full sm:w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="quick">Quick</SelectItem>
                    <SelectItem value="deep">Deep</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="analysis-length" className="text-sm font-medium">Response Length:</Label>
              <div className="flex items-center gap-2">
                <InfoTooltip content="Choose how detailed you want the strategic insights to be. Short for quick overviews, Long for comprehensive analysis." />
                <Select value={lengthPreference} onValueChange={(value: any) => setLengthPreference(value)}>
                  <SelectTrigger className="w-full sm:w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="short">Short</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="long">Long</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-4 sm:p-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 gap-1 h-auto">
            <TabsTrigger value="text" className="flex items-center justify-center gap-1 sm:gap-2 px-1 sm:px-4 py-2 text-xs sm:text-sm min-h-[2.5rem]">
              <Edit size={14} className="sm:w-4 sm:h-4 flex-shrink-0" />
              <span className="hidden sm:inline truncate">Manual Text</span>
              <span className="sm:hidden">Text</span>
            </TabsTrigger>
            <TabsTrigger value="url" className="flex items-center justify-center gap-1 sm:gap-2 px-1 sm:px-4 py-2 text-xs sm:text-sm min-h-[2.5rem]">
              <Link size={14} className="sm:w-4 sm:h-4 flex-shrink-0" />
              <span className="hidden sm:inline truncate">URL Analysis</span>
              <span className="sm:hidden">URL</span>
            </TabsTrigger>
            <TabsTrigger value="audio" className="flex items-center justify-center gap-1 sm:gap-2 px-1 sm:px-4 py-2 text-xs sm:text-sm min-h-[2.5rem]">
              <Mic size={14} className="sm:w-4 sm:h-4 flex-shrink-0" />
              <span className="hidden sm:inline truncate">Audio Upload</span>
              <span className="sm:hidden">Audio</span>
            </TabsTrigger>
            <TabsTrigger value="selection" className="flex items-center justify-center gap-1 sm:gap-2 px-1 sm:px-4 py-2 text-xs sm:text-sm min-h-[2.5rem]">
              <Highlighter size={14} className="sm:w-4 sm:h-4 flex-shrink-0" />
              <span className="hidden sm:inline truncate">Text Selection</span>
              <span className="sm:hidden">Selection</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="text" className="space-y-4 mt-4 w-full">
            <form onSubmit={(e) => {
              console.log("Form submit event triggered");
              console.log("Form validation errors:", form.formState.errors);
              console.log("Form values:", form.getValues());
              form.handleSubmit(handleAnalyze, (errors) => {
                console.log("Form validation failed:", errors);
              })(e);
            }} className="space-y-4">
              {/* Analysis Mode Toggle */}
              <div className="p-3 bg-gray-50 rounded-lg space-y-3">
                <div className="flex items-center justify-between">
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
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setAnalysisMode(analysisMode === 'quick' ? 'deep' : 'quick')}
                    className="h-8 px-3 text-xs"
                  >
                    <span className="hidden sm:inline">
                      {analysisMode === 'quick' ? 'Switch to Deep' : 'Switch to Quick'}
                    </span>
                    <span className="sm:hidden">
                      {analysisMode === 'quick' ? 'Deep' : 'Quick'}
                    </span>
                  </Button>
                </div>
                <div className="text-xs text-gray-500">
                  Est. {analysisMode === 'quick' ? '2-3 seconds' : '8-15 seconds'}
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Label htmlFor="manual-text">Enter content to analyze</Label>
                  <InfoTooltip content="Paste any text content here for AI analysis. The system will analyze sentiment, tone, keywords, and provide strategic insights." />
                </div>
                <div className="flex flex-wrap gap-2 mb-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleTryExample}
                    className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm"
                  >
                    <Sparkles className="h-3 w-3 sm:h-4 sm:w-4" />
                    <span className="hidden sm:inline">Try Example</span>
                    <span className="sm:hidden">Example</span>
                  </Button>
                </div>
                <div className="relative">
                  <Textarea
                    id="manual-text"
                    rows={8}
                    placeholder="Paste your content here for AI analysis..."
                    {...form.register("content")}
                    onChange={handleTextareaChange}
                    disabled={isLoading}
                    className={`transition-all duration-500 ${
                      isLoading 
                        ? 'bg-gradient-to-r from-blue-50 via-purple-50 to-blue-50 border-blue-200 analysis-glow active' 
                        : 'bg-white hover:border-blue-300 focus:border-blue-500'
                    }`}
                  />
                  {/* Elegant analysis overlay */}
                  {isLoading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-r from-blue-50/95 to-purple-50/95 backdrop-blur-sm rounded-md animate-in fade-in-50 duration-500">
                      <div className="text-center space-y-3 floating-animation">
                        <div className="flex items-center justify-center gap-2">
                          <Brain className="h-6 w-6 text-blue-600 animate-pulse" />
                          <span className="text-sm font-medium text-blue-700">
                            {analysisProgress.stage || 'Analyzing content...'}
                          </span>
                        </div>
                        {analysisProgress.progress > 0 && (
                          <div className="w-40 bg-blue-200/50 rounded-full h-2">
                            <div 
                              className="progress-shimmer h-2 rounded-full transition-all duration-500 ease-out"
                              style={{ width: `${analysisProgress.progress}%` }}
                            />
                          </div>
                        )}
                        <div className="text-xs text-blue-600/80 flex items-center justify-center gap-1">
                          <div className="animate-pulse">●</div>
                          <span>Processing insights...</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
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
              
              {/* Elegant progress indicator for streaming analysis */}
              {isLoading && useStreaming && analysisProgress.stage && (
                <div className="space-y-3 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200/50 animate-in fade-in-50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="animate-pulse text-blue-600">
                        <Brain className="h-4 w-4" />
                      </div>
                      <span className="text-sm font-medium text-blue-700">
                        {analysisProgress.stage}
                      </span>
                    </div>
                    <span className="text-sm text-blue-600 font-medium">
                      {Math.round(analysisProgress.progress)}%
                    </span>
                  </div>
                  <div className="w-full bg-blue-200/50 rounded-full h-2">
                    <div 
                      className="progress-shimmer h-2 rounded-full transition-all duration-500 ease-out shadow-sm"
                      style={{ width: `${analysisProgress.progress}%` }}
                    />
                  </div>
                  <div className="text-xs text-blue-600/80 flex items-center gap-1">
                    <div className="animate-pulse">●</div>
                    <span>Processing strategic insights...</span>
                  </div>
                </div>
              )}

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className={`text-xs sm:text-sm ${charCount > 4500 ? 'text-warning' : 'text-gray-500'}`}>
                    {charCount}/5000 characters
                  </span>
                  <InfoTooltip content="Keyboard shortcut: Ctrl+Enter to analyze" />
                </div>
                <Button 
                  type="submit" 
                  disabled={isLoading || !form.watch("content")?.trim()}
                  data-tutorial="analyze-button"
                  className="w-full"
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
            </form>
          </TabsContent>

          <TabsContent value="url" className="space-y-4 mt-4 w-full">
            <div className="space-y-3">
              <Label htmlFor="url-field" className="text-sm font-medium">Website URL</Label>
              <div className="space-y-2">
                <Input
                  id="url-field"
                  type="url"
                  placeholder="https://example.com/article"
                  {...form.register("url")}
                  disabled={isLoading}
                  className="w-full text-sm"
                />
                <Button 
                  onClick={handleExtractUrl} 
                  disabled={isLoading || !form.watch("url")}
                  className="w-full text-sm"
                  size="default"
                >
                  {isLoading ? (
                    <div className="flex items-center justify-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Extracting...</span>
                    </div>
                  ) : (
                    <>
                      <Download size={16} className="mr-2" />
                      Extract Content
                    </>
                  )}
                </Button>
              </div>
            </div>
            
            <div className="bg-gray-50 dark:bg-gray-800 rounded-md p-3 sm:p-4">
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 flex items-start sm:items-center gap-2">
                <Info size={14} className="sm:w-4 sm:h-4 mt-0.5 sm:mt-0 flex-shrink-0" />
                <span>We'll extract and analyze the main content from the webpage automatically.</span>
              </p>
            </div>
            
            {(form.watch("content") || extractedSections) && (
              <div className="space-y-4">
                {/* Toggle between old and new display */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Extracted Content</Label>
                    {extractedSections && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setUseSectionedDisplay(!useSectionedDisplay)}
                        className="text-xs"
                      >
                        <Settings className="h-3 w-3 mr-1" />
                        {useSectionedDisplay ? 'Legacy' : 'Sectioned'}
                      </Button>
                    )}
                  </div>
                </div>
                
                {/* Conditional rendering based on toggle */}
                {extractedSections && useSectionedDisplay ? (
                  <SectionedContentDisplay 
                    sections={extractedSections}
                    onTextChange={(content) => {
                      form.setValue("content", content);
                      setCharCount(content.length);
                    }}
                    isLoading={isLoading}
                  />
                ) : isLoading ? (
                  <div className="space-y-4">
                    <div className="animate-pulse bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 bg-[length:200%_100%] rounded-md h-[120px]" />
                    <div className="flex items-center justify-center gap-2 text-blue-600">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                      <span className="text-sm">Extracting content...</span>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Textarea
                      value={form.watch("content")}
                      onChange={(e) => {
                        form.setValue("content", e.target.value);
                        setCharCount(e.target.value.length);
                      }}
                      rows={4}
                      className="bg-white"
                    />
                  </div>
                )}
                
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
                
                <Button 
                  onClick={form.handleSubmit(handleAnalyze)} 
                  disabled={isLoading}
                  className="w-full"
                >
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

          <TabsContent value="audio" className="space-y-4 mt-4 w-full">
            <div className="bg-green-50 border border-green-200 rounded-md p-4">
              <div className="flex items-center gap-2">
                <Mic className="text-green-600" size={16} />
                <p className="text-sm text-green-800">
                  Upload audio files for automatic transcription and strategic analysis using OpenAI Whisper API.
                </p>
              </div>
            </div>
            
            <div className="grid gap-4">
              <div className="space-y-2">
                <Label htmlFor="audio-upload">Audio File</Label>
                <input
                  id="audio-upload"
                  type="file"
                  accept="audio/*"
                  onChange={handleAudioUpload}
                  disabled={isLoading}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <p className="text-xs text-gray-500">
                  Supported formats: MP3, WAV, M4A, MP4, WebM (max 25MB)
                </p>
              </div>

              {audioFile && (
                <div className="bg-green-50 border border-green-200 rounded-md p-4">
                  <h4 className="text-sm font-medium text-green-900 mb-2">Selected Audio File:</h4>
                  <div className="text-sm text-green-800">
                    <p><strong>File:</strong> {audioFile.name}</p>
                    <p><strong>Size:</strong> {(audioFile.size / (1024 * 1024)).toFixed(2)} MB</p>
                    <p><strong>Type:</strong> {audioFile.type}</p>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="audio-title">Title (Optional)</Label>
                <Input
                  id="audio-title"
                  placeholder="Enter a title for this audio analysis"
                  value={audioTitle}
                  onChange={(e) => setAudioTitle(e.target.value)}
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="audio-language">Language (Optional)</Label>
                  <Select value={audioLanguage} onValueChange={setAudioLanguage} disabled={isLoading}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Auto-detect" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="auto">Auto-detect</SelectItem>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="es">Spanish</SelectItem>
                      <SelectItem value="fr">French</SelectItem>
                      <SelectItem value="de">German</SelectItem>
                      <SelectItem value="it">Italian</SelectItem>
                      <SelectItem value="pt">Portuguese</SelectItem>
                      <SelectItem value="ru">Russian</SelectItem>
                      <SelectItem value="ja">Japanese</SelectItem>
                      <SelectItem value="ko">Korean</SelectItem>
                      <SelectItem value="zh">Chinese</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="audio-prompt">Context Prompt (Optional)</Label>
                  <Input
                    id="audio-prompt"
                    placeholder="e.g., podcast, meeting, interview"
                    value={audioPrompt}
                    onChange={(e) => setAudioPrompt(e.target.value)}
                    disabled={isLoading}
                    className="w-full"
                  />
                </div>
              </div>

              {/* User Notes Section */}
              <div className="space-y-2">
                <Label htmlFor="audio-user-notes">Your Notes (Optional)</Label>
                <Textarea
                  id="audio-user-notes"
                  rows={3}
                  placeholder="Add context about this audio - what should the analysis focus on?"
                  value={userNotes}
                  onChange={(e) => setUserNotes(e.target.value)}
                  disabled={isLoading}
                  className="w-full"
                />
              </div>

              {/* Progress indicator for audio transcription */}
              {isTranscribing && (
                <div className="space-y-3 p-4 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg border border-green-200/50 animate-in fade-in-50">
                  <div className="flex items-center gap-2">
                    <div className="animate-pulse text-green-600">
                      <Mic className="h-4 w-4" />
                    </div>
                    <span className="text-sm font-medium text-green-700">
                      Transcribing audio and analyzing content...
                    </span>
                  </div>
                  <div className="w-full bg-green-200/50 rounded-full h-2">
                    <div className="progress-shimmer h-2 rounded-full transition-all duration-500 ease-out shadow-sm bg-green-600" style={{ width: '100%' }} />
                  </div>
                  <div className="text-xs text-green-600/80 flex items-center gap-1">
                    <div className="animate-pulse">●</div>
                    <span>Using OpenAI Whisper API for transcription...</span>
                  </div>
                </div>
              )}

              <Button 
                onClick={handleAudioAnalyze} 
                disabled={isLoading || !audioFile}
                className="bg-green-600 hover:bg-green-700 w-full"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    {isTranscribing ? 'Transcribing...' : 'Processing...'}
                  </div>
                ) : (
                  <>
                    <Mic size={16} className="mr-2" />
                    Transcribe & Analyze
                  </>
                )}
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="selection" className="space-y-4 mt-4 w-full">
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
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 sm:gap-0">
                <span className={`text-xs sm:text-sm ${charCount > 4500 ? 'text-warning' : 'text-gray-500'}`}>
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
            
            <Button 
              onClick={handleAnalyzeSelection} 
              disabled={isLoading || !selectedText}
              className="bg-orange-600 hover:bg-orange-700 w-full"
            >
              {isLoading ? <LoadingSpinner size="sm" /> : (
                <>
                  <Brain size={16} className="mr-2" />
                  Analyze Selection
                </>
              )}
            </Button>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
