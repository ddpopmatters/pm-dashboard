/**
 * D1-backed rate limiter for Cloudflare Workers
 * Provides persistent rate limiting across worker instances
 */

import type { D1Database } from '../types/env';

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
}

/**
 * Check if a request is allowed under the rate limit
 * Uses a sliding window approach with D1 for persistence
 *
 * @param db - D1 database instance
 * @param key - Unique identifier for the rate limit (e.g., "login:user@example.com" or "api:192.168.1.1")
 * @param limit - Maximum number of requests allowed in the window
 * @param windowMs - Time window in milliseconds
 * @returns Promise with allowed status, remaining requests, and reset timestamp
 */
export async function checkRateLimit(
  db: D1Database,
  key: string,
  limit: number,
  windowMs: number,
): Promise<RateLimitResult> {
  const now = Date.now();
  const windowStart = now - windowMs;

  try {
    // Get current rate limit entry
    const existing = await db
      .prepare('SELECT count, window_start FROM rate_limits WHERE key = ?')
      .bind(key)
      .first<{ count: number; window_start: number }>();

    if (!existing) {
      // No existing entry - create new one and allow
      await db
        .prepare('INSERT INTO rate_limits (key, count, window_start) VALUES (?, 1, ?)')
        .bind(key, now)
        .run();

      return {
        allowed: true,
        remaining: limit - 1,
        resetAt: now + windowMs,
      };
    }

    // Check if window has expired
    if (existing.window_start < windowStart) {
      // Window expired - reset counter
      await db
        .prepare('UPDATE rate_limits SET count = 1, window_start = ? WHERE key = ?')
        .bind(now, key)
        .run();

      return {
        allowed: true,
        remaining: limit - 1,
        resetAt: now + windowMs,
      };
    }

    // Window still active - check count
    if (existing.count >= limit) {
      // Rate limit exceeded
      return {
        allowed: false,
        remaining: 0,
        resetAt: existing.window_start + windowMs,
      };
    }

    // Increment counter
    await db.prepare('UPDATE rate_limits SET count = count + 1 WHERE key = ?').bind(key).run();

    return {
      allowed: true,
      remaining: limit - existing.count - 1,
      resetAt: existing.window_start + windowMs,
    };
  } catch (error) {
    // On database error, fail open (allow the request) but log
    console.error('Rate limit check failed:', error);
    return {
      allowed: true,
      remaining: limit,
      resetAt: now + windowMs,
    };
  }
}

/**
 * Reset the rate limit for a specific key (e.g., after successful authentication)
 *
 * @param db - D1 database instance
 * @param key - The rate limit key to reset
 */
export async function resetRateLimit(db: D1Database, key: string): Promise<void> {
  try {
    await db.prepare('DELETE FROM rate_limits WHERE key = ?').bind(key).run();
  } catch (error) {
    console.error('Rate limit reset failed:', error);
  }
}

/**
 * Clean up expired rate limit entries
 * Should be called periodically (e.g., via a cron trigger or occasionally in requests)
 *
 * @param db - D1 database instance
 * @param maxAgeMs - Maximum age of entries to keep (default: 1 hour)
 */
export async function cleanupExpiredRateLimits(
  db: D1Database,
  maxAgeMs: number = 60 * 60 * 1000,
): Promise<number> {
  const cutoff = Date.now() - maxAgeMs;

  try {
    const result = await db
      .prepare('DELETE FROM rate_limits WHERE window_start < ?')
      .bind(cutoff)
      .run();

    return result.meta?.changes ?? 0;
  } catch (error) {
    console.error('Rate limit cleanup failed:', error);
    return 0;
  }
}

// Probability of running cleanup on each request (1% chance)
const CLEANUP_PROBABILITY = 0.01;

/**
 * Probabilistically clean up expired entries
 * Call this from request handlers to gradually clean up old entries
 *
 * @param db - D1 database instance
 * @param maxAgeMs - Maximum age of entries to keep
 */
export async function maybeCleanupExpiredRateLimits(
  db: D1Database,
  maxAgeMs: number = 60 * 60 * 1000,
): Promise<void> {
  if (Math.random() < CLEANUP_PROBABILITY) {
    // Fire and forget - don't block the request
    cleanupExpiredRateLimits(db, maxAgeMs).catch(() => {});
  }
}
