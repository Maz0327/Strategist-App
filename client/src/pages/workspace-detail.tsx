import React, { useState, useMemo } from 'react';
import { useRoute } from 'wouter';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  ArrowLeft,
  Upload,
  Camera,
  FileText,
  ExternalLink,
  Calendar,
  Tag,
  Plus,
  Eye,
  Zap,
  Globe,
  Filter,
  Search,
  Grid,
  List,
  ChevronDown,
  Edit3,
  Check,
  X,
  Brain,
  Image,
  BookOpen,
  Download
} from 'lucide-react';
import { Link } from 'wouter';

interface Signal {
  id: number;
  title: string;
  content: string;
  url?: string;
  userNotes?: string;
  status: 'capture' | 'potential_signal' | 'signal' | 'validated_signal';
  isDraft: boolean;
  capturedAt: string;
  browserContext?: {
    domain: string;
    metadata: any;
  };
  tags?: string[];
}

interface Project {
  id: number;
  name: string;
  description: string;
  createdAt: string;
}

export function WorkspaceDetail() {
  const [match, params] = useRoute('/projects/:id/workspace');
  const projectId = params?.id;
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Upload dialog state
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadContent, setUploadContent] = useState('');
  const [uploadNotes, setUploadNotes] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Smart Capture Viewer state
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [showAnalyzedOnly, setShowAnalyzedOnly] = useState(false);
  const [showNotesOnly, setShowNotesOnly] = useState(false);
  const [showImagesOnly, setShowImagesOnly] = useState(false);
  const [selectedCaptures, setSelectedCaptures] = useState<Set<number>>(new Set());
  const [editingNotes, setEditingNotes] = useState<{ [key: number]: boolean }>({});
  const [editingTags, setEditingTags] = useState<{ [key: number]: boolean }>({});

  // Fetch project details
  const { data: project, isLoading: projectLoading } = useQuery<Project>({
    queryKey: ['/api/projects', projectId],
    queryFn: async () => {
      const response = await fetch(`/api/projects/${projectId}`, {
        credentials: 'include'
      });
      if (!response.ok) {
        throw new Error('Failed to fetch project');
      }
      const result = await response.json();
      return result.data || result;
    },
    enabled: !!projectId
  });

  // Fetch project signals/captures
  const { data: signalsData, isLoading: signalsLoading } = useQuery({
    queryKey: ['/api/signals', 'project', projectId],
    queryFn: async () => {
      const response = await fetch(`/api/signals?projectId=${projectId}`, {
        credentials: 'include'
      });
      return response.json();
    },
    enabled: !!projectId
  });

  // Mobile upload mutation
  const uploadMutation = useMutation({
    mutationFn: async (data: { title: string; content: string; userNotes: string; file?: File }) => {
      const formData = new FormData();
      formData.append('title', data.title);
      formData.append('content', data.content);
      formData.append('user_notes', data.userNotes);
      formData.append('projectId', projectId!);
      formData.append('isDraft', 'true');
      formData.append('status', 'capture');
      
      if (data.file) {
        formData.append('file', data.file);
      }

      const response = await fetch('/api/signals/upload', {
        method: 'POST',
        credentials: 'include',
        body: formData
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/signals', 'project', projectId] });
      toast({
        title: "Content uploaded",
        description: "Your content has been added to the workspace"
      });
      setIsUploadOpen(false);
      setUploadTitle('');
      setUploadContent('');
      setUploadNotes('');
      setSelectedFile(null);
    },
    onError: () => {
      toast({
        title: "Upload failed",
        description: "Please try again later",
        variant: "destructive"
      });
    }
  });

  const handleUpload = () => {
    if (!uploadTitle.trim() && !uploadContent.trim()) {
      toast({
        title: "Content required",
        description: "Please add a title or content",
        variant: "destructive"
      });
      return;
    }

    uploadMutation.mutate({
      title: uploadTitle.trim(),
      content: uploadContent.trim(),
      userNotes: uploadNotes.trim(),
      file: selectedFile || undefined
    });
  };

  // Update signal mutation for inline editing
  const updateSignalMutation = useMutation({
    mutationFn: async ({ signalId, updates }: { signalId: number; updates: Partial<Signal> }) => {
      const response = await apiRequest(`/api/signals/${signalId}`, 'PUT', updates);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/signals', 'project', projectId] });
    },
    onError: () => {
      toast({
        title: "Update failed",
        description: "Please try again later",
        variant: "destructive"
      });
    }
  });

  const signals: Signal[] = signalsData?.data?.signals || [];
  
  // Remove debug logs since the issue is identified

  // Available tags from all signals
  const availableTags = useMemo(() => {
    const tagSet = new Set<string>();
    signals.forEach(signal => {
      if (signal.tags) {
        signal.tags.forEach(tag => tagSet.add(tag));
      }
    });
    return Array.from(tagSet);
  }, [signals]);

  // Filtered signals based on search and filters
  const filteredSignals = useMemo(() => {
    return signals.filter(signal => {
      // Search filter
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        const matchesSearch = 
          signal.title?.toLowerCase().includes(searchLower) ||
          signal.content?.toLowerCase().includes(searchLower) ||
          signal.userNotes?.toLowerCase().includes(searchLower) ||
          signal.url?.toLowerCase().includes(searchLower);
        if (!matchesSearch) return false;
      }

      // Tag filter
      if (selectedTags.length > 0) {
        const hasMatchingTag = selectedTags.some(tag => 
          signal.tags?.includes(tag)
        );
        if (!hasMatchingTag) return false;
      }

      // Status filters
      if (showAnalyzedOnly && signal.isDraft) return false;
      if (showNotesOnly && !signal.userNotes?.trim()) return false;
      if (showImagesOnly && !signal.browserContext?.metadata?.mimetype?.startsWith('image/')) return false;

      return true;
    });
  }, [signals, searchTerm, selectedTags, showAnalyzedOnly, showNotesOnly, showImagesOnly]);

  // Handle inline editing
  const handleNotesEdit = async (signalId: number, newNotes: string) => {
    await updateSignalMutation.mutateAsync({
      signalId,
      updates: { userNotes: newNotes }
    });
    setEditingNotes(prev => ({ ...prev, [signalId]: false }));
  };

  const handleTagsEdit = async (signalId: number, newTags: string[]) => {
    await updateSignalMutation.mutateAsync({
      signalId,
      updates: { tags: newTags }
    });
    setEditingTags(prev => ({ ...prev, [signalId]: false }));
  };

  const handleCaptureSelect = (signalId: number, checked: boolean) => {
    setSelectedCaptures(prev => {
      const newSet = new Set(prev);
      if (checked) {
        newSet.add(signalId);
      } else {
        newSet.delete(signalId);
      }
      return newSet;
    });
  };

  if (projectLoading) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-8"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-48 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Workspace not found</h1>
          <Link href="/workspaces">
            <Button variant="outline">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Workspaces
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6">
      {/* Mobile Header */}
      <div className="sm:hidden mb-4">
        <div className="flex items-center gap-2 mb-3">
          <Link href="/workspaces">
            <Button variant="outline" size="sm">
              <ArrowLeft className="w-4 h-4 mr-1" />
              Back
            </Button>
          </Link>
          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-bold text-gray-900 truncate">{project.name}</h1>
            {project.description && (
              <p className="text-sm text-gray-600 truncate">{project.description}</p>
            )}
          </div>
        </div>
        
        {/* Mobile Action Buttons */}
        <div className="flex gap-2 mb-4">
          <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
            <DialogTrigger asChild>
              <Button className="flex-1">
                <Plus className="w-4 h-4 mr-2" />
                Add Content
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Add Content to Workspace</DialogTitle>
                <DialogDescription>
                  Upload content directly from your mobile device or add text manually
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Title</label>
                  <Input
                    value={uploadTitle}
                    onChange={(e) => setUploadTitle(e.target.value)}
                    placeholder="Content title"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Content</label>
                  <Textarea
                    value={uploadContent}
                    onChange={(e) => setUploadContent(e.target.value)}
                    placeholder="Paste content, URL, or describe what you found..."
                    rows={4}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Your Notes</label>
                  <Textarea
                    value={uploadNotes}
                    onChange={(e) => setUploadNotes(e.target.value)}
                    placeholder="Why is this interesting? What caught your attention?"
                    rows={3}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">File Upload (Optional)</label>
                  <Input
                    type="file"
                    accept="image/*,text/*,.pdf"
                    onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                  />
                </div>
                <div className="flex gap-2">
                  <Button 
                    onClick={handleUpload} 
                    disabled={uploadMutation.isPending}
                    className="flex-1"
                  >
                    {uploadMutation.isPending ? 'Uploading...' : 'Add to Workspace'}
                  </Button>
                  <Button variant="outline" onClick={() => setIsUploadOpen(false)}>
                    Cancel
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
          
          {selectedCaptures.size > 0 && (
            <Button variant="outline" size="sm">
              <Brain className="w-4 h-4 mr-1" />
              Analyze ({selectedCaptures.size})
            </Button>
          )}
        </div>
      </div>

      {/* Desktop Header */}
      <div className="hidden sm:flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Link href="/workspaces">
            <Button variant="outline" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              My Workspaces
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{project.name}</h1>
            <p className="text-gray-600">{project.description}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* View Mode Toggle */}
          <div className="flex border rounded-lg">
            <Button 
              variant={viewMode === 'grid' ? 'default' : 'ghost'} 
              size="sm" 
              onClick={() => setViewMode('grid')}
            >
              <Grid className="w-4 h-4" />
            </Button>
            <Button 
              variant={viewMode === 'list' ? 'default' : 'ghost'} 
              size="sm" 
              onClick={() => setViewMode('list')}
            >
              <List className="w-4 h-4" />
            </Button>
          </div>

          {/* Selected Actions */}
          {selectedCaptures.size > 0 && (
            <Button variant="outline" size="sm">
              <Brain className="w-4 h-4 mr-2" />
              Analyze Selected ({selectedCaptures.size})
            </Button>
          )}

          {/* Desktop Upload Button */}
          <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2">
                <Plus className="w-4 h-4" />
                Add Content
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Add Content to Workspace</DialogTitle>
                <DialogDescription>
                  Upload content directly from your mobile device or add text manually
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Title</label>
                  <Input
                    value={uploadTitle}
                    onChange={(e) => setUploadTitle(e.target.value)}
                    placeholder="Content title"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Content</label>
                  <Textarea
                    value={uploadContent}
                    onChange={(e) => setUploadContent(e.target.value)}
                    placeholder="Paste content, URL, or describe what you found..."
                    rows={4}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Your Notes</label>
                  <Textarea
                    value={uploadNotes}
                    onChange={(e) => setUploadNotes(e.target.value)}
                    placeholder="Why is this interesting? What caught your attention?"
                    rows={3}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">File Upload (Optional)</label>
                  <Input
                    type="file"
                    accept="image/*,text/*,.pdf"
                    onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                  />
                </div>
                <div className="flex gap-2">
                  <Button 
                    onClick={handleUpload} 
                    disabled={uploadMutation.isPending}
                    className="flex-1"
                  >
                    {uploadMutation.isPending ? 'Uploading...' : 'Add to Workspace'}
                  </Button>
                  <Button variant="outline" onClick={() => setIsUploadOpen(false)}>
                    Cancel
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Smart Capture Viewer Layout */}
      <div className="flex gap-6">
        {/* Left Sidebar - Filters */}
        <div className="w-80 space-y-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Filter className="w-4 h-4" />
                Filters & Search
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Search */}
              <div>
                <label className="text-sm font-medium text-gray-700">Search</label>
                <div className="relative mt-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Search content, notes, URLs..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              {/* Tag Filter */}
              <div>
                <label className="text-sm font-medium text-gray-700">Tags</label>
                <Select>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Filter by tags" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableTags.map((tag) => (
                      <SelectItem key={tag} value={tag}>
                        {tag}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Status Filters */}
              <div className="space-y-3">
                <label className="text-sm font-medium text-gray-700">Show Only</label>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="analyzed" 
                      checked={showAnalyzedOnly}
                      onCheckedChange={(checked) => setShowAnalyzedOnly(checked as boolean)}
                    />
                    <label htmlFor="analyzed" className="text-sm">Analyzed content</label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="notes" 
                      checked={showNotesOnly}
                      onCheckedChange={(checked) => setShowNotesOnly(checked as boolean)}
                    />
                    <label htmlFor="notes" className="text-sm">With notes</label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="images" 
                      checked={showImagesOnly}
                      onCheckedChange={(checked) => setShowImagesOnly(checked as boolean)}
                    />
                    <label htmlFor="images" className="text-sm">Images only</label>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Workspace Stats */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Workspace Stats</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Total Captures</span>
                <span className="font-medium">{signals.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Analyzed</span>
                <span className="font-medium">{signals.filter(s => !s.isDraft).length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">With Notes</span>
                <span className="font-medium">{signals.filter(s => s.userNotes?.trim()).length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Selected</span>
                <span className="font-medium">{selectedCaptures.size}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Area */}
        <div className="flex-1">
          {signalsLoading ? (
            <div className={viewMode === 'grid' 
              ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" 
              : "space-y-4"
            }>
              {[1, 2, 3, 4, 5, 6].map(i => (
                <Card key={i} className="animate-pulse">
                  <CardHeader>
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="h-3 bg-gray-200 rounded"></div>
                      <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : filteredSignals.length === 0 ? (
            <Card className="p-8 sm:p-16 min-h-[400px] flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-dashed border-blue-200">
              <div className="text-center max-w-md mx-auto">
                <div className="bg-blue-100 rounded-full p-4 w-20 h-20 mx-auto mb-6 flex items-center justify-center">
                  <Plus className="w-10 h-10 text-blue-600" />
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3">
                  {signals.length === 0 ? 'Ready to Start?' : 'No matching content'}
                </h3>
                <p className="text-gray-600 mb-8 text-base">
                  {signals.length === 0 
                    ? 'Add your first piece of content to begin building strategic intelligence'
                    : 'Try adjusting your filters or search terms'
                  }
                </p>
                {signals.length === 0 && (
                  <div className="space-y-4">
                    <Button 
                      onClick={() => setIsUploadOpen(true)} 
                      size="lg"
                      className="w-full h-16 text-xl font-bold bg-blue-600 hover:bg-blue-700 shadow-lg"
                    >
                      <Plus className="w-6 h-6 mr-3" />
                      Add Your First Content
                    </Button>
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <div className="flex-1 border-t border-gray-300"></div>
                      <span className="bg-white px-3 py-1 rounded-full text-xs font-medium">or</span>
                      <div className="flex-1 border-t border-gray-300"></div>
                    </div>
                    <Button variant="outline" asChild className="w-full h-12 border-blue-200 hover:bg-blue-50">
                      <a href="/chrome-extension" target="_blank">
                        <Camera className="w-5 h-5 mr-2" />
                        Get Chrome Extension
                      </a>
                    </Button>
                  </div>
                )}
              </div>
            </Card>
          ) : (
            <div className={viewMode === 'grid' 
              ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" 
              : "space-y-4"
            }>
              {filteredSignals.map((signal) => (
                <Card key={signal.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2 flex-1">
                        <Checkbox
                          checked={selectedCaptures.has(signal.id)}
                          onCheckedChange={(checked) => handleCaptureSelect(signal.id, checked as boolean)}
                        />
                        <div className="flex-1">
                          <CardTitle className="text-base font-semibold line-clamp-2">
                            {signal.title || 'Untitled Capture'}
                          </CardTitle>
                          <CardDescription className="flex items-center gap-2 mt-1">
                            <Calendar className="w-3 h-3" />
                            {new Date(signal.capturedAt).toLocaleDateString()}
                          </CardDescription>
                        </div>
                      </div>
                      <Badge 
                        variant={signal.isDraft ? "secondary" : "default"}
                        className="ml-2"
                      >
                        {signal.isDraft ? 'Draft' : signal.status.replace('_', ' ')}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {/* File/Content Thumbnail */}
                    {signal.browserContext?.metadata?.mimetype?.startsWith('image/') && (
                      <div className="w-full h-32 bg-gray-100 rounded flex items-center justify-center">
                        <Image className="w-8 h-8 text-gray-400" />
                        <span className="text-xs text-gray-500 ml-2">Image File</span>
                      </div>
                    )}

                    {signal.content && (
                      <p className="text-sm text-gray-600 line-clamp-3">
                        {signal.content}
                      </p>
                    )}
                    
                    {/* Inline Notes Editing */}
                    <div className="bg-blue-50 p-2 rounded">
                      <div className="flex items-center justify-between mb-1">
                        <strong className="text-sm">Notes:</strong>
                        {!editingNotes[signal.id] && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setEditingNotes(prev => ({ ...prev, [signal.id]: true }))}
                          >
                            <Edit3 className="w-3 h-3" />
                          </Button>
                        )}
                      </div>
                      {editingNotes[signal.id] ? (
                        <div className="space-y-2">
                          <Textarea
                            defaultValue={signal.userNotes || ''}
                            placeholder="Add your strategic notes..."
                            rows={2}
                            id={`notes-${signal.id}`}
                          />
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={() => {
                                const textarea = document.getElementById(`notes-${signal.id}`) as HTMLTextAreaElement;
                                handleNotesEdit(signal.id, textarea.value);
                              }}
                            >
                              <Check className="w-3 h-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setEditingNotes(prev => ({ ...prev, [signal.id]: false }))}
                            >
                              <X className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <p className="text-sm">{signal.userNotes || 'Click to add notes...'}</p>
                      )}
                    </div>

                    {signal.url && (
                      <div className="flex items-center gap-2 text-sm text-blue-600">
                        <ExternalLink className="w-3 h-3" />
                        <span className="truncate">
                          {signal.browserContext?.domain || new URL(signal.url).hostname}
                        </span>
                      </div>
                    )}

                    {/* Inline Tags Editing */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <strong className="text-sm">Tags:</strong>
                        {!editingTags[signal.id] && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setEditingTags(prev => ({ ...prev, [signal.id]: true }))}
                          >
                            <Edit3 className="w-3 h-3" />
                          </Button>
                        )}
                      </div>
                      {editingTags[signal.id] ? (
                        <div className="space-y-2">
                          <Input
                            defaultValue={signal.tags?.join(', ') || ''}
                            placeholder="Add tags (comma separated)"
                            id={`tags-${signal.id}`}
                          />
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={() => {
                                const input = document.getElementById(`tags-${signal.id}`) as HTMLInputElement;
                                const tags = input.value.split(',').map(t => t.trim()).filter(t => t);
                                handleTagsEdit(signal.id, tags);
                              }}
                            >
                              <Check className="w-3 h-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setEditingTags(prev => ({ ...prev, [signal.id]: false }))}
                            >
                              <X className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-wrap gap-1">
                          {signal.tags && signal.tags.length > 0 ? (
                            signal.tags.slice(0, 3).map((tag, index) => (
                              <Badge key={index} variant="outline" className="text-xs">
                                <Tag className="w-2 h-2 mr-1" />
                                {tag}
                              </Badge>
                            ))
                          ) : (
                            <span className="text-xs text-gray-500">Click to add tags...</span>
                          )}
                          {signal.tags && signal.tags.length > 3 && (
                            <Badge variant="outline" className="text-xs">
                              +{signal.tags.length - 3} more
                            </Badge>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Truth Analysis Collapsible */}
                    <Collapsible>
                      <CollapsibleTrigger asChild>
                        <Button variant="outline" size="sm" className="w-full">
                          <Brain className="w-3 h-3 mr-2" />
                          Truth Analysis
                          <ChevronDown className="w-3 h-3 ml-auto" />
                        </Button>
                      </CollapsibleTrigger>
                      <CollapsibleContent className="mt-2">
                        <div className="bg-gray-50 p-3 rounded text-sm space-y-2">
                          <div><strong>Fact:</strong> Not analyzed yet</div>
                          <div><strong>Observation:</strong> Not analyzed yet</div>
                          <div><strong>Insight:</strong> Not analyzed yet</div>
                          <Button size="sm" className="mt-2">
                            <Zap className="w-3 h-3 mr-1" />
                            Run Analysis
                          </Button>
                        </div>
                      </CollapsibleContent>
                    </Collapsible>

                    <div className="flex gap-2 pt-2">
                      <Button size="sm" className="flex-1">
                        <Eye className="w-3 h-3 mr-1" />
                        View
                      </Button>
                      {signal.isDraft && (
                        <Button size="sm" variant="outline" className="flex-1">
                          <Zap className="w-3 h-3 mr-1" />
                          Analyze
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}