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
import { useIsMobile } from "@/hooks/use-mobile";
import { Brain, Bell, User, Home, Search, Plus, Target, Settings, ChevronRight, BarChart3, ChevronLeft, Menu, X } from "lucide-react";

interface DashboardProps {
  user: { id: number; email: string };
  onLogout: () => void;
  onPageChange?: (page: string) => void;
}

export default function Dashboard({ user, onLogout, onPageChange }: DashboardProps) {
  const [activeTab, setActiveTab] = useState("briefing");
  const [activeSubTab, setActiveSubTab] = useState("");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { toast } = useToast();
  const isMobile = useIsMobile();

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
  const handleNavigateToTrending = (platform?: string) => {
    handleTabChange("explore");
    setActiveSubTab("trending");
    // TODO: Could add platform filtering here if needed
  };

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
      {/* Mobile-Responsive Header */}
      <header className="bg-white border-b border-gray-200 px-4 py-2 sm:px-6 sm:py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {isMobile && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          )}
          <div className="flex items-center gap-2">
            <Brain className="h-6 w-6 text-blue-600" />
            <span className="font-semibold text-gray-900 text-sm sm:text-base">Strategist</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" className="p-2">
            <Bell className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={handleLogout} className="p-2">
            <User className="h-4 w-4" />
          </Button>
        </div>
      </header>

      {/* Mobile-Only Persistent Navigation Bar */}
      {isMobile && (
        <div className="bg-white border-b border-gray-200 px-4 py-2">
          <div className="flex overflow-x-auto pb-2 scrollbar-hide">
            <div className="flex space-x-2 min-w-max">
              <Button
                variant={activeTab === "briefing" && activeSubTab === "client-feeds" ? "default" : "outline"}
                size="sm"
                onClick={() => {
                  setActiveTab("briefing");
                  setActiveSubTab("client-feeds");
                }}
                className="whitespace-nowrap flex-shrink-0"
              >
                <Home className="w-4 h-4 mr-1" />
                Client Channels
              </Button>
              <Button
                variant={activeTab === "briefing" && activeSubTab === "custom-feeds" ? "default" : "outline"}
                size="sm"
                onClick={() => {
                  setActiveTab("briefing");
                  setActiveSubTab("custom-feeds");
                }}
                className="whitespace-nowrap flex-shrink-0"
              >
                <Brain className="w-4 h-4 mr-1" />
                Custom Feeds
              </Button>
              <Button
                variant={activeTab === "briefing" && activeSubTab === "project-feeds" ? "default" : "outline"}
                size="sm"
                onClick={() => {
                  setActiveTab("briefing");
                  setActiveSubTab("project-feeds");
                }}
                className="whitespace-nowrap flex-shrink-0"
              >
                <BarChart3 className="w-4 h-4 mr-1" />
                Project Intel
              </Button>
              <Button
                variant={activeTab === "explore" ? "default" : "outline"}
                size="sm"
                onClick={() => setActiveTab("explore")}
                className="whitespace-nowrap flex-shrink-0"
              >
                <Search className="w-4 h-4 mr-1" />
                Explore
              </Button>
              <Button
                variant={activeTab === "capture" ? "default" : "outline"}
                size="sm"
                onClick={() => setActiveTab("capture")}
                className="whitespace-nowrap flex-shrink-0"
              >
                <Plus className="w-4 h-4 mr-1" />
                Capture
              </Button>
              <Button
                variant={activeTab === "brief" ? "default" : "outline"}
                size="sm"
                onClick={() => setActiveTab("brief")}
                className="whitespace-nowrap flex-shrink-0"
              >
                <Target className="w-4 h-4 mr-1" />
                Brief Lab
              </Button>
            </div>
          </div>
        </div>
      )}

      <div className="flex-1 flex overflow-hidden">
        {/* Mobile Menu Overlay */}
        {isMobile && mobileMenuOpen && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-40"
            onClick={() => setMobileMenuOpen(false)}
          />
        )}

        {/* Sidebar */}
        <div className={`
          ${isMobile ? 'fixed' : 'relative'} 
          ${isMobile && !mobileMenuOpen ? '-translate-x-full' : 'translate-x-0'}
          ${isMobile ? 'z-50' : ''}
          ${sidebarCollapsed && !isMobile ? 'w-16' : isMobile ? 'w-80' : 'w-64'}
          bg-white border-r border-gray-200 transition-all duration-300
          ${isMobile ? 'h-full' : ''}
        `}>
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              {!sidebarCollapsed && (
                <h2 className="text-sm font-semibold text-gray-900">Navigation</h2>
              )}
              {!isMobile && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                  className="p-1"
                >
                  <ChevronLeft className={`h-4 w-4 transition-transform ${sidebarCollapsed ? 'rotate-180' : ''}`} />
                </Button>
              )}
            </div>
          </div>
          
          <nav className="p-2 space-y-1">
            {navigationItems.map((item) => (
              <div key={item.id}>
                <Button
                  variant={activeTab === item.id ? "default" : "ghost"}
                  className={`w-full justify-start ${sidebarCollapsed && !isMobile ? 'px-2' : 'px-3'}`}
                  onClick={() => {
                    handleTabChange(item.id);
                    if (isMobile) setMobileMenuOpen(false);
                  }}
                >
                  <item.icon className={`h-4 w-4 ${sidebarCollapsed && !isMobile ? '' : 'mr-2'}`} />
                  {(!sidebarCollapsed || isMobile) && item.label}
                </Button>
                
                {/* Sub-navigation */}
                {item.subItems.length > 0 && activeTab === item.id && (!sidebarCollapsed || isMobile) && (
                  <div className="ml-4 mt-1 space-y-1">
                    {item.subItems.map((subItem) => (
                      <Button
                        key={subItem.id}
                        variant={activeSubTab === subItem.id ? "secondary" : "ghost"}
                        size="sm"
                        className="w-full justify-start text-xs"
                        onClick={() => {
                          setActiveSubTab(subItem.id);
                          if (isMobile) setMobileMenuOpen(false);
                        }}
                      >
                        {subItem.label}
                      </Button>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </nav>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex overflow-hidden">
          <main className="flex-1 overflow-y-auto p-4 sm:p-6">
            {activeTab === "briefing" && (
              <TodaysBriefing 
                activeSubTab={activeSubTab}
                onNavigateToExplore={handleNavigateToExplore}
                onNavigateToCapture={handleNavigateToCapture}
                onNavigateToBrief={handleNavigateToBrief}
                onNavigate={(tab, subTab) => {
                  setActiveTab(tab);
                  if (subTab) setActiveSubTab(subTab);
                }}
              />
            )}
            
            {activeTab === "explore" && (
              <ExploreSignals 
                activeSubTab={activeSubTab}
                onNavigateToTrending={handleNavigateToTrending}
                onNavigateToCapture={handleNavigateToCapture}
                onNavigateToBrief={handleNavigateToBrief}
              />
            )}
            
            {activeTab === "capture" && (
              <NewSignalCapture 
                onNavigateToManage={handleNavigateToManage}
                onNavigateToExplore={handleNavigateToExplore}
                onNavigateToBrief={handleNavigateToBrief}
              />
            )}
            
            {activeTab === "brief" && (
              <StrategicBriefLab 
                activeSubTab={activeSubTab}
                onNavigateToCapture={handleNavigateToCapture}
                onNavigateToManage={handleNavigateToManage}
              />
            )}
            
            {activeTab === "manage" && (
              <ManageHub 
                activeSubTab={activeSubTab}
                onNavigateToCapture={handleNavigateToCapture}
                onNavigateToExplore={handleNavigateToExplore}
                onNavigateToBrief={handleNavigateToBrief}
              />
            )}
            
            {activeTab === "admin" && (
              <AdminDashboard />
            )}
          </main>
          
          {/* Sidebar for larger screens */}
          {!isMobile && (
            <SignalsSidebar 
              onNavigateToTrending={handleNavigateToTrending}
              onNavigateToCapture={handleNavigateToCapture}
              onNavigateToBrief={handleNavigateToBrief}
              collapsed={sidebarCollapsed}
            />
          )}
        </div>
      </div>
      
      {/* Feedback Widget */}
      <FeedbackWidget />
    </div>
  );
}