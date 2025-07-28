import React from 'react';
import { useParams } from 'wouter';
import { WorkspaceDashboard } from '@/components/workspace-dashboard';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, RefreshCw } from 'lucide-react';
import { Link } from 'wouter';

export default function WorkspacePage() {
  const { projectId } = useParams<{ projectId: string }>();
  
  // Validate project ID
  const numericProjectId = projectId ? parseInt(projectId, 10) : null;
  
  // Fetch project details for validation
  const { data: project, isLoading, error } = useQuery({
    queryKey: ['/api/projects', numericProjectId],
    enabled: !!numericProjectId
  });

  if (!numericProjectId || isNaN(numericProjectId)) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <h2 className="text-xl font-semibold mb-2">Invalid Project</h2>
            <p className="text-muted-foreground mb-4">The project ID provided is not valid.</p>
            <Button asChild>
              <Link href="/projects">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Projects
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="w-6 h-6 animate-spin mr-2" />
          <span>Loading project...</span>
        </div>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <h2 className="text-xl font-semibold mb-2">Project Not Found</h2>
            <p className="text-muted-foreground mb-4">
              The project you're looking for doesn't exist or you don't have permission to view it.
            </p>
            <Button asChild>
              <Link href="/projects">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Projects
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6">
      {/* Breadcrumb Navigation */}
      <div className="flex items-center gap-2 mb-6 text-sm text-muted-foreground">
        <Link href="/projects" className="hover:text-foreground transition-colors">
          Projects
        </Link>
        <span>/</span>
        <span className="text-foreground font-medium">{(project as any)?.data?.name || 'Project'}</span>
        <span>/</span>
        <span className="text-foreground font-medium">Workspace</span>
      </div>

      {/* Workspace Dashboard */}
      <WorkspaceDashboard projectId={numericProjectId} />
    </div>
  );
}