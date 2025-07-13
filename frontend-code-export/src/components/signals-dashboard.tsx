import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { formatDistanceToNow } from "date-fns";
import { Search, Filter, Edit, Trash2, Tag, FileText, TrendingUp, Calendar, Globe } from "lucide-react";
import type { Signal } from "@shared/schema";

export function SignalsDashboard() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedSignal, setSelectedSignal] = useState<Signal | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: signalsData, isLoading, error } = useQuery<{ signals: Signal[] }>({
    queryKey: ["/api/signals"],
    staleTime: 30000, // 30 seconds
    refetchOnWindowFocus: true,
    retry: false,
    queryFn: async () => {
      try {
        const response = await fetch('/api/signals', {
          credentials: 'include'
        });
        if (!response.ok) {
          throw new Error("Failed to fetch signals");
        }
        return response.json();
      } catch (error) {
        console.warn('Failed to fetch signals:', error);
        return { signals: [] };
      }
    },
  });

  const updateSignalMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: number; updates: Partial<Signal> }) => {
      const response = await apiRequest("PUT", `/api/signals/${id}`, updates);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/signals"] });
      toast({
        title: "Content Updated",
        description: "Content has been updated successfully",
      });
      setIsEditDialogOpen(false);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update content",
        variant: "destructive",
      });
    },
  });

  const deleteSignalMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/signals/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/signals"] });
      toast({
        title: "Content Deleted",
        description: "Content has been deleted successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete signal",
        variant: "destructive",
      });
    },
  });

  const signals = signalsData?.signals || [];

  const filteredSignals = signals.filter(signal => {
    const matchesSearch = signal.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         signal.summary?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         signal.content?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || signal.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment?.toLowerCase()) {
      case 'positive':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'negative':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'capture':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'potential_signal':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'signal':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'capture':
        return 'Capture';
      case 'potential_signal':
        return 'Potential Signal';
      case 'signal':
        return 'Signal';
      default:
        return status;
    }
  };

  const handleEditSignal = (signal: Signal) => {
    setSelectedSignal(signal);
    setIsEditDialogOpen(true);
  };

  const handleUpdateSignal = (updates: Partial<Signal>) => {
    if (selectedSignal) {
      updateSignalMutation.mutate({ id: selectedSignal.id, updates });
    }
  };

  const handleDeleteSignal = (id: number) => {
    if (confirm("Are you sure you want to delete this content?")) {
      deleteSignalMutation.mutate(id);
    }
  };

  // Dashboard is working - signals are being loaded successfully

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-8 bg-gray-200 rounded animate-pulse"></div>
        <div className="h-32 bg-gray-200 rounded animate-pulse"></div>
        <div className="h-32 bg-gray-200 rounded animate-pulse"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Content Dashboard</h2>
          <p className="text-sm text-gray-600">Manage your captures, potential signals, and signals</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="text-sm">
            {signals.filter(s => s.status === 'capture').length} captures
          </Badge>
          <Badge variant="secondary" className="text-sm bg-blue-100 text-blue-800">
            {signals.filter(s => s.status === 'potential_signal').length} potential signals
          </Badge>
          <Badge variant="secondary" className="text-sm bg-green-100 text-green-800">
            {signals.filter(s => s.status === 'signal').length} signals
          </Badge>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <Label htmlFor="search">Search content</Label>
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              id="search"
              placeholder="Search by title, summary, or content..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>
        <div className="sm:w-48">
          <Label htmlFor="status-filter">Filter by status</Label>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger>
              <SelectValue placeholder="All statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="capture">Capture</SelectItem>
              <SelectItem value="potential_signal">Potential Signal</SelectItem>
              <SelectItem value="signal">Signal</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Results */}
      <div className="text-sm text-gray-600 mb-4">
        Showing {filteredSignals.length} of {signals.length} items
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredSignals.map((signal) => (
          <Card key={signal.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <CardTitle className="text-lg font-semibold text-gray-900 line-clamp-2">
                  {signal.title || "Untitled Signal"}
                </CardTitle>
                <div className="flex space-x-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEditSignal(signal)}
                  >
                    <Edit size={16} />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteSignal(signal.id)}
                  >
                    <Trash2 size={16} />
                  </Button>
                </div>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Calendar size={12} />
                {formatDistanceToNow(new Date(signal.createdAt!), { addSuffix: true })}
                {signal.url && (
                  <>
                    <Globe size={12} />
                    <span className="truncate">URL Source</span>
                  </>
                )}
              </div>
            </CardHeader>
            
            <CardContent className="space-y-4">
              <p className="text-sm text-gray-700 line-clamp-3">
                {signal.summary || "No summary available"}
              </p>

              <div className="flex flex-wrap gap-2">
                {signal.sentiment && (
                  <Badge className={getSentimentColor(signal.sentiment)} variant="secondary">
                    {signal.sentiment}
                  </Badge>
                )}
                {signal.tone && (
                  <Badge variant="outline" className="text-xs">
                    {signal.tone}
                  </Badge>
                )}
                {signal.confidence && (
                  <Badge variant="outline" className="text-xs">
                    {signal.confidence} confidence
                  </Badge>
                )}
              </div>

              {signal.keywords && signal.keywords.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {signal.keywords.slice(0, 3).map((keyword, index) => (
                    <Badge key={index} variant="secondary" className="text-xs bg-blue-100 text-blue-800">
                      {keyword}
                    </Badge>
                  ))}
                  {signal.keywords.length > 3 && (
                    <Badge variant="secondary" className="text-xs">
                      +{signal.keywords.length - 3} more
                    </Badge>
                  )}
                </div>
              )}

              <div className="flex justify-between items-center pt-2">
                <Badge variant="outline" className={`text-xs ${getStatusColor(signal.status || "capture")}`}>
                  {getStatusLabel(signal.status || "capture")}
                </Badge>
                <Button variant="ghost" size="sm" className="text-xs">
                  <FileText size={12} className="mr-1" />
                  View Details
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredSignals.length === 0 && (
        <div className="text-center py-12">
          <TrendingUp className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No signals found</h3>
          <p className="mt-1 text-sm text-gray-500">
            {searchTerm || statusFilter !== "all" 
              ? "Try adjusting your search or filter criteria"
              : "Start analyzing content to create your first signal"
            }
          </p>
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Edit Signal</DialogTitle>
          </DialogHeader>
          {selectedSignal && (
            <EditSignalForm
              signal={selectedSignal}
              onUpdate={handleUpdateSignal}
              onCancel={() => setIsEditDialogOpen(false)}
              isLoading={updateSignalMutation.isPending}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

interface EditSignalFormProps {
  signal: Signal;
  onUpdate: (updates: Partial<Signal>) => void;
  onCancel: () => void;
  isLoading: boolean;
}

function EditSignalForm({ signal, onUpdate, onCancel, isLoading }: EditSignalFormProps) {
  const [title, setTitle] = useState(signal.title || "");
  const [status, setStatus] = useState(signal.status || "capture");
  const [tags, setTags] = useState(signal.tags?.join(", ") || "");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdate({
      title,
      status,
      tags: tags.split(",").map(tag => tag.trim()).filter(Boolean),
    });
  };

  const getNextStatus = (currentStatus: string) => {
    switch (currentStatus) {
      case 'capture':
        return 'potential_signal';
      case 'potential_signal':
        return 'signal';
      default:
        return currentStatus;
    }
  };

  const canPromote = (currentStatus: string) => {
    return currentStatus === 'capture' || currentStatus === 'potential_signal';
  };

  const handlePromote = () => {
    const nextStatus = getNextStatus(status);
    setStatus(nextStatus);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="edit-title">Title</Label>
        <Input
          id="edit-title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          disabled={isLoading}
        />
      </div>

      <div>
        <Label htmlFor="edit-status">Status</Label>
        <div className="flex items-center gap-2">
          <Select value={status} onValueChange={setStatus} disabled={isLoading}>
            <SelectTrigger className="flex-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="capture">Capture</SelectItem>
              <SelectItem value="potential_signal">Potential Signal</SelectItem>
              <SelectItem value="signal">Signal</SelectItem>
            </SelectContent>
          </Select>
          {canPromote(status) && (
            <Button 
              type="button" 
              variant="outline" 
              size="sm" 
              onClick={handlePromote}
              disabled={isLoading}
            >
              <TrendingUp size={16} className="mr-1" />
              Promote
            </Button>
          )}
        </div>
        <p className="text-xs text-gray-500 mt-1">
          {status === 'capture' && "Raw content saved from webpage"}
          {status === 'potential_signal' && "Analyzed content showing promise"}
          {status === 'signal' && "Validated content ready for briefs"}
        </p>
      </div>

      <div>
        <Label htmlFor="edit-tags">Tags (comma-separated)</Label>
        <Input
          id="edit-tags"
          value={tags}
          onChange={(e) => setTags(e.target.value)}
          placeholder="marketing, strategy, ai"
          disabled={isLoading}
        />
      </div>

      <div className="flex justify-end space-x-2">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
          Cancel
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? "Updating..." : "Update Content"}
        </Button>
      </div>
    </form>
  );
}