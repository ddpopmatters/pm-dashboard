/**
 * useOnMount - Run effect only on mount
 *
 * A semantic wrapper around useEffect with empty dependency array.
 * Makes mount-only effects more readable and explicit.
 *
 * @example
 * useOnMount(() => {
 *   analytics.trackPageView();
 * });
 *
 * @example
 * // With cleanup
 * useOnMount(() => {
 *   const subscription = eventBus.subscribe('event', handler);
 *   return () => subscription.unsubscribe();
 * });
 */
import { useEffect, useRef, type RefObject } from 'react';

export function useOnMount(callback: () => void | (() => void)): void {
  // Use ref to store callback to avoid stale closure issues
  const callbackRef = useRef(callback);
  callbackRef.current = callback;

  useEffect(() => {
    return callbackRef.current();
    // Empty deps - only run on mount
  }, []);
}

/**
 * useOnUnmount - Run cleanup only on unmount
 *
 * A semantic wrapper for cleanup-only effects.
 *
 * @example
 * useOnUnmount(() => {
 *   analytics.trackPageExit();
 * });
 *
 * @example
 * // Clean up resources
 * useOnUnmount(() => {
 *   socket.disconnect();
 *   cache.clear();
 * });
 */
export function useOnUnmount(callback: () => void): void {
  const callbackRef = useRef(callback);
  callbackRef.current = callback;

  useEffect(() => {
    return () => {
      callbackRef.current();
    };
    // Empty deps - cleanup only runs on unmount
  }, []);
}

/**
 * useIsMounted - Track component mount state
 *
 * Returns a ref that indicates whether the component is currently mounted.
 * Useful for checking mount state in async callbacks.
 *
 * @example
 * const isMounted = useIsMounted();
 *
 * const fetchData = async () => {
 *   const data = await api.get('/data');
 *   if (isMounted.current) {
 *     setData(data);
 *   }
 * };
 */
export function useIsMounted(): RefObject<boolean> {
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  return isMounted;
}

export default useOnMount;
