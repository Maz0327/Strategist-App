import React, { useEffect, useRef } from 'react';
import { Button } from './button';

// Skip Navigation Link Component
export function SkipNavLink({ targetId = 'main-content' }: { targetId?: string }) {
  return (
    <a
      href={`#${targetId}`}
      className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 z-50 bg-primary text-primary-foreground px-4 py-2 rounded-md font-medium"
      aria-label="Skip to main content"
    >
      Skip to main content
    </a>
  );
}

// Accessible Button with proper ARIA attributes
interface AccessibleButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  ariaLabel?: string;
  ariaDescribedBy?: string;
  isLoading?: boolean;
  loadingText?: string;
}

export function AccessibleButton({
  children,
  ariaLabel,
  ariaDescribedBy,
  isLoading = false,
  loadingText = 'Loading...',
  ...props
}: AccessibleButtonProps) {
  return (
    <Button
      {...props}
      aria-label={ariaLabel || (typeof children === 'string' ? children : undefined)}
      aria-describedby={ariaDescribedBy}
      aria-busy={isLoading}
      disabled={props.disabled || isLoading}
    >
      {isLoading ? (
        <>
          <span className="sr-only">{loadingText}</span>
          <span aria-hidden="true">{children}</span>
        </>
      ) : (
        children
      )}
    </Button>
  );
}

// Live Region for Dynamic Content Updates
interface LiveRegionProps {
  children: React.ReactNode;
  politeness?: 'polite' | 'assertive' | 'off';
  atomic?: boolean;
  className?: string;
}

export function LiveRegion({ 
  children, 
  politeness = 'polite', 
  atomic = false,
  className = '' 
}: LiveRegionProps) {
  return (
    <div
      aria-live={politeness}
      aria-atomic={atomic}
      className={`${className}`}
    >
      {children}
    </div>
  );
}

// Focus Trap for Modals and Dialogs
interface FocusTrapProps {
  children: React.ReactNode;
  isActive: boolean;
  onEscape?: () => void;
  className?: string;
}

export function FocusTrap({ 
  children, 
  isActive, 
  onEscape,
  className = '' 
}: FocusTrapProps) {
  const trapRef = useRef<HTMLDivElement>(null);
  const firstFocusableRef = useRef<HTMLElement | null>(null);
  const lastFocusableRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!isActive || !trapRef.current) return;

    const focusableElements = trapRef.current.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );

    if (focusableElements.length > 0) {
      firstFocusableRef.current = focusableElements[0] as HTMLElement;
      lastFocusableRef.current = focusableElements[focusableElements.length - 1] as HTMLElement;
      
      // Focus first element
      firstFocusableRef.current?.focus();
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && onEscape) {
        onEscape();
        return;
      }

      if (event.key === 'Tab') {
        if (event.shiftKey) {
          // Shift + Tab
          if (document.activeElement === firstFocusableRef.current) {
            event.preventDefault();
            lastFocusableRef.current?.focus();
          }
        } else {
          // Tab
          if (document.activeElement === lastFocusableRef.current) {
            event.preventDefault();
            firstFocusableRef.current?.focus();
          }
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isActive, onEscape]);

  if (!isActive) return null;

  return (
    <div ref={trapRef} className={className}>
      {children}
    </div>
  );
}

// Screen Reader Only Content
export function ScreenReaderOnly({ children }: { children: React.ReactNode }) {
  return <span className="sr-only">{children}</span>;
}

// Accessible Form Field with proper labeling
interface AccessibleFormFieldProps {
  label: string;
  children: React.ReactNode;
  error?: string;
  hint?: string;
  required?: boolean;
  fieldId: string;
}

export function AccessibleFormField({
  label,
  children,
  error,
  hint,
  required = false,
  fieldId
}: AccessibleFormFieldProps) {
  const hintId = hint ? `${fieldId}-hint` : undefined;
  const errorId = error ? `${fieldId}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(' ') || undefined;

  return (
    <div className="space-y-2">
      <label 
        htmlFor={fieldId}
        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
      >
        {label}
        {required && (
          <>
            <span className="text-destructive ml-1" aria-label="required">*</span>
            <ScreenReaderOnly>required</ScreenReaderOnly>
          </>
        )}
      </label>
      
      {hint && (
        <p id={hintId} className="text-sm text-muted-foreground">
          {hint}
        </p>
      )}
      
      <div>
        {React.cloneElement(children as React.ReactElement, {
          id: fieldId,
          'aria-describedby': describedBy,
          'aria-required': required,
          'aria-invalid': !!error
        })}
      </div>
      
      {error && (
        <p id={errorId} className="text-sm text-destructive" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

// Progress Bar with accessible labels
interface AccessibleProgressProps {
  value: number;
  max?: number;
  label?: string;
  className?: string;
}

export function AccessibleProgress({ 
  value, 
  max = 100, 
  label,
  className = '' 
}: AccessibleProgressProps) {
  const percentage = Math.round((value / max) * 100);

  return (
    <div className={className}>
      {label && (
        <div className="flex justify-between text-sm mb-1">
          <span>{label}</span>
          <span>{percentage}%</span>
        </div>
      )}
      <div
        role="progressbar"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={max}
        aria-label={label || `Progress: ${percentage}%`}
        className="w-full bg-secondary rounded-full h-2"
      >
        <div
          className="bg-primary h-2 rounded-full transition-all duration-300"
          style={{ width: `${percentage}%` }}
        />
      </div>
      <ScreenReaderOnly>
        Progress: {percentage}% complete
      </ScreenReaderOnly>
    </div>
  );
}

// Hook for managing focus
export function useFocusManagement() {
  const restoreFocus = useRef<HTMLElement | null>(null);

  const saveFocus = () => {
    restoreFocus.current = document.activeElement as HTMLElement;
  };

  const restoreFocusToSaved = () => {
    if (restoreFocus.current) {
      restoreFocus.current.focus();
      restoreFocus.current = null;
    }
  };

  const focusElement = (element: HTMLElement | null) => {
    if (element) {
      element.focus();
    }
  };

  return {
    saveFocus,
    restoreFocusToSaved,
    focusElement
  };
}

// Reduced Motion Wrapper
export function ReducedMotionWrapper({ 
  children, 
  fallback 
}: { 
  children: React.ReactNode;
  fallback?: React.ReactNode;
}) {
  const [prefersReducedMotion, setPrefersReducedMotion] = React.useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    const handleChange = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  if (prefersReducedMotion && fallback) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}