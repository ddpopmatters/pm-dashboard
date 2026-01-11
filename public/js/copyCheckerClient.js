// Copy checker client - DISABLED for static hosting
// This feature requires a serverless backend (Supabase Edge Function)

/**
 * Run the copy checker - currently disabled for static hosting.
 * Returns a disabled status so the UI can handle it gracefully.
 */
export async function runCopyCheck(params) {
  console.warn('[Copy Checker] Feature disabled - requires serverless backend');
  return {
    disabled: true,
    message: 'Copy checker is not available in static hosting mode',
    // Return empty results so the UI doesn't break
    issues: [],
    score: null,
    suggestions: [],
  };
}

// Expose globally for non-module scripts
try {
  if (typeof window !== 'undefined') {
    window.copyChecker = Object.freeze({
      ...(window.copyChecker || {}),
      runCopyCheck,
      disabled: true,
    });
  }
} catch {
  /* noop */
}
