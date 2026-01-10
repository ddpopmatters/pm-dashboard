import { useState, useCallback } from 'react';

// Default timeout for API requests (30 seconds)
const DEFAULT_TIMEOUT_MS = 30000;

export function useApi() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const request = useCallback(async (url, options = {}) => {
    setLoading(true);
    setError(null);

    // Set up abort controller for timeout
    const controller = new AbortController();
    const timeoutMs = options.timeout || DEFAULT_TIMEOUT_MS;
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          'X-Requested-With': 'XMLHttpRequest', // CSRF protection header
          ...options.headers,
        },
        ...options,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Request failed: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (err) {
      clearTimeout(timeoutId);
      // Provide clearer error message for timeout/abort
      if (err.name === 'AbortError') {
        const timeoutError = new Error('Request timed out. Please try again.');
        setError(timeoutError.message);
        throw timeoutError;
      }
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const get = useCallback((url) => request(url, { method: 'GET' }), [request]);

  const post = useCallback(
    (url, body) =>
      request(url, {
        method: 'POST',
        body: JSON.stringify(body),
      }),
    [request],
  );

  const put = useCallback(
    (url, body) =>
      request(url, {
        method: 'PUT',
        body: JSON.stringify(body),
      }),
    [request],
  );

  const del = useCallback((url) => request(url, { method: 'DELETE' }), [request]);

  const patch = useCallback(
    (url, body) =>
      request(url, {
        method: 'PATCH',
        body: JSON.stringify(body),
      }),
    [request],
  );

  return {
    loading,
    error,
    request,
    get,
    post,
    put,
    del,
    patch,
    clearError: () => setError(null),
  };
}

export default useApi;
