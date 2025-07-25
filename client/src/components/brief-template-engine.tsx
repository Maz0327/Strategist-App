import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { 
  FileText, 
  Download, 
  Eye, 
  Edit3, 
  Plus, 
  Wand2, 
  Image, 
  BarChart3,
  Users,
  Target,
  Lightbulb,
  TrendingUp
} from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

const createBriefSchema = z.object({
  title: z.string().min(1, 'Brief title is required').max(100, 'Title too long'),
  projectId: z.string().min(1, 'Project selection is required'),
  templateType: z.enum(['jimmy-johns', 'custom']).default('jimmy-johns'),
  description: z.string().max(500, 'Description too long').optional()
});

type CreateBriefData = z.infer<typeof createBriefSchema>;

interface BriefTemplate {
  id: number;
  title: string;
  projectId: number;
  templateType: string;
  sections: BriefSection[];
  createdAt: string;
  status: 'draft' | 'complete' | 'exported';
}

interface BriefSection {
  id: string;
  name: string;
  description: string;
  content: string;
  contentTypes: string[];
  mappedFields: string[];
  order: number;
}

interface Project {
  id: number;
  name: string;
  captureCount?: number;
}

const JIMMY_JOHNS_TEMPLATE: BriefSection[] = [
  {
    id: 'performance',
    name: 'Performance Analysis',
    description: 'Current market performance and baseline metrics',
    content: '',
    contentTypes: ['metrics', 'data', 'benchmarks'],
    mappedFields: ['fact'],
    order: 1
  },
  {
    id: 'cultural-signals',
    name: 'Cultural Signals',
    description: 'Emerging cultural moments and trending behaviors',
    content: '',
    contentTypes: ['cultural-trends', 'social-movements', 'zeitgeist'],
    mappedFields: ['culturalMoment'],
    order: 2
  },
  {
    id: 'platform-signals',
    name: 'Platform Signals', 
    description: 'Social media insights and platform-specific observations',
    content: '',
    contentTypes: ['social-insights', 'platform-data', 'engagement'],
    mappedFields: ['observation'],
    order: 3
  },
  {
    id: 'opportunities',
    name: 'Strategic Opportunities',
    description: 'Actionable insights and growth opportunities',
    content: '',
    contentTypes: ['insights', 'recommendations', 'opportunities'],
    mappedFields: ['insight'],
    order: 4
  },
  {
    id: 'cohorts',
    name: 'Target Cohorts',
    description: 'Audience segments and behavioral insights',
    content: '',
    contentTypes: ['demographics', 'psychographics', 'behaviors'],
    mappedFields: ['humanTruth'],
    order: 5
  },
  {
    id: 'ideation',
    name: 'Creative Ideation',
    description: 'Campaign concepts and creative directions',
    content: '',
    contentTypes: ['concepts', 'campaigns', 'creative'],
    mappedFields: [],
    order: 6
  }
];

