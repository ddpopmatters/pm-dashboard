/**
 * Storage utilities for entries, ideas, and testing frameworks
 */
import { STORAGE_KEYS, storageAvailable, isOlderThanDays } from './utils';
import {
  sanitizeEntry,
  sanitizeIdea,
  sanitizeTestingFramework,
  computeStatusDetail,
} from './sanitizers';
import type { Entry, Idea, TestingFramework } from '../types/models';

const ENTRIES_STORAGE_KEY = STORAGE_KEYS.ENTRIES;
const IDEAS_STORAGE_KEY = STORAGE_KEYS.IDEAS;
const TESTING_STORAGE_KEY = STORAGE_KEYS.TESTING;

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

/**
 * Loads testing frameworks from localStorage
 */
export const loadTestingFrameworks = (): TestingFramework[] => {
  if (!storageAvailable) return [];
  try {
    const raw = window.localStorage.getItem(TESTING_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed)
      ? (
          parsed.map((item) => sanitizeTestingFramework(item)).filter(Boolean) as TestingFramework[]
        ).sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''))
      : [];
  } catch (error) {
    console.warn('Failed to load testing frameworks', error);
    return [];
  }
};

/**
 * Saves testing frameworks to localStorage
 */
export const saveTestingFrameworks = (items: TestingFramework[]): void => {
  if (!storageAvailable) return;
  try {
    window.localStorage.setItem(TESTING_STORAGE_KEY, JSON.stringify(items));
  } catch (error) {
    console.warn('Failed to persist testing frameworks', error);
  }
};
