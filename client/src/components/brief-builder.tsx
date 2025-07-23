import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { FileText, Download, Share, Eye, Plus, Trash2, Edit, Save, Calendar, TrendingUp, ChevronDown, Presentation } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import type { Signal } from "@shared/schema";

interface Brief {
  id: string;
  title: string;
  content: string;
  signals: Signal[];
  format: 'markdown' | 'text' | 'html';
  createdAt: string;
  updatedAt: string;
}

export function BriefBuilder() {
  const [selectedSignals, setSelectedSignals] = useState<Set<number>>(new Set());
  const [briefTitle, setBriefTitle] = useState("");
  const [briefContent, setBriefContent] = useState("");
  const [briefFormat, setBriefFormat] = useState<'markdown' | 'text' | 'html'>('markdown');
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isGeneratingBrief, setIsGeneratingBrief] = useState(false);
  const [savedBriefs, setSavedBriefs] = useState<Brief[]>([]);
  const { toast } = useToast();

  const { data: signalsData, isLoading: isLoadingSignals, error } = useQuery<{ signals: Signal[] }>({
    queryKey: ["/api/signals"],
    retry: false,
    refetchOnWindowFocus: false,
    queryFn: async () => {
      try {
        const response = await fetch('/api/signals', {
          credentials: 'include'
        });
        if (!response.ok) {
          throw new Error("Failed to fetch signals");
        }
        return response.json();
      } catch (error) {
        console.warn('Failed to fetch signals for brief builder:', error);
        return { signals: [] };
      }
    },
  });

  const signals = signalsData?.signals || [];
  // Only show content that has been validated as signals and ready for brief creation
  const readySignals = signals.filter(signal => signal.status === 'signal');

  const generateBriefMutation = useMutation({
    mutationFn: async (data: { title: string; signalIds: number[] }) => {
      const response = await apiRequest("POST", "/api/brief/generate", data);
      return response.json();
    },
    onSuccess: (data) => {
      setBriefContent(data.content);
      toast({
        title: "Brief Generated",
        description: "Your strategic brief has been generated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to generate brief",
        variant: "destructive",
      });
    },
  });

  const handleSignalToggle = (signalId: number) => {
    const newSelected = new Set(selectedSignals);
    if (newSelected.has(signalId)) {
      newSelected.delete(signalId);
    } else {
      newSelected.add(signalId);
    }
    setSelectedSignals(newSelected);
  };

  const handleGenerateBrief = async () => {
    if (selectedSignals.size === 0) {
      toast({
        title: "No Signals Selected",
        description: "Please select at least one validated signal to generate a brief",
        variant: "destructive",
      });
      return;
    }

    if (!briefTitle.trim()) {
      toast({
        title: "Title Required",
        description: "Please enter a title for your brief",
        variant: "destructive",
      });
      return;
    }

    setIsGeneratingBrief(true);
    try {
      const selectedSignalData = readySignals.filter(s => selectedSignals.has(s.id));
      
      // Generate brief content from selected signals
      const briefSections = selectedSignalData.map(signal => {
        return `## ${signal.title || 'Untitled Signal'}

**Source:** ${signal.url || 'Manual Entry'}
**Sentiment:** ${signal.sentiment || 'Neutral'}
**Tone:** ${signal.tone || 'Professional'}
**Confidence:** ${signal.confidence || 'N/A'}

### Summary
${signal.summary || 'No summary available'}

### Key Insights
${signal.keywords?.map(keyword => `- ${keyword}`).join('\n') || 'No keywords available'}

---
`;
      });

      const generatedContent = `# ${briefTitle}

*Generated on ${new Date().toLocaleDateString()}*

## Executive Summary

This strategic brief combines **${selectedSignals.size} validated signals** to create actionable insights for strategic decision-making. These signals have been promoted from initial captures through analysis and validation.

## Key Insights

${briefSections.join('\n')}

## Strategic Recommendations

Based on the analyzed signals, we recommend:

1. **High-Priority Actions:** Focus on signals with positive sentiment and high confidence scores
2. **Trend Monitoring:** Track emerging patterns revealed by multiple signals
3. **Risk Mitigation:** Address negative sentiment signals promptly to prevent issues
4. **Opportunity Capture:** Leverage insights from trending keywords and topics

## Implementation Roadmap

**Phase 1 (Immediate):** Act on high-confidence positive signals  
**Phase 2 (Short-term):** Monitor trend developments from medium-confidence signals  
**Phase 3 (Long-term):** Develop strategies based on emerging patterns  

## Conclusion

The ${selectedSignals.size} signals analyzed in this brief provide validated insights ready for strategic implementation. These signals represent curated content that has moved through our analysis pipeline from initial capture to strategic intelligence.

---

*Brief generated from ${selectedSignals.size} validated signals*`;

      setBriefContent(generatedContent);
      
      toast({
        title: "Brief Generated",
        description: "Your strategic brief has been created successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate brief",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingBrief(false);
    }
  };

  const handleSaveBrief = () => {
    if (!briefTitle.trim() || !briefContent.trim()) {
      toast({
        title: "Incomplete Brief",
        description: "Please ensure the brief has a title and content",
        variant: "destructive",
      });
      return;
    }

    const newBrief: Brief = {
      id: Date.now().toString(),
      title: briefTitle,
      content: briefContent,
      signals: signals.filter(s => selectedSignals.has(s.id)),
      format: briefFormat,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setSavedBriefs(prev => [newBrief, ...prev]);
    toast({
      title: "Brief Saved",
      description: "Your brief has been saved successfully",
    });
  };

  const handleExportBrief = () => {
    if (!briefContent.trim()) {
      toast({
        title: "No Content",
        description: "Please generate or write content before exporting",
        variant: "destructive",
      });
      return;
    }

    const blob = new Blob([briefContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${briefTitle || 'strategic-brief'}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: "Brief Exported",
      description: "Your brief has been downloaded as a text file",
    });
  };

  const generateSlidesContent = () => {
    const selectedSignalsList = signals.filter(s => selectedSignals.has(s.id));
    
    // Create structured slides content
    const slidesContent = `STRATEGIC BRIEF - PRESENTATION FORMAT
${briefTitle || 'Untitled Strategic Brief'}
Generated: ${new Date().toLocaleDateString()}

==========================================

SLIDE 1: TITLE SLIDE
==========================================
Title: ${briefTitle || 'Strategic Brief'}
Subtitle: Strategic Intelligence from ${selectedSignalsList.length} Validated Signals
Date: ${new Date().toLocaleDateString()}
Prepared by: Strategic Analysis Platform

==========================================

SLIDE 2: EXECUTIVE SUMMARY
==========================================
Title: Executive Summary

Key Findings:
• Analyzed ${selectedSignalsList.length} strategic signals
• ${selectedSignalsList.filter(s => s.sentiment === 'positive').length} positive sentiment indicators
• ${selectedSignalsList.filter(s => s.sentiment === 'negative').length} risk factors identified
• ${selectedSignalsList.filter(s => s.attentionValue === 'high').length} high-attention opportunities

Strategic Recommendations:
${briefContent.split('\n').slice(0, 3).map(line => `• ${line.trim()}`).join('\n')}

==========================================

${selectedSignalsList.map((signal, index) => `
SLIDE ${index + 3}: SIGNAL ANALYSIS - ${signal.title?.toUpperCase() || 'UNTITLED'}
==========================================
Title: ${signal.title || 'Untitled Signal'}

Truth Analysis:
• Fact: ${signal.truthFact || 'Not analyzed'}
• Observation: ${signal.truthObservation || 'Not analyzed'}
• Insight: ${signal.truthInsight || 'Not analyzed'}
• Human Truth: ${signal.humanTruth || 'Not analyzed'}

Strategic Context:
• Sentiment: ${signal.sentiment || 'Unknown'}
• Attention Value: ${signal.attentionValue || 'Unknown'}
• Viral Potential: ${signal.viralPotential || 'Unknown'}
• Cultural Moment: ${signal.culturalMoment || 'Not identified'}

Key Metrics:
• Confidence: ${signal.confidence || 'Not specified'}
• Platform Context: ${signal.platformContext || 'Not specified'}
• Keywords: ${signal.keywords?.join(', ') || 'None specified'}

Cohort Opportunities:
${signal.cohortSuggestions?.map(cohort => `• ${cohort}`).join('\n') || '• No cohorts identified'}

Next Actions:
${signal.nextActions?.map(action => `• ${action}`).join('\n') || '• No actions specified'}
`).join('\n')}

==========================================

SLIDE ${selectedSignalsList.length + 3}: STRATEGIC RECOMMENDATIONS
==========================================
Title: Strategic Action Plan

Immediate Priorities:
${selectedSignalsList.filter(s => s.attentionValue === 'high').map(s => `• Leverage ${s.title} for high-attention opportunity`).join('\n')}

Risk Mitigation:
${selectedSignalsList.filter(s => s.sentiment === 'negative').map(s => `• Address concerns from ${s.title}`).join('\n')}

Growth Opportunities:
${selectedSignalsList.filter(s => s.viralPotential === 'high').map(s => `• Scale ${s.title} across platforms`).join('\n')}

Cultural Timing:
${selectedSignalsList.filter(s => s.culturalMoment).map(s => `• ${s.culturalMoment}`).join('\n')}

==========================================

SLIDE ${selectedSignalsList.length + 4}: NEXT STEPS
==========================================
Title: Implementation Roadmap

30-Day Actions:
${selectedSignalsList.flatMap(s => s.nextActions || []).slice(0, 3).map(action => `• ${action}`).join('\n')}

90-Day Goals:
• Monitor signal evolution and market response
• Implement cohort-specific campaigns
• Measure attention arbitrage opportunities
• Assess competitive positioning

Success Metrics:
• Track engagement across identified cohorts
• Monitor viral coefficient for high-potential content
• Measure attention value optimization
• Assess cultural timing effectiveness

==========================================

APPENDIX: DATA SOURCES
==========================================
Signal Sources:
${selectedSignalsList.map(s => `• ${s.title}: Created ${formatDistanceToNow(new Date(s.createdAt!), { addSuffix: true })}`).join('\n')}

Analysis Framework:
• Truth-based analysis (Fact → Observation → Insight → Human Truth)
• Cultural intelligence assessment
• Attention arbitrage identification
• 7-pillar cohort methodology
• Strategic action prioritization

Generated by Strategic Analysis Platform
${new Date().toLocaleString()}`;

    return slidesContent;
  };

  const handleExportSlides = () => {
    if (!briefContent.trim() || selectedSignals.size === 0) {
      toast({
        title: "No Content",
        description: "Please generate content and select signals before exporting slides",
        variant: "destructive",
      });
      return;
    }

    const slidesContent = generateSlidesContent();
    const blob = new Blob([slidesContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${briefTitle || 'strategic-brief'}-slides.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: "Slides Format Exported",
      description: "Your brief has been exported in presentation format. Ready for import to Google Slides or PowerPoint.",
    });
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
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Strategic Brief Builder</h2>
          <p className="text-sm text-gray-600 mt-1">
            Transform validated signals into strategic insights and actionable briefs
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={() => setIsPreviewOpen(true)} disabled={!briefContent}>
            <Eye className="mr-2 h-4 w-4" />
            Preview
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" disabled={!briefContent}>
                <Download className="mr-2 h-4 w-4" />
                Export
                <ChevronDown className="ml-1 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={handleExportBrief}>
                <FileText className="mr-2 h-4 w-4" />
                Text File
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleExportSlides}>
                <Presentation className="mr-2 h-4 w-4" />
                Slides Format
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button onClick={handleSaveBrief} disabled={!briefContent}>
            <Save className="mr-2 h-4 w-4" />
            Save Brief
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Signal Selection */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Select Signals</CardTitle>
              <p className="text-sm text-gray-600">
                Only validated signals are available for brief creation
              </p>
              <div className="mt-2 p-2 bg-blue-50 rounded text-xs text-blue-800">
                <strong>Hierarchy:</strong> Capture → Potential Signal → Signal → Insight → Brief
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {readySignals.map((signal) => (
                  <div
                    key={signal.id}
                    className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                      selectedSignals.has(signal.id)
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => handleSignalToggle(signal.id)}
                  >
                    <div className="flex items-start space-x-3">
                      <Checkbox
                        checked={selectedSignals.has(signal.id)}
                        onChange={() => handleSignalToggle(signal.id)}
                        className="mt-1"
                      />
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-medium text-gray-900 truncate">
                          {signal.title || "Untitled Signal"}
                        </h4>
                        <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                          {signal.summary || "No summary available"}
                        </p>
                        <div className="flex items-center space-x-2 mt-2">
                          {signal.sentiment && (
                            <Badge className={getSentimentColor(signal.sentiment)} variant="secondary">
                              {signal.sentiment}
                            </Badge>
                          )}
                          <span className="text-xs text-gray-500">
                            {formatDistanceToNow(new Date(signal.createdAt!), { addSuffix: true })}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              {readySignals.length === 0 && (
                <div className="text-center py-8">
                  <TrendingUp className="mx-auto h-8 w-8 text-gray-400" />
                  <p className="text-sm text-gray-500 mt-2">
                    No validated signals available.
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    Promote captures and potential signals to the "Signal" status first.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Brief Builder */}
        <div className="lg:col-span-2 space-y-6">
          {/* Brief Configuration */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Brief Configuration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="brief-title">Brief Title</Label>
                <Input
                  id="brief-title"
                  placeholder="Enter brief title..."
                  value={briefTitle}
                  onChange={(e) => setBriefTitle(e.target.value)}
                />
              </div>
              
              <div className="flex items-center space-x-4">
                <div className="flex-1">
                  <Label htmlFor="brief-format">Format</Label>
                  <Select value={briefFormat} onValueChange={(value: 'markdown' | 'text' | 'html') => setBriefFormat(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="markdown">Markdown</SelectItem>
                      <SelectItem value="text">Plain Text</SelectItem>
                      <SelectItem value="html">HTML</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-600">
                    {selectedSignals.size} signals selected
                  </span>
                  <Button
                    onClick={handleGenerateBrief}
                    disabled={isGeneratingBrief || selectedSignals.size === 0}
                  >
                    {isGeneratingBrief ? "Generating..." : "Generate Brief"}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Brief Editor */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Brief Content</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                placeholder="Your brief content will appear here after generation, or you can write it manually..."
                value={briefContent}
                onChange={(e) => setBriefContent(e.target.value)}
                rows={20}
                className="font-mono text-sm"
              />
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Saved Briefs */}
      {savedBriefs.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Saved Briefs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {savedBriefs.map((brief) => (
                <div key={brief.id} className="p-4 border rounded-lg hover:shadow-md transition-shadow">
                  <h4 className="font-medium text-gray-900 truncate">{brief.title}</h4>
                  <p className="text-sm text-gray-500 mt-1">
                    {brief.signals.length} signals • {formatDistanceToNow(new Date(brief.createdAt), { addSuffix: true })}
                  </p>
                  <div className="flex items-center space-x-2 mt-3">
                    <Button variant="outline" size="sm">
                      <Edit className="mr-1 h-3 w-3" />
                      Edit
                    </Button>
                    <Button variant="outline" size="sm">
                      <Download className="mr-1 h-3 w-3" />
                      Export
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Preview Dialog */}
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="sm:max-w-[800px] max-h-[600px]" aria-describedby="brief-preview-desc">
          <DialogHeader>
            <DialogTitle>Brief Preview</DialogTitle>
          </DialogHeader>
          <div id="brief-preview-desc" className="sr-only">
            Preview your generated strategic brief before saving or exporting. The brief contains analysis from your selected signals.
          </div>
          <div className="overflow-auto">
            <div className="prose prose-sm max-w-none">
              <pre className="whitespace-pre-wrap text-sm">{briefContent}</pre>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}