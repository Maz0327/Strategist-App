import React, { useState, useEffect } from 'react';
import { QueryClientProvider, useQuery } from '@tanstack/react-query';
import { Route, Switch } from 'wouter';
import { queryClient } from './lib/queryClient';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { authService } from './lib/auth';
import AuthPage from './pages/auth';
import Dashboard from './pages/dashboard';
import AdminRegister from './components/admin-register';
import NotFound from './pages/not-found';
import { DebugPanel } from './components/debug-panel';
import { TutorialOverlay } from './components/tutorial-overlay';
import { useTutorial } from './hooks/use-tutorial';
import { ErrorBoundary, setupGlobalErrorHandlers } from './components/error-boundary';

function AppContent() {
  const [user, setUser] = useState<{ id: number; email: string } | null>(null);
  const [initialized, setInitialized] = useState(false);
  const { isEnabled: tutorialEnabled, toggleTutorial } = useTutorial();

  // auth check
  const { data, isLoading } = useQuery({
    queryKey: ['authUser'],
    queryFn: () => authService.getCurrentUser().catch(() => null),
    retry: false,
    enabled: !initialized,
    refetchOnWindowFocus: false
  });

  useEffect(() => {
    if (!isLoading) {
      setUser(data?.user ?? null);
      setInitialized(true);
    }
  }, [isLoading, data]);

  if (!initialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <LoadingSpinner size="lg" />
        <p className="mt-4 text-gray-600">Loading application...</p>
      </div>
    );
  }

  const element = (
    <Switch>
      <Route path="/admin-register">
        <AdminRegister />
      </Route>
      <Route path="/auth">
        {!user 
          ? <AuthPage onAuthSuccess={setUser} />
          : <Dashboard user={user} onLogout={() => setUser(null)} currentPage="briefing" />
        }
      </Route>
      <Route path="/dashboard">
        {user
          ? <Dashboard user={user} onLogout={() => setUser(null)} currentPage="briefing" />
          : <AuthPage onAuthSuccess={setUser} />
        }
      </Route>
      <Route path="/capture">
        {user
          ? <Dashboard user={user} onLogout={() => setUser(null)} currentPage="capture" />
          : <AuthPage onAuthSuccess={setUser} />
        }
      </Route>
      <Route path="/signals">
        {user
          ? <Dashboard user={user} onLogout={() => setUser(null)} currentPage="signals" />
          : <AuthPage onAuthSuccess={setUser} />
        }
      </Route>
      <Route path="/briefing">
        {user
          ? <Dashboard user={user} onLogout={() => setUser(null)} currentPage="briefing" />
          : <AuthPage onAuthSuccess={setUser} />
        }
      </Route>
      <Route path="/explore">
        {user
          ? <Dashboard user={user} onLogout={() => setUser(null)} currentPage="explore" />
          : <AuthPage onAuthSuccess={setUser} />
        }
      </Route>
      <Route path="/brief">
        {user
          ? <Dashboard user={user} onLogout={() => setUser(null)} currentPage="brief" />
          : <AuthPage onAuthSuccess={setUser} />
        }
      </Route>
      <Route path="/manage">
        {user
          ? <Dashboard user={user} onLogout={() => setUser(null)} currentPage="manage" />
          : <AuthPage onAuthSuccess={setUser} />
        }
      </Route>
      <Route path="/admin">
        {user
          ? <Dashboard user={user} onLogout={() => setUser(null)} currentPage="admin" />
          : <AuthPage onAuthSuccess={setUser} />
        }
      </Route>
      <Route path="/projects">
        {user
          ? <Dashboard user={user} onLogout={() => setUser(null)} currentPage="projects" />
          : <AuthPage onAuthSuccess={setUser} />
        }
      </Route>
      <Route path="/">
        {user
          ? <Dashboard user={user} onLogout={() => setUser(null)} currentPage="briefing" />
          : <AuthPage onAuthSuccess={setUser} />
        }
      </Route>
      <Route>
        <NotFound />
      </Route>
    </Switch>
  );

  return (
    <TooltipProvider>
      <Toaster />
      {element}
      <TutorialOverlay isEnabled={tutorialEnabled} onToggle={toggleTutorial} currentPage="briefing" />
      <DebugPanel />
    </TooltipProvider>
  );
}

export default function App() {
  // global JS error handlers
  useEffect(setupGlobalErrorHandlers, []);

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AppContent />
      </QueryClientProvider>
    </ErrorBoundary>
  );
}