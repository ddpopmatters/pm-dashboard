/**
 * useWindowSize - Track window dimensions
 *
 * Returns the current window dimensions and updates on resize.
 * Useful for responsive layouts and conditional rendering.
 *
 * @example
 * const { width, height } = useWindowSize();
 *
 * return width < 768 ? <MobileView /> : <DesktopView />;
 *
 * @example
 * // With debouncing
 * const size = useWindowSize({ debounceMs: 100 });
 */
import { useState, useEffect, useCallback } from 'react';

export interface WindowSize {
  /** Window inner width in pixels */
  width: number;
  /** Window inner height in pixels */
  height: number;
}

export interface UseWindowSizeOptions {
  /** Debounce resize events by this many milliseconds */
  debounceMs?: number;
  /** Initial size for SSR (default: 0x0) */
  initialSize?: WindowSize;
}

function getWindowSize(): WindowSize {
  if (typeof window === 'undefined') {
    return { width: 0, height: 0 };
  }
  return {
    width: window.innerWidth,
    height: window.innerHeight,
  };
}

export function useWindowSize(options: UseWindowSizeOptions = {}): WindowSize {
  const { debounceMs = 0, initialSize } = options;

  const [size, setSize] = useState<WindowSize>(() => {
    if (typeof window === 'undefined') {
      return initialSize ?? { width: 0, height: 0 };
    }
    return getWindowSize();
  });

  const handleResize = useCallback(() => {
    setSize(getWindowSize());
  }, []);

  useEffect(() => {
    // SSR safety
    if (typeof window === 'undefined') {
      return;
    }

    // Set initial size on mount (in case SSR value differs)
    setSize(getWindowSize());

    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    const debouncedHandler =
      debounceMs > 0
        ? () => {
            if (timeoutId) {
              clearTimeout(timeoutId);
            }
            timeoutId = setTimeout(handleResize, debounceMs);
          }
        : handleResize;

    window.addEventListener('resize', debouncedHandler);

    return () => {
      window.removeEventListener('resize', debouncedHandler);
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [debounceMs, handleResize]);

  return size;
}

/**
 * useMediaQuery - Check if a CSS media query matches
 *
 * @example
 * const isMobile = useMediaQuery('(max-width: 768px)');
 * const prefersDark = useMediaQuery('(prefers-color-scheme: dark)');
 *
 * @example
 * // Responsive breakpoints
 * const isSmall = useMediaQuery('(max-width: 640px)');
 * const isMedium = useMediaQuery('(min-width: 641px) and (max-width: 1024px)');
 * const isLarge = useMediaQuery('(min-width: 1025px)');
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(() => {
    if (typeof window === 'undefined') {
      return false;
    }
    return window.matchMedia(query).matches;
  });

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const mediaQueryList = window.matchMedia(query);

    // Set initial value
    setMatches(mediaQueryList.matches);

    const listener = (event: MediaQueryListEvent) => {
      setMatches(event.matches);
    };

    // Modern browsers
    if (mediaQueryList.addEventListener) {
      mediaQueryList.addEventListener('change', listener);
      return () => mediaQueryList.removeEventListener('change', listener);
    }

    // Legacy browsers (Safari < 14)
    mediaQueryList.addListener(listener);
    return () => mediaQueryList.removeListener(listener);
  }, [query]);

  return matches;
}

/**
 * Common breakpoint helpers
 */
export const breakpoints = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
} as const;

/**
 * useBreakpoint - Check current breakpoint
 *
 * Returns mutually exclusive breakpoint flags (only one will be true at a time).
 *
 * @example
 * const { isMobile, isTablet, isDesktop } = useBreakpoint();
 */
export function useBreakpoint() {
  // Use non-overlapping ranges to ensure only one flag is true
  // Mobile: 0 - 767px
  // Tablet: 768px - 1023px
  // Desktop: 1024px+
  const isMobile = useMediaQuery('(max-width: 767px)');
  const isTablet = useMediaQuery('(min-width: 768px) and (max-width: 1023px)');
  const isDesktop = useMediaQuery('(min-width: 1024px)');

  return { isMobile, isTablet, isDesktop };
}

export default useWindowSize;
