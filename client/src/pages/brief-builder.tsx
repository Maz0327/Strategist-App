import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { toast } from "@/hooks/use-toast";
import { 
  FileText, 
  Plus, 
  FolderPlus, 
  Users, 
  Target, 
  Lightbulb, 
  Download,
  Calendar,
  Settings,
  Trash2,
  Edit3,
  Eye,
  Play,
  Image,
  Link
} from "lucide-react";

interface Project {
  id: number;
  name: string;
  description: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

interface ProjectCapture {
  id: number;
  title: string;
  content: string;
  url?: string;
  userNotes?: string;
  templateSection?: string;
  visualAssets?: any;
  qualScore?: number;
  createdAt: string;
}

interface GeneratedBrief {
  id: number;
  projectId: number;
  templateId: string;
  content: any;
  status: string;
  createdAt: string;
}

const TEMPLATE_SECTIONS = [
  { id: 'performance', name: 'Performance', description: 'Current performance metrics and baseline data' },
  { id: 'cultural_signals', name: 'Cultural Signals', description: 'Cultural moments and societal trends' },
  { id: 'platform_signals', name: 'Platform Signals', description: 'Platform-specific insights and behaviors' },
  { id: 'opportunities', name: 'Opportunities', description: 'Strategic opportunities and gaps' },
  { id: 'cohorts', name: 'Cohorts', description: 'Target audience insights and personas' },
  { id: 'ideation', name: 'Ideation', description: 'Creative concepts and recommendations' }
];

export default function BriefBuilder() {
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [showNewProjectDialog, setShowNewProjectDialog] = useState(false);
  const [showBriefPreview, setShowBriefPreview] = useState(false);
  const [newProjectForm, setNewProjectForm] = useState({ name: '', description: '' });
  const [selectedBrief, setSelectedBrief] = useState<GeneratedBrief | null>(null);
  const [activeTab, setActiveTab] = useState('projects');
  const queryClient = useQueryClient();

  // Fetch projects
  const { data: projects = [], isLoading: projectsLoading } = useQuery({
    queryKey: ['/api/projects'],
    queryFn: async () => {
      const response = await fetch('/api/projects', { credentials: 'include' });
      if (!response.ok) throw new Error('Failed to fetch projects');
      return response.json();
    }
  });

  // Fetch project captures
  const { data: captures = [], isLoading: capturesLoading } = useQuery({
    queryKey: ['/api/projects', selectedProject?.id, 'captures'],
    queryFn: async () => {
      const response = await fetch(`/api/projects/${selectedProject?.id}/captures`, { credentials: 'include' });
      if (!response.ok) throw new Error('Failed to fetch captures');
      return response.json();
    },
    enabled: !!selectedProject
  });

  // Fetch generated briefs
  const { data: briefs = [], isLoading: briefsLoading } = useQuery({
    queryKey: ['/api/briefs'],
    queryFn: async () => {
      const response = await fetch('/api/briefs', { credentials: 'include' });
      if (!response.ok) throw new Error('Failed to fetch briefs');
      return response.json();
    }
  });

  // Create project mutation
  const createProjectMutation = useMutation({
    mutationFn: async (data: typeof newProjectForm) => {
      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data)
      });
      if (!response.ok) throw new Error('Failed to create project');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/projects'] });
      setShowNewProjectDialog(false);
      setNewProjectForm({ name: '', description: '' });
      toast({ title: "Project created successfully" });
    },
    onError: () => {
      toast({ title: "Failed to create project", variant: "destructive" });
    }
  });

  // Generate brief mutation
  const generateBriefMutation = useMutation({
    mutationFn: async (projectId: number) => {
      const response = await fetch(`/api/briefs/generate/${projectId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ templateId: 'jimmy-johns-pac' })
      });
      if (!response.ok) throw new Error('Failed to generate brief');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/briefs'] });
      toast({ title: "Brief generated successfully" });
      setActiveTab('briefs');
    },
    onError: (error: any) => {
      toast({ 
        title: "Failed to generate brief", 
        description: error.message,
        variant: "destructive" 
      });
    }
  });

  // Assign signal to project mutation
  const assignSignalMutation = useMutation({
    mutationFn: async ({ projectId, signalId, templateSection }: { 
      projectId: number; 
      signalId: number; 
      templateSection: string 
    }) => {
      const response = await fetch(`/api/projects/${projectId}/assign-signal`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ signalId, templateSection })
      });
      if (!response.ok) throw new Error('Failed to assign signal');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/projects', selectedProject?.id, 'captures'] });
      toast({ title: "Signal assigned to project" });
    }
  });

  const handleCreateProject = () => {
    if (!newProjectForm.name.trim()) {
      toast({ title: "Project name is required", variant: "destructive" });
      return;
    }
    createProjectMutation.mutate(newProjectForm);
  };

  const handleGenerateBrief = (projectId: number) => {
    generateBriefMutation.mutate(projectId);
  };

  const getCapturesBySection = (sectionId: string) => {
    return captures.filter((capture: ProjectCapture) => capture.templateSection === sectionId);
  };

  const getSectionProgress = () => {
    const totalSections = TEMPLATE_SECTIONS.length;
    const filledSections = TEMPLATE_SECTIONS.filter(section => 
      getCapturesBySection(section.id).length > 0
    ).length;
    return (filledSections / totalSections) * 100;
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Strategic Brief Builder</h1>
          <p className="text-muted-foreground">
            Create professional strategic briefs from your captured content
          </p>
        </div>
        <Button onClick={() => setShowNewProjectDialog(true)} className="gap-2">
          <FolderPlus className="w-4 h-4" />
          New Project
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid grid-cols-3 w-full max-w-md">
          <TabsTrigger value="projects">Projects</TabsTrigger>
          <TabsTrigger value="builder">Builder</TabsTrigger>
          <TabsTrigger value="briefs">Generated Briefs</TabsTrigger>
        </TabsList>

        {/* Projects Tab */}
        <TabsContent value="projects" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {projectsLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardHeader>
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  </CardHeader>
                  <CardContent>
                    <div className="h-3 bg-gray-200 rounded w-full mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                  </CardContent>
                </Card>
              ))
            ) : (
              projects.map((project: Project) => (
                <Card 
                  key={project.id} 
                  className={`cursor-pointer transition-all hover:shadow-md ${
                    selectedProject?.id === project.id ? 'ring-2 ring-blue-500' : ''
                  }`}
                  onClick={() => setSelectedProject(project)}
                >
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      {project.name}
                      <Badge variant={project.status === 'active' ? 'default' : 'secondary'}>
                        {project.status}
                      </Badge>
                    </CardTitle>
                    <CardDescription>
                      {project.description || 'No description'}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <span>Created {new Date(project.createdAt).toLocaleDateString()}</span>
                      <Button 
                        size="sm" 
                        variant="ghost"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedProject(project);
                          setActiveTab('builder');
                        }}
                      >
                        <Edit3 className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        {/* Builder Tab */}
        <TabsContent value="builder" className="space-y-6">
          {!selectedProject ? (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-8">
                  <FolderPlus className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">No Project Selected</h3>
                  <p className="text-muted-foreground mb-4">
                    Select a project from the Projects tab or create a new one to start building a brief.
                  </p>
                  <Button onClick={() => setShowNewProjectDialog(true)}>
                    Create New Project
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              {/* Project Header */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>{selectedProject.name}</CardTitle>
                      <CardDescription>{selectedProject.description}</CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleGenerateBrief(selectedProject.id)}
                        disabled={generateBriefMutation.isPending}
                        className="gap-2"
                      >
                        <Play className="w-4 h-4" />
                        {generateBriefMutation.isPending ? 'Generating...' : 'Generate Brief'}
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span>Brief Progress</span>
                      <span>{Math.round(getSectionProgress())}%</span>
                    </div>
                    <Progress value={getSectionProgress()} className="h-2" />
                  </div>
                </CardHeader>
              </Card>

              {/* Template Sections */}
              <div className="grid gap-4">
                {TEMPLATE_SECTIONS.map((section) => {
                  const sectionCaptures = getCapturesBySection(section.id);
                  return (
                    <Card key={section.id}>
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <div>
                            <CardTitle className="text-lg">{section.name}</CardTitle>
                            <CardDescription>{section.description}</CardDescription>
                          </div>
                          <Badge variant={sectionCaptures.length > 0 ? 'default' : 'outline'}>
                            {sectionCaptures.length} captures
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        {sectionCaptures.length === 0 ? (
                          <div className="text-center py-4 text-muted-foreground">
                            <Target className="w-8 h-8 mx-auto mb-2" />
                            <p>No captures for this section yet</p>
                            <p className="text-sm">Use the Chrome extension to capture content and assign it to this section</p>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            {sectionCaptures.map((capture: ProjectCapture) => (
                              <div key={capture.id} className="border rounded-lg p-3">
                                <div className="flex items-start justify-between">
                                  <div className="flex-1">
                                    <h4 className="font-medium">{capture.title}</h4>
                                    {capture.userNotes && (
                                      <p className="text-sm text-muted-foreground mt-1">
                                        {capture.userNotes}
                                      </p>
                                    )}
                                    <div className="flex items-center gap-2 mt-2">
                                      {capture.url && (
                                        <Button variant="ghost" size="sm" className="h-6 px-2">
                                          <Link className="w-3 h-3" />
                                        </Button>
                                      )}
                                      {capture.visualAssets && (
                                        <Button variant="ghost" size="sm" className="h-6 px-2">
                                          <Image className="w-3 h-3" />
                                        </Button>
                                      )}
                                      {capture.qualScore && (
                                        <Badge variant="outline" className="text-xs">
                                          Quality: {capture.qualScore}/10
                                        </Badge>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          )}
        </TabsContent>

        {/* Generated Briefs Tab */}
        <TabsContent value="briefs" className="space-y-4">
          <div className="grid gap-4">
            {briefsLoading ? (
              Array.from({ length: 2 }).map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardHeader>
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  </CardHeader>
                </Card>
              ))
            ) : briefs.length === 0 ? (
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center py-8">
                    <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium mb-2">No Briefs Generated</h3>
                    <p className="text-muted-foreground">
                      Generate your first strategic brief from a project with captured content.
                    </p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              briefs.map((brief: GeneratedBrief) => (
                <Card key={brief.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle>Strategic Brief #{brief.id}</CardTitle>
                        <CardDescription>
                          Generated {new Date(brief.createdAt).toLocaleDateString()}
                        </CardDescription>
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => {
                            setSelectedBrief(brief);
                            setShowBriefPreview(true);
                          }}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button variant="outline" size="sm">
                          <Download className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span>Project: {brief.projectId}</span>
                      <Badge variant={brief.status === 'completed' ? 'default' : 'outline'}>
                        {brief.status}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* New Project Dialog */}
      <Dialog open={showNewProjectDialog} onOpenChange={setShowNewProjectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Project</DialogTitle>
            <DialogDescription>
              Create a new project to organize your content captures and generate strategic briefs.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="projectName">Project Name</Label>
              <Input
                id="projectName"
                value={newProjectForm.name}
                onChange={(e) => setNewProjectForm(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Enter project name..."
              />
            </div>
            <div>
              <Label htmlFor="projectDescription">Description</Label>
              <Textarea
                id="projectDescription"
                value={newProjectForm.description}
                onChange={(e) => setNewProjectForm(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Describe the project goals and objectives..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setShowNewProjectDialog(false)}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleCreateProject}
              disabled={createProjectMutation.isPending}
            >
              {createProjectMutation.isPending ? 'Creating...' : 'Create Project'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Brief Preview Dialog */}
      <Dialog open={showBriefPreview} onOpenChange={setShowBriefPreview}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Strategic Brief Preview</DialogTitle>
            <DialogDescription>
              Preview of generated brief content
            </DialogDescription>
          </DialogHeader>
          {selectedBrief && (
            <div className="space-y-4">
              <div className="prose max-w-none">
                <h3>{selectedBrief.content?.title || 'Strategic Brief'}</h3>
                {selectedBrief.content?.sections && (
                  <div className="space-y-4">
                    {Object.entries(selectedBrief.content.sections).map(([sectionId, section]: [string, any]) => (
                      <div key={sectionId} className="border-l-4 border-blue-500 pl-4">
                        <h4 className="font-semibold">{section.title}</h4>
                        <p className="text-muted-foreground">{section.description}</p>
                        {section.insights && (
                          <div className="mt-2">
                            <h5 className="font-medium">Key Insights:</h5>
                            <ul className="list-disc list-inside space-y-1">
                              {section.insights.map((insight: any, index: number) => (
                                <li key={index} className="text-sm">
                                  {insight.content}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}