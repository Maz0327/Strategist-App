import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { QueryClientProvider } from "@tanstack/react-query";
import { Route, Switch, useLocation } from "wouter";
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
import { ErrorBoundary, setupGlobalErrorHandlers } from "./components/error-boundary";

function AppContent() {
  const [user, setUser] = useState<{ id: number; email: string } | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [currentPage, setCurrentPage] = useState("briefing");
  const { isEnabled: tutorialEnabled, toggleTutorial } = useTutorial();

  // Setup global error handlers
  useEffect(() => {
    setupGlobalErrorHandlers();
  }, []);

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

  // Create a routing component that uses location
  const RoutingComponent = () => {
    const [location] = useLocation();

    // Enhanced catch-all routing logic
    const renderRoute = () => {
      try {
        // Handle exact route matches first
        switch (location) {
          case '/admin-register':
            return <AdminRegister />;
          case '/auth':
            return !user ? <AuthPage onAuthSuccess={handleAuthSuccess} /> : <Dashboard user={user} onLogout={handleLogout} />;
          case '/dashboard':
            return user ? <Dashboard user={user} onLogout={handleLogout} currentPage="briefing" /> : <AuthPage onAuthSuccess={handleAuthSuccess} />;
          case '/capture':
            return user ? <Dashboard user={user} onLogout={handleLogout} currentPage="capture" /> : <AuthPage onAuthSuccess={handleAuthSuccess} />;
          case '/signals':
            return user ? <Dashboard user={user} onLogout={handleLogout} currentPage="signals" /> : <AuthPage onAuthSuccess={handleAuthSuccess} />;
          case '/briefing':
            return user ? <Dashboard user={user} onLogout={handleLogout} currentPage="briefing" /> : <AuthPage onAuthSuccess={handleAuthSuccess} />;
          case '/explore':
            return user ? <Dashboard user={user} onLogout={handleLogout} currentPage="explore" /> : <AuthPage onAuthSuccess={handleAuthSuccess} />;
          case '/brief':
            return user ? <Dashboard user={user} onLogout={handleLogout} currentPage="brief" /> : <AuthPage onAuthSuccess={handleAuthSuccess} />;
          case '/manage':
            return user ? <Dashboard user={user} onLogout={handleLogout} currentPage="manage" /> : <AuthPage onAuthSuccess={handleAuthSuccess} />;
          case '/admin':
            return user ? <Dashboard user={user} onLogout={handleLogout} currentPage="admin" /> : <AuthPage onAuthSuccess={handleAuthSuccess} />;
          case '/':
            return user ? <Dashboard user={user} onLogout={handleLogout} currentPage="briefing" /> : <AuthPage onAuthSuccess={handleAuthSuccess} />;
          default:
            // Catch-all: Check if it starts with known paths
            if (location.startsWith('/dashboard')) {
              return user ? <Dashboard user={user} onLogout={handleLogout} currentPage="briefing" /> : <AuthPage onAuthSuccess={handleAuthSuccess} />;
            }
            if (location.startsWith('/capture')) {
              return user ? <Dashboard user={user} onLogout={handleLogout} currentPage="capture" /> : <AuthPage onAuthSuccess={handleAuthSuccess} />;
            }
            if (location.startsWith('/explore')) {
              return user ? <Dashboard user={user} onLogout={handleLogout} currentPage="explore" /> : <AuthPage onAuthSuccess={handleAuthSuccess} />;
            }
            if (location.startsWith('/brief')) {
              return user ? <Dashboard user={user} onLogout={handleLogout} currentPage="brief" /> : <AuthPage onAuthSuccess={handleAuthSuccess} />;
            }
            if (location.startsWith('/manage')) {
              return user ? <Dashboard user={user} onLogout={handleLogout} currentPage="manage" /> : <AuthPage onAuthSuccess={handleAuthSuccess} />;
            }
            if (location.startsWith('/admin')) {
              return user ? <Dashboard user={user} onLogout={handleLogout} currentPage="admin" /> : <AuthPage onAuthSuccess={handleAuthSuccess} />;
            }
            // Fall back to 404
            return <NotFound />;
        }
      } catch (error) {
        console.error('Routing error:', error);
        return <NotFound />;
      }
    };

    return renderRoute();
  };

  return (
    <ErrorBoundary>
      <TooltipProvider>
        <Toaster />
        <RoutingComponent />
        <TutorialOverlay 
          currentPage={currentPage}
          isEnabled={tutorialEnabled}
          onToggle={toggleTutorial}
        />
        <DebugPanel />
      </TooltipProvider>
    </ErrorBoundary>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AppContent />
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
