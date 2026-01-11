/**
 * useInterval - Declarative setInterval hook
 *
 * Handles interval setup and cleanup with proper React lifecycle integration.
 * Automatically clears interval on unmount or when delay changes.
 *
 * @example
 * // Basic polling
 * useInterval(() => {
 *   fetchLatestData();
 * }, 5000);
 *
 * @example
 * // Pause interval by passing null
 * const [isRunning, setIsRunning] = useState(true);
 * useInterval(() => {
 *   tick();
 * }, isRunning ? 1000 : null);
 *
 * @example
 * // With immediate execution
 * useInterval(() => {
 *   syncData();
 * }, 10000, { immediate: true });
 */
import { useEffect, useRef } from 'react';

export interface UseIntervalOptions {
  /** Run callback immediately on mount (default: false) */
  immediate?: boolean;
}

/**
 * useInterval - Run a callback at regular intervals
 *
 * @param callback - Function to call on each interval
 * @param delay - Interval in milliseconds, or null to pause
 * @param options - Configuration options
 */
export function useInterval(
  callback: () => void,
  delay: number | null,
  options: UseIntervalOptions = {},
): void {
  const { immediate = false } = options;
  const savedCallback = useRef(callback);
  // Track if immediate has fired to prevent double-execution in Strict Mode
  const immediateRef = useRef(false);

  // Remember the latest callback to avoid stale closures
  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  // Set up the interval
  useEffect(() => {
    // Don't schedule if delay is null (paused)
    if (delay === null) {
      // Reset immediate flag when paused so it fires again on resume if requested
      immediateRef.current = false;
      return;
    }

    // Run immediately if requested and hasn't fired yet for this interval session
    if (immediate && !immediateRef.current) {
      immediateRef.current = true;
      savedCallback.current();
    }

    const id = setInterval(() => {
      savedCallback.current();
    }, delay);

    return () => {
      clearInterval(id);
    };
  }, [delay, immediate]);
}

/**
 * useIntervalWhen - Conditional interval hook
 *
 * @example
 * useIntervalWhen(
 *   () => pollStatus(),
 *   1000,
 *   isPollingEnabled
 * );
 */
export function useIntervalWhen(
  callback: () => void,
  delay: number,
  condition: boolean,
  options: UseIntervalOptions = {},
): void {
  useInterval(callback, condition ? delay : null, options);
}

export default useInterval;
