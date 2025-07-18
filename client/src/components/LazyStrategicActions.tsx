import React, { lazy, Suspense } from 'react';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import ErrorBoundary from './ErrorBoundary';

// Lazy load the implementation
const StrategicActionsImpl = lazy(() => import('./StrategicActionsImpl'));

interface LazyStrategicActionsProps {
  content: string;
  title?: string;
  truthAnalysis?: any;
  onClose?: () => void;
}

export default function LazyStrategicActions(props: LazyStrategicActionsProps) {
  return (
    <ErrorBoundary>
      <Suspense fallback={<LoadingSpinner />}>
        <StrategicActionsImpl {...props} />
      </Suspense>
    </ErrorBoundary>
  );
}