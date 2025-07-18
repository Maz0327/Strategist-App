import React, { lazy, Suspense } from 'react';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import ErrorBoundary from './ErrorBoundary';

// Lazy load the implementation
const StrategicInsightsImpl = lazy(() => import('./StrategicInsightsImpl'));

interface LazyStrategicInsightsProps {
  content: string;
  title?: string;
  truthAnalysis?: any;
  onClose?: () => void;
}

export default function LazyStrategicInsights(props: LazyStrategicInsightsProps) {
  return (
    <ErrorBoundary>
      <Suspense fallback={<LoadingSpinner />}>
        <StrategicInsightsImpl {...props} />
      </Suspense>
    </ErrorBoundary>
  );
}