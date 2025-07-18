import React, { Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import ErrorBoundary from './ErrorBoundary';

// Lazy load the cohort builder component
const CohortBuilderImpl = React.lazy(() => import('./CohortBuilderImpl'));

interface LazyCohortBuilderProps {
  content: string;
  title?: string;
  onClose?: () => void;
  truthAnalysis?: any;
}

function CohortBuilderLoading() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-8 w-64" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    </div>
  );
}

function CohortBuilderError({ error, retry }: { error: Error; retry: () => void }) {
  return (
    <div className="text-center py-8">
      <h3 className="text-lg font-semibold mb-2">Failed to load Cohort Builder</h3>
      <p className="text-gray-600 mb-4">
        The cohort builder module couldn't be loaded. Please try again.
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

export default function LazyCohortBuilder(props: LazyCohortBuilderProps) {
  return (
    <ErrorBoundary fallback={CohortBuilderError}>
      <Suspense fallback={<CohortBuilderLoading />}>
        <CohortBuilderImpl {...props} />
      </Suspense>
    </ErrorBoundary>
  );
}