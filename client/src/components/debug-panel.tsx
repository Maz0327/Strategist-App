import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { 
  Bug, 
  Activity, 
  AlertTriangle, 
  BarChart3, 
  Trash2, 
  RefreshCw,
  Clock,
  User,
  Globe,
  Zap
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface LogEntry {
  timestamp: string;
  level: 'info' | 'warn' | 'error' | 'debug';
  message: string;
  data?: any;
  stack?: string;
  userId?: number;
  endpoint?: string;
  userAgent?: string;
  ip?: string;
}

interface ErrorSummary {
  totalErrors: number;
  recentErrors: LogEntry[];
  errorCounts: Record<string, number>;
  errorsByEndpoint: Record<string, number>;
  errorsByUser: Record<string, number>;
}

interface PerformanceMetrics {
  totalRequests: number;
  averageResponseTime: number;
  p95ResponseTime: number;
  p99ResponseTime: number;
  slowRequests: number;
}

export function DebugPanel() {
  const [selectedLevel, setSelectedLevel] = useState<string>('all');
  const [isOpen, setIsOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: logsData, isLoading: isLoadingLogs, refetch: refetchLogs, error: logsError } = useQuery<{ logs: LogEntry[]; count: number }>({
    queryKey: ["/api/debug/logs", selectedLevel],
    queryFn: async () => {
      try {
        const level = selectedLevel === 'all' ? '' : selectedLevel;
        const response = await apiRequest("GET", `/api/debug/logs?limit=100${level ? `&level=${level}` : ''}`);
        return response.json();
      } catch (error) {
        console.warn('Failed to fetch logs:', error);
        return { logs: [], count: 0 };
      }
    },
    retry: false,
    refetchOnWindowFocus: false,
    enabled: isOpen, // Only fetch when panel is open
  });

  const { data: errorSummary, refetch: refetchErrors, error: errorsError } = useQuery<ErrorSummary>({
    queryKey: ["/api/debug/errors"],
    queryFn: async () => {
      try {
        const response = await apiRequest("GET", "/api/debug/errors");
        return response.json();
      } catch (error) {
        console.warn('Failed to fetch error summary:', error);
        return { totalErrors: 0, recentErrors: [], errorCounts: {}, errorsByEndpoint: {}, errorsByUser: {} };
      }
    },
    retry: false,
    refetchOnWindowFocus: false,
    enabled: isOpen, // Only fetch when panel is open
  });

  const { data: performanceMetrics, refetch: refetchPerformance, error: performanceError } = useQuery<PerformanceMetrics>({
    queryKey: ["/api/debug/performance"],
    queryFn: async () => {
      try {
        const response = await apiRequest("GET", "/api/debug/performance");
        return response.json();
      } catch (error) {
        console.warn('Failed to fetch performance metrics:', error);
        return { totalRequests: 0, averageResponseTime: 0, p95ResponseTime: 0, p99ResponseTime: 0, slowRequests: 0 };
      }
    },
    retry: false,
    refetchOnWindowFocus: false,
    enabled: isOpen, // Only fetch when panel is open
  });

  const clearLogsMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/debug/clear-logs");
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Logs Cleared",
        description: "Debug logs have been cleared successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/debug"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to clear logs",
        variant: "destructive",
      });
    },
  });

  const refreshAll = () => {
    refetchLogs();
    refetchErrors();
    refetchPerformance();
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'error':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'warn':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'info':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'debug':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatTimestamp = (timestamp: string) => {
    try {
      return formatDistanceToNow(new Date(timestamp), { addSuffix: true });
    } catch {
      return timestamp;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          size="sm" 
          className="fixed bottom-4 right-4 z-50"
        >
          <Bug className="mr-2 h-4 w-4" />
          Debug
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-6xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span className="flex items-center">
              <Bug className="mr-2 h-5 w-5" />
              Debug & Monitoring Panel
            </span>
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm" onClick={refreshAll}>
                <RefreshCw className="mr-2 h-4 w-4" />
                Refresh
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => clearLogsMutation.mutate()}
                disabled={clearLogsMutation.isPending}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Clear Logs
              </Button>
            </div>
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="logs">Logs</TabsTrigger>
            <TabsTrigger value="errors">Errors</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Logs</CardTitle>
                  <Activity className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{logsData?.count || 0}</div>
                  <p className="text-xs text-muted-foreground">
                    System activity logged
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Errors</CardTitle>
                  <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-600">
                    {errorSummary?.totalErrors || 0}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Errors detected
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Avg Response Time</CardTitle>
                  <BarChart3 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {performanceMetrics?.averageResponseTime || 0}ms
                  </div>
                  <p className="text-xs text-muted-foreground">
                    API performance
                  </p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Recent Error Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-32">
                  {errorSummary?.recentErrors?.slice(0, 5).map((error, index) => (
                    <div key={index} className="flex items-center space-x-2 py-1">
                      <Badge variant="destructive" className="text-xs">ERROR</Badge>
                      <span className="text-sm text-gray-600">{formatTimestamp(error.timestamp)}</span>
                      <span className="text-sm truncate">{error.message}</span>
                    </div>
                  ))}
                  {!errorSummary?.recentErrors?.length && (
                    <p className="text-sm text-gray-500">No recent errors</p>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="logs" className="space-y-4">
            <div className="flex items-center space-x-2">
              <Select value={selectedLevel} onValueChange={setSelectedLevel}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Filter level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Levels</SelectItem>
                  <SelectItem value="error">Error</SelectItem>
                  <SelectItem value="warn">Warning</SelectItem>
                  <SelectItem value="info">Info</SelectItem>
                  <SelectItem value="debug">Debug</SelectItem>
                </SelectContent>
              </Select>
              <span className="text-sm text-gray-500">
                Showing {logsData?.count || 0} logs
              </span>
            </div>

            <ScrollArea className="h-96">
              <div className="space-y-2">
                {logsData?.logs?.map((log, index) => (
                  <Card key={index} className="p-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-2">
                        <Badge className={getLevelColor(log.level)}>
                          {log.level.toUpperCase()}
                        </Badge>
                        <span className="text-sm font-medium">{log.message}</span>
                      </div>
                      <span className="text-xs text-gray-500">
                        {formatTimestamp(log.timestamp)}
                      </span>
                    </div>
                    
                    {log.endpoint && (
                      <div className="flex items-center space-x-1 mt-1">
                        <Globe className="h-3 w-3 text-gray-400" />
                        <span className="text-xs text-gray-600">{log.endpoint}</span>
                      </div>
                    )}
                    
                    {log.userId && (
                      <div className="flex items-center space-x-1 mt-1">
                        <User className="h-3 w-3 text-gray-400" />
                        <span className="text-xs text-gray-600">User {log.userId}</span>
                      </div>
                    )}
                    
                    {log.data && (
                      <details className="mt-2">
                        <summary className="text-xs text-gray-500 cursor-pointer">View Details</summary>
                        <pre className="text-xs bg-gray-50 p-2 mt-1 rounded overflow-x-auto">
                          {JSON.stringify(log.data, null, 2)}
                        </pre>
                      </details>
                    )}
                    
                    {log.stack && (
                      <details className="mt-2">
                        <summary className="text-xs text-red-500 cursor-pointer">Stack Trace</summary>
                        <pre className="text-xs bg-red-50 p-2 mt-1 rounded overflow-x-auto text-red-700">
                          {log.stack}
                        </pre>
                      </details>
                    )}
                  </Card>
                ))}
                
                {isLoadingLogs && (
                  <div className="text-center py-4">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
                  </div>
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="errors" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle>Error Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {Object.entries(errorSummary?.errorCounts || {}).map(([error, count]) => (
                      <div key={error} className="flex justify-between">
                        <span className="text-sm truncate">{error}</span>
                        <Badge variant="destructive">{count}</Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Errors by Endpoint</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {Object.entries(errorSummary?.errorsByEndpoint || {}).map(([endpoint, count]) => (
                      <div key={endpoint} className="flex justify-between">
                        <span className="text-sm truncate">{endpoint}</span>
                        <Badge variant="destructive">{count}</Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Recent Errors</CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-64">
                  <div className="space-y-2">
                    {errorSummary?.recentErrors?.map((error, index) => (
                      <Card key={index} className="p-3 border-red-200">
                        <div className="flex items-start justify-between">
                          <div>
                            <span className="text-sm font-medium text-red-800">{error.message}</span>
                            {error.endpoint && (
                              <div className="text-xs text-red-600 mt-1">{error.endpoint}</div>
                            )}
                          </div>
                          <span className="text-xs text-gray-500">
                            {formatTimestamp(error.timestamp)}
                          </span>
                        </div>
                        {error.stack && (
                          <details className="mt-2">
                            <summary className="text-xs text-red-500 cursor-pointer">Stack Trace</summary>
                            <pre className="text-xs bg-red-50 p-2 mt-1 rounded overflow-x-auto text-red-700">
                              {error.stack}
                            </pre>
                          </details>
                        )}
                      </Card>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="performance" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Requests</CardTitle>
                  <Activity className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {performanceMetrics?.totalRequests || 0}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Avg Response</CardTitle>
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {performanceMetrics?.averageResponseTime || 0}ms
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">P95 Response</CardTitle>
                  <BarChart3 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {performanceMetrics?.p95ResponseTime || 0}ms
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Slow Requests</CardTitle>
                  <Zap className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-orange-600">
                    {performanceMetrics?.slowRequests || 0}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    &gt;1000ms
                  </p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Performance Insights</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {performanceMetrics?.averageResponseTime && (
                    <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <span className="text-sm">Average response time</span>
                      <Badge variant={performanceMetrics.averageResponseTime > 500 ? "destructive" : "default"}>
                        {performanceMetrics.averageResponseTime}ms
                      </Badge>
                    </div>
                  )}
                  {performanceMetrics?.slowRequests && performanceMetrics.slowRequests > 0 && (
                    <div className="flex items-center justify-between p-2 bg-orange-50 rounded">
                      <span className="text-sm">Slow requests detected</span>
                      <Badge variant="destructive">{performanceMetrics.slowRequests}</Badge>
                    </div>
                  )}
                  {(!performanceMetrics?.slowRequests || performanceMetrics.slowRequests === 0) && (
                    <div className="flex items-center justify-between p-2 bg-green-50 rounded">
                      <span className="text-sm">All requests performing well</span>
                      <Badge className="bg-green-100 text-green-800">Good</Badge>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}