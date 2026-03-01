/**
 * Client-side terminology checker.
 * Scans text for terms from PM's "never use" list and returns matches with suggestions.
 */
import { TERMINOLOGY_MAP } from '../constants';

export interface TerminologyMatch {
  term: string;
  useInstead: string;
  index: number;
  length: number;
}

/**
 * Scans text for banned terminology and returns all matches.
 * Case-insensitive, whole-word matching.
 */
export function checkTerminology(text: string): TerminologyMatch[] {
  if (!text || !text.trim()) return [];

  const matches: TerminologyMatch[] = [];

  for (const entry of TERMINOLOGY_MAP) {
    // Escape special regex characters and match whole words (case-insensitive)
    const escaped = entry.neverUse.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`\\b${escaped}\\b`, 'gi');
    let match: RegExpExecArray | null;
    while ((match = regex.exec(text)) !== null) {
      matches.push({
        term: match[0],
        useInstead: entry.useInstead,
        index: match.index,
        length: match[0].length,
      });
    }
  }

  // Sort by position in text
  matches.sort((a, b) => a.index - b.index);
  return matches;
}

/**
 * Returns true if text contains any banned terminology.
 */
export function hasTerminologyIssues(text: string): boolean {
  return checkTerminology(text).length > 0;
}
