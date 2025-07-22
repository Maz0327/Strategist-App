// Mobile optimization utilities for strategic content platform

// Touch-friendly button size constants
export const TOUCH_TARGET_SIZE = {
  MINIMUM: 44, // iOS/Android minimum recommendation
  COMFORTABLE: 48, // More comfortable touch target
  LARGE: 56 // Large touch targets for primary actions
};

// Viewport detection utilities
export function getViewportSize() {
  return {
    width: window.innerWidth,
    height: window.innerHeight
  };
}

export function isMobileViewport(): boolean {
  return window.innerWidth < 768; // Tailwind's md breakpoint
}

export function isTabletViewport(): boolean {
  return window.innerWidth >= 768 && window.innerWidth < 1024; // Between md and lg
}

export function isDesktopViewport(): boolean {
  return window.innerWidth >= 1024; // Tailwind's lg breakpoint and above
}

// Touch event utilities
export function isTouchDevice(): boolean {
  return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
}

// Gesture handling utilities
export interface SwipeGestureOptions {
  threshold?: number; // Minimum distance for swipe (default: 50px)
  restraint?: number; // Maximum perpendicular movement (default: 100px)
  allowedTime?: number; // Maximum time for swipe (default: 300ms)
}

export function useSwipeGesture(
  element: HTMLElement | null,
  onSwipeLeft?: () => void,
  onSwipeRight?: () => void,
  options: SwipeGestureOptions = {}
) {
  const { 
    threshold = 50, 
    restraint = 100, 
    allowedTime = 300 
  } = options;

  if (!element || !isTouchDevice()) return;

  let startX: number;
  let startY: number;
  let startTime: number;

  const handleTouchStart = (e: TouchEvent) => {
    const touch = e.changedTouches[0];
    startX = touch.pageX;
    startY = touch.pageY;
    startTime = new Date().getTime();
  };

  const handleTouchEnd = (e: TouchEvent) => {
    const touch = e.changedTouches[0];
    const distX = touch.pageX - startX;
    const distY = touch.pageY - startY;
    const elapsedTime = new Date().getTime() - startTime;

    // Check if gesture meets criteria
    if (elapsedTime <= allowedTime && Math.abs(distX) >= threshold && Math.abs(distY) <= restraint) {
      if (distX > 0 && onSwipeRight) {
        onSwipeRight();
      } else if (distX < 0 && onSwipeLeft) {
        onSwipeLeft();
      }
    }
  };

  element.addEventListener('touchstart', handleTouchStart, { passive: true });
  element.addEventListener('touchend', handleTouchEnd, { passive: true });

  // Return cleanup function
  return () => {
    element.removeEventListener('touchstart', handleTouchStart);
    element.removeEventListener('touchend', handleTouchEnd);
  };
}

// Mobile-specific input utilities
export function getMobileInputMode(inputType: string): string {
  const inputModeMap: Record<string, string> = {
    'email': 'email',
    'tel': 'tel',
    'url': 'url',
    'search': 'search',
    'number': 'numeric',
    'decimal': 'decimal'
  };

  return inputModeMap[inputType] || 'text';
}

// Performance optimization for mobile
export function optimizeForMobile() {
  // Disable hover effects on touch devices
  if (isTouchDevice()) {
    document.body.classList.add('touch-device');
  }

  // Add passive event listeners for better scroll performance
  const addPassiveListener = (element: Element, event: string, handler: EventListener) => {
    element.addEventListener(event, handler, { passive: true });
  };

  return { addPassiveListener };
}

// Mobile-friendly modal positioning
export function getMobileModalPosition() {
  const viewportHeight = window.innerHeight;
  const keyboardHeight = viewportHeight - window.visualViewport?.height || 0;
  
  return {
    maxHeight: `${viewportHeight - keyboardHeight - 40}px`, // 40px for padding
    transform: keyboardHeight > 0 ? `translateY(-${keyboardHeight / 2}px)` : 'none'
  };
}

// Responsive text scaling
export function getResponsiveFontSize(baseSize: number): string {
  const viewport = getViewportSize();
  
  if (viewport.width < 375) {
    // Small phones
    return `${Math.max(baseSize * 0.875, 12)}px`;
  } else if (viewport.width < 768) {
    // Regular phones
    return `${baseSize}px`;
  } else if (viewport.width < 1024) {
    // Tablets
    return `${baseSize * 1.125}px`;
  } else {
    // Desktop
    return `${baseSize * 1.25}px`;
  }
}

// Mobile-optimized loading states
export function getMobileLoadingConfig() {
  return {
    spinnerSize: isMobileViewport() ? 24 : 32,
    animationDuration: isMobileViewport() ? '1s' : '0.75s',
    reducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches
  };
}

// Touch-friendly spacing utilities
export function getTouchFriendlySpacing() {
  return {
    buttonGap: isMobileViewport() ? '0.75rem' : '0.5rem',
    cardPadding: isMobileViewport() ? '1rem' : '1.5rem',
    sectionGap: isMobileViewport() ? '1.5rem' : '2rem'
  };
}

// Mobile navigation utilities
export function getMobileNavConfig() {
  const isMobile = isMobileViewport();
  
  return {
    showLabels: !isMobile, // Hide labels on mobile to save space
    iconSize: isMobile ? 24 : 20,
    tabHeight: isMobile ? 64 : 48,
    useBottomNavigation: isMobile
  };
}

// Virtual keyboard handling
export function handleVirtualKeyboard() {
  if (!window.visualViewport) return;

  const viewport = window.visualViewport;
  
  const handleViewportChange = () => {
    const keyboardHeight = window.innerHeight - viewport.height;
    
    // Adjust UI when keyboard appears
    if (keyboardHeight > 150) { // Keyboard is likely open
      document.documentElement.style.setProperty('--keyboard-height', `${keyboardHeight}px`);
      document.body.classList.add('keyboard-open');
    } else {
      document.documentElement.style.removeProperty('--keyboard-height');
      document.body.classList.remove('keyboard-open');
    }
  };

  viewport.addEventListener('resize', handleViewportChange);
  
  return () => {
    viewport.removeEventListener('resize', handleViewportChange);
  };
}

// Battery and performance awareness
export function getBatteryAwareConfig() {
  const isMobile = isMobileViewport();
  
  return {
    // Reduce animations on mobile to save battery
    enableAnimations: !isMobile || navigator.hardwareConcurrency > 4,
    // Reduce polling frequency on mobile
    pollInterval: isMobile ? 10000 : 5000,
    // Lazy load more aggressively on mobile
    lazyLoadThreshold: isMobile ? '200px' : '100px'
  };
}

// Export all utilities as a single object for easy importing
export const MobileOptimization = {
  TOUCH_TARGET_SIZE,
  getViewportSize,
  isMobileViewport,
  isTabletViewport,
  isDesktopViewport,
  isTouchDevice,
  useSwipeGesture,
  getMobileInputMode,
  optimizeForMobile,
  getMobileModalPosition,
  getResponsiveFontSize,
  getMobileLoadingConfig,
  getTouchFriendlySpacing,
  getMobileNavConfig,
  handleVirtualKeyboard,
  getBatteryAwareConfig
};