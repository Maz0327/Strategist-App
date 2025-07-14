import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { SignalsSidebar } from "@/components/signals-sidebar";
import { TodaysBriefing } from "@/components/todays-briefing";
import { ExploreSignals } from "@/components/explore-signals";
import { NewSignalCapture } from "@/components/new-signal-capture";
import { StrategicBriefLab } from "@/components/strategic-brief-lab";
import { ManageHub } from "@/components/manage-hub";
import { AdminDashboard } from "@/components/admin-dashboard";
import { FeedbackWidget } from "@/components/feedback-widget";
import { authService } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { Brain, Bell, User, Home, Search, Plus, Target, Settings, ChevronRight, BarChart3 } from "lucide-react";

interface DashboardProps {
  user: { id: number; email: string };
  onLogout: () => void;
  onPageChange?: (page: string) => void;
}

export default function Dashboard({ user, onLogout, onPageChange }: DashboardProps) {
  const [activeTab, setActiveTab] = useState("briefing");
  const [activeSubTab, setActiveSubTab] = useState("");
  const { toast } = useToast();

  // Notify parent component of page changes
  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    onPageChange?.(tab);
  };

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

  // Navigation handlers
  const handleNavigateToExplore = () => setActiveTab("explore");
  const handleNavigateToCapture = () => setActiveTab("capture");
  const handleNavigateToBrief = () => setActiveTab("brief");
  const handleNavigateToManage = () => setActiveTab("manage");

  // Sidebar navigation items
  const navigationItems = [
    {
      id: "briefing",
      label: "Today's Briefing",
      icon: Home,
      subItems: [
        { id: "client-feeds", label: "Client Channels" },
        { id: "custom-feeds", label: "Custom Feeds" },
        { id: "project-feeds", label: "Project Intelligence" }
      ]
    },
    {
      id: "explore",
      label: "Explore Signals",
      icon: Search,
      subItems: [
        { id: "trending", label: "Trending Topics" },
        { id: "mining", label: "Signal Mining" },
        { id: "opportunities", label: "Reactive Opportunities" },
        { id: "cultural", label: "Cultural Moments" }
      ]
    },
    {
      id: "capture",
      label: "Signal Capture",
      icon: Plus,
      subItems: []
    },
    {
      id: "brief",
      label: "Strategic Brief Lab",
      icon: Target,
      subItems: [
        { id: "cohorts", label: "Cohort Builder" },
        { id: "framework", label: "Define → Shift → Deliver" }
      ]
    },
    {
      id: "manage",
      label: "Manage",
      icon: Settings,
      subItems: [
        { id: "dashboard", label: "Dashboard" },
        { id: "sources", label: "Sources" },
        { id: "reports", label: "Daily Reports" },
        { id: "insights", label: "Audience Insights" }
      ]
    },
    {
      id: "admin",
      label: "Admin Panel",
      icon: BarChart3,
      subItems: [
        { id: "analytics", label: "User Analytics" },
        { id: "feedback", label: "Feedback Management" },
        { id: "performance", label: "System Performance" }
      ]
    }
  ];

  return (
    <div className="h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200 flex-shrink-0">
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
      <main className="flex flex-1 overflow-hidden">
        {/* Sidebar Navigation */}
        <div className="w-64 bg-white border-r border-gray-200 flex flex-col h-full">
          <div className="flex-1 overflow-y-auto py-6 px-4">
            <nav className="space-y-2">
              {navigationItems.map((item) => (
                <div key={item.id}>
                  <button
                    onClick={() => {
                      handleTabChange(item.id);
                      setActiveSubTab("");
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 text-left rounded-md text-sm font-medium transition-colors ${
                      activeTab === item.id 
                        ? 'bg-primary text-primary-foreground' 
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <div className="flex items-center space-x-2">
                      <item.icon className="h-4 w-4" />
                      <span>{item.label}</span>
                    </div>
                    {item.subItems.length > 0 && (
                      <ChevronRight className={`h-4 w-4 transition-transform ${
                        activeTab === item.id ? 'rotate-90' : ''
                      }`} />
                    )}
                  </button>
                  
                  {/* Sub-navigation */}
                  {activeTab === item.id && item.subItems.length > 0 && (
                    <div 
                      className="ml-6 mt-2 space-y-1"
                      data-tutorial={item.id === "briefing" ? "briefing-tabs" : undefined}
                    >
                      {item.subItems.map((subItem) => (
                        <button
                          key={subItem.id}
                          onClick={() => setActiveSubTab(subItem.id)}
                          className={`w-full text-left px-3 py-2 text-sm rounded-md transition-colors ${
                            activeSubTab === subItem.id
                              ? 'bg-primary/10 text-primary'
                              : 'text-gray-600 hover:bg-gray-50'
                          }`}
                        >
                          {subItem.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </nav>
          </div>
          
          {/* Sidebar Footer - Fixed height with scroll */}
          <div className="flex-shrink-0 px-4 py-4 border-t border-gray-200 max-h-80 overflow-y-auto">
            <SignalsSidebar />
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 overflow-y-auto bg-gray-50 p-8">
          {activeTab === "briefing" && (
            <TodaysBriefing 
              activeSubTab={activeSubTab}
              onNavigateToExplore={handleNavigateToExplore}
              onNavigateToCapture={handleNavigateToCapture}
              onNavigateToBrief={handleNavigateToBrief}
            />
          )}
          
          {activeTab === "explore" && (
            <ExploreSignals activeSubTab={activeSubTab} />
          )}
          
          {activeTab === "capture" && (
            <NewSignalCapture 
              onNavigateToBrief={handleNavigateToBrief}
            />
          )}
          
          {activeTab === "brief" && (
            <StrategicBriefLab activeSubTab={activeSubTab} />
          )}
          
          {activeTab === "manage" && (
            <ManageHub activeSubTab={activeSubTab} />
          )}
          
          {activeTab === "admin" && (
            <AdminDashboard />
          )}
        </div>
      </main>
      
      {/* Feedback Widget */}
      <FeedbackWidget />
    </div>
  );
}
