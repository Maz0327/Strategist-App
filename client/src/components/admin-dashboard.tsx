import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { formatDistanceToNow } from "date-fns";
import { 
  BarChart3, 
  Users, 
  TrendingUp, 
  Clock, 
  MessageSquare, 
  Star,
  Filter,
  RefreshCw,
  Eye,
  CheckCircle,
  XCircle,
  AlertCircle,
  Activity
} from "lucide-react";

interface DashboardData {
  activeUsers: number;
  topFeatures: {
    feature: string;
    totalUsage: number;
    uniqueUsers: number;
    avgDuration: number;
  }[];
  userEngagement: {
    userId: number;
    totalActions: number;
    uniqueFeatures: number;
    avgSessionDuration: number;
  }[];
  avgResponseTime: number;
  recentFeedback: {
    id: number;
    type: string;
    category: string;
    rating: number;
    title: string;
    status: string;
    createdAt: string;
  }[];
}

interface FeedbackItem {
  id: number;
  userId: number;
  userEmail: string;
  type: string;
  category: string;
  rating: number;
  title: string;
  description: string;
  status: string;
  adminResponse: string;
  createdAt: string;
  updatedAt: string;
}

export function AdminDashboard() {
  const [timeRange, setTimeRange] = useState<'day' | 'week' | 'month'>('week');
  const [selectedUser, setSelectedUser] = useState<number | null>(null);
  const [feedbackFilter, setFeedbackFilter] = useState<string>('all');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch dashboard data
  const { data: dashboardData, isLoading: isDashboardLoading, refetch: refetchDashboard } = useQuery<DashboardData>({
    queryKey: ["/api/admin/dashboard", timeRange],
    staleTime: 30000,
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/admin/dashboard?timeRange=${timeRange}`);
      return response.json();
    },
  });

  // Fetch all feedback
  const { data: feedbackData, isLoading: isFeedbackLoading, refetch: refetchFeedback } = useQuery<FeedbackItem[]>({
    queryKey: ["/api/admin/feedback", feedbackFilter],
    staleTime: 30000,
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/admin/feedback?status=${feedbackFilter}`);
      return response.json();
    },
  });

  // Update feedback status mutation
  const updateFeedbackMutation = useMutation({
    mutationFn: async ({ id, status, adminResponse }: { id: number; status: string; adminResponse?: string }) => {
      const response = await apiRequest("PUT", `/api/admin/feedback/${id}`, { status, adminResponse });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/feedback"] });
      toast({
        title: "Feedback Updated",
        description: "Feedback status has been updated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update feedback",
        variant: "destructive",
      });
    },
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'bg-red-100 text-red-800';
      case 'in_progress': return 'bg-yellow-100 text-yellow-800';
      case 'resolved': return 'bg-green-100 text-green-800';
      case 'closed': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'bug': return 'bg-red-100 text-red-800';
      case 'feature_request': return 'bg-blue-100 text-blue-800';
      case 'rating': return 'bg-yellow-100 text-yellow-800';
      case 'general': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleRefresh = () => {
    refetchDashboard();
    refetchFeedback();
  };

  if (isDashboardLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        </div>
        <div className="grid gap-4">
          {[1, 2, 3, 4].map(i => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-6 bg-gray-200 rounded w-1/3"></div>
              </CardHeader>
              <CardContent>
                <div className="h-4 bg-gray-200 rounded w-2/3"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-600">Monitor user engagement and system performance</p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={timeRange} onValueChange={(value: 'day' | 'week' | 'month') => setTimeRange(value)}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="day">Last Day</SelectItem>
              <SelectItem value="week">Last Week</SelectItem>
              <SelectItem value="month">Last Month</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={handleRefresh} variant="outline" size="sm">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="features">Feature Usage</TabsTrigger>
          <TabsTrigger value="users">User Behavior</TabsTrigger>
          <TabsTrigger value="feedback">Feedback</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Users</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{dashboardData?.activeUsers || 0}</div>
                <p className="text-xs text-muted-foreground">
                  In the last {timeRange}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Top Features</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{dashboardData?.topFeatures?.length || 0}</div>
                <p className="text-xs text-muted-foreground">
                  Features being used
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg Response Time</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{Math.round(dashboardData?.avgResponseTime || 0)}ms</div>
                <p className="text-xs text-muted-foreground">
                  System performance
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Recent Feedback</CardTitle>
                <MessageSquare className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{dashboardData?.recentFeedback?.length || 0}</div>
                <p className="text-xs text-muted-foreground">
                  New feedback items
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Recent Feedback Preview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Recent Feedback
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {dashboardData?.recentFeedback?.map((feedback) => (
                  <div key={feedback.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge className={getTypeColor(feedback.type)}>
                          {feedback.type.replace('_', ' ')}
                        </Badge>
                        <Badge className={getStatusColor(feedback.status)}>
                          {feedback.status.replace('_', ' ')}
                        </Badge>
                        {feedback.rating && (
                          <div className="flex items-center gap-1">
                            <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                            <span className="text-sm">{feedback.rating}</span>
                          </div>
                        )}
                      </div>
                      <p className="font-medium break-words">{feedback.title}</p>
                      <p className="text-sm text-gray-500">
                        {formatDistanceToNow(new Date(feedback.createdAt), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="features" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Feature Usage Analytics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {dashboardData?.topFeatures?.map((feature, index) => (
                  <div key={feature.feature} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="outline">#{index + 1}</Badge>
                        <h3 className="font-medium">{feature.feature.replace('_', ' ')}</h3>
                      </div>
                      <div className="grid grid-cols-3 gap-4 text-sm text-gray-600">
                        <div>
                          <span className="font-medium">Total Usage:</span> {feature.totalUsage}
                        </div>
                        <div>
                          <span className="font-medium">Unique Users:</span> {feature.uniqueUsers}
                        </div>
                        <div>
                          <span className="font-medium">Avg Duration:</span> {Math.round(feature.avgDuration || 0)}ms
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                User Engagement Patterns
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {dashboardData?.userEngagement?.map((user) => (
                  <div key={user.userId} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="outline">User {user.userId}</Badge>
                        <Badge className="bg-blue-100 text-blue-800">
                          {user.totalActions} actions
                        </Badge>
                      </div>
                      <div className="grid grid-cols-3 gap-4 text-sm text-gray-600">
                        <div>
                          <span className="font-medium">Features Used:</span> {user.uniqueFeatures}
                        </div>
                        <div>
                          <span className="font-medium">Avg Session:</span> {Math.round(user.avgSessionDuration || 0)}ms
                        </div>
                        <div>
                          <span className="font-medium">Engagement Level:</span> 
                          <Badge className={user.totalActions > 50 ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}>
                            {user.totalActions > 50 ? 'High' : 'Medium'}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="feedback" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  User Feedback Management
                </CardTitle>
                <Select value={feedbackFilter} onValueChange={setFeedbackFilter}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="open">Open</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="resolved">Resolved</SelectItem>
                    <SelectItem value="closed">Closed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {feedbackData?.map((feedback) => (
                  <FeedbackItem
                    key={feedback.id}
                    feedback={feedback}
                    onUpdateStatus={(id, status, adminResponse) => 
                      updateFeedbackMutation.mutate({ id, status, adminResponse })
                    }
                  />
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

interface FeedbackItemProps {
  feedback: FeedbackItem;
  onUpdateStatus: (id: number, status: string, adminResponse?: string) => void;
}

function FeedbackItem({ feedback, onUpdateStatus }: FeedbackItemProps) {
  const [isResponseDialogOpen, setIsResponseDialogOpen] = useState(false);
  const [adminResponse, setAdminResponse] = useState(feedback.adminResponse || '');

  const handleStatusUpdate = (newStatus: string) => {
    onUpdateStatus(feedback.id, newStatus, adminResponse);
    setIsResponseDialogOpen(false);
  };

  return (
    <div className="border rounded-lg p-4 space-y-3">
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <Badge className={getTypeColor(feedback.type)}>
              {feedback.type.replace('_', ' ')}
            </Badge>
            <Badge className={getStatusColor(feedback.status)}>
              {feedback.status.replace('_', ' ')}
            </Badge>
            {feedback.rating && (
              <div className="flex items-center gap-1">
                <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                <span className="text-sm">{feedback.rating}/5</span>
              </div>
            )}
          </div>
          <h3 className="font-medium break-words">{feedback.title}</h3>
          <p className="text-sm text-gray-600 break-words mt-1">{feedback.description}</p>
          <div className="flex items-center gap-2 text-xs text-gray-500 mt-2">
            <span>User: {feedback.userEmail}</span>
            <span>•</span>
            <span>{formatDistanceToNow(new Date(feedback.createdAt), { addSuffix: true })}</span>
          </div>
        </div>
        <div className="flex gap-2 flex-shrink-0">
          <Dialog open={isResponseDialogOpen} onOpenChange={setIsResponseDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Eye className="h-4 w-4 mr-1" />
                Respond
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Respond to Feedback</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="admin-response">Admin Response</Label>
                  <Textarea
                    id="admin-response"
                    value={adminResponse}
                    onChange={(e) => setAdminResponse(e.target.value)}
                    placeholder="Enter your response to the user..."
                    rows={4}
                  />
                </div>
                <div className="flex justify-between">
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => handleStatusUpdate('in_progress')}
                    >
                      <AlertCircle className="h-4 w-4 mr-1" />
                      In Progress
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => handleStatusUpdate('resolved')}
                    >
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Resolved
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => handleStatusUpdate('closed')}
                    >
                      <XCircle className="h-4 w-4 mr-1" />
                      Closed
                    </Button>
                  </div>
                  <Button onClick={() => setIsResponseDialogOpen(false)} variant="outline">
                    Cancel
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>
      {feedback.adminResponse && (
        <div className="bg-blue-50 p-3 rounded-lg">
          <p className="text-sm text-blue-800">
            <strong>Admin Response:</strong> {feedback.adminResponse}
          </p>
        </div>
      )}
    </div>
  );
}

function getTypeColor(type: string) {
  switch (type) {
    case 'bug': return 'bg-red-100 text-red-800';
    case 'feature_request': return 'bg-blue-100 text-blue-800';
    case 'rating': return 'bg-yellow-100 text-yellow-800';
    case 'general': return 'bg-gray-100 text-gray-800';
    default: return 'bg-gray-100 text-gray-800';
  }
}

function getStatusColor(status: string) {
  switch (status) {
    case 'open': return 'bg-red-100 text-red-800';
    case 'in_progress': return 'bg-yellow-100 text-yellow-800';
    case 'resolved': return 'bg-green-100 text-green-800';
    case 'closed': return 'bg-gray-100 text-gray-800';
    default: return 'bg-gray-100 text-gray-800';
  }
}