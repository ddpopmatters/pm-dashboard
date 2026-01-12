/**
 * Storage utilities for entries and ideas
 */
import { STORAGE_KEYS, storageAvailable, isOlderThanDays } from './utils';
import { sanitizeEntry, sanitizeIdea, computeStatusDetail } from './sanitizers';
import type { Entry, Idea } from '../types/models';

const ENTRIES_STORAGE_KEY = STORAGE_KEYS.ENTRIES;
const IDEAS_STORAGE_KEY = STORAGE_KEYS.IDEAS;

/**
 * Loads entries from localStorage, sanitizes them, and cleans up old deleted entries
 */
export const loadEntries = (): Entry[] => {
  if (!storageAvailable) return [];
  try {
    const raw = window.localStorage.getItem(ENTRIES_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    const migrated = parsed
      .map((entry) => sanitizeEntry(entry))
      .filter((entry): entry is Entry => entry !== null)
      .map((sanitized) => ({
        ...sanitized,
        // Preserve existing statusDetail if set, only compute if missing
        statusDetail: sanitized.statusDetail || computeStatusDetail(sanitized),
      }));
    const kept = migrated.filter(
      (entry) => !(entry.deletedAt && isOlderThanDays(entry.deletedAt, 30)),
    );
    if (kept.length !== migrated.length && storageAvailable) {
      window.localStorage.setItem(ENTRIES_STORAGE_KEY, JSON.stringify(kept));
    }
    return kept;
  } catch (error) {
    console.warn('Failed to load entries from storage', error);
    return [];
  }
};

/**
 * Saves entries to localStorage
 */
export const saveEntries = (entries: Entry[]): void => {
  if (!storageAvailable) return;
  try {
    window.localStorage.setItem(ENTRIES_STORAGE_KEY, JSON.stringify(entries));
  } catch (error) {
    console.warn('Failed to persist entries', error);
  }
};

/**
 * Loads ideas from localStorage
 */
export const loadIdeas = (): Idea[] => {
  if (!storageAvailable) return [];
  try {
    const raw = window.localStorage.getItem(IDEAS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed)
      ? (parsed.map((item) => sanitizeIdea(item)).filter(Boolean) as Idea[]).sort((a, b) =>
          (b.createdAt || '').localeCompare(a.createdAt || ''),
        )
      : [];
  } catch (error) {
    console.warn('Failed to load ideas', error);
    return [];
  }
};

/**
 * Saves ideas to localStorage
 */
export const saveIdeas = (ideas: Idea[]): void => {
  if (!storageAvailable) return;
  try {
    window.localStorage.setItem(IDEAS_STORAGE_KEY, JSON.stringify(ideas));
  } catch (error) {
    console.warn('Failed to persist ideas', error);
  }
};
