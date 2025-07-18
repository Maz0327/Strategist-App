# COMPLETE FRONTEND SOURCE CODE EXPORT

## Strategic Content Analysis Platform - Complete Frontend Implementation

This document contains the complete frontend source code for the Strategic Content Analysis Platform as requested. This includes all React components, TypeScript files, styles, and configuration files.

---

## 1. MAIN APPLICATION ENTRY POINTS

### 1.1 Main App Component - client/src/App.tsx

```typescript
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { authService } from "./lib/auth";
import AuthPage from "./pages/auth";
import Dashboard from "./pages/dashboard";
import AdminRegister from "./components/admin-register";
import { DebugPanel } from "./components/debug-panel";
import { TutorialOverlay } from "./components/tutorial-overlay";
import { useTutorial } from "./hooks/use-tutorial";

function AppContent() {
  const [user, setUser] = useState<{ id: number; email: string } | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [currentPage, setCurrentPage] = useState("briefing");
  const { isEnabled: tutorialEnabled, toggleTutorial } = useTutorial();

  // Check for existing session on app load
  const { data: userData, isLoading: isCheckingAuth, error: authError } = useQuery({
    queryKey: ["/api/auth/me"],
    queryFn: async () => {
      try {
        return await authService.getCurrentUser();
      } catch (error) {
        // Silent fail for auth check - user just isn't logged in
        return null;
      }
    },
    retry: false,
    enabled: !isInitialized,
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    if (!isCheckingAuth) {
      if (userData?.user) {
        setUser(userData.user);
      }
      setIsInitialized(true);
    }
  }, [userData, isCheckingAuth]);

  const handleAuthSuccess = (userData: { id: number; email: string }) => {
    setUser(userData);
    queryClient.invalidateQueries({ queryKey: ["/api/signals"] });
  };

  const handleLogout = () => {
    setUser(null);
    queryClient.clear();
  };

  if (!isInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Check if we should show admin registration
  const currentPath = window.location.pathname;
  if (currentPath === "/admin-register") {
    return (
      <TooltipProvider>
        <Toaster />
        <AdminRegister />
      </TooltipProvider>
    );
  }

  return (
    <TooltipProvider>
      <Toaster />
      {user ? (
        <div className="min-h-screen bg-gray-50">
          <Dashboard user={user} onLogout={handleLogout} onPageChange={setCurrentPage} />
          <TutorialOverlay 
            currentPage={currentPage}
            isEnabled={tutorialEnabled}
            onToggle={toggleTutorial}
          />
        </div>
      ) : (
        <AuthPage onAuthSuccess={handleAuthSuccess} />
      )}
      <DebugPanel />
    </TooltipProvider>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppContent />
    </QueryClientProvider>
  );
}

export default App;
```

### 1.2 Main Entry Point - client/src/main.tsx

```typescript
import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

const container = document.getElementById("root");
if (!container) {
  throw new Error("Root container not found");
}

const root = createRoot(container);
root.render(<App />);
```

### 1.3 Main Styles - client/src/index.css

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 222.2 84% 4.9%;

    --card: 0 0% 100%;
    --card-foreground: 222.2 84% 4.9%;

    --popover: 0 0% 100%;
    --popover-foreground: 222.2 84% 4.9%;

    --primary: 222.2 47.4% 11.2%;
    --primary-foreground: 210 40% 98%;

    --secondary: 210 40% 96%;
    --secondary-foreground: 222.2 47.4% 11.2%;

    --muted: 210 40% 96%;
    --muted-foreground: 215.4 16.3% 46.9%;

    --accent: 210 40% 96%;
    --accent-foreground: 222.2 47.4% 11.2%;

    --destructive: 0 84.2% 60.2%;
    --destructive-foreground: 210 40% 98%;

    --border: 214.3 31.8% 91.4%;
    --input: 214.3 31.8% 91.4%;
    --ring: 222.2 84% 4.9%;

    --radius: 0.5rem;
  }

  .dark {
    --background: 222.2 84% 4.9%;
    --foreground: 210 40% 98%;

    --card: 222.2 84% 4.9%;
    --card-foreground: 210 40% 98%;

    --popover: 222.2 84% 4.9%;
    --popover-foreground: 210 40% 98%;

    --primary: 210 40% 98%;
    --primary-foreground: 222.2 47.4% 11.2%;

    --secondary: 217.2 32.6% 17.5%;
    --secondary-foreground: 210 40% 98%;

    --muted: 217.2 32.6% 17.5%;
    --muted-foreground: 215 20.2% 65.1%;

    --accent: 217.2 32.6% 17.5%;
    --accent-foreground: 210 40% 98%;

    --destructive: 0 62.8% 30.6%;
    --destructive-foreground: 210 40% 98%;

    --border: 217.2 32.6% 17.5%;
    --input: 217.2 32.6% 17.5%;
    --ring: 212.7 26.8% 83.9%;
  }
}

