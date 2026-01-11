/**
 * Notification storage and key utilities
 */
import { STORAGE_KEYS, uuid, storageAvailable } from './utils';
import type { Notification } from '../types/models';

const NOTIFICATIONS_STORAGE_KEY = STORAGE_KEYS.NOTIFICATIONS;

/**
 * Generates a unique key for a notification to prevent duplicates
 */
export const notificationKey = (
  type: string,
  entryId: string | null | undefined,
  user: string | null | undefined,
  meta: Record<string, unknown> | null | undefined = {},
): string => {
  const metaObj = meta && typeof meta === 'object' ? meta : {};
  const commentId = typeof metaObj.commentId === 'string' ? metaObj.commentId : '';
  return [type, entryId || 'none', user || '', commentId].join(':');
};

/**
 * Loads notifications from localStorage
 */
export const loadNotifications = (): Notification[] => {
  if (!storageAvailable) return [];
  try {
    const raw = window.localStorage.getItem(NOTIFICATIONS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed)
      ? parsed
          .map((item: Record<string, unknown>) => ({
            id: typeof item.id === 'string' ? item.id : uuid(),
            entryId: String(item.entryId || ''),
            user: String(item.user || ''),
            type: String(item.type || ''),
            message: String(item.message || ''),
            createdAt:
              typeof item.createdAt === 'string' ? item.createdAt : new Date().toISOString(),
            read: Boolean(item.read),
            key:
              typeof item.key === 'string'
                ? item.key
                : notificationKey(
                    String(item.type || ''),
                    String(item.entryId || ''),
                    String(item.user || ''),
                    item.meta as Record<string, unknown> | null | undefined,
                  ),
            meta:
              item.meta && typeof item.meta === 'object'
                ? (item.meta as Record<string, unknown>)
                : {},
          }))
          .filter((item: Notification) => item.entryId && item.user && item.type && item.message)
      : [];
  } catch (error) {
    console.warn('Failed to load notifications', error);
    return [];
  }
};

/**
 * Saves notifications to localStorage
 */
export const saveNotifications = (items: Notification[]): void => {
  if (!storageAvailable) return;
  try {
    window.localStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(items));
  } catch (error) {
    console.warn('Failed to persist notifications', error);
  }
};
