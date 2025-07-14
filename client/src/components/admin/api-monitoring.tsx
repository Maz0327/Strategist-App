import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Clock, Activity, AlertCircle, TrendingUp, Database, ExternalLink, RefreshCw } from 'lucide-react';

interface ApiCall {
  id: number;
  endpoint: string;
  method: string;
  statusCode: number;
  responseTime: number;
  timestamp: string;
  userAgent?: string;
  errorMessage?: string;
  metadata?: any;
}

interface ExternalApiCall {
  id: number;
  service: string;
  endpoint?: string;
  method: string;
  statusCode?: number;
  responseTime: number;
  tokensUsed?: number;
  cost?: number;
  timestamp: string;
  errorMessage?: string;
  metadata?: any;
}

interface ApiStats {
  internal: {
    endpoint: string;
    method: string;
    totalCalls: number;
    avgResponseTime: number;
    successRate: number;
    totalErrors: number;
  }[];
  external: {
    service: string;
    totalCalls: number;
    avgResponseTime: number;
    totalTokens: number;
    totalCost: number;
    successRate: number;
  }[];
}

export default function ApiMonitoring() {
  const [timeRange, setTimeRange] = useState<'day' | 'week' | 'month'>('week');
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<ApiStats>({ internal: [], external: [] });
  const [recentCalls, setRecentCalls] = useState<ApiCall[]>([]);
  const [externalCalls, setExternalCalls] = useState<ExternalApiCall[]>([]);
  const [selectedService, setSelectedService] = useState<string>('all');

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch API statistics
      const statsResponse = await fetch(`/api/admin/api-stats?timeRange=${timeRange}`, {
        credentials: 'include'
      });
      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        setStats(statsData);
      }

      // Fetch recent API calls
      const callsResponse = await fetch(`/api/admin/recent-calls?limit=50`, {
        credentials: 'include'
      });
      if (callsResponse.ok) {
        const callsData = await callsResponse.json();
        setRecentCalls(callsData);
      }

      // Fetch external API calls
      const externalResponse = await fetch(`/api/admin/recent-calls?limit=50&service=openai`, {
        credentials: 'include'
      });
      if (externalResponse.ok) {
        const externalData = await externalResponse.json();
        setExternalCalls(externalData);
      }
    } catch (error) {
      console.error('Failed to fetch API monitoring data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [timeRange]);

  const formatCurrency = (cents: number) => {
    return `$${(cents / 100).toFixed(3)}`;
  };

  const formatResponseTime = (ms: number) => {
    return `${ms}ms`;
  };

  const getStatusColor = (status: number) => {
    if (status >= 200 && status < 300) return 'bg-green-100 text-green-800';
    if (status >= 400 && status < 500) return 'bg-yellow-100 text-yellow-800';
    if (status >= 500) return 'bg-red-100 text-red-800';
    return 'bg-gray-100 text-gray-800';
  };

  const getServiceIcon = (service: string) => {
    switch (service) {
      case 'openai':
        return <ExternalLink className="h-4 w-4" />;
      case 'database':
        return <Database className="h-4 w-4" />;
      default:
        return <Activity className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">API Monitoring</h2>
          <p className="text-gray-600">Track API usage, performance, and costs</p>
        </div>
        <div className="flex items-center space-x-4">
          <Select value={timeRange} onValueChange={(value: 'day' | 'week' | 'month') => setTimeRange(value)}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="day">Last 24h</SelectItem>
              <SelectItem value="week">Last week</SelectItem>
              <SelectItem value="month">Last month</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={fetchData} disabled={loading} size="sm">
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="internal">Internal APIs</TabsTrigger>
          <TabsTrigger value="external">External APIs</TabsTrigger>
          <TabsTrigger value="logs">Recent Calls</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total API Calls</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {stats.internal.reduce((sum, stat) => sum + stat.totalCalls, 0) + 
                   stats.external.reduce((sum, stat) => sum + stat.totalCalls, 0)}
                </div>
                <p className="text-xs text-muted-foreground">
                  {stats.internal.reduce((sum, stat) => sum + stat.totalCalls, 0)} internal, {' '}
                  {stats.external.reduce((sum, stat) => sum + stat.totalCalls, 0)} external
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg Response Time</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {Math.round(stats.internal.reduce((sum, stat) => sum + stat.avgResponseTime, 0) / (stats.internal.length || 1))}ms
                </div>
                <p className="text-xs text-muted-foreground">
                  Internal API average
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {Math.round(stats.internal.reduce((sum, stat) => sum + stat.successRate, 0) / (stats.internal.length || 1))}%
                </div>
                <p className="text-xs text-muted-foreground">
                  Overall success rate
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">AI Costs</CardTitle>
                <ExternalLink className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatCurrency(stats.external.reduce((sum, stat) => sum + stat.totalCost, 0))}
                </div>
                <p className="text-xs text-muted-foreground">
                  {stats.external.reduce((sum, stat) => sum + stat.totalTokens, 0)} tokens used
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="internal" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Internal API Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {stats.internal.map((stat, index) => (
                  <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <Badge variant={stat.method === 'GET' ? 'default' : 'secondary'}>
                        {stat.method}
                      </Badge>
                      <span className="font-medium">{stat.endpoint}</span>
                    </div>
                    <div className="flex items-center space-x-6 text-sm">
                      <div className="text-center">
                        <div className="font-medium">{stat.totalCalls}</div>
                        <div className="text-gray-500">calls</div>
                      </div>
                      <div className="text-center">
                        <div className="font-medium">{formatResponseTime(stat.avgResponseTime)}</div>
                        <div className="text-gray-500">avg time</div>
                      </div>
                      <div className="text-center">
                        <div className="font-medium">{stat.successRate}%</div>
                        <div className="text-gray-500">success</div>
                      </div>
                      <div className="text-center">
                        <div className="font-medium text-red-600">{stat.totalErrors}</div>
                        <div className="text-gray-500">errors</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="external" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>External API Usage</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {stats.external.map((stat, index) => (
                  <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      {getServiceIcon(stat.service)}
                      <span className="font-medium capitalize">{stat.service}</span>
                    </div>
                    <div className="flex items-center space-x-6 text-sm">
                      <div className="text-center">
                        <div className="font-medium">{stat.totalCalls}</div>
                        <div className="text-gray-500">calls</div>
                      </div>
                      <div className="text-center">
                        <div className="font-medium">{formatResponseTime(stat.avgResponseTime)}</div>
                        <div className="text-gray-500">avg time</div>
                      </div>
                      <div className="text-center">
                        <div className="font-medium">{stat.totalTokens}</div>
                        <div className="text-gray-500">tokens</div>
                      </div>
                      <div className="text-center">
                        <div className="font-medium">{formatCurrency(stat.totalCost)}</div>
                        <div className="text-gray-500">cost</div>
                      </div>
                      <div className="text-center">
                        <div className="font-medium">{stat.successRate}%</div>
                        <div className="text-gray-500">success</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="logs" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent API Calls</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {recentCalls.slice(0, 20).map((call) => (
                  <div key={call.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <Badge variant="outline">{call.method}</Badge>
                      <span className="font-medium">{call.endpoint}</span>
                      <Badge className={getStatusColor(call.statusCode)}>
                        {call.statusCode}
                      </Badge>
                    </div>
                    <div className="flex items-center space-x-4 text-sm">
                      <span>{formatResponseTime(call.responseTime)}</span>
                      <span className="text-gray-500">
                        {new Date(call.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}