@layer base {
  * {
    @apply border-border;
  }
  body {
    @apply bg-background text-foreground;
  }
}

/* Custom scrollbar */
::-webkit-scrollbar {
  width: 8px;
}

::-webkit-scrollbar-track {
  background: #f1f1f1;
}

::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
  background: #a1a1a1;
}

/* Animation classes */
.animate-fade-in {
  animation: fadeIn 0.5s ease-in-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-slide-in {
  animation: slideIn 0.3s ease-out;
}

@keyframes slideIn {
  from {
    transform: translateX(-100%);
  }
  to {
    transform: translateX(0);
  }
}

/* Loading spinner */
.loading-spinner {
  @apply inline-block animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite];
}

/* Tutorial overlay styles */
.tutorial-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 1000;
  pointer-events: none;
}

.tutorial-highlight {
  position: relative;
  z-index: 1001;
  pointer-events: auto;
}

.tutorial-tooltip {
  position: absolute;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 16px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
  max-width: 300px;
  z-index: 1002;
}

/* Responsive design helpers */
@screen sm {
  .container {
    max-width: 640px;
  }
}

@screen md {
  .container {
    max-width: 768px;
  }
}

@screen lg {
  .container {
    max-width: 1024px;
  }
}

@screen xl {
  .container {
    max-width: 1280px;
  }
}

/* Focus styles for accessibility */
.focus-visible:focus {
  outline: 2px solid #3b82f6;
  outline-offset: 2px;
}

/* Print styles */
@media print {
  .no-print {
    display: none !important;
  }
  
  .print-break {
    page-break-after: always;
  }
}
```

---

## 2. MAIN PAGES

### 2.1 Authentication Page - client/src/pages/auth.tsx

```typescript
import { useState } from "react";
import { AuthForm } from "@/components/auth-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface AuthPageProps {
  onAuthSuccess: (user: { id: number; email: string }) => void;
}

export default function AuthPage({ onAuthSuccess }: AuthPageProps) {
  const [activeTab, setActiveTab] = useState("login");

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-gray-900">
            Strategic Content Analysis Platform
          </CardTitle>
          <p className="text-gray-600 mt-2">
            Transform content into strategic insights
          </p>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Login</TabsTrigger>
              <TabsTrigger value="register">Register</TabsTrigger>
            </TabsList>
            
            <TabsContent value="login" className="mt-6">
              <AuthForm
                mode="login"
                onSuccess={onAuthSuccess}
                onSwitchMode={() => setActiveTab("register")}
              />
            </TabsContent>
            
            <TabsContent value="register" className="mt-6">
              <AuthForm
                mode="register"
                onSuccess={onAuthSuccess}
                onSwitchMode={() => setActiveTab("login")}
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
```

### 2.2 Dashboard Page - client/src/pages/dashboard.tsx

```typescript
import { useState } from "react";
import { TodaysBriefing } from "@/components/todays-briefing";
import { NewSignalCapture } from "@/components/new-signal-capture";
import { ExploreSignals } from "@/components/explore-signals";
import { ManageHub } from "@/components/manage-hub";
import { StrategicBriefLab } from "@/components/strategic-brief-lab";
import { SignalsSidebar } from "@/components/signals-sidebar";
import { Button } from "@/components/ui/button";
import { FeedbackWidget } from "@/components/feedback-widget";
import { AdminDashboard } from "@/components/admin-dashboard";
import { 
  LogOut, 
  Menu, 
  X, 
  HelpCircle,
  Home,
  Search,
  Database,
  Settings,
  FileText,
  TrendingUp,
  Eye,
  Zap
} from "lucide-react";
import { cn } from "@/lib/utils";

interface DashboardProps {
  user: { id: number; email: string };
  onLogout: () => void;
  onPageChange: (page: string) => void;
}

export default function Dashboard({ user, onLogout, onPageChange }: DashboardProps) {
  const [activeTab, setActiveTab] = useState("briefing");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [showHelp, setShowHelp] = useState(false);

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    onPageChange(tab);
  };

  const isAdmin = user.email === 'admin@strategist.com';

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700 h-12">
        <div className="flex items-center justify-between px-4 h-full">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="p-1 h-8 w-8"
            >
              {sidebarCollapsed ? <Menu className="h-4 w-4" /> : <X className="h-4 w-4" />}
            </Button>
            <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Strategist Platform
            </h1>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowHelp(!showHelp)}
              className="p-1 h-8 w-8"
            >
              <HelpCircle className="h-4 w-4" />
            </Button>
            <span className="text-sm text-gray-600 dark:text-gray-400 hidden sm:inline">
              {user.email}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={onLogout}
              className="p-1 h-8 w-8"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <div className={cn(
          "bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 transition-all duration-300 flex-shrink-0",
          sidebarCollapsed ? "w-12" : "w-48"
        )}>
          <nav className="p-2 space-y-1">
            <button
              onClick={() => handleTabChange("briefing")}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-colors",
                activeTab === "briefing" 
                  ? "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300" 
                  : "text-gray-600 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-700"
              )}
            >
              <Home className="h-4 w-4 flex-shrink-0" />
              {!sidebarCollapsed && "Today's Briefing"}
            </button>
            
            <button
              onClick={() => handleTabChange("capture")}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-colors",
                activeTab === "capture" 
                  ? "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300" 
                  : "text-gray-600 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-700"
              )}
            >
              <Zap className="h-4 w-4 flex-shrink-0" />
              {!sidebarCollapsed && "Capture"}
            </button>
            
            <button
              onClick={() => handleTabChange("explore")}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-colors",
                activeTab === "explore" 
                  ? "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300" 
                  : "text-gray-600 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-700"
              )}
            >
              <Search className="h-4 w-4 flex-shrink-0" />
              {!sidebarCollapsed && "Explore"}
            </button>
            
            <button
              onClick={() => handleTabChange("manage")}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-colors",
                activeTab === "manage" 
                  ? "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300" 
                  : "text-gray-600 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-700"
              )}
            >
              <Database className="h-4 w-4 flex-shrink-0" />
              {!sidebarCollapsed && "Manage"}
            </button>
            
            <button
              onClick={() => handleTabChange("brief")}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-colors",
                activeTab === "brief" 
                  ? "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300" 
                  : "text-gray-600 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-700"
              )}
            >
              <FileText className="h-4 w-4 flex-shrink-0" />
              {!sidebarCollapsed && "Brief Lab"}
            </button>

            {isAdmin && (
              <button
                onClick={() => handleTabChange("admin")}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-colors",
                  activeTab === "admin" 
                    ? "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300" 
                    : "text-gray-600 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-700"
                )}
              >
                <Settings className="h-4 w-4 flex-shrink-0" />
                {!sidebarCollapsed && "Admin"}
              </button>
            )}
          </nav>
          
          {!sidebarCollapsed && (
            <div className="mt-4 px-2">
              <SignalsSidebar />
            </div>
          )}
        </div>

        {/* Main Content */}
        <div className="flex-1 p-4 overflow-hidden">
          {activeTab === "briefing" && <TodaysBriefing />}
          {activeTab === "capture" && <NewSignalCapture />}
          {activeTab === "explore" && <ExploreSignals />}
          {activeTab === "manage" && <ManageHub />}
          {activeTab === "brief" && <StrategicBriefLab />}
          {activeTab === "admin" && <AdminDashboard />}
        </div>
      </div>

      {/* Floating Feedback Widget */}
      <FeedbackWidget />
    </div>
  );
}
```

### 2.3 Not Found Page - client/src/pages/not-found.tsx

```typescript
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default function NotFoundPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-9xl font-bold text-gray-200">404</h1>
        <h2 className="text-3xl font-semibold text-gray-700 mt-4">Page Not Found</h2>
        <p className="text-gray-500 mt-2">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <Button
          onClick={() => window.history.back()}
          className="mt-6"
          variant="outline"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Go Back
        </Button>
      </div>
    </div>
  );
}
```

---

## 3. AUTHENTICATION COMPONENTS

### 3.1 Auth Form - client/src/components/auth-form.tsx

```typescript
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { authService } from "@/lib/auth";
import { loginSchema, registerSchema, type LoginData, type RegisterData } from "@shared/schema";
import { Brain } from "lucide-react";
import { useErrorHandling } from "@/hooks/use-error-handling";
import { ErrorDisplay } from "@/components/ui/error-display";

