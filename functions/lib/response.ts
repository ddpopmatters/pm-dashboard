/**
 * Shared utilities for API responses and common operations.
 */

export const jsonResponse = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json' },
  });

export const errorResponse = (error: string, status = 400) => jsonResponse({ error }, status);

export const uuid = () =>
  crypto?.randomUUID?.() ?? Math.random().toString(36).slice(2) + Date.now().toString(36);

export const nowIso = () => new Date().toISOString();

export const str = (value: unknown) => JSON.stringify(value ?? null);

export const stringifyJson = str;

export const parseJson = <T = unknown>(value: string | null | undefined): T | undefined => {
  if (!value) return undefined;
  try {
    return JSON.parse(value) as T;
  } catch {
    return undefined;
  }
};
