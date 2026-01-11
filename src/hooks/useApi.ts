/**
 * useApi - HTTP client hook with loading and error state
 *
 * Provides typed HTTP methods (get, post, put, patch, del) with
 * automatic loading state, error handling, and timeout support.
 *
 * @example
 * const { get, post, loading, error } = useApi();
 *
 * // GET request with type
 * const entries = await get<Entry[]>('/api/entries');
 *
 * // POST request with type
 * const newEntry = await post<Entry>('/api/entries', { date: '2025-01-15' });
 */
import { useState, useCallback } from 'react';
import type { ApiError } from '../types';

// Default timeout for API requests (30 seconds)
const DEFAULT_TIMEOUT_MS = 30000;

// ============================================================================
// Types
// ============================================================================

export interface RequestOptions extends Omit<RequestInit, 'body'> {
  timeout?: number;
  body?: unknown;
}

export interface UseApiReturn {
  loading: boolean;
  error: string | null;
  request: <T>(url: string, options?: RequestOptions) => Promise<T>;
  get: <T>(url: string) => Promise<T>;
  post: <T>(url: string, body?: unknown) => Promise<T>;
  put: <T>(url: string, body?: unknown) => Promise<T>;
  patch: <T>(url: string, body?: unknown) => Promise<T>;
  del: <T>(url: string) => Promise<T>;
  clearError: () => void;
}

// ============================================================================
// Hook
// ============================================================================

export function useApi(): UseApiReturn {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const request = useCallback(async <T>(url: string, options: RequestOptions = {}): Promise<T> => {
    setLoading(true);
    setError(null);

    // Set up abort controller for timeout
    const controller = new AbortController();
    const timeoutMs = options.timeout ?? DEFAULT_TIMEOUT_MS;
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const { timeout: _timeout, body, ...fetchOptions } = options;

      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          'X-Requested-With': 'XMLHttpRequest', // CSRF protection header
          ...fetchOptions.headers,
        },
        ...fetchOptions,
        body: body !== undefined ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData: ApiError = await response.json().catch(() => ({ error: '' }));
        throw new Error(errorData.error || `Request failed: ${response.status}`);
      }

      // Handle empty responses (204 No Content, etc.)
      if (response.status === 204 || response.headers.get('content-length') === '0') {
        return undefined as T;
      }

      // Parse response text first to handle empty bodies gracefully
      const text = await response.text();
      if (!text) {
        return undefined as T;
      }

      const data = JSON.parse(text) as T;
      return data;
    } catch (err) {
      clearTimeout(timeoutId);

      // Provide clearer error message for timeout/abort
      if (err instanceof Error && err.name === 'AbortError') {
        const timeoutError = new Error('Request timed out. Please try again.');
        setError(timeoutError.message);
        throw timeoutError;
      }

      const message = err instanceof Error ? err.message : 'An unknown error occurred';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const get = useCallback(
    <T>(url: string): Promise<T> => request<T>(url, { method: 'GET' }),
    [request],
  );

  const post = useCallback(
    <T>(url: string, body?: unknown): Promise<T> => request<T>(url, { method: 'POST', body }),
    [request],
  );

  const put = useCallback(
    <T>(url: string, body?: unknown): Promise<T> => request<T>(url, { method: 'PUT', body }),
    [request],
  );

  const patch = useCallback(
    <T>(url: string, body?: unknown): Promise<T> => request<T>(url, { method: 'PATCH', body }),
    [request],
  );

  const del = useCallback(
    <T>(url: string): Promise<T> => request<T>(url, { method: 'DELETE' }),
    [request],
  );

  const clearError = useCallback(() => setError(null), []);

  return {
    loading,
    error,
    request,
    get,
    post,
    put,
    patch,
    del,
    clearError,
  };
}

export default useApi;
