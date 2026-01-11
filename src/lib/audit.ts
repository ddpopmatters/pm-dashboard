/**
 * Audit trail utilities for tracking user actions
 */
import { STORAGE_KEYS, uuid, storageAvailable } from './utils';
import type { AuditEntry } from '../types/models';

const AUDIT_STORAGE_KEY = STORAGE_KEYS.AUDIT;

// Type for api object with logAudit
interface AuditApi {
  enabled?: boolean;
  logAudit?: (entry: AuditEntry) => Promise<void>;
}

export interface AuditEvent {
  user?: string;
  entryId?: string;
  action?: string;
  meta?: Record<string, unknown>;
}

/**
 * Appends an audit entry to local storage and optionally syncs to server
 * Keeps a ring buffer of the most recent 500 entries
 */
export const appendAudit = (event: AuditEvent): void => {
  if (!storageAvailable) return;
  try {
    const raw = window.localStorage.getItem(AUDIT_STORAGE_KEY);
    const list: AuditEntry[] = raw ? JSON.parse(raw) : [];
    const entry: AuditEntry = {
      id: uuid(),
      ts: new Date().toISOString(),
      user: event?.user || 'Unknown',
      entryId: event?.entryId || '',
      action: event?.action || '',
      meta: event?.meta || {},
    };
    list.unshift(entry);
    window.localStorage.setItem(AUDIT_STORAGE_KEY, JSON.stringify(list.slice(0, 500)));
    const api = (window as { api?: AuditApi }).api;
    if (api && api.enabled && api.logAudit) {
      try {
        api.logAudit(entry).catch(() => {});
      } catch {
        // Ignore API errors
      }
    }
  } catch (e) {
    console.warn('Failed to append audit', e);
  }
};
