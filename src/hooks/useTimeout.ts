/**
 * useTimeout - Declarative setTimeout hook
 *
 * Handles timeout setup and cleanup with proper React lifecycle integration.
 * Automatically clears timeout on unmount or when delay changes.
 *
 * @example
 * // Auto-dismiss notification
 * useTimeout(() => {
 *   setVisible(false);
 * }, 3000);
 *
 * @example
 * // Delay action until user stops typing
 * useTimeout(() => {
 *   submitSearch(query);
 * }, query ? 500 : null);
 *
 * @example
 * // With reset capability
 * const { reset, clear } = useTimeoutFn(() => {
 *   showIdleWarning();
 * }, 60000);
 *
 * // Reset timer on user activity
 * onUserActivity(() => reset());
 */
import { useEffect, useRef, useCallback, useState } from 'react';

/**
 * useTimeout - Run a callback after a delay
 *
 * @param callback - Function to call after delay
 * @param delay - Delay in milliseconds, or null to disable
 */
export function useTimeout(callback: () => void, delay: number | null): void {
  const savedCallback = useRef(callback);

  // Remember the latest callback to avoid stale closures
  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  // Set up the timeout
  useEffect(() => {
    // Don't schedule if delay is null (disabled)
    if (delay === null) {
      return;
    }

    const id = setTimeout(() => {
      savedCallback.current();
    }, delay);

    return () => {
      clearTimeout(id);
    };
  }, [delay]);
}

export interface UseTimeoutFnReturn {
  /** Reset the timeout (restart from beginning) */
  reset: () => void;
  /** Clear the timeout without executing callback */
  clear: () => void;
  /** Whether the timeout is currently pending */
  isPending: boolean;
}

/**
 * useTimeoutFn - Timeout with reset and clear controls
 *
 * Returns controls to manually reset or clear the timeout.
 *
 * @example
 * const { reset, clear, isPending } = useTimeoutFn(() => {
 *   logout();
 * }, 30 * 60 * 1000); // 30 minutes
 *
 * // Reset on any user activity
 * useEventListener('click', reset);
 * useEventListener('keydown', reset);
 */
export function useTimeoutFn(callback: () => void, delay: number): UseTimeoutFnReturn {
  const savedCallback = useRef(callback);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Use useState for isPending so changes trigger re-renders
  const [isPending, setIsPending] = useState(false);

  // Remember the latest callback
  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  const clear = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
      setIsPending(false);
    }
  }, []);

  const reset = useCallback(() => {
    clear();
    timeoutRef.current = setTimeout(() => {
      setIsPending(false);
      savedCallback.current();
    }, delay);
    setIsPending(true);
  }, [delay, clear]);

  // Start timeout on mount
  useEffect(() => {
    reset();
    return clear;
  }, [reset, clear]);

  return {
    reset,
    clear,
    isPending,
  };
}

/**
 * useTimeoutWhen - Conditional timeout hook
 *
 * @example
 * useTimeoutWhen(
 *   () => hideToast(),
 *   3000,
 *   isToastVisible
 * );
 */
export function useTimeoutWhen(callback: () => void, delay: number, condition: boolean): void {
  useTimeout(callback, condition ? delay : null);
}

export default useTimeout;
