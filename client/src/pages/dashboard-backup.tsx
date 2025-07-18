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
          <div className="flex justify-between items-center h-14 sm:h-12">
            <div className="flex items-center">
              {/* Mobile Menu Button */}
              {isMobile && (
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  className="mr-2 h-8 w-8 p-0 md:hidden"
                >
                  <Menu size={18} className="text-gray-600" />
                </Button>
              )}
              <div className="h-6 w-6 bg-primary rounded-full flex items-center justify-center">
                <Brain className="text-white" size={14} />
              </div>
              <h1 className="ml-2 text-lg sm:text-xl font-semibold text-gray-900">Strategist</h1>
            </div>
            <div className="flex items-center space-x-2">
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <Bell size={16} className="text-gray-500" />
              </Button>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={handleLogout}
                className="flex items-center space-x-2 h-8 px-2"
              >
                <div className="h-6 w-6 rounded-full bg-gray-300 flex items-center justify-center">
                  <User size={12} className="text-gray-600" />
                </div>
                <span className="text-sm text-gray-700 font-medium hidden sm:inline">{user.email}</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex flex-1 overflow-hidden relative">
        {/* Mobile Navigation Overlay */}
        {isMobile && mobileMenuOpen && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
            onClick={() => setMobileMenuOpen(false)}
          />
        )}

        {/* Responsive Sidebar Navigation */}
        <div className={`
          ${isMobile 
            ? `fixed inset-y-0 left-0 z-50 w-72 bg-white border-r border-gray-200 transform transition-transform duration-300 ease-in-out ${
                mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
              }`
            : `${sidebarCollapsed ? 'w-12' : 'w-48'} bg-white border-r border-gray-200 transition-all duration-300`
          } flex flex-col h-full`}>
          
          {/* Sidebar Header */}
          <div className="flex justify-between items-center p-3 border-b border-gray-200">
            {((!sidebarCollapsed && !isMobile) || (isMobile && mobileMenuOpen)) && (
              <span className="text-sm font-medium text-gray-700">Navigation</span>
            )}
            {isMobile ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setMobileMenuOpen(false)}
                className="h-8 w-8 p-0"
              >
                <X size={16} />
              </Button>
            ) : (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                className="h-8 w-8 p-0"
              >
                {sidebarCollapsed ? <Menu size={16} /> : <ChevronLeft size={16} />}
              </Button>
            )}
          </div>
          <div className="flex-1 overflow-y-auto py-4 px-3">
            <nav className="space-y-1">
              {navigationItems.map((item) => (
                <div key={item.id}>
                  <button
                    onClick={() => {
                      handleTabChange(item.id);
                      setActiveSubTab("");
                      if (isMobile) setMobileMenuOpen(false);
                    }}
                    className={`w-full flex items-center ${
                      sidebarCollapsed && !isMobile ? 'justify-center' : 'justify-between'
                    } px-3 py-2.5 text-left rounded-lg text-sm font-medium transition-colors ${
                      activeTab === item.id 
                        ? 'bg-primary text-primary-foreground' 
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                    title={sidebarCollapsed && !isMobile ? item.label : undefined}
                  >
                    <div className={`flex items-center ${
                      sidebarCollapsed && !isMobile ? '' : 'space-x-3'
                    }`}>
                      <item.icon className="h-5 w-5 flex-shrink-0" />
                      {(!sidebarCollapsed || isMobile) && <span>{item.label}</span>}
                    </div>
                    {(!sidebarCollapsed || isMobile) && item.subItems.length > 0 && (
                      <ChevronRight className={`h-4 w-4 transition-transform ${
                        activeTab === item.id ? 'rotate-90' : ''
                      }`} />
                    )}
                  </button>
                  
                  {/* Sub-navigation */}
                  {(!sidebarCollapsed || isMobile) && activeTab === item.id && item.subItems.length > 0 && (
                    <div 
                      className="ml-6 mt-1 space-y-0.5"
                      data-tutorial={item.id === "briefing" ? "briefing-tabs" : undefined}
                    >
                      {item.subItems.map((subItem) => (
                        <button
                          key={subItem.id}
                          onClick={() => {
                            setActiveSubTab(subItem.id);
                            if (isMobile) setMobileMenuOpen(false);
                          }}
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
          
          {/* Compact Sidebar Footer */}
          {(!sidebarCollapsed || isMobile) && (
            <div className="flex-shrink-0 px-3 py-3 border-t border-gray-200 max-h-48 overflow-y-auto">
              <SignalsSidebar onNavigateToTrending={handleNavigateToTrending} />
            </div>
          )}
        </div>

        {/* Main Content Area - Mobile Responsive */}
        <div className="flex-1 overflow-y-auto bg-gray-50 p-4 sm:p-6 lg:p-8">
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
