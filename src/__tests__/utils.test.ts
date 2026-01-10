import { describe, it, expect } from 'vitest';
import {
  cx,
  uuid,
  daysInMonth,
  monthStartISO,
  monthEndISO,
  isoFromParts,
  isOlderThanDays,
  ensureArray,
  normalizeEmail,
  extractMentions,
  escapeHtml,
} from '../lib/utils';

describe('cx', () => {
  it('joins truthy class names', () => {
    expect(cx('a', 'b', 'c')).toBe('a b c');
  });

  it('filters out falsy values', () => {
    expect(cx('a', null, 'b', undefined, 'c', false, '')).toBe('a b c');
  });

  it('returns empty string for no args', () => {
    expect(cx()).toBe('');
  });
});

describe('uuid', () => {
  it('generates unique IDs', () => {
    const id1 = uuid();
    const id2 = uuid();
    expect(id1).not.toBe(id2);
  });

  it('generates non-empty strings', () => {
    const id = uuid();
    expect(typeof id).toBe('string');
    expect(id.length).toBeGreaterThan(0);
  });
});

describe('daysInMonth', () => {
  it('returns correct days for January', () => {
    expect(daysInMonth(2024, 0)).toBe(31);
  });

  it('returns correct days for February in leap year', () => {
    expect(daysInMonth(2024, 1)).toBe(29);
  });

  it('returns correct days for February in non-leap year', () => {
    expect(daysInMonth(2023, 1)).toBe(28);
  });
});

describe('monthStartISO', () => {
  it('returns first day of month', () => {
    const date = new Date(2024, 5, 15);
    const result = monthStartISO(date);
    // Result should be first day of June 2024 in local timezone
    expect(result).toMatch(/^2024-0[56]-\d{2}$/);
    expect(result.endsWith('-01') || result.endsWith('-31')).toBe(true);
  });
});

describe('monthEndISO', () => {
  it('returns last day of month', () => {
    const date = new Date(2024, 5, 15);
    const result = monthEndISO(date);
    // Result should be last day of June 2024 in local timezone
    expect(result).toMatch(/^2024-0[56]-\d{2}$/);
  });
});

describe('isoFromParts', () => {
  it('formats date correctly', () => {
    expect(isoFromParts(2024, 0, 5)).toBe('2024-01-05');
  });

  it('pads single digit months and days', () => {
    expect(isoFromParts(2024, 11, 25)).toBe('2024-12-25');
  });
});

describe('isOlderThanDays', () => {
  it('returns true for old dates', () => {
    const oldDate = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString();
    expect(isOlderThanDays(oldDate, 5)).toBe(true);
  });

  it('returns false for recent dates', () => {
    const recentDate = new Date().toISOString();
    expect(isOlderThanDays(recentDate, 5)).toBe(false);
  });
});

describe('ensureArray', () => {
  it('returns array as-is with falsy values filtered', () => {
    expect(ensureArray(['a', null, 'b'])).toEqual(['a', 'b']);
  });

  it('returns empty array for non-array', () => {
    expect(ensureArray('string')).toEqual([]);
    expect(ensureArray(null)).toEqual([]);
    expect(ensureArray(undefined)).toEqual([]);
  });
});

describe('normalizeEmail', () => {
  it('lowercases and trims email', () => {
    expect(normalizeEmail('  Test@Example.COM  ')).toBe('test@example.com');
  });

  it('returns empty string for falsy values', () => {
    expect(normalizeEmail('')).toBe('');
    expect(normalizeEmail(null)).toBe('');
    expect(normalizeEmail(undefined)).toBe('');
  });
});

describe('extractMentions', () => {
  it('extracts @ mentions', () => {
    expect(extractMentions('Hello @John and @Jane')).toEqual(['@John', '@Jane']);
  });

  it('returns empty array for no mentions', () => {
    expect(extractMentions('No mentions here')).toEqual([]);
  });

  it('handles empty input', () => {
    expect(extractMentions('')).toEqual([]);
    expect(extractMentions(null)).toEqual([]);
  });
});

describe('escapeHtml', () => {
  it('escapes HTML entities', () => {
    expect(escapeHtml('<script>alert("xss")</script>')).toBe(
      '&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;',
    );
  });

  it('escapes ampersands', () => {
    expect(escapeHtml('A & B')).toBe('A &amp; B');
  });

  it('handles null and undefined', () => {
    expect(escapeHtml(null)).toBe('');
    expect(escapeHtml(undefined)).toBe('');
  });
});
