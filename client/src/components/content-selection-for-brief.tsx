import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, Filter, ArrowRight, Calendar, Globe, Tag, User, FileText, Image, Video } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import type { Signal } from "@shared/schema";

interface ContentSelectionProps {
  selectedContent: Set<number>;
  onSelectionChange: (selectedIds: Set<number>) => void;
  onContinueToBrief: () => void;
}

export function ContentSelectionForBrief({ 
  selectedContent, 
  onSelectionChange, 
  onContinueToBrief 
}: ContentSelectionProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [projectFilter, setProjectFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("recent");

  const { data: signalsData, isLoading } = useQuery<{ signals: Signal[] }>({
    queryKey: ["/api/signals"],
    refetchOnWindowFocus: false,
  });

  const { data: projectsData } = useQuery<{ id: number; name: string }[]>({
    queryKey: ["/api/projects"],
    refetchOnWindowFocus: false,
  });

  const signals = signalsData?.signals || [];
  const projects = projectsData || [];

  // Filter and sort content
  const filteredContent = signals
    .filter(signal => {
      // Search filter
      if (searchTerm && !signal.title?.toLowerCase().includes(searchTerm.toLowerCase()) && 
          !signal.content?.toLowerCase().includes(searchTerm.toLowerCase())) {
        return false;
      }
      
      // Status filter
      if (statusFilter !== "all" && signal.status !== statusFilter) {
        return false;
      }
      
      // Project filter
      if (projectFilter !== "all" && signal.projectId !== parseInt(projectFilter)) {
        return false;
      }
      
      return true;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "recent":
          return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
        case "oldest":
          return new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime();
        case "title":
          return (a.title || "").localeCompare(b.title || "");
        default:
          return 0;
      }
    });

  const handleSelectAll = () => {
    const allIds = new Set(filteredContent.map(signal => signal.id));
    onSelectionChange(allIds);
  };

  const handleClearAll = () => {
    onSelectionChange(new Set());
  };

  const handleToggleContent = (signalId: number) => {
    const newSelection = new Set(selectedContent);
    if (newSelection.has(signalId)) {
      newSelection.delete(signalId);
    } else {
      newSelection.add(signalId);
    }
    onSelectionChange(newSelection);
  };

  const getContentTypeIcon = (signal: Signal) => {
    if (signal.url?.includes('youtube.com') || signal.url?.includes('youtu.be')) {
      return <Video className="h-4 w-4 text-red-500" />;
    }
    if (signal.url?.includes('instagram.com')) {
      return <Image className="h-4 w-4 text-pink-500" />;
    }
    return <FileText className="h-4 w-4 text-blue-500" />;
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      capture: { color: "bg-gray-100 text-gray-800", label: "Captured" },
      potential: { color: "bg-yellow-100 text-yellow-800", label: "Potential Signal" },
      signal: { color: "bg-green-100 text-green-800", label: "Signal" },
      analyzed: { color: "bg-blue-100 text-blue-800", label: "Analyzed" }
    };
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.capture;
    return <Badge className={config.color}>{config.label}</Badge>;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your content...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Select Content for Brief</h2>
          <p className="text-gray-600 mt-1">Choose the captured content you want to include in your strategic brief</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500">{selectedContent.size} selected</span>
          <Button 
            onClick={onContinueToBrief}
            disabled={selectedContent.size === 0}
            className="flex items-center gap-2"
          >
            Continue to Brief <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search content..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Status Filter */}
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="capture">Captured</SelectItem>
                <SelectItem value="potential">Potential Signal</SelectItem>
                <SelectItem value="signal">Signal</SelectItem>
                <SelectItem value="analyzed">Analyzed</SelectItem>
              </SelectContent>
            </Select>

            {/* Project Filter */}
            <Select value={projectFilter} onValueChange={setProjectFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Projects" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Projects</SelectItem>
                {projects.map(project => (
                  <SelectItem key={project.id} value={project.id.toString()}>
                    {project.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Sort */}
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger>
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="recent">Most Recent</SelectItem>
                <SelectItem value="oldest">Oldest First</SelectItem>
                <SelectItem value="title">Title A-Z</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Bulk Actions */}
          <div className="flex items-center gap-2 mt-4 pt-4 border-t">
            <Button variant="outline" size="sm" onClick={handleSelectAll}>
              Select All ({filteredContent.length})
            </Button>
            <Button variant="outline" size="sm" onClick={handleClearAll}>
              Clear Selection
            </Button>
            <div className="ml-auto text-sm text-gray-500">
              {filteredContent.length} items found
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Content Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredContent.map((signal) => (
          <Card 
            key={signal.id} 
            className={`cursor-pointer transition-all hover:shadow-md ${
              selectedContent.has(signal.id) ? 'ring-2 ring-blue-500 bg-blue-50' : ''
            }`}
            onClick={() => handleToggleContent(signal.id)}
          >
            <CardHeader className="pb-3">
              <div className="flex items-start gap-3">
                <Checkbox 
                  checked={selectedContent.has(signal.id)}
                  onChange={() => handleToggleContent(signal.id)}
                  className="mt-1"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    {getContentTypeIcon(signal)}
                    <h3 className="font-medium text-sm truncate">
                      {signal.title || "Untitled Content"}
                    </h3>
                  </div>
                  {getStatusBadge(signal.status || "capture")}
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="pt-0">
              {/* Content Preview */}
              {signal.content && (
                <p className="text-sm text-gray-600 line-clamp-3 mb-3">
                  {signal.content.substring(0, 150)}...
                </p>
              )}

              {/* Metadata */}
              <div className="space-y-2 text-xs text-gray-500">
                {signal.url && (
                  <div className="flex items-center gap-1">
                    <Globe className="h-3 w-3" />
                    <span className="truncate">{new URL(signal.url).hostname}</span>
                  </div>
                )}
                
                <div className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  <span>{formatDistanceToNow(new Date(signal.createdAt || new Date()))} ago</span>
                </div>

                {signal.projectId && (
                  <div className="flex items-center gap-1">
                    <Tag className="h-3 w-3" />
                    <span>{projects.find(p => p.id === signal.projectId)?.name || 'Project'}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Empty State */}
      {filteredContent.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No content found</h3>
            <p className="text-gray-600 mb-4">
              {searchTerm || statusFilter !== "all" || projectFilter !== "all"
                ? "Try adjusting your filters or search terms"
                : "Start by capturing some content to create your strategic brief"}
            </p>
            {(!searchTerm && statusFilter === "all" && projectFilter === "all") && (
              <Button variant="outline">
                Go to Signal Capture
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}