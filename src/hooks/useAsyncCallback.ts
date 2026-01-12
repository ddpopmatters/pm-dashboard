/**
 * useAsyncCallback - Wrap async functions with loading/error state
 *
 * Provides automatic loading and error state management for async operations.
 * Useful for form submissions, data fetching, and other async actions.
 *
 * @example
 * const [saveUser, { loading, error }] = useAsyncCallback(async (userData) => {
 *   const result = await api.post('/users', userData);
 *   return result;
 * });
 *
 * <Button onClick={() => saveUser(formData)} disabled={loading}>
 *   {loading ? 'Saving...' : 'Save'}
 * </Button>
 * {error && <div className="error">{error.message}</div>}
 */
import { useState, useCallback, useRef, useEffect } from 'react';

export interface AsyncState<T> {
  /** Whether the async operation is in progress */
  loading: boolean;
  /** Error from the last execution, if any */
  error: Error | null;
  /** Result from the last successful execution */
  data: T | null;
  /** Reset the state */
  reset: () => void;
}

export type AsyncCallback<TArgs extends unknown[], TResult> = (
  ...args: TArgs
) => Promise<TResult | undefined>;

export type UseAsyncCallbackReturn<TArgs extends unknown[], TResult> = [
  AsyncCallback<TArgs, TResult>,
  AsyncState<TResult>,
];

export function useAsyncCallback<TArgs extends unknown[], TResult>(
  callback: (...args: TArgs) => Promise<TResult>,
  deps: readonly unknown[] = [],
): UseAsyncCallbackReturn<TArgs, TResult> {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [data, setData] = useState<TResult | null>(null);

  // Track mounted state to prevent state updates after unmount
  const mountedRef = useRef(true);

  // Track current execution to handle race conditions
  const executionIdRef = useRef(0);

  const reset = useCallback(() => {
    // Increment execution ID to invalidate any in-flight requests
    executionIdRef.current++;
    setLoading(false);
    setError(null);
    setData(null);
  }, []);

  const execute = useCallback(
    async (...args: TArgs): Promise<TResult | undefined> => {
      const executionId = ++executionIdRef.current;

      setLoading(true);
      setError(null);

      try {
        const result = await callback(...args);

        // Only update state if this is still the latest execution and component is mounted
        if (executionId === executionIdRef.current && mountedRef.current) {
          setData(result);
          setLoading(false);
        }

        return result;
      } catch (err) {
        // Only update state if this is still the latest execution and component is mounted
        if (executionId === executionIdRef.current && mountedRef.current) {
          const error = err instanceof Error ? err : new Error(String(err));
          setError(error);
          setLoading(false);
        }

        throw err;
      }
    },
    // Include callback to avoid stale closure, plus caller's deps
    [callback, ...deps],
  );

  // Track mount state - set to false on unmount to prevent state updates
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  return [
    execute,
    {
      loading,
      error,
      data,
      reset,
    },
  ];
}

export default useAsyncCallback;
