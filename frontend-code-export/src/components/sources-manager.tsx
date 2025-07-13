import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { formatDistanceToNow } from "date-fns";
import { 
  Globe, 
  ExternalLink, 
  Search, 
  Filter,
  BarChart3,
  Clock,
  Activity,
  Shield,
  Newspaper,
  Trash2,
  RefreshCw,
  Eye,
  TrendingUp
} from "lucide-react";

interface Source {
  id: number;
  url: string;
  title: string;
  domain: string;
  favicon?: string;
  description?: string;
  sourceType: string;
  reliability: string;
  firstCaptured: string;
  lastAccessed: string;
  accessCount: number;
  isActive: boolean;
  createdAt: string;
}

interface SourceAnalytics {
  totalSources: number;
  sourcesByType: Record<string, number>;
  sourcesByReliability: Record<string, number>;
  topDomains: Array<{ domain: string; count: number }>;
  recentSources: Source[];
}

export function SourcesManager() {
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [reliabilityFilter, setReliabilityFilter] = useState<string>("all");
  const [selectedSource, setSelectedSource] = useState<Source | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: sourcesData, isLoading, error: sourcesError } = useQuery<{ sources: Source[] }>({
    queryKey: ["/api/sources"],
    staleTime: 30000,
    retry: false,
    queryFn: async () => {
      try {
        const response = await fetch('/api/sources', {
          credentials: 'include'
        });
        if (!response.ok) {
          throw new Error("Failed to fetch sources");
        }
        return response.json();
      } catch (error) {
        console.warn('Failed to fetch sources:', error);
        return { sources: [] };
      }
    },
  });

  const { data: analyticsData, error: analyticsError } = useQuery<SourceAnalytics>({
    queryKey: ["/api/sources/analytics"],
    staleTime: 60000,
    retry: false,
    queryFn: async () => {
      try {
        const response = await fetch('/api/sources/analytics', {
          credentials: 'include'
        });
        if (!response.ok) {
          throw new Error("Failed to fetch analytics");
        }
        return response.json();
      } catch (error) {
        console.warn('Failed to fetch source analytics:', error);
        return { 
          totalSources: 0, 
          sourcesByType: {}, 
          sourcesByReliability: {}, 
          topDomains: [], 
          recentSources: [] 
        };
      }
    },
  });

  const { data: sourceDetailsData, error: detailsError } = useQuery<{ source: Source; relatedSignals: any[] }>({
    queryKey: ["/api/sources", selectedSource?.id],
    enabled: !!selectedSource,
    retry: false,
    queryFn: async () => {
      try {
        const response = await fetch(`/api/sources/${selectedSource?.id}`, {
          credentials: 'include'
        });
        if (!response.ok) {
          throw new Error("Failed to fetch source details");
        }
        return response.json();
      } catch (error) {
        console.warn('Failed to fetch source details:', error);
        return { source: selectedSource!, relatedSignals: [] };
      }
    },
  });

  const updateSourceMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: number; updates: any }) => {
      const response = await apiRequest("PUT", `/api/sources/${id}`, updates);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sources"] });
      toast({
        title: "Source Updated",
        description: "Source reliability has been updated.",
      });
    },
  });

  const sources = sourcesData?.sources || [];
  const analytics = analyticsData;

  // Filter sources
  const filteredSources = sources.filter(source => {
    const matchesSearch = source.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         source.domain.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = typeFilter === "all" || source.sourceType === typeFilter;
    const matchesReliability = reliabilityFilter === "all" || source.reliability === reliabilityFilter;
    
    return matchesSearch && matchesType && matchesReliability;
  });

  const getReliabilityColor = (reliability: string) => {
    switch (reliability) {
      case 'high':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'news':
        return <Newspaper size={16} />;
      case 'research':
        return <BarChart3 size={16} />;
      case 'social':
        return <Activity size={16} />;
      default:
        return <Globe size={16} />;
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-8 bg-gray-200 rounded animate-pulse"></div>
        <div className="h-64 bg-gray-200 rounded animate-pulse"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Sources</h2>
          <p className="text-sm text-gray-600 mt-1">
            Track and manage your research sources and their reliability
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => queryClient.invalidateQueries({ queryKey: ["/api/sources"] })}
          className="flex items-center gap-2"
        >
          <RefreshCw size={14} />
          Refresh
        </Button>
      </div>

      {/* Analytics Cards */}
      {analytics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Sources</p>
                  <p className="text-2xl font-bold">{analytics.totalSources}</p>
                </div>
                <Globe className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">High Reliability</p>
                  <p className="text-2xl font-bold text-green-600">
                    {analytics.sourcesByReliability.high || 0}
                  </p>
                </div>
                <Shield className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">News Sources</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {analytics.sourcesByType.news || 0}
                  </p>
                </div>
                <Newspaper className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Research Sources</p>
                  <p className="text-2xl font-bold text-purple-600">
                    {analytics.sourcesByType.research || 0}
                  </p>
                </div>
                <BarChart3 className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search sources..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="news">News</SelectItem>
                <SelectItem value="research">Research</SelectItem>
                <SelectItem value="social">Social Media</SelectItem>
                <SelectItem value="article">Articles</SelectItem>
                <SelectItem value="tech_blog">Tech Blogs</SelectItem>
              </SelectContent>
            </Select>

            <Select value={reliabilityFilter} onValueChange={setReliabilityFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Filter by reliability" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Reliability</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="unknown">Unknown</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Sources Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">
            Sources ({filteredSources.length})
          </h3>
          
          {filteredSources.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-8">
                  <Globe className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No sources found</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    {searchQuery ? "Try adjusting your search or filters." : "Analyze some content with URLs to start building your source library."}
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            filteredSources.map((source) => (
              <Card 
                key={source.id} 
                className={`hover:shadow-md transition-shadow cursor-pointer ${
                  selectedSource?.id === source.id ? 'ring-2 ring-blue-500' : ''
                }`}
                onClick={() => setSelectedSource(source)}
              >
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1">
                      {source.favicon ? (
                        <img src={source.favicon} alt="" className="w-5 h-5 mt-1" />
                      ) : (
                        getTypeIcon(source.sourceType)
                      )}
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-gray-900 truncate">
                          {source.title}
                        </h4>
                        <p className="text-sm text-gray-500 truncate">
                          {source.domain}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 ml-4">
                      <Badge className={getReliabilityColor(source.reliability)} variant="secondary">
                        {source.reliability}
                      </Badge>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          window.open(source.url, '_blank');
                        }}
                      >
                        <ExternalLink size={14} />
                      </Button>
                    </div>
                  </div>
                  
                  <div className="mt-3 flex items-center justify-between text-xs text-gray-500">
                    <div className="flex items-center gap-4">
                      <span className="flex items-center gap-1">
                        <Clock size={12} />
                        {formatDistanceToNow(new Date(source.lastAccessed), { addSuffix: true })}
                      </span>
                      <span className="flex items-center gap-1">
                        <Eye size={12} />
                        {source.accessCount} access{source.accessCount !== 1 ? 'es' : ''}
                      </span>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {source.sourceType}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Source Details */}
        <div className="sticky top-4">
          {selectedSource ? (
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    {selectedSource.favicon ? (
                      <img src={selectedSource.favicon} alt="" className="w-6 h-6 mt-1" />
                    ) : (
                      getTypeIcon(selectedSource.sourceType)
                    )}
                    <div>
                      <CardTitle className="text-lg">{selectedSource.title}</CardTitle>
                      <p className="text-sm text-gray-500">{selectedSource.domain}</p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => window.open(selectedSource.url, '_blank')}
                  >
                    <ExternalLink size={16} />
                  </Button>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Reliability</p>
                    <Select 
                      value={selectedSource.reliability} 
                      onValueChange={(value) => 
                        updateSourceMutation.mutate({
                          id: selectedSource.id,
                          updates: { reliability: value }
                        })
                      }
                    >
                      <SelectTrigger className="w-full mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="unknown">Unknown</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <p className="text-sm font-medium text-gray-600">Type</p>
                    <p className="text-sm text-gray-900 mt-1 capitalize">
                      {selectedSource.sourceType.replace('_', ' ')}
                    </p>
                  </div>
                </div>

                <Separator />

                <div>
                  <p className="text-sm font-medium text-gray-600">Access History</p>
                  <div className="mt-2 space-y-2 text-sm text-gray-700">
                    <p>First captured: {formatDistanceToNow(new Date(selectedSource.firstCaptured), { addSuffix: true })}</p>
                    <p>Last accessed: {formatDistanceToNow(new Date(selectedSource.lastAccessed), { addSuffix: true })}</p>
                    <p>Total accesses: {selectedSource.accessCount}</p>
                  </div>
                </div>

                {selectedSource.description && (
                  <>
                    <Separator />
                    <div>
                      <p className="text-sm font-medium text-gray-600">Description</p>
                      <p className="text-sm text-gray-700 mt-1">{selectedSource.description}</p>
                    </div>
                  </>
                )}

                {sourceDetailsData?.relatedSignals && sourceDetailsData.relatedSignals.length > 0 && (
                  <>
                    <Separator />
                    <div>
                      <p className="text-sm font-medium text-gray-600">
                        Related Signals ({sourceDetailsData.relatedSignals.length})
                      </p>
                      <div className="mt-2 space-y-2">
                        {sourceDetailsData.relatedSignals.slice(0, 3).map((signal) => (
                          <div key={signal.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                            <span className="text-sm text-gray-900 truncate">{signal.title}</span>
                            <Badge variant="outline" className="text-xs">
                              {signal.status}
                            </Badge>
                          </div>
                        ))}
                        {sourceDetailsData.relatedSignals.length > 3 && (
                          <p className="text-xs text-gray-500">
                            +{sourceDetailsData.relatedSignals.length - 3} more signals
                          </p>
                        )}
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-8">
                  <Eye className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">Select a source</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Click on a source to view details and manage its reliability rating.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}