import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Rss, Plus, Edit, Trash2, Globe, Clock, AlertCircle, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { UserFeedSource } from "@shared/schema";

interface FeedSourceManagerProps {
  feedType?: "project_data" | "custom_feed" | "intelligence_feed";
  onSourcesChange?: () => void;
}

export function FeedSourceManager({ feedType, onSourcesChange }: FeedSourceManagerProps) {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingSource, setEditingSource] = useState<UserFeedSource | null>(null);
  const [newSource, setNewSource] = useState({
    name: "",
    feedType: feedType || "custom_feed",
    sourceType: "rss",
    sourceUrl: "",
    category: "",
    updateFrequency: "4h",
    isActive: true,
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch user's feed sources
  const { data: feedSourcesData, isLoading } = useQuery<{feedSources: UserFeedSource[]}>({
    queryKey: ["/api/feeds/sources"],
    queryFn: async () => {
      const response = await fetch("/api/feeds/sources", {
        credentials: "include"
      });
      if (!response.ok) {
        throw new Error("Failed to fetch feed sources");
      }
      return response.json();
    },
  });

  const feedSources = feedSourcesData?.feedSources || [];

  // Filter sources by type if specified
  const filteredSources = feedSources?.filter(source => 
    !feedType || source.feedType === feedType
  ) || [];

  // Create source mutation
  const createSourceMutation = useMutation({
    mutationFn: async (sourceData: typeof newSource) => {
      return apiRequest("/api/feeds/sources", {
        method: "POST",
        body: JSON.stringify(sourceData)
      });
    },
    onSuccess: () => {
      toast({
        title: "Source added",
        description: "Your feed source has been added successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/feeds/sources"] });
      setIsAddDialogOpen(false);
      setNewSource({
        name: "",
        feedType: feedType || "custom_feed",
        sourceType: "rss",
        sourceUrl: "",
        category: "",
        updateFrequency: "4h",
        isActive: true,
      });
      if (onSourcesChange) onSourcesChange();
    },
    onError: (error: any) => {
      toast({
        title: "Error adding source",
        description: error.message || "Failed to add feed source",
        variant: "destructive",
      });
    },
  });

  // Update source mutation
  const updateSourceMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: number; updates: Partial<UserFeedSource> }) => {
      return apiRequest(`/api/feeds/sources/${id}`, {
        method: "PUT",
        body: JSON.stringify(updates)
      });
    },
    onSuccess: () => {
      toast({
        title: "Source updated",
        description: "Feed source has been updated successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/feeds/sources"] });
      setEditingSource(null);
      if (onSourcesChange) onSourcesChange();
    },
    onError: (error: any) => {
      toast({
        title: "Error updating source",
        description: error.message || "Failed to update feed source",
        variant: "destructive",
      });
    },
  });

  // Delete source mutation
  const deleteSourceMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest(`/api/feeds/sources/${id}`, {
        method: "DELETE"
      });
    },
    onSuccess: () => {
      toast({
        title: "Source deleted",
        description: "Feed source has been deleted successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/feeds/sources"] });
      if (onSourcesChange) onSourcesChange();
    },
    onError: (error: any) => {
      toast({
        title: "Error deleting source",
        description: error.message || "Failed to delete feed source",
        variant: "destructive",
      });
    },
  });

  const handleAddSource = () => {
    if (!newSource.name || !newSource.sourceUrl) {
      toast({
        title: "Missing information",
        description: "Please provide both name and URL for the feed source.",
        variant: "destructive",
      });
      return;
    }

    createSourceMutation.mutate(newSource);
  };

  const handleUpdateSource = (id: number, updates: Partial<UserFeedSource>) => {
    updateSourceMutation.mutate({ id, updates });
  };

  const handleDeleteSource = (id: number) => {
    if (confirm("Are you sure you want to delete this feed source?")) {
      deleteSourceMutation.mutate(id);
    }
  };

  const getSourceTypeIcon = (sourceType: string) => {
    switch (sourceType) {
      case "rss": return <Rss className="h-4 w-4" />;
      case "website": return <Globe className="h-4 w-4" />;
      default: return <Rss className="h-4 w-4" />;
    }
  };

  const getFeedTypeColor = (feedType: string) => {
    switch (feedType) {
      case "project_data": return "border-blue-200 bg-blue-50";
      case "custom_feed": return "border-green-200 bg-green-50";
      case "intelligence_feed": return "border-purple-200 bg-purple-50";
      default: return "border-gray-200 bg-gray-50";
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Rss className="h-5 w-5" />
            Feed Sources
            {feedType && (
              <Badge variant="secondary" className="ml-2">
                {feedType.replace("_", " ")}
              </Badge>
            )}
          </div>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Source
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Add Feed Source</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="source-name">Name</Label>
                  <Input
                    id="source-name"
                    placeholder="e.g., TechCrunch Marketing"
                    value={newSource.name}
                    onChange={(e) => setNewSource({...newSource, name: e.target.value})}
                  />
                </div>
                
                <div>
                  <Label htmlFor="source-url">URL</Label>
                  <Input
                    id="source-url"
                    placeholder="https://example.com/feed.xml"
                    value={newSource.sourceUrl}
                    onChange={(e) => setNewSource({...newSource, sourceUrl: e.target.value})}
                  />
                </div>

                <div>
                  <Label htmlFor="source-category">Category</Label>
                  <Input
                    id="source-category"
                    placeholder="e.g., Tech News, Industry Reports"
                    value={newSource.category}
                    onChange={(e) => setNewSource({...newSource, category: e.target.value})}
                  />
                </div>

                {!feedType && (
                  <div>
                    <Label htmlFor="feed-type">Feed Type</Label>
                    <Select value={newSource.feedType} onValueChange={(value) => setNewSource({...newSource, feedType: value})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="project_data">Project Data</SelectItem>
                        <SelectItem value="custom_feed">Custom Feed</SelectItem>
                        <SelectItem value="intelligence_feed">Market Intelligence</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div>
                  <Label htmlFor="update-frequency">Update Frequency</Label>
                  <Select value={newSource.updateFrequency} onValueChange={(value) => setNewSource({...newSource, updateFrequency: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1h">Every Hour</SelectItem>
                      <SelectItem value="4h">Every 4 Hours</SelectItem>
                      <SelectItem value="12h">Every 12 Hours</SelectItem>
                      <SelectItem value="24h">Daily</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleAddSource}
                    disabled={createSourceMutation.isPending}
                  >
                    {createSourceMutation.isPending ? "Adding..." : "Add Source"}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {filteredSources.length === 0 ? (
          <div className="text-center py-8">
            <Rss className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 mb-4">No feed sources configured yet</p>
            <p className="text-sm text-gray-400">
              Add RSS feeds, websites, or other sources to start building your personalized intelligence feed.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredSources.map((source) => (
              <Card key={source.id} className={`${getFeedTypeColor(source.feedType)} border`}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2">
                        {getSourceTypeIcon(source.sourceType)}
                        <h4 className="font-medium">{source.name}</h4>
                        <Badge variant="secondary" className="text-xs">
                          {source.feedType.replace("_", " ")}
                        </Badge>
                        {source.isActive ? (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        ) : (
                          <AlertCircle className="h-4 w-4 text-red-500" />
                        )}
                      </div>
                      <p className="text-sm text-gray-600 truncate">{source.sourceUrl}</p>
                      {source.category && (
                        <Badge variant="outline" className="text-xs">
                          {source.category}
                        </Badge>
                      )}
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          Updates every {source.updateFrequency}
                        </span>
                        {source.lastFetched && (
                          <span>
                            Last fetched: {new Date(source.lastFetched).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={source.isActive}
                        onCheckedChange={(checked) => handleUpdateSource(source.id, { isActive: checked })}
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setEditingSource(source)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteSource(source.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}