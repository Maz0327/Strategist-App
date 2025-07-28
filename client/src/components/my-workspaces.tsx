import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { 
  FolderOpen, 
  Plus, 
  Search, 
  MoreVertical,
  Calendar,
  FileText,
  Zap,
  TrendingUp,
  Users,
  Activity,
  Eye,
  Settings,
  Trash2
} from 'lucide-react';
import { Link } from 'wouter';

interface Project {
  id: number;
  name: string;
  description: string;
  createdAt: string;
  captureCount?: number;
  analyzedCount?: number;
  lastActivity?: string;
}

export function MyWorkspaces() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectDescription, setNewProjectDescription] = useState('');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  // Fetch user's projects
  const { data: projects, isLoading, refetch } = useQuery({
    queryKey: ['/api/projects'],
    staleTime: 1000, // Reduced stale time for better real-time updates
    refetchOnWindowFocus: true
  });

  // Create project mutation
  const createProjectMutation = useMutation({
    mutationFn: async (projectData: { name: string; description: string }) => {
      const response = await apiRequest('/api/projects', 'POST', projectData);
      const result = await response.json();
      console.log('Create project response:', result);
      return result;
    },
    onSuccess: (data) => {
      console.log('Project created successfully:', data);
      // Force refresh the projects list to show new workspace immediately
      queryClient.invalidateQueries({ queryKey: ['/api/projects'] });
      queryClient.refetchQueries({ queryKey: ['/api/projects'] });
      
      const projectName = data?.data?.name || data?.name || 'New workspace';
      toast({
        title: "Workspace created",
        description: `"${projectName}" is ready for content capture`
      });
      setIsCreateDialogOpen(false);
      setNewProjectName('');
      setNewProjectDescription('');
    },
    onError: () => {
      toast({
        title: "Failed to create workspace",
        description: "Please try again later",
        variant: "destructive"
      });
    }
  });

  const handleCreateProject = () => {
    if (!newProjectName.trim()) {
      toast({
        title: "Workspace name required",
        description: "Please enter a name for your workspace",
        variant: "destructive"
      });
      return;
    }

    createProjectMutation.mutate({
      name: newProjectName.trim(),
      description: newProjectDescription.trim()
    });
  };

  // Handle both direct array and wrapped response formats
  const projectList: Project[] = Array.isArray(projects) ? projects : (projects as any)?.data || [];
  
  // Debug logging
  console.log('Projects data:', projects);
  console.log('Project list:', projectList);

  // Filter projects based on search
  const filteredProjects = projectList.filter(project =>
    project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    project.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">My Workspaces</h1>
            <p className="text-gray-600">Organize your content capture and analysis by project</p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
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
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Workspaces</h1>
          <p className="text-gray-600">Organize your content capture and analysis by project</p>
        </div>
        
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              New Workspace
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Workspace</DialogTitle>
              <DialogDescription>
                Set up a new project workspace for organizing your content captures and analysis.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="projectName">Workspace Name</Label>
                <Input
                  id="projectName"
                  placeholder="e.g., Q1 Marketing Campaign"
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="projectDescription">Description (Optional)</Label>
                <Textarea
                  id="projectDescription"
                  placeholder="Brief description of this workspace..."
                  value={newProjectDescription}
                  onChange={(e) => setNewProjectDescription(e.target.value)}
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleCreateProject}
                disabled={createProjectMutation.isPending}
              >
                {createProjectMutation.isPending ? 'Creating...' : 'Create Workspace'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search Bar */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Search workspaces..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Badge variant="secondary" className="text-sm">
          {filteredProjects.length} workspace{filteredProjects.length !== 1 ? 's' : ''}
        </Badge>
      </div>

      {/* Workspaces Grid */}
      {filteredProjects.length === 0 ? (
        <Card className="p-12">
          <div className="text-center">
            <FolderOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {searchTerm ? 'No workspaces found' : 'No workspaces yet'}
            </h3>
            <p className="text-gray-600 mb-6">
              {searchTerm 
                ? 'Try adjusting your search terms'
                : 'Create your first workspace to start organizing content captures'
              }
            </p>
            {!searchTerm && (
              <Button onClick={() => setIsCreateDialogOpen(true)} className="flex items-center gap-2">
                <Plus className="w-4 h-4" />
                Create Your First Workspace
              </Button>
            )}
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProjects.map((project) => (
            <Card key={project.id} className="hover:shadow-md transition-shadow cursor-pointer group">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg font-semibold group-hover:text-blue-600 transition-colors">
                      {project.name}
                    </CardTitle>
                    {project.description && (
                      <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                        {project.description}
                      </p>
                    )}
                  </div>
                  <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity">
                    <MoreVertical className="w-4 h-4" />
                  </Button>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                {/* Workspace Stats */}
                <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    <span>{project.captureCount || 0} captures</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4" />
                    <span>{project.analyzedCount || 0} analyzed</span>
                  </div>
                </div>

                {/* Last Activity */}
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <Calendar className="w-3 h-3" />
                  <span>Created {new Date(project.createdAt).toLocaleDateString()}</span>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2 pt-2">
                  <Button 
                    asChild 
                    size="sm" 
                    className="flex-1"
                  >
                    <Link href={`/projects/${project.id}/workspace`}>
                      <Activity className="w-4 h-4 mr-2" />
                      Open Workspace
                    </Link>
                  </Button>
                  <Button variant="outline" size="sm">
                    <Eye className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Quick Tips Section */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
              <TrendingUp className="w-4 h-4 text-blue-600" />
            </div>
            <div>
              <h3 className="font-medium text-blue-900 mb-2">Streamlined Workflow</h3>
              <p className="text-sm text-blue-800 mb-3">
                Each workspace organizes your content captures by project. Use the Chrome extension to quickly assign captures to the right workspace.
              </p>
              <div className="flex flex-wrap gap-2 text-xs">
                <Badge variant="secondary" className="bg-blue-100 text-blue-800">Chrome Extension Ready</Badge>
                <Badge variant="secondary" className="bg-blue-100 text-blue-800">Batch Analysis</Badge>
                <Badge variant="secondary" className="bg-blue-100 text-blue-800">Strategic Briefs</Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}