export function BriefTemplateEngine() {
  const [selectedTemplate, setSelectedTemplate] = useState<BriefTemplate | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<CreateBriefData>({
    resolver: zodResolver(createBriefSchema),
    defaultValues: {
      title: '',
      projectId: '',
      templateType: 'jimmy-johns',
      description: ''
    }
  });

  // Fetch projects for selection
  const { data: projects = [] } = useQuery({
    queryKey: ['/api/projects'],
    refetchOnWindowFocus: false
  });

  // Fetch briefs
  const { data: briefs = [], isLoading } = useQuery({
    queryKey: ['/api/briefs'],
    refetchOnWindowFocus: false
  });

  // Create brief mutation
  const createBriefMutation = useMutation({
    mutationFn: async (data: CreateBriefData) => {
      return apiRequest('/api/briefs', 'POST', {
        ...data,
        sections: JIMMY_JOHNS_TEMPLATE
      });
    },
    onSuccess: (newBrief: any) => {
      queryClient.invalidateQueries({ queryKey: ['/api/briefs'] });
      setIsCreateDialogOpen(false);
      form.reset();
      setSelectedTemplate(newBrief);
      toast({
        title: 'Brief Created',
        description: `${newBrief.title} has been created with Jimmy John's template.`
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'Failed to create brief. Please try again.',
        variant: 'destructive'
      });
    }
  });

  // Auto-population mutation
  const autoPopulateMutation = useMutation({
    mutationFn: async (briefId: number) => {
      return apiRequest(`/api/briefs/${briefId}/auto-populate`, 'POST');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/briefs'] });
      toast({
        title: 'Auto-Population Complete',
        description: 'Brief sections have been populated with project insights.'
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'Failed to auto-populate brief. Please try again.',
        variant: 'destructive'
      });
    }
  });

  const handleCreateBrief = (data: CreateBriefData) => {
    createBriefMutation.mutate(data);
  };

  const handleAutoPopulate = (briefId: number) => {
    autoPopulateMutation.mutate(briefId);
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-full mb-2"></div>
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Brief Template Engine
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Transform project insights into professional strategic briefs
          </p>
        </div>
        
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="mt-4 md:mt-0">
              <Plus className="w-4 h-4 mr-2" />
              New Brief
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Strategic Brief</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleCreateBrief)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Brief Title</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter brief title..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="projectId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Source Project</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a project" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {(projects as Project[]).map((project) => (
                            <SelectItem key={project.id} value={project.id.toString()}>
                              {project.name} ({project.captureCount || 0} captures)
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="templateType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Template Type</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="jimmy-johns">Jimmy John's PAC Drop Style</SelectItem>
                          <SelectItem value="custom">Custom Template</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description (Optional)</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Describe the brief's purpose and goals..."
                          rows={3}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex justify-end space-x-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsCreateDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={createBriefMutation.isPending}
                  >
                    {createBriefMutation.isPending ? 'Creating...' : 'Create Brief'}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Brief Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {(briefs as BriefTemplate[]).map((brief) => (
          <Card 
            key={brief.id} 
            className="hover:shadow-lg transition-all duration-200 cursor-pointer group"
            onClick={() => setSelectedTemplate(brief)}
          >
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <FileText className="w-6 h-6 text-blue-500 group-hover:text-blue-600 transition-colors" />
                <Badge 
                  variant={brief.status === 'complete' ? 'default' : brief.status === 'draft' ? 'secondary' : 'outline'}
                  className="text-xs"
                >
                  {brief.status}
                </Badge>
              </div>
              <CardTitle className="text-lg font-semibold line-clamp-2 group-hover:text-blue-600 transition-colors">
                {brief.title}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="flex items-center text-xs text-gray-500 dark:text-gray-400 mb-3">
                <Badge variant="outline" className="text-xs mr-2">
                  {brief.templateType === 'jimmy-johns' ? 'PAC Drop Style' : 'Custom'}
                </Badge>
                {brief.sections.length} sections
              </div>
              
              <div className="flex justify-between items-center pt-2 border-t border-gray-100 dark:border-gray-700">
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  Created {new Date(brief.createdAt).toLocaleDateString()}
                </span>
                <div className="flex space-x-1">
                  <Button size="sm" variant="ghost" className="text-xs p-1">
                    <Eye className="w-3 h-3" />
                  </Button>
                  <Button size="sm" variant="ghost" className="text-xs p-1">
                    <Edit3 className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Brief Editor/Viewer Modal */}
      {selectedTemplate && (
        <Dialog open={!!selectedTemplate} onOpenChange={() => setSelectedTemplate(null)}>
          <DialogContent className="max-w-6xl max-h-[80vh] overflow-y-auto">
            <DialogHeader className="flex flex-row items-center justify-between">
              <DialogTitle className="text-xl">
                {selectedTemplate.title}
              </DialogTitle>
              <div className="flex items-center space-x-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleAutoPopulate(selectedTemplate.id)}
                  disabled={autoPopulateMutation.isPending}
                >
                  <Wand2 className="w-4 h-4 mr-2" />
                  {autoPopulateMutation.isPending ? 'Populating...' : 'Auto-Populate'}
                </Button>
                <Button size="sm" variant="outline">
                  <Eye className="w-4 h-4 mr-2" />
                  Preview
                </Button>
                <Button size="sm">
                  <Download className="w-4 h-4 mr-2" />
                  Export
                </Button>
              </div>
            </DialogHeader>
            
            <Tabs defaultValue="sections" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="sections">Brief Sections</TabsTrigger>
                <TabsTrigger value="assets">Visual Assets</TabsTrigger>
                <TabsTrigger value="settings">Settings</TabsTrigger>
              </TabsList>
              
              <TabsContent value="sections" className="space-y-6">
                {selectedTemplate.sections.map((section) => {
                  const getSectionIcon = (sectionId: string) => {
                    switch (sectionId) {
                      case 'performance': return <BarChart3 className="w-5 h-5" />;
                      case 'cultural-signals': return <TrendingUp className="w-5 h-5" />;
                      case 'platform-signals': return <Target className="w-5 h-5" />;
                      case 'opportunities': return <Lightbulb className="w-5 h-5" />;
                      case 'cohorts': return <Users className="w-5 h-5" />;
                      case 'ideation': return <Wand2 className="w-5 h-5" />;
                      default: return <FileText className="w-5 h-5" />;
                    }
                  };

                  return (
                    <Card key={section.id}>
                      <CardHeader>
                        <div className="flex items-center space-x-3">
                          <div className="text-blue-500">
                            {getSectionIcon(section.id)}
                          </div>
                          <div>
                            <CardTitle className="text-lg">{section.name}</CardTitle>
                            <p className="text-sm text-gray-600 dark:text-gray-300">
                              {section.description}
                            </p>
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {section.mappedFields.map((field) => (
                            <Badge key={field} variant="secondary" className="text-xs">
                              Truth Analysis: {field}
                            </Badge>
                          ))}
                          {section.contentTypes.map((type) => (
                            <Badge key={type} variant="outline" className="text-xs">
                              {type}
                            </Badge>
                          ))}
                        </div>
                      </CardHeader>
                      <CardContent>
                        <Textarea
                          placeholder={`Enter ${section.name.toLowerCase()} content...`}
                          value={section.content}
                          onChange={(e) => {
                            // Update section content
                            const updatedSections = selectedTemplate.sections.map(s => 
                              s.id === section.id ? { ...s, content: e.target.value } : s
                            );
                            setSelectedTemplate({ ...selectedTemplate, sections: updatedSections });
                          }}
                          rows={6}
                          className="min-h-32"
                        />
                      </CardContent>
                    </Card>
                  );
                })}
              </TabsContent>
              
              <TabsContent value="assets" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Image className="w-5 h-5 mr-2" />
                      Visual Assets Manager
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                      <Image className="w-16 h-16 mx-auto mb-4 opacity-50" />
                      <p>Visual assets management coming in Phase 4</p>
                      <p className="text-sm">Screenshots and images will be managed here</p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="settings" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Brief Settings</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <label className="text-sm font-medium">Template Type</label>
                      <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                        {selectedTemplate.templateType === 'jimmy-johns' ? 'Jimmy John\'s PAC Drop Style' : 'Custom Template'}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium">Status</label>
                      <Badge className="ml-2" variant={selectedTemplate.status === 'complete' ? 'default' : 'secondary'}>
                        {selectedTemplate.status}
                      </Badge>
                    </div>
                    <div>
                      <label className="text-sm font-medium">Created</label>
                      <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                        {new Date(selectedTemplate.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </DialogContent>
        </Dialog>
      )}

      {/* Empty State */}
      {(briefs as BriefTemplate[]).length === 0 && !isLoading && (
        <div className="text-center py-12">
          <FileText className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            No briefs created yet
          </h3>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            Create your first strategic brief using the Jimmy John's PAC Drop template
          </p>
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Create First Brief
          </Button>
        </div>
      )}
    </div>
  );
}