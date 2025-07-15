import { lazy, Suspense } from 'react';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

/**
 * PERFORMANCE OPTIMIZATION: Lazy loaded components with loading states
 * Reduces initial bundle size and improves app startup performance
 */

const LazyWrapper = ({ children }: { children: React.ReactNode }) => (
  <Suspense fallback={
    <div className="flex items-center justify-center p-8">
      <LoadingSpinner size="md" />
    </div>
  }>
    {children}
  </Suspense>
);

// Lazy load heavy dashboard components
export const LazyDashboard = lazy(() => import('../pages/dashboard'));
export const LazySignalDetails = lazy(() => import('../pages/signal-details'));
export const LazyBriefEditor = lazy(() => import('../pages/brief-editor'));
export const LazyAdminDashboard = lazy(() => import('../pages/admin-dashboard'));
export const LazyAnalytics = lazy(() => import('../pages/analytics'));

// Wrapped components with loading states
export const Dashboard = ({ ...props }) => (
  <LazyWrapper>
    <LazyDashboard {...props} />
  </LazyWrapper>
);

export const SignalDetails = ({ ...props }) => (
  <LazyWrapper>
    <LazySignalDetails {...props} />
  </LazyWrapper>
);

export const BriefEditor = ({ ...props }) => (
  <LazyWrapper>
    <LazyBriefEditor {...props} />
  </LazyWrapper>
);

export const AdminDashboard = ({ ...props }) => (
  <LazyWrapper>
    <LazyAdminDashboard {...props} />
  </LazyWrapper>
);

export const Analytics = ({ ...props }) => (
  <LazyWrapper>
    <LazyAnalytics {...props} />
  </LazyWrapper>
);