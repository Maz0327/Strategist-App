import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { QueryClientProvider } from "@tanstack/react-query";
import { Router, Route, Switch, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { authService } from "./lib/auth";
import AuthPage from "./pages/auth";
import Dashboard from "./pages/dashboard";
import AdminRegister from "./components/admin-register";
import NotFound from "./pages/not-found";
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

  // Define the router component
  const AppRouter = () => {
    const [location] = useLocation();
    
    // Check if user is authenticated for protected routes
    const isProtectedRoute = (path: string) => {
      const protectedPaths = ['/dashboard', '/capture', '/signals', '/briefing', '/admin'];
      return protectedPaths.some(protectedPath => path.startsWith(protectedPath));
    };

    // If user is not authenticated and trying to access protected route, redirect to auth
    if (!user && isProtectedRoute(location)) {
      return <AuthPage onAuthSuccess={handleAuthSuccess} />;
    }

    // If user is authenticated and on root or auth page, redirect to dashboard
    if (user && (location === '/' || location === '/auth')) {
      window.history.replaceState({}, '', '/dashboard');
    }

    return (
      <Switch>
        {/* Public routes */}
        <Route path="/admin-register">
          <AdminRegister />
        </Route>
        
        {/* Auth routes */}
        <Route path="/auth">
          {!user ? <AuthPage onAuthSuccess={handleAuthSuccess} /> : <Dashboard user={user} onLogout={handleLogout} />}
        </Route>
        
        {/* Protected routes */}
        <Route path="/dashboard">
          {user ? <Dashboard user={user} onLogout={handleLogout} currentPage="briefing" /> : <AuthPage onAuthSuccess={handleAuthSuccess} />}
        </Route>
        
        <Route path="/capture">
          {user ? <Dashboard user={user} onLogout={handleLogout} currentPage="capture" /> : <AuthPage onAuthSuccess={handleAuthSuccess} />}
        </Route>
        
        <Route path="/signals">
          {user ? <Dashboard user={user} onLogout={handleLogout} currentPage="signals" /> : <AuthPage onAuthSuccess={handleAuthSuccess} />}
        </Route>
        
        <Route path="/briefing">
          {user ? <Dashboard user={user} onLogout={handleLogout} currentPage="briefing" /> : <AuthPage onAuthSuccess={handleAuthSuccess} />}
        </Route>
        
        <Route path="/explore">
          {user ? <Dashboard user={user} onLogout={handleLogout} currentPage="explore" /> : <AuthPage onAuthSuccess={handleAuthSuccess} />}
        </Route>
        
        <Route path="/brief">
          {user ? <Dashboard user={user} onLogout={handleLogout} currentPage="brief" /> : <AuthPage onAuthSuccess={handleAuthSuccess} />}
        </Route>
        
        <Route path="/manage">
          {user ? <Dashboard user={user} onLogout={handleLogout} currentPage="manage" /> : <AuthPage onAuthSuccess={handleAuthSuccess} />}
        </Route>
        
        <Route path="/admin">
          {user ? <Dashboard user={user} onLogout={handleLogout} currentPage="admin" /> : <AuthPage onAuthSuccess={handleAuthSuccess} />}
        </Route>
        
        {/* Root route */}
        <Route path="/">
          {user ? <Dashboard user={user} onLogout={handleLogout} /> : <AuthPage onAuthSuccess={handleAuthSuccess} />}
        </Route>
        
        {/* 404 route */}
        <Route>
          <NotFound />
        </Route>
      </Switch>
    );
  };

  return (
    <TooltipProvider>
      <Toaster />
      <Router>
        <AppRouter />
      </Router>
      <TutorialOverlay 
        currentPage={currentPage}
        isEnabled={tutorialEnabled}
        onToggle={toggleTutorial}
      />
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
