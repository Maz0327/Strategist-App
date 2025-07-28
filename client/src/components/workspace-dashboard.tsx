import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  PlayCircle, 
  Edit3, 
  Tag, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  Zap,
  Star,
  Search,
  Filter,
  RefreshCw,
  Archive,
  Eye,
  PenTool,
  Lightbulb
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

interface WorkspaceProps {
  projectId: number;
}

interface Capture {
  id: number;
  title: string;
  content: string;
  url?: string;
  tags: string[];
  workspaceNotes: string;
  analysisStatus: 'pending' | 'analyzing' | 'completed' | 'error';
  briefSectionAssignment: 'define' | 'shift' | 'deliver' | null;
  batchQueueStatus: boolean;
  workspacePriority: number;
  createdAt: string;
  truthAnalysis?: string;
  culturalIntelligence?: string;
  bridgeWorthy?: boolean;
}

interface WorkspaceSession {
  id: number;
  currentView: string;
  filterTags: string[];
  selectedCaptures: number[];
  lastAccessed: string;
}

const STRATEGIC_TAGS = [
  'define-context', 'define-audience', 'define-problem',
  'shift-cultural', 'shift-behavior', 'shift-perception',
  'deliver-creative', 'deliver-format', 'deliver-channel',
  'competitive-intel', 'trend-signal', 'insight-cue',
  'bridge-worthy', 'research-deep', 'priority-high'
];

const BRIEF_SECTIONS = [
  { value: 'define', label: 'Define', color: 'bg-blue-100 text-blue-800' },
  { value: 'shift', label: 'Shift', color: 'bg-purple-100 text-purple-800' },
  { value: 'deliver', label: 'Deliver', color: 'bg-green-100 text-green-800' }
];

