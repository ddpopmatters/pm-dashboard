/**
 * useDebounce - Debounce a value
 *
 * Returns a debounced version of the input value that only updates
 * after the specified delay has passed without changes.
 *
 * @example
 * const [searchTerm, setSearchTerm] = useState('');
 * const debouncedSearch = useDebounce(searchTerm, 300);
 *
 * useEffect(() => {
 *   // This only runs 300ms after the user stops typing
 *   searchAPI(debouncedSearch);
 * }, [debouncedSearch]);
 */
import { useState, useEffect, useCallback, useRef } from 'react';

export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
}

/**
 * useDebouncedCallback - Debounce a callback function
 *
 * Returns a debounced version of the callback that only executes
 * after the specified delay has passed without being called again.
 * Automatically cleans up pending timeouts on unmount.
 *
 * @example
 * const debouncedSave = useDebouncedCallback((data) => {
 *   saveToServer(data);
 * }, 500);
 *
 * // Call this on every change - it only saves after 500ms of inactivity
 * debouncedSave(formData);
 */

export function useDebouncedCallback<T extends (...args: unknown[]) => unknown>(
  callback: T,
  delay: number,
): (...args: Parameters<T>) => void {
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Cleanup on unmount to prevent callbacks firing after unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return useCallback(
    (...args: Parameters<T>) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(() => {
        callback(...args);
      }, delay);
    },
    [callback, delay],
  );
}

export default useDebounce;