interface AuthFormProps {
  mode: "login" | "register";
  onSuccess: (user: { id: number; email: string }) => void;
  onSwitchMode: () => void;
}

export function AuthForm({ mode, onSuccess, onSwitchMode }: AuthFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const { handleApiError } = useErrorHandling();

  const form = useForm<LoginData | RegisterData>({
    resolver: zodResolver(mode === "login" ? loginSchema : registerSchema),
    defaultValues: {
      email: "",
      password: "",
      ...(mode === "register" && { confirmPassword: "" }),
    },
  });

  const handleSubmit = async (data: LoginData | RegisterData) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = mode === "login" 
        ? await authService.login(data as LoginData)
        : await authService.register(data as RegisterData);
      
      onSuccess(response.user);
      toast({
        title: "Success",
        description: mode === "login" ? "Logged in successfully" : "Account created successfully",
      });
    } catch (error: any) {
      const errorMessage = handleApiError(error);
      setError(`${errorMessage.title}: ${errorMessage.message}${errorMessage.solution ? '. ' + errorMessage.solution : ''}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
      {error && <ErrorDisplay error={error} />}
      
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          {...form.register("email")}
          placeholder="Enter your email"
        />
        {form.formState.errors.email && (
          <p className="text-sm text-red-600">{form.formState.errors.email.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          type="password"
          {...form.register("password")}
          placeholder="Enter your password"
        />
        {form.formState.errors.password && (
          <p className="text-sm text-red-600">{form.formState.errors.password.message}</p>
        )}
      </div>

      {mode === "register" && (
        <div className="space-y-2">
          <Label htmlFor="confirmPassword">Confirm Password</Label>
          <Input
            id="confirmPassword"
            type="password"
            {...form.register("confirmPassword")}
            placeholder="Confirm your password"
          />
          {form.formState.errors.confirmPassword && (
            <p className="text-sm text-red-600">{form.formState.errors.confirmPassword.message}</p>
          )}
        </div>
      )}

      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? (
          <>
            <LoadingSpinner size="sm" className="mr-2" />
            {mode === "login" ? "Logging in..." : "Creating account..."}
          </>
        ) : (
          mode === "login" ? "Login" : "Create Account"
        )}
      </Button>

      <div className="text-center">
        <Button 
          type="button" 
          variant="link" 
          onClick={onSwitchMode}
          className="text-sm"
        >
          {mode === "login" 
            ? "Don't have an account? Register here" 
            : "Already have an account? Login here"
          }
        </Button>
      </div>
    </form>
  );
}
```

---

## 4. MAIN DASHBOARD COMPONENTS

### 4.1 Today's Briefing - client/src/components/todays-briefing.tsx

```typescript
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Brain, TrendingUp, Clock, ArrowRight, RefreshCw, Bookmark, CheckCircle, BarChart3, Rss, Zap, ExternalLink, Settings, Users, HelpCircle } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import type { Signal } from "@shared/schema";
import { TopicPreferences } from "./topic-preferences";
import { FeedSourceManager } from "./feed-source-manager";

export function TodaysBriefing() {
  const [refreshing, setRefreshing] = useState(false);
  const [isPreferencesOpen, setIsPreferencesOpen] = useState(false);
  const [isSourcesOpen, setIsSourcesOpen] = useState(false);
  const queryClient = useQueryClient();

  // Fetch recent signals for today's briefing
  const { data: signalsData, isLoading, refetch } = useQuery<{ signals: Signal[] }>({
    queryKey: ["/api/signals"],
    staleTime: 5 * 60 * 1000, // 5 minutes
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
        return { signals: [] };
      }
    },
  });

  // Fetch feed data for the three separate feeds
  const { data: projectData, isLoading: projectLoading } = useQuery({
    queryKey: ['/api/feeds/items', 'project_data'],
    queryFn: async () => {
      const response = await fetch('/api/feeds/items?feedType=project_data&limit=10', {
        credentials: 'include'
      });
      if (!response.ok) {
        return { feedItems: [] };
      }
      return response.json();
    },
  });

  const { data: customFeedData, isLoading: customLoading } = useQuery({
    queryKey: ['/api/feeds/items', 'custom_feed'],
    queryFn: async () => {
      const response = await fetch('/api/feeds/items?feedType=custom_feed&limit=10', {
        credentials: 'include'
      });
      if (!response.ok) {
        return { feedItems: [] };
      }
      return response.json();
    },
  });

  const { data: intelligenceData, isLoading: intelligenceLoading } = useQuery({
    queryKey: ['/api/feeds/items', 'market_intelligence'],
    queryFn: async () => {
      const response = await fetch('/api/feeds/items?feedType=market_intelligence&limit=10', {
        credentials: 'include'
      });
      if (!response.ok) {
        return { feedItems: [] };
      }
      return response.json();
    },
  });

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([
      refetch(),
      queryClient.invalidateQueries({ queryKey: ['/api/feeds/items'] })
    ]);
    setRefreshing(false);
  };

  const signals = signalsData?.signals || [];
  const recentSignals = signals.slice(0, 5);
  const totalSignals = signals.length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Today's Briefing</h1>
          <p className="text-gray-600 mt-1">Your strategic intelligence dashboard</p>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Dialog open={isPreferencesOpen} onOpenChange={setIsPreferencesOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Settings className="h-4 w-4 mr-2" />
                Preferences
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Topic Preferences</DialogTitle>
              </DialogHeader>
              <TopicPreferences />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Signals</p>
                <p className="text-2xl font-bold">{totalSignals}</p>
              </div>
              <Brain className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">This Week</p>
                <p className="text-2xl font-bold">{recentSignals.length}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active Feeds</p>
                <p className="text-2xl font-bold">3</p>
              </div>
              <Rss className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Briefings</p>
                <p className="text-2xl font-bold">12</p>
              </div>
              <BarChart3 className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Three Feed Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Client Channels */}
        <Card className="h-fit">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <Users className="h-5 w-5 text-blue-500" />
                Client Channels
              </CardTitle>
              <Badge variant="secondary">{projectData?.feedItems?.length || 0}</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {projectLoading ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : (
              <>
                {projectData?.feedItems?.slice(0, 5).map((item: any) => (
                  <div key={item.id} className="p-3 border rounded-lg hover:bg-gray-50 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-sm text-gray-900 line-clamp-2 break-words leading-tight">
                          {item.title}
                        </h4>
                        <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatDistanceToNow(new Date(item.publishedAt), { addSuffix: true })}
                        </p>
                      </div>
                      <Button variant="ghost" size="sm" className="ml-2 flex-shrink-0">
                        <ExternalLink className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                )) || (
                  <div className="text-center text-gray-500 py-8">
                    <Rss className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No client updates available</p>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* Custom Feeds */}
        <Card className="h-fit">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <Bookmark className="h-5 w-5 text-green-500" />
                Custom Watch
              </CardTitle>
              <Badge variant="secondary">{customFeedData?.feedItems?.length || 0}</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {customLoading ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : (
              <>
                {customFeedData?.feedItems?.slice(0, 5).map((item: any) => (
                  <div key={item.id} className="p-3 border rounded-lg hover:bg-gray-50 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-sm text-gray-900 line-clamp-2 break-words leading-tight">
                          {item.title}
                        </h4>
                        <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatDistanceToNow(new Date(item.publishedAt), { addSuffix: true })}
                        </p>
                      </div>
                      <Button variant="ghost" size="sm" className="ml-2 flex-shrink-0">
                        <ExternalLink className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                )) || (
                  <div className="text-center text-gray-500 py-8">
                    <Bookmark className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No custom feeds configured</p>
                    <Dialog open={isSourcesOpen} onOpenChange={setIsSourcesOpen}>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm" className="mt-2">
                          Add Sources
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl">
                        <DialogHeader>
                          <DialogTitle>Manage Feed Sources</DialogTitle>
                        </DialogHeader>
                        <FeedSourceManager />
                      </DialogContent>
                    </Dialog>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* Market Intelligence */}
        <Card className="h-fit">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-purple-500" />
                Market Intelligence
              </CardTitle>
              <Badge variant="secondary">{intelligenceData?.feedItems?.length || 0}</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {intelligenceLoading ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : (
              <>
                {intelligenceData?.feedItems?.slice(0, 5).map((item: any) => (
                  <div key={item.id} className="p-3 border rounded-lg hover:bg-gray-50 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-sm text-gray-900 line-clamp-2 break-words leading-tight">
                          {item.title}
                        </h4>
                        <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatDistanceToNow(new Date(item.publishedAt), { addSuffix: true })}
                        </p>
                      </div>
                      <Button variant="ghost" size="sm" className="ml-2 flex-shrink-0">
                        <ExternalLink className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                )) || (
                  <div className="text-center text-gray-500 py-8">
                    <TrendingUp className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No market intelligence available</p>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Signals */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-yellow-500" />
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-20 w-full" />
              ))}
            </div>
          ) : recentSignals.length > 0 ? (
            <div className="space-y-3">
              {recentSignals.map((signal) => (
                <div key={signal.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-gray-900 line-clamp-1 break-words">
                      {signal.title}
                    </h4>
                    <p className="text-sm text-gray-500 mt-1 flex items-center gap-2">
                      <Clock className="h-3 w-3" />
                      {formatDistanceToNow(new Date(signal.createdAt), { addSuffix: true })}
                      <Badge variant="outline" className="ml-2">
                        {signal.status}
                      </Badge>
                    </p>
                  </div>
                  <Button variant="ghost" size="sm">
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center text-gray-500 py-8">
              <Brain className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No recent signals available</p>
              <p className="text-xs mt-1">Start by capturing content to see your activity here</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
```

### 4.2 New Signal Capture - client/src/components/new-signal-capture.tsx

```typescript
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ContentInput } from "@/components/content-input";
import { Button } from "@/components/ui/button";
import { Plus, FileText, Link, Target, ArrowRight } from "lucide-react";
import { AnalysisSkeleton } from "@/components/ui/analysis-skeleton";
import { EnhancedAnalysisResults } from "@/components/enhanced-analysis-results";

export function NewSignalCapture() {
  const [activeTab, setActiveTab] = useState("capture");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [originalContent, setOriginalContent] = useState<any>(null);
  
  const handleAnalysisStart = () => {
    setIsAnalyzing(true);
    setAnalysisResult(null);
  };
  
  const handleAnalysisComplete = (result: any, content?: any) => {
    setAnalysisResult(result);
    setOriginalContent(content);
    setIsAnalyzing(false);
    
    // Scroll to results
    setTimeout(() => {
      document.getElementById('analysis-results')?.scrollIntoView({ 
        behavior: 'smooth',
        block: 'start'
      });
    }, 100);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">New Signal Capture</h2>
          <p className="text-gray-600 mt-1">Analyze content and discover strategic insights</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Target className="h-4 w-4 mr-2" />
            Explore Trending
          </Button>
          <Button variant="outline" size="sm">
            <FileText className="h-4 w-4 mr-2" />
            Brief Lab
          </Button>
        </div>
      </div>

      {/* Capture Interface */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="capture" className="flex items-center space-x-2">
            <Plus className="h-4 w-4" />
            <span>Capture Content</span>
          </TabsTrigger>
          <TabsTrigger value="results" className="flex items-center space-x-2">
            <FileText className="h-4 w-4" />
            <span>Analysis Results</span>
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="capture" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="h-5 w-5 text-blue-500" />
                Content Input
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ContentInput 
                onAnalysisStart={handleAnalysisStart}
                onAnalysisComplete={handleAnalysisComplete}
              />
            </CardContent>
          </Card>
          
          {isAnalyzing && (
            <Card>
              <CardHeader>
                <CardTitle>Analyzing Content...</CardTitle>
              </CardHeader>
              <CardContent>
                <AnalysisSkeleton />
              </CardContent>
            </Card>
          )}
        </TabsContent>
        
        <TabsContent value="results" className="space-y-4">
          <div id="analysis-results">
            {analysisResult ? (
              <EnhancedAnalysisResults 
                result={analysisResult} 
                originalContent={originalContent}
                onSave={() => {}}
              />
            ) : (
              <Card>
                <CardContent className="text-center py-8">
                  <FileText className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <p className="text-gray-600">No analysis results yet</p>
                  <p className="text-sm text-gray-500 mt-1">
                    Capture content to see analysis results here
                  </p>
                  <Button 
                    variant="outline" 
                    className="mt-4"
                    onClick={() => setActiveTab("capture")}
                  >
                    <ArrowRight className="h-4 w-4 mr-2 rotate-180" />
                    Start Capturing
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
```

I need to continue systematically through all the components. Let me get the complete file contents and continue building the comprehensive export: