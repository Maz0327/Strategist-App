import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { formatDistanceToNow } from "date-fns";
import { 
  Brain, 
  Target, 
  AlertTriangle, 
  TrendingUp, 
  Users, 
  Lightbulb,
  RefreshCw,
  CheckCircle,
  Clock,
  Zap
} from "lucide-react";

interface SystemSuggestion {
  capture: {
    id: number;
    title: string;
    content: string;
    summary: string;
    sentiment: string;
    keywords: string[];
    createdAt: string;
  };
  reason: string;
  priority: 'high' | 'medium' | 'low';
  suggestedAction: string;
}

export function SystemSuggestions() {
  const [acceptingIds, setAcceptingIds] = useState<Set<number>>(new Set());
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Enhanced suggestions with loading state
  const { data: suggestionsData, isLoading } = useQuery({
    queryKey: ["/api/system-suggestions"],
    staleTime: 10 * 60 * 1000,
    retry: 1,
    refetchOnWindowFocus: false,
    queryFn: async () => {
      try {
        const response = await fetch('/api/system-suggestions', {
          credentials: 'include'
        });
        if (!response.ok) {
          throw new Error("Failed to fetch suggestions");
        }
        return response.json();
      } catch (error) {
        console.warn('System suggestions unavailable:', error);
        return { suggestions: mockSuggestions };
      }
    },
  });

  // Extract suggestions from API response or use mock data
  const suggestions = suggestionsData?.suggestions || mockSuggestions;

  // Mock suggestions for fallback
  const mockSuggestions: SystemSuggestion[] = [
    {
      capture: {
        id: 1,
        title: "AI Marketing Automation Trends",
        content: "Recent analysis shows 73% increase in AI-powered marketing automation adoption...",
        summary: "AI marketing automation is experiencing rapid growth with significant ROI improvements",
        sentiment: "positive",
        keywords: ["AI", "marketing", "automation", "ROI", "growth"],
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
      },
      reason: "High engagement potential based on trending keywords and positive sentiment. Contains actionable insights for strategic planning.",
      priority: "high",
      suggestedAction: "Flag as potential signal for strategic brief inclusion"
    },
    {
      capture: {
        id: 2,
        title: "Consumer Privacy Concerns in Digital Marketing",
        content: "Survey reveals 68% of consumers are increasingly concerned about data privacy...",
        summary: "Rising privacy concerns are reshaping digital marketing strategies",
        sentiment: "cautious",
        keywords: ["privacy", "digital marketing", "consumer behavior", "data protection"],
        createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString()
      },
      reason: "Strategic risk indicator. Privacy concerns could impact marketing effectiveness and require strategic response.",
      priority: "medium",
      suggestedAction: "Monitor for competitive intelligence and risk assessment"
    }
  ];

  const acceptSuggestionMutation = useMutation({
    mutationFn: async ({ id, reason }: { id: number; reason: string }) => {
      const response = await apiRequest("PUT", `/api/signals/${id}`, {
        status: 'potential_signal',
        promotionReason: reason,
        systemSuggestionReason: reason,
        userNotes: 'Promoted based on system suggestion'
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/signals"] });
      toast({
        title: "Suggestion Accepted",
        description: "Content has been flagged as a potential signal.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to accept suggestion",
        variant: "destructive",
      });
    },
  });

  const handleAcceptSuggestion = async (suggestion: SystemSuggestion) => {
    const captureId = suggestion.capture.id;
    setAcceptingIds(prev => new Set(prev).add(captureId));
    
    try {
      await acceptSuggestionMutation.mutateAsync({
        id: captureId,
        reason: suggestion.reason
      });
    } finally {
      setAcceptingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(captureId);
        return newSet;
      });
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
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

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'high':
        return <AlertTriangle size={16} className="text-red-600" />;
      case 'medium':
        return <Target size={16} className="text-yellow-600" />;
      case 'low':
        return <Lightbulb size={16} className="text-green-600" />;
      default:
        return <Brain size={16} className="text-gray-600" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">AI Suggestions</h2>
          <p className="text-sm text-gray-600 mt-1">
            Smart recommendations for content worth researching further
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="flex items-center gap-1">
            <Brain size={12} />
            {suggestions.length} suggestions
          </Badge>
        </div>
      </div>

      {/* Priority Distribution */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">High Priority</p>
                <p className="text-2xl font-bold text-red-600">
                  {suggestions.filter(s => s.priority === 'high').length}
                </p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Medium Priority</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {suggestions.filter(s => s.priority === 'medium').length}
                </p>
              </div>
              <Target className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Low Priority</p>
                <p className="text-2xl font-bold text-green-600">
                  {suggestions.filter(s => s.priority === 'low').length}
                </p>
              </div>
              <Lightbulb className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Suggestions List */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">Recommended Actions</h3>
        
        {suggestions.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-8">
                <Brain className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No suggestions available</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Analyze more content to get AI-powered recommendations for strategic insights.
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          suggestions
            .sort((a, b) => {
              const priorityOrder = { high: 3, medium: 2, low: 1 };
              return priorityOrder[b.priority] - priorityOrder[a.priority];
            })
            .map((suggestion) => (
              <Card key={suggestion.capture.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      {getPriorityIcon(suggestion.priority)}
                      <div className="flex-1">
                        <CardTitle className="text-lg">{suggestion.capture.title}</CardTitle>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge className={getPriorityColor(suggestion.priority)} variant="secondary">
                            {suggestion.priority} priority
                          </Badge>
                          <span className="text-xs text-gray-500 flex items-center gap-1">
                            <Clock size={12} />
                            {formatDistanceToNow(new Date(suggestion.capture.createdAt), { addSuffix: true })}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 mb-2">Content Summary</h4>
                    <p className="text-sm text-gray-700">{suggestion.capture.summary}</p>
                  </div>

                  <Separator />

                  <div>
                    <h4 className="text-sm font-medium text-gray-900 mb-2">Why This Matters</h4>
                    <p className="text-sm text-gray-700">{suggestion.reason}</p>
                  </div>

                  <Separator />

                  <div>
                    <h4 className="text-sm font-medium text-gray-900 mb-2">Keywords</h4>
                    <div className="flex flex-wrap gap-1">
                      {suggestion.capture.keywords.map((keyword, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {keyword}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-4">
                    <div className="text-sm text-gray-600">
                      <span className="font-medium">Suggested Action:</span> {suggestion.suggestedAction}
                    </div>
                    
                    <Button
                      onClick={() => handleAcceptSuggestion(suggestion)}
                      disabled={acceptingIds.has(suggestion.capture.id) || acceptSuggestionMutation.isPending}
                      className="flex items-center gap-2"
                    >
                      {acceptingIds.has(suggestion.capture.id) ? (
                        <>
                          <RefreshCw size={14} className="animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          <CheckCircle size={14} />
                          Accept Suggestion
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
        )}
      </div>
    </div>
  );
}