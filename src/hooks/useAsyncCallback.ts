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

/**
 * useAsyncCallbackWithRetry - Async callback with automatic retry support
 *
 * @example
 * const [fetchData, { loading, error, retryCount }] = useAsyncCallbackWithRetry(
 *   async () => api.get('/data'),
 *   { maxRetries: 3, retryDelay: 1000 }
 * );
 */
export interface RetryOptions {
  /** Maximum number of retries (default: 3) */
  maxRetries?: number;
  /** Delay between retries in ms (default: 1000) */
  retryDelay?: number;
  /** Whether to use exponential backoff (default: true) */
  exponentialBackoff?: boolean;
  /** Function to determine if error is retryable (default: all errors) */
  isRetryable?: (error: Error) => boolean;
}

export interface AsyncStateWithRetry<T> extends AsyncState<T> {
  /** Number of retries attempted */
  retryCount: number;
}

export function useAsyncCallbackWithRetry<TArgs extends unknown[], TResult>(
  callback: (...args: TArgs) => Promise<TResult>,
  options: RetryOptions = {},
  deps: readonly unknown[] = [],
): [AsyncCallback<TArgs, TResult>, AsyncStateWithRetry<TResult>] {
  const {
    maxRetries = 3,
    retryDelay = 1000,
    exponentialBackoff = true,
    isRetryable = () => true,
  } = options;

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [data, setData] = useState<TResult | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  const mountedRef = useRef(true);
  const executionIdRef = useRef(0);

  const reset = useCallback(() => {
    // Increment execution ID to invalidate any in-flight requests
    executionIdRef.current++;
    setLoading(false);
    setError(null);
    setData(null);
    setRetryCount(0);
  }, []);

  const execute = useCallback(
    async (...args: TArgs): Promise<TResult | undefined> => {
      const executionId = ++executionIdRef.current;

      setLoading(true);
      setError(null);
      setRetryCount(0);

      let lastError: Error | null = null;
      let attempts = 0;

      while (attempts <= maxRetries) {
        try {
          const result = await callback(...args);

          if (executionId === executionIdRef.current && mountedRef.current) {
            setData(result);
            setLoading(false);
          }

          return result;
        } catch (err) {
          lastError = err instanceof Error ? err : new Error(String(err));
          attempts++;

          if (executionId === executionIdRef.current && mountedRef.current) {
            setRetryCount(attempts);
          }

          // Check if we should retry
          if (attempts <= maxRetries && isRetryable(lastError)) {
            const delay = exponentialBackoff ? retryDelay * Math.pow(2, attempts - 1) : retryDelay;
            await new Promise((resolve) => setTimeout(resolve, delay));
          } else {
            break;
          }
        }
      }

      // All retries exhausted
      if (executionId === executionIdRef.current && mountedRef.current) {
        setError(lastError);
        setLoading(false);
      }

      if (lastError) {
        throw lastError;
      }
    },
    // Include callback to avoid stale closure, plus options and caller's deps
    [callback, maxRetries, retryDelay, exponentialBackoff, isRetryable, ...deps],
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
      retryCount,
      reset,
    },
  ];
}

export default useAsyncCallback;
