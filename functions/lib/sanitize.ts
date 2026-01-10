/**
 * HTML sanitization utilities to prevent XSS attacks.
 * Escapes dangerous characters in user-provided strings before database storage.
 */

const HTML_ESCAPE_MAP: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#x27;',
};

const HTML_ESCAPE_REGEX = /[&<>"']/g;

/**
 * Escapes HTML entities in a string to prevent XSS.
 * Safe for storage in database and display in HTML.
 */
export function escapeHtml(str: string): string {
  if (typeof str !== 'string') return '';
  return str.replace(HTML_ESCAPE_REGEX, (char) => HTML_ESCAPE_MAP[char] || char);
}

/**
 * Sanitizes a text field - escapes HTML entities.
 * Use for short text fields like titles, names.
 */
export function sanitizeText(value: unknown): string {
  if (value === null || value === undefined) return '';
  if (typeof value !== 'string') return '';
  return escapeHtml(value.trim());
}

/**
 * Sanitizes a multiline text field - escapes HTML but preserves newlines.
 * Use for longer text fields like captions, notes, comments.
 */
export function sanitizeMultilineText(value: unknown): string {
  if (value === null || value === undefined) return '';
  if (typeof value !== 'string') return '';
  return escapeHtml(value);
}

/**
 * Sanitizes an optional text field - returns sanitized text or the fallback.
 */
export function sanitizeOptionalText(value: unknown, fallback: string = ''): string {
  if (value === null || value === undefined) return fallback;
  if (typeof value !== 'string') return fallback;
  const sanitized = escapeHtml(value.trim());
  return sanitized || fallback;
}

/**
 * Validates and sanitizes a URL - only allows http/https protocols.
 * Returns empty string for invalid URLs.
 */
export function sanitizeUrl(value: unknown): string {
  if (typeof value !== 'string') return '';
  const trimmed = value.trim();
  if (!trimmed) return '';

  try {
    const url = new URL(trimmed);
    if (url.protocol !== 'http:' && url.protocol !== 'https:') {
      return '';
    }
    return url.href;
  } catch {
    return '';
  }
}

/**
 * Sanitizes an email address - validates format and escapes.
 */
export function sanitizeEmail(value: unknown): string {
  if (typeof value !== 'string') return '';
  const trimmed = value.trim().toLowerCase();
  // Basic email validation - allows most valid emails
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(trimmed)) return '';
  return escapeHtml(trimmed);
}

/**
 * Sanitizes an array of links - validates each URL.
 */
export function sanitizeLinks(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((link) => {
      if (typeof link === 'string') {
        return sanitizeUrl(link);
      }
      if (typeof link === 'object' && link !== null && 'url' in link) {
        return sanitizeUrl((link as { url: unknown }).url);
      }
      return '';
    })
    .filter((url) => url !== '');
}
