import { describe, it, expect } from 'vitest';
import {
  escapeHtml,
  sanitizeText,
  sanitizeMultilineText,
  sanitizeOptionalText,
  sanitizeUrl,
  sanitizeEmail,
  sanitizeLinks,
} from '../lib/sanitize';

describe('escapeHtml', () => {
  it('escapes < and >', () => {
    expect(escapeHtml('<script>')).toBe('&lt;script&gt;');
  });

  it('escapes quotes', () => {
    expect(escapeHtml('"test" \'value\'')).toBe('&quot;test&quot; &#x27;value&#x27;');
  });

  it('escapes ampersands', () => {
    expect(escapeHtml('A & B')).toBe('A &amp; B');
  });

  it('handles non-string input', () => {
    expect(escapeHtml(123 as unknown as string)).toBe('');
    expect(escapeHtml(null as unknown as string)).toBe('');
  });
});

describe('sanitizeText', () => {
  it('trims and escapes text', () => {
    expect(sanitizeText('  <test>  ')).toBe('&lt;test&gt;');
  });

  it('handles null and undefined', () => {
    expect(sanitizeText(null)).toBe('');
    expect(sanitizeText(undefined)).toBe('');
  });
});

describe('sanitizeMultilineText', () => {
  it('preserves newlines while escaping HTML', () => {
    expect(sanitizeMultilineText('Line 1\nLine <2>')).toBe('Line 1\nLine &lt;2&gt;');
  });
});

describe('sanitizeOptionalText', () => {
  it('returns fallback for empty values', () => {
    expect(sanitizeOptionalText('', 'default')).toBe('default');
    expect(sanitizeOptionalText(null, 'default')).toBe('default');
  });

  it('sanitizes non-empty values', () => {
    expect(sanitizeOptionalText('<test>', 'default')).toBe('&lt;test&gt;');
  });
});

describe('sanitizeUrl', () => {
  it('accepts valid http URLs', () => {
    expect(sanitizeUrl('http://example.com')).toBe('http://example.com/');
  });

  it('accepts valid https URLs', () => {
    expect(sanitizeUrl('https://example.com/path?q=1')).toBe('https://example.com/path?q=1');
  });

  it('rejects javascript: URLs', () => {
    expect(sanitizeUrl('javascript:alert(1)')).toBe('');
  });

  it('rejects data: URLs', () => {
    expect(sanitizeUrl('data:text/html,<script>alert(1)</script>')).toBe('');
  });

  it('handles invalid URLs', () => {
    expect(sanitizeUrl('not a url')).toBe('');
  });

  it('handles non-string input', () => {
    expect(sanitizeUrl(123)).toBe('');
  });
});

describe('sanitizeEmail', () => {
  it('validates and normalizes email', () => {
    expect(sanitizeEmail('TEST@Example.COM')).toBe('test@example.com');
  });

  it('rejects invalid emails', () => {
    expect(sanitizeEmail('not-an-email')).toBe('');
    expect(sanitizeEmail('@nodomain')).toBe('');
  });

  it('rejects emails with invalid characters', () => {
    // Emails with spaces or other invalid characters should be rejected
    expect(sanitizeEmail('test @test.com')).toBe('');
    expect(sanitizeEmail('test\n@test.com')).toBe('');
  });
});

describe('sanitizeLinks', () => {
  it('sanitizes array of URL strings', () => {
    expect(sanitizeLinks(['https://example.com', 'https://test.com'])).toEqual([
      'https://example.com/',
      'https://test.com/',
    ]);
  });

  it('filters out invalid URLs', () => {
    expect(sanitizeLinks(['https://valid.com', 'javascript:alert(1)', 'invalid'])).toEqual([
      'https://valid.com/',
    ]);
  });

  it('handles objects with url property', () => {
    expect(sanitizeLinks([{ url: 'https://example.com' }])).toEqual(['https://example.com/']);
  });

  it('returns empty array for non-array input', () => {
    expect(sanitizeLinks('string')).toEqual([]);
    expect(sanitizeLinks(null)).toEqual([]);
  });
});
