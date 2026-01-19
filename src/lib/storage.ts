/**
 * Storage utilities for entries and ideas
 */
import { STORAGE_KEYS, storageAvailable, isOlderThanDays } from './utils';
import { sanitizeEntry, sanitizeIdea, computeStatusDetail } from './sanitizers';
import type { Entry, Idea, Influencer, InfluencerStatus } from '../types/models';

const ENTRIES_STORAGE_KEY = STORAGE_KEYS.ENTRIES;
const IDEAS_STORAGE_KEY = STORAGE_KEYS.IDEAS;
const INFLUENCERS_STORAGE_KEY = STORAGE_KEYS.INFLUENCERS;

const VALID_INFLUENCER_STATUSES: InfluencerStatus[] = [
  'Discovery',
  'Outreach',
  'Negotiating',
  'Active',
  'Completed',
];

/**
 * Sanitizes an influencer record from storage
 */
const sanitizeInfluencer = (raw: unknown): Influencer | null => {
  if (!raw || typeof raw !== 'object') return null;
  const obj = raw as Record<string, unknown>;
  if (typeof obj.id !== 'string' || !obj.id) return null;
  if (typeof obj.name !== 'string' || !obj.name) return null;

  const status = VALID_INFLUENCER_STATUSES.includes(obj.status as InfluencerStatus)
    ? (obj.status as InfluencerStatus)
    : 'Discovery';

  return {
    id: obj.id,
    createdAt: typeof obj.createdAt === 'string' ? obj.createdAt : new Date().toISOString(),
    createdBy: typeof obj.createdBy === 'string' ? obj.createdBy : '',
    name: obj.name,
    handle: typeof obj.handle === 'string' ? obj.handle : '',
    profileUrl: typeof obj.profileUrl === 'string' ? obj.profileUrl : '',
    platform: typeof obj.platform === 'string' ? obj.platform : '',
    followerCount: typeof obj.followerCount === 'number' ? obj.followerCount : 0,
    engagementRate: typeof obj.engagementRate === 'number' ? obj.engagementRate : undefined,
    contactEmail: typeof obj.contactEmail === 'string' ? obj.contactEmail : '',
    niche: typeof obj.niche === 'string' ? obj.niche : '',
    estimatedRate: typeof obj.estimatedRate === 'number' ? obj.estimatedRate : undefined,
    notes: typeof obj.notes === 'string' ? obj.notes : '',
    status,
  };
};

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
 * Loads influencers from localStorage
 */
export const loadInfluencers = (): Influencer[] => {
  if (!storageAvailable) return [];
  try {
    const raw = window.localStorage.getItem(INFLUENCERS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed)
      ? (parsed.map((item) => sanitizeInfluencer(item)).filter(Boolean) as Influencer[]).sort(
          (a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''),
        )
      : [];
  } catch (error) {
    console.warn('Failed to load influencers', error);
    return [];
  }
};

/**
 * Saves influencers to localStorage
 */
export const saveInfluencers = (influencers: Influencer[]): void => {
  if (!storageAvailable) return;
  try {
    window.localStorage.setItem(INFLUENCERS_STORAGE_KEY, JSON.stringify(influencers));
  } catch (error) {
    console.warn('Failed to persist influencers', error);
  }
};

// Custom niches storage
const CUSTOM_NICHES_STORAGE_KEY = STORAGE_KEYS.CUSTOM_NICHES;

/**
 * Loads custom niches from localStorage
 */
export const loadCustomNiches = (): string[] => {
  if (!storageAvailable) return [];
  try {
    const raw = window.localStorage.getItem(CUSTOM_NICHES_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((n) => typeof n === 'string') : [];
  } catch (error) {
    console.warn('Failed to load custom niches', error);
    return [];
  }
};

/**
 * Saves custom niches to localStorage
 */
export const saveCustomNiches = (niches: string[]): void => {
  if (!storageAvailable) return;
  try {
    window.localStorage.setItem(CUSTOM_NICHES_STORAGE_KEY, JSON.stringify(niches));
  } catch (error) {
    console.warn('Failed to persist custom niches', error);
  }
};
