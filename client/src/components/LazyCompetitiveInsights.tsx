import React, { Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import ErrorBoundary from './ErrorBoundary';

// Lazy load the competitive insights component
const CompetitiveInsightsImpl = React.lazy(() => import('./CompetitiveInsightsImpl'));

interface LazyCompetitiveInsightsProps {
  content: string;
  title?: string;
  onClose?: () => void;
}

function CompetitiveInsightsLoading() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-8 w-64" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-4 w-1/2" />
    </div>
  );
}

function CompetitiveInsightsError({ error, retry }: { error: Error; retry: () => void }) {
  return (
    <div className="text-center py-8">
      <h3 className="text-lg font-semibold mb-2">Failed to load Competitive Intelligence</h3>
      <p className="text-gray-600 mb-4">
        The competitive intelligence module couldn't be loaded. Please try again.
      </p>
      <button 
        onClick={retry}
        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
      >
        Retry
      </button>
    </div>
  );
}

export default function LazyCompetitiveInsights(props: LazyCompetitiveInsightsProps) {
  return (
    <ErrorBoundary fallback={CompetitiveInsightsError}>
      <Suspense fallback={<CompetitiveInsightsLoading />}>
        <CompetitiveInsightsImpl {...props} />
      </Suspense>
    </ErrorBoundary>
  );
}