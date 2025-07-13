import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ContentInput } from "@/components/content-input";
import { EnhancedAnalysisResults } from "@/components/enhanced-analysis-results";
import { SignalsSidebar } from "@/components/signals-sidebar";
import { SignalsDashboard } from "@/components/signals-dashboard";
import { TrendingTopics } from "@/components/trending-topics";
import { BriefBuilder } from "@/components/brief-builder";
import { GetToByBrief } from "@/components/get-to-by-brief";
import { CohortBuilder } from "@/components/cohort-builder";
import { SystemSuggestions } from "@/components/system-suggestions";
import { SourcesManager } from "@/components/sources-manager";
import { SignalMiningDashboard } from "@/components/signal-mining-dashboard";
import { ReactiveContentBuilder } from "@/components/reactive-content-builder";
import { DailyReport } from "@/components/daily-report";
import { authService } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { Brain, Bell, User, BarChart3, TrendingUp, FileText, Zap, Globe, Activity } from "lucide-react";

interface DashboardProps {
  user: { id: number; email: string };
  onLogout: () => void;
}

export default function Dashboard({ user, onLogout }: DashboardProps) {
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [originalContent, setOriginalContent] = useState<any>(null);
  const [activeTab, setActiveTab] = useState("capture");
  const { toast } = useToast();

  const handleLogout = async () => {
    try {
      await authService.logout();
      onLogout();
      toast({
        title: "Logged out",
        description: "You have been logged out successfully",
      });
    } catch (error) {
      console.error("Logout error:", error);
      onLogout(); // Logout anyway
    }
  };

  const handleAnalysisComplete = (result: any, content?: any) => {
    setAnalysisResult(result);
    if (content) {
      setOriginalContent(content);
    }
    // Scroll to results
    setTimeout(() => {
      document.getElementById('analysis-results')?.scrollIntoView({ 
        behavior: 'smooth',
        block: 'start'
      });
    }, 100);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="h-8 w-8 bg-primary rounded-full flex items-center justify-center">
                <Brain className="text-white" size={20} />
              </div>
              <h1 className="ml-3 text-xl font-semibold text-gray-900">Strategist</h1>
            </div>
            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="sm">
                <Bell size={20} className="text-gray-500" />
              </Button>
              <div className="relative">
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={handleLogout}
                  className="flex items-center space-x-2"
                >
                  <div className="h-8 w-8 rounded-full bg-gray-300 flex items-center justify-center">
                    <User size={16} className="text-gray-600" />
                  </div>
                  <span className="text-gray-700 font-medium">{user.email}</span>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Left Column - Sidebar */}
          <div className="lg:col-span-1 order-2 lg:order-1">
            <SignalsSidebar />
          </div>

          {/* Main Content Area */}
          <div className="lg:col-span-3 order-1 lg:order-2">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="capture" className="flex items-center space-x-1">
                  <Zap className="h-4 w-4" />
                  <span>Capture</span>
                </TabsTrigger>
                <TabsTrigger value="intelligence" className="flex items-center space-x-1">
                  <Activity className="h-4 w-4" />
                  <span>Intelligence</span>
                </TabsTrigger>
                <TabsTrigger value="manage" className="flex items-center space-x-1">
                  <BarChart3 className="h-4 w-4" />
                  <span>Manage</span>
                </TabsTrigger>
                <TabsTrigger value="strategy" className="flex items-center space-x-1">
                  <Brain className="h-4 w-4" />
                  <span>Strategy</span>
                </TabsTrigger>
                <TabsTrigger value="execute" className="flex items-center space-x-1">
                  <FileText className="h-4 w-4" />
                  <span>Execute</span>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="capture" className="space-y-6">
                <div className="mb-8">
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    Content Capture & Analysis
                  </h2>
                  <p className="text-gray-600">
                    Capture content from multiple sources and analyze for strategic insights
                  </p>
                </div>

                <div className="space-y-8">
                  <ContentInput onAnalysisComplete={handleAnalysisComplete} />
                  
                  {/* Analysis Results */}
                  {analysisResult && (
                    <div id="analysis-results">
                      <EnhancedAnalysisResults analysis={analysisResult} originalContent={originalContent} />
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="intelligence" className="space-y-6">
                <Tabs defaultValue="signals" className="space-y-4">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="signals">Signal Mining</TabsTrigger>
                    <TabsTrigger value="trends">Trending Topics</TabsTrigger>
                    <TabsTrigger value="reactive">Reactive Content</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="signals" className="space-y-4">
                    <SignalMiningDashboard />
                  </TabsContent>
                  
                  <TabsContent value="trends" className="space-y-4">
                    <TrendingTopics />
                  </TabsContent>
                  
                  <TabsContent value="reactive" className="space-y-4">
                    <ReactiveContentBuilder />
                  </TabsContent>
                </Tabs>
              </TabsContent>

              <TabsContent value="manage" className="space-y-6">
                <Tabs defaultValue="dashboard" className="space-y-4">
                  <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
                    <TabsTrigger value="reports">Daily Reports</TabsTrigger>
                    <TabsTrigger value="sources">Sources</TabsTrigger>
                    <TabsTrigger value="suggestions">AI Suggestions</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="dashboard" className="space-y-4">
                    <SignalsDashboard />
                  </TabsContent>
                  
                  <TabsContent value="reports" className="space-y-4">
                    <DailyReport />
                  </TabsContent>
                  
                  <TabsContent value="sources" className="space-y-4">
                    <SourcesManager />
                  </TabsContent>
                  
                  <TabsContent value="suggestions" className="space-y-4">
                    <SystemSuggestions />
                  </TabsContent>
                </Tabs>
              </TabsContent>

              <TabsContent value="strategy" className="space-y-6">
                <Tabs defaultValue="cohorts" className="space-y-4">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="cohorts">Cohort Builder</TabsTrigger>
                    <TabsTrigger value="get-to-by">GET→TO→BY</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="cohorts" className="space-y-4">
                    <CohortBuilder />
                  </TabsContent>
                  
                  <TabsContent value="get-to-by" className="space-y-4">
                    <GetToByBrief selectedSignals={[]} />
                  </TabsContent>
                </Tabs>
              </TabsContent>

              <TabsContent value="execute" className="space-y-6">
                <BriefBuilder />
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </main>
    </div>
  );
}
