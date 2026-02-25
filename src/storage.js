import {
  STORAGE_KEY,
  GUIDELINES_STORAGE_KEY,
  NOTIFICATIONS_STORAGE_KEY,
  IDEAS_STORAGE_KEY,
  LINKEDIN_STORAGE_KEY,
  TESTING_STORAGE_KEY,
  AUDIT_STORAGE_KEY,
  storageAvailable,
} from "./constants.js";
import {
  uuid,
  isOlderThanDays,
  normalizeGuidelines,
  sanitizeIdea,
  sanitizeLinkedInSubmission,
  sanitizeTestingFramework,
  sanitizeEntry,
  computeStatusDetail,
  notificationKey,
} from "./utils.js";

function readStorage(key, fallback) {
  if (!storageAvailable) return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw);
  } catch (error) {
    console.warn(`Failed to read ${key}`, error);
    return fallback;
  }
}

function writeStorage(key, value) {
  if (!storageAvailable) return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.warn(`Failed to write ${key}`, error);
  }
}

export const loadGuidelines = () => {
  const raw = readStorage(GUIDELINES_STORAGE_KEY, null);
  return normalizeGuidelines(raw || undefined);
};

export const saveGuidelines = (guidelines) => {
  writeStorage(GUIDELINES_STORAGE_KEY, normalizeGuidelines(guidelines));
};

export const loadNotifications = () => {
  const parsed = readStorage(NOTIFICATIONS_STORAGE_KEY, []);
  return Array.isArray(parsed)
    ? parsed
        .map((item) => ({
          id: item.id || uuid(),
          entryId: item.entryId,
          user: item.user,
          type: item.type,
          message: item.message,
          createdAt: item.createdAt || new Date().toISOString(),
          read: Boolean(item.read),
          key:
            item.key ||
            notificationKey(item.type, item.entryId, item.user, item.meta),
          meta: item.meta && typeof item.meta === "object" ? item.meta : {},
        }))
        .filter((item) => item.entryId && item.user && item.type && item.message)
    : [];
};

export const saveNotifications = (items) => {
  writeStorage(NOTIFICATIONS_STORAGE_KEY, items);
};

export const appendAudit = (event) => {
  if (!storageAvailable) return;
  try {
    const raw = window.localStorage.getItem(AUDIT_STORAGE_KEY);
    const list = raw ? JSON.parse(raw) : [];
    const entry = {
      id: uuid(),
      ts: new Date().toISOString(),
      user: event?.user || "Unknown",
      entryId: event?.entryId || "",
      action: event?.action || "",
      meta: event?.meta || {},
    };
    list.unshift(entry);
    window.localStorage.setItem(
      AUDIT_STORAGE_KEY,
      JSON.stringify(list.slice(0, 500)),
    );
  } catch (e) {
    console.warn("Failed to append audit", e);
  }
};

export const loadIdeas = () => {
  const parsed = readStorage(IDEAS_STORAGE_KEY, []);
  return Array.isArray(parsed)
    ? parsed
        .map((item) => sanitizeIdea(item))
        .filter(Boolean)
        .sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""))
    : [];
};

export const saveIdeas = (ideas) => {
  writeStorage(IDEAS_STORAGE_KEY, ideas);
};

export const loadLinkedInSubmissions = () => {
  const parsed = readStorage(LINKEDIN_STORAGE_KEY, []);
  return Array.isArray(parsed)
    ? parsed
        .map((item) => sanitizeLinkedInSubmission(item))
        .filter(Boolean)
        .sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""))
    : [];
};

export const saveLinkedInSubmissions = (items) => {
  writeStorage(LINKEDIN_STORAGE_KEY, items);
};

export const loadTestingFrameworks = () => {
  const parsed = readStorage(TESTING_STORAGE_KEY, []);
  return Array.isArray(parsed)
    ? parsed
        .map((item) => sanitizeTestingFramework(item))
        .filter(Boolean)
        .sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""))
    : [];
};

export const saveTestingFrameworks = (items) => {
  writeStorage(TESTING_STORAGE_KEY, items);
};

export function loadEntries() {
  if (!storageAvailable) return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    const migrated = parsed
      .map((entry) => sanitizeEntry(entry))
      .filter(Boolean)
      .map((sanitized) => ({
        ...sanitized,
        statusDetail: computeStatusDetail(sanitized),
      }));
    const kept = migrated.filter(
      (entry) => !(entry.deletedAt && isOlderThanDays(entry.deletedAt, 30)),
    );
    if (kept.length !== migrated.length && storageAvailable) {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(kept));
    }
    return kept;
  } catch (error) {
    console.warn("Failed to load entries from storage", error);
    return [];
  }
}

export function saveEntries(entries) {
  writeStorage(STORAGE_KEY, entries);
}