export function WorkspaceDashboard({ projectId }: WorkspaceProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTag, setFilterTag] = useState('');
  const [selectedCaptures, setSelectedCaptures] = useState<number[]>([]);
  const [batchAnalysisMode, setBatchAnalysisMode] = useState<'quick' | 'deep'>('quick');

  // Fetch workspace data
  const { data: workspaceData, isLoading } = useQuery({
    queryKey: ['/api/workspace', projectId],
    enabled: !!projectId
  });

  // Update workspace session mutation
  const updateSessionMutation = useMutation({
    mutationFn: async (sessionData: Partial<WorkspaceSession>) => {
      const response = await apiRequest(`/api/workspace/session`, 'POST', { 
        projectId,
        ...sessionData
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/workspace', projectId] });
    }
  });

  // Update capture notes mutation
  const updateNotesMutation = useMutation({
    mutationFn: async ({ captureId, notes }: { captureId: number; notes: string }) => {
      const response = await apiRequest(`/api/workspace/captures/${captureId}/notes`, 'PATCH', { 
        workspaceNotes: notes 
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/workspace', projectId] });
      toast({ title: "Notes updated successfully" });
    }
  });

  // Update capture workspace settings
  const updateWorkspaceMutation = useMutation({
    mutationFn: async ({ captureId, updates }: { captureId: number; updates: any }) => {
      const response = await apiRequest(`/api/workspace/captures/${captureId}/workspace`, 'PATCH', updates);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/workspace', projectId] });
      toast({ title: "Workspace settings updated" });
    }
  });

  // Batch analysis mutation
  const batchAnalysisMutation = useMutation({
    mutationFn: async ({ captureIds, mode }: { captureIds: number[]; mode: 'quick' | 'deep' }) => {
      const response = await apiRequest('/api/workspace/analysis/batch', 'POST', { 
        captureIds, 
        analysisMode: mode 
      });
      return response.json();
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ['/api/workspace', projectId] });
      toast({ 
        title: "Batch analysis completed", 
        description: `Processed ${data.processed || 0} captures` 
      });
      setSelectedCaptures([]);
    },
    onError: () => {
      toast({ 
        title: "Batch analysis failed", 
        variant: "destructive" 
      });
    }
  });

  const captures: Capture[] = workspaceData?.data?.captures || [];
  const project = workspaceData?.data?.project;
  const workspaceSession = workspaceData?.data?.workspaceSession;

  // Filter captures based on search and tags
  const filteredCaptures = captures.filter(capture => {
    const matchesSearch = searchTerm === '' || 
      capture.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      capture.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
      capture.workspaceNotes.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesTag = filterTag === '' || capture.tags.includes(filterTag);
    
    return matchesSearch && matchesTag;
  });

  // Handle individual capture analysis
  const handleAnalyzeCapture = async (captureId: number) => {
    try {
      await updateWorkspaceMutation.mutateAsync({
        captureId,
        updates: { analysisStatus: 'analyzing' }
      });
      
      // Simulate analysis completion (replace with actual analysis call)
      setTimeout(() => {
        updateWorkspaceMutation.mutate({
          captureId,
          updates: { analysisStatus: 'completed' }
        });
      }, 3000);
    } catch (error) {
      toast({ title: "Analysis failed", variant: "destructive" });
    }
  };

  // Handle batch queue toggle
  const handleBatchQueue = (captureId: number, inQueue: boolean) => {
    updateWorkspaceMutation.mutate({
      captureId,
      updates: { batchQueueStatus: inQueue }
    });

    if (inQueue && !selectedCaptures.includes(captureId)) {
      setSelectedCaptures([...selectedCaptures, captureId]);
    } else if (!inQueue) {
      setSelectedCaptures(selectedCaptures.filter(id => id !== captureId));
    }
  };

  // Handle batch analysis
  const handleBatchAnalysis = () => {
    const queuedCaptures = captures
      .filter(c => c.batchQueueStatus)
      .map(c => c.id);
    
    if (queuedCaptures.length === 0) {
      toast({ title: "No captures queued for analysis" });
      return;
    }

    batchAnalysisMutation.mutate({
      captureIds: queuedCaptures,
      mode: batchAnalysisMode
    });
  };

  // Render analysis status badge
  const renderAnalysisStatus = (status: string) => {
    const statusConfig = {
      pending: { color: 'bg-gray-100 text-gray-800', icon: Clock },
      analyzing: { color: 'bg-blue-100 text-blue-800', icon: RefreshCw },
      completed: { color: 'bg-green-100 text-green-800', icon: CheckCircle },
      error: { color: 'bg-red-100 text-red-800', icon: AlertCircle }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    const Icon = config.icon;

    return (
      <Badge className={config.color}>
        <Icon className="w-3 h-3 mr-1" />
        {status}
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-6 h-6 animate-spin" />
        <span className="ml-2">Loading workspace...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Workspace Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold">{project?.name} Workspace</h1>
          <p className="text-muted-foreground">
            {captures.length} captures • {captures.filter(c => c.analysisStatus === 'completed').length} analyzed
          </p>
        </div>
        
        <div className="flex gap-2">
          <Select value={batchAnalysisMode} onValueChange={(value: 'quick' | 'deep') => setBatchAnalysisMode(value)}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="quick">Quick Mode</SelectItem>
              <SelectItem value="deep">Deep Mode</SelectItem>
            </SelectContent>
          </Select>
          
          <Button 
            onClick={handleBatchAnalysis}
            disabled={batchAnalysisMutation.isPending || captures.filter(c => c.batchQueueStatus).length === 0}
            className="gap-2"
          >
            <Zap className="w-4 h-4" />
            Batch Analyze ({captures.filter(c => c.batchQueueStatus).length})
          </Button>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="flex gap-4">
        <div className="flex-1">
          <Input
            placeholder="Search captures..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full"
          />
        </div>
        
        <Select value={filterTag} onValueChange={setFilterTag}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter by tag" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All tags</SelectItem>
            {STRATEGIC_TAGS.map(tag => (
              <SelectItem key={tag} value={tag}>{tag}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Captures Grid */}
      <div className="grid gap-4">
        {filteredCaptures.map(capture => (
          <Card key={capture.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start gap-4">
                <div className="flex-1">
                  <CardTitle className="text-lg">{capture.title}</CardTitle>
                  <div className="flex gap-2 mt-2">
                    {renderAnalysisStatus(capture.analysisStatus)}
                    {capture.briefSectionAssignment && (
                      <Badge className={BRIEF_SECTIONS.find(s => s.value === capture.briefSectionAssignment)?.color}>
                        {BRIEF_SECTIONS.find(s => s.value === capture.briefSectionAssignment)?.label}
                      </Badge>
                    )}
                    {capture.bridgeWorthy && (
                      <Badge className="bg-yellow-100 text-yellow-800">
                        <Star className="w-3 h-3 mr-1" />
                        Bridge Worthy
                      </Badge>
                    )}
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <Checkbox
                    checked={capture.batchQueueStatus}
                    onCheckedChange={(checked) => handleBatchQueue(capture.id, !!checked)}
                  />
                  
                  {capture.analysisStatus === 'pending' && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleAnalyzeCapture(capture.id)}
                      className="gap-1"
                    >
                      <PlayCircle className="w-4 h-4" />
                      Analyze
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-4">
              {/* Content Preview */}
              <div className="text-sm text-muted-foreground line-clamp-2">
                {capture.content}
              </div>

              {/* Tags */}
              {capture.tags.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {capture.tags.map(tag => (
                    <Badge key={tag} variant="secondary" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}

              {/* Workspace Notes */}
              <div>
                <Textarea
                  placeholder="Add workspace notes..."
                  value={capture.workspaceNotes}
                  onChange={(e) => {
                    // Debounced update (simplified)
                    setTimeout(() => {
                      updateNotesMutation.mutate({
                        captureId: capture.id,
                        notes: e.target.value
                      });
                    }, 1000);
                  }}
                  className="min-h-20 text-sm"
                />
              </div>

              {/* Analysis Results (if completed) */}
              {capture.analysisStatus === 'completed' && capture.truthAnalysis && (
                <div className="bg-gray-50 p-3 rounded-lg">
                  <h4 className="font-medium mb-2 flex items-center gap-2">
                    <Eye className="w-4 h-4" />
                    Analysis Results
                  </h4>
                  <p className="text-sm">{capture.truthAnalysis}</p>
                </div>
              )}

              {/* Quick Actions */}
              <div className="flex justify-between items-center pt-2 border-t">
                <div className="flex gap-2">
                  <Select 
                    value={capture.briefSectionAssignment || ''} 
                    onValueChange={(value) => 
                      updateWorkspaceMutation.mutate({
                        captureId: capture.id,
                        updates: { briefSectionAssignment: value || null }
                      })
                    }
                  >
                    <SelectTrigger className="w-32 h-8 text-xs">
                      <SelectValue placeholder="Section" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">No section</SelectItem>
                      {BRIEF_SECTIONS.map(section => (
                        <SelectItem key={section.value} value={section.value}>
                          {section.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="text-xs text-muted-foreground">
                  {new Date(capture.createdAt).toLocaleDateString()}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredCaptures.length === 0 && (
        <div className="text-center py-12">
          <Archive className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">No captures found</h3>
          <p className="text-muted-foreground">
            {searchTerm || filterTag ? 'Try adjusting your search filters' : 'Start capturing content to see it here'}
          </p>
        </div>
      )}
    </div>
  );
}