/**
 * Core utility functions for the PM Dashboard
 */

// Class name utility - joins truthy class names
export const cx = (...xs) => xs.filter(Boolean).join(' ');

// Date utilities
export const daysInMonth = (y, m) => new Date(y, m + 1, 0).getDate();
export const monthStartISO = (d) =>
  new Date(d.getFullYear(), d.getMonth(), 1).toISOString().slice(0, 10);
export const monthEndISO = (d) =>
  new Date(d.getFullYear(), d.getMonth() + 1, 0).toISOString().slice(0, 10);
export const isoFromParts = (year, monthIndex, day) =>
  `${year}-${String(monthIndex + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
export const isOlderThanDays = (iso, days) => Date.now() - new Date(iso).getTime() > days * 864e5;
export const monthKeyFromDate = (iso) => (iso ? iso.slice(0, 7) : '');

// UUID generator - uses crypto API for better randomness
export const uuid = () => {
  // Use crypto.randomUUID if available (modern browsers)
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback using crypto.getRandomValues
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    const bytes = new Uint8Array(16);
    crypto.getRandomValues(bytes);
    // Convert to hex string
    return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
  }
  // Last resort fallback (not cryptographically secure)
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
};

// Array utilities
export const ensureArray = (value) => (Array.isArray(value) ? value.filter(Boolean) : []);

export const ensurePeopleArray = (value) => {
  if (Array.isArray(value)) {
    return value.map((name) => (typeof name === 'string' ? name.trim() : '')).filter(Boolean);
  }
  if (typeof value === 'string' && value.trim()) {
    return [value.trim()];
  }
  return [];
};

export const ensureLinksArray = (value) => {
  if (!value) return [];
  if (Array.isArray(value)) {
    return value.map((link) => (typeof link === 'string' ? link.trim() : '')).filter(Boolean);
  }
  if (typeof value === 'string') {
    return value
      .split(/\n+/)
      .map((link) => link.trim())
      .filter(Boolean);
  }
  return [];
};

export const ensureAttachments = (value) => {
  if (!Array.isArray(value)) return [];
  return value
    .map((attachment) => {
      if (!attachment || typeof attachment !== 'object') return null;
      const name = typeof attachment.name === 'string' ? attachment.name : 'Attachment';
      const dataUrl = typeof attachment.dataUrl === 'string' ? attachment.dataUrl : '';
      const type = typeof attachment.type === 'string' ? attachment.type : '';
      const size = typeof attachment.size === 'number' ? attachment.size : 0;
      if (!dataUrl) return null;
      return {
        id: attachment.id || uuid(),
        name,
        dataUrl,
        type,
        size,
      };
    })
    .filter(Boolean);
};

// HTML escaping for email templates
export const escapeHtml = (value) => {
  if (value === null || value === undefined) return '';
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
};

// Serialization helper for comparison
export const serializeForComparison = (value) => {
  if (value === null || value === undefined) return '';
  if (typeof value === 'object') {
    try {
      return JSON.stringify(value);
    } catch {
      return String(value);
    }
  }
  return String(value);
};

// Email normalization
export const normalizeEmail = (value) => {
  if (!value) return '';
  return String(value).trim().toLowerCase();
};

// Mention extraction from text
export const extractMentions = (text) => {
  if (!text) return [];
  const matches = text.match(/@([A-Z][\w.&'-]*(?:\s+[A-Z][\w.&'-]*){0,2})/g);
  if (!matches) return [];
  return Array.from(new Set(matches.map((token) => token.trim())));
};

// Storage availability check
export const storageAvailable =
  typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';

// Storage keys
export const STORAGE_KEYS = {
  ENTRIES: 'pm-content-dashboard-v1',
  USER: 'pm-content-dashboard-user',
  NOTIFICATIONS: 'pm-content-dashboard-notifications',
  IDEAS: 'pm-content-dashboard-ideas',
  LINKEDIN: 'pm-content-dashboard-linkedin',
  TESTING: 'pm-content-dashboard-testing',
  GUIDELINES: 'pm-content-guidelines',
  AUDIT: 'pm-content-audit-log',
};
