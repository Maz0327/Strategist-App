import React, { useState } from 'react';
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
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
  Globe
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
  
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadContent, setUploadContent] = useState('');
  const [uploadNotes, setUploadNotes] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Fetch project details
  const { data: project, isLoading: projectLoading } = useQuery({
    queryKey: ['/api/projects', projectId],
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

  const signals: Signal[] = signalsData?.data?.signals || [];
  const projectData: Project = (project as any)?.data || project;

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

  if (!projectData) {
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
    <div className="max-w-6xl mx-auto p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Link href="/workspaces">
            <Button variant="outline" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              My Workspaces
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{projectData.name}</h1>
            <p className="text-gray-600">{projectData.description}</p>
          </div>
        </div>

        {/* Mobile Upload Button */}
        <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Add Content</span>
              <Upload className="w-4 h-4 sm:hidden" />
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

      {/* Workspace Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-blue-600" />
              <span className="text-sm text-gray-600">Total Captures</span>
            </div>
            <div className="text-2xl font-bold">{signals.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Eye className="w-4 h-4 text-green-600" />
              <span className="text-sm text-gray-600">Analyzed</span>
            </div>
            <div className="text-2xl font-bold">
              {signals.filter(s => !s.isDraft).length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-orange-600" />
              <span className="text-sm text-gray-600">Signals</span>
            </div>
            <div className="text-2xl font-bold">
              {signals.filter(s => s.status === 'signal' || s.status === 'validated_signal').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4 text-purple-600" />
              <span className="text-sm text-gray-600">Sources</span>
            </div>
            <div className="text-2xl font-bold">
              {new Set(signals.filter(s => s.url).map(s => new URL(s.url!).hostname)).size}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Content Cards */}
      {signalsLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
      ) : signals.length === 0 ? (
        <Card className="p-12">
          <div className="text-center">
            <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No content yet</h3>
            <p className="text-gray-600 mb-6">
              Use the Chrome extension to capture content or upload directly from mobile
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button onClick={() => setIsUploadOpen(true)} className="flex items-center gap-2">
                <Plus className="w-4 h-4" />
                Add First Content
              </Button>
              <Button variant="outline" asChild>
                <a href="/chrome-extension" target="_blank">
                  <Camera className="w-4 h-4 mr-2" />
                  Get Extension
                </a>
              </Button>
            </div>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {signals.map((signal) => (
            <Card key={signal.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-base font-semibold line-clamp-2">
                      {signal.title || 'Untitled Capture'}
                    </CardTitle>
                    <CardDescription className="flex items-center gap-2 mt-1">
                      <Calendar className="w-3 h-3" />
                      {new Date(signal.capturedAt).toLocaleDateString()}
                    </CardDescription>
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
                {signal.content && (
                  <p className="text-sm text-gray-600 line-clamp-3">
                    {signal.content}
                  </p>
                )}
                
                {signal.userNotes && (
                  <div className="bg-blue-50 p-2 rounded text-sm">
                    <strong>Notes:</strong> {signal.userNotes}
                  </div>
                )}

                {signal.url && (
                  <div className="flex items-center gap-2 text-sm text-blue-600">
                    <ExternalLink className="w-3 h-3" />
                    <span className="truncate">
                      {signal.browserContext?.domain || new URL(signal.url).hostname}
                    </span>
                  </div>
                )}

                {signal.tags && signal.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {signal.tags.slice(0, 3).map((tag, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        <Tag className="w-2 h-2 mr-1" />
                        {tag}
                      </Badge>
                    ))}
                    {signal.tags.length > 3 && (
                      <Badge variant="outline" className="text-xs">
                        +{signal.tags.length - 3} more
                      </Badge>
                    )}
                  </div>
                )}

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
  );
}