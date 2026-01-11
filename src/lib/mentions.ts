/**
 * Mention handling utilities for @-mentions in text fields
 */

export interface MentionState {
  /** The query text after the @ symbol */
  query: string;
  /** Start position of the mention in the text */
  start: number;
  /** End position (cursor position) */
  end: number;
  /** Filtered list of name suggestions */
  suggestions: string[];
}

/**
 * Resolves a mention candidate to a matching name from the provided list.
 * Matches by exact match, condensed match (no spaces), prefix, or partial word.
 */
export const resolveMentionCandidate = (
  candidate: string | null | undefined,
  names: readonly string[],
): string | null => {
  if (!candidate) return null;
  const trimmed = candidate.trim();
  if (!trimmed) return null;
  const lower = trimmed.toLowerCase();
  const condensed = lower.replace(/\s+/g, '');
  for (const name of names) {
    if (!name) continue;
    const clean = String(name).trim();
    if (!clean) continue;
    const lowerName = clean.toLowerCase();
    if (lowerName === lower) return clean;
    if (lowerName.replace(/\s+/g, '') === condensed) return clean;
    if (lowerName.startsWith(lower)) return clean;
    const parts = clean.split(/\s+/).map((part) => part.toLowerCase());
    if (parts.includes(lower)) return clean;
  }
  return null;
};

/**
 * Computes the current mention state based on cursor position in text.
 * Returns null if cursor is not in an @-mention context.
 */
export const computeMentionState = (
  value: string,
  cursor: number | null | undefined,
  names: readonly string[],
): MentionState | null => {
  if (!names || !names.length) return null;
  if (typeof cursor !== 'number') return null;
  const uptoCursor = value.slice(0, cursor);
  const match = uptoCursor.match(/@([^\s@]*)$/);
  if (!match) return null;
  const query = match[1];
  const start = cursor - query.length - 1;
  if (start < 0) return null;
  const lowered = query.toLowerCase();
  const suggestions = names
    .filter((name) => {
      if (!name) return false;
      const normalized = name.toLowerCase();
      if (!lowered) return true;
      return normalized.includes(lowered);
    })
    .slice(0, 6);
  if (!suggestions.length) return null;
  return { query, start, end: cursor, suggestions };
};
