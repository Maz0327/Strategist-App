// Mobile Optimization Utilities
// Provides touch-friendly interactions and responsive behavior

import { useEffect, useState } from 'react';

// Custom hook for mobile detection
export function useIsMobile(breakpoint: number = 768) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkDevice = () => {
      setIsMobile(window.innerWidth < breakpoint);
    };

    checkDevice();
    window.addEventListener('resize', checkDevice);
    return () => window.removeEventListener('resize', checkDevice);
  }, [breakpoint]);

  return isMobile;
}

// Touch gesture utilities
interface TouchGestureOptions {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
  threshold?: number;
}

export function useTouchGestures({
  onSwipeLeft,
  onSwipeRight,
  onSwipeUp,
  onSwipeDown,
  threshold = 50
}: TouchGestureOptions) {
  const [startPos, setStartPos] = useState<{ x: number; y: number } | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    setStartPos({ x: touch.clientX, y: touch.clientY });
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!startPos) return;

    const touch = e.changedTouches[0];
    const deltaX = touch.clientX - startPos.x;
    const deltaY = touch.clientY - startPos.y;

    // Determine primary direction
    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      // Horizontal swipe
      if (Math.abs(deltaX) > threshold) {
        if (deltaX > 0) {
          onSwipeRight?.();
        } else {
          onSwipeLeft?.();
        }
      }
    } else {
      // Vertical swipe
      if (Math.abs(deltaY) > threshold) {
        if (deltaY > 0) {
          onSwipeDown?.();
        } else {
          onSwipeUp?.();
        }
      }
    }

    setStartPos(null);
  };

  return {
    onTouchStart: handleTouchStart,
    onTouchEnd: handleTouchEnd
  };
}

// Mobile-optimized button sizes and spacing
export const mobileOptimized = {
  button: {
    minHeight: '44px', // Apple's recommended minimum touch target
    minWidth: '44px',
    padding: '12px 16px'
  },
  spacing: {
    xs: '4px',
    sm: '8px',
    md: '16px',
    lg: '24px',
    xl: '32px'
  },
  text: {
    small: '14px',
    body: '16px', // Prevents zoom on iOS
    large: '18px'
  }
};

// Responsive breakpoints
export const breakpoints = {
  mobile: '(max-width: 767px)',
  tablet: '(min-width: 768px) and (max-width: 1023px)',
  desktop: '(min-width: 1024px)',
  touch: '(pointer: coarse)', // Touch-enabled devices
  hover: '(hover: hover)' // Devices that support hover
};

// Mobile-friendly form validation
export function getMobileInputProps(type: string) {
  const baseProps = {
    autoCapitalize: 'off',
    autoCorrect: 'off',
    spellCheck: false
  };

  switch (type) {
    case 'email':
      return {
        ...baseProps,
        inputMode: 'email' as const,
        type: 'email'
      };
    case 'url':
      return {
        ...baseProps,
        inputMode: 'url' as const,
        type: 'url'
      };
    case 'number':
      return {
        ...baseProps,
        inputMode: 'numeric' as const,
        type: 'text', // Use text to prevent spinner on mobile
        pattern: '[0-9]*'
      };
    case 'search':
      return {
        ...baseProps,
        inputMode: 'search' as const,
        type: 'search'
      };
    default:
      return baseProps;
  }
}

// Viewport utilities for mobile
export function getViewportHeight() {
  // Handle mobile viewport issues
  return window.visualViewport?.height || window.innerHeight;
}

export function useViewportHeight() {
  const [height, setHeight] = useState(getViewportHeight());

  useEffect(() => {
    const updateHeight = () => setHeight(getViewportHeight());
    
    window.addEventListener('resize', updateHeight);
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', updateHeight);
    }

    return () => {
      window.removeEventListener('resize', updateHeight);
      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', updateHeight);
      }
    };
  }, []);

  return height;
}

// Smooth scroll for mobile
export function smoothScrollTo(elementId: string, offset: number = 0) {
  const element = document.getElementById(elementId);
  if (!element) return;

  const y = element.getBoundingClientRect().top + window.pageYOffset - offset;
  
  window.scrollTo({
    top: y,
    behavior: 'smooth'
  });
}

// Touch-friendly tab navigation
export function createMobileTabProps(isActive: boolean) {
  return {
    role: 'tab',
    'aria-selected': isActive,
    tabIndex: isActive ? 0 : -1,
    className: `
      ${isActive ? 'bg-primary text-primary-foreground' : 'bg-background text-foreground'}
      min-h-[44px] px-4 py-2 text-sm font-medium rounded-md transition-colors
      focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring
      active:scale-95 touch-manipulation select-none
    `.trim()
  };
}

// Performance optimization for mobile
export function useReducedMotion() {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mediaQuery.addEventListener('change', handler);
    
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  return prefersReducedMotion;
}