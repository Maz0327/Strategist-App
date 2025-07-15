import { lazy } from 'react';

// Lazy load heavy components to improve initial bundle size
export const LazyTodaysBriefing = lazy(() => import('./todays-briefing'));
export const LazyExploreSignals = lazy(() => import('./explore-signals'));
export const LazyStrategicBriefLab = lazy(() => import('./strategic-brief-lab'));
export const LazyManageHub = lazy(() => import('./manage-hub'));
export const LazyAdminDashboard = lazy(() => import('./admin-dashboard'));
export const LazyTrendingTopics = lazy(() => import('./trending-topics'));
export const LazyAudienceInsights = lazy(() => import('./audience-insights'));
export const LazySignalAnalytics = lazy(() => import('./signal-analytics'));
export const LazyCustomFeedBuilder = lazy(() => import('./custom-feed-builder'));
export const LazyProjectIntelligence = lazy(() => import('./project-intelligence'));

// Loading fallback component
export const ComponentLoader = () => (
  <div className="flex items-center justify-center min-h-[400px]">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
    <span className="ml-3 text-gray-600">Loading...</span>
  </div>
);

// Error boundary for lazy components
export const LazyErrorBoundary = ({ children }: { children: React.ReactNode }) => (
  <div className="min-h-[400px] p-8">
    <div className="text-center">
      <div className="text-red-500 mb-4">
        <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">Failed to load component</h3>
      <p className="text-gray-600 mb-4">Please try refreshing the page.</p>
      <button 
        onClick={() => window.location.reload()}
        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
      >
        Refresh Page
      </button>
    </div>
    {children}
  </div>
);