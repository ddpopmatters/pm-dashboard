import { useEffect, useCallback } from 'react';

export interface KeyboardShortcut {
  /** Key combination (e.g., 'ctrl+n', 'cmd+shift+p') */
  keys: string;
  /** Action to perform when shortcut is triggered */
  action: () => void;
  /** Optional description for help display */
  description?: string;
  /** Whether to prevent default browser behavior */
  preventDefault?: boolean;
  /** Only trigger when not in an input/textarea */
  ignoreWhenEditing?: boolean;
}

function normalizeKey(key: string): string {
  const lower = key.toLowerCase();
  // Normalize modifier names
  if (lower === 'command' || lower === 'meta' || lower === 'cmd') return 'meta';
  if (lower === 'control' || lower === 'ctrl') return 'ctrl';
  if (lower === 'option' || lower === 'alt') return 'alt';
  return lower;
}

function parseShortcut(shortcut: string): { modifiers: Set<string>; key: string } {
  const parts = shortcut.toLowerCase().split('+').map(normalizeKey);
  const key = parts.pop() || '';
  const modifiers = new Set(parts);
  return { modifiers, key };
}

function matchesShortcut(e: KeyboardEvent, modifiers: Set<string>, key: string): boolean {
  // Check modifiers
  const eventMods = new Set<string>();
  if (e.ctrlKey) eventMods.add('ctrl');
  if (e.metaKey) eventMods.add('meta');
  if (e.altKey) eventMods.add('alt');
  if (e.shiftKey) eventMods.add('shift');

  // Compare modifier sets
  if (eventMods.size !== modifiers.size) return false;
  for (const mod of modifiers) {
    if (!eventMods.has(mod)) return false;
  }

  // Compare key (case insensitive)
  return e.key.toLowerCase() === key;
}

function isEditingElement(e: KeyboardEvent): boolean {
  const target = e.target as HTMLElement;
  const tagName = target?.tagName?.toLowerCase();
  return (
    tagName === 'input' ||
    tagName === 'textarea' ||
    tagName === 'select' ||
    target?.isContentEditable
  );
}

/**
 * Hook for registering keyboard shortcuts
 *
 * @example
 * useKeyboardShortcuts([
 *   { keys: 'cmd+n', action: () => createNew(), description: 'Create new entry' },
 *   { keys: 'ctrl+s', action: () => save(), description: 'Save changes' },
 * ]);
 */
export function useKeyboardShortcuts(shortcuts: KeyboardShortcut[]): void {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      for (const shortcut of shortcuts) {
        const { modifiers, key } = parseShortcut(shortcut.keys);

        if (!matchesShortcut(e, modifiers, key)) continue;

        // Check if we should ignore when editing
        if (shortcut.ignoreWhenEditing !== false && isEditingElement(e)) continue;

        // Execute the action
        if (shortcut.preventDefault !== false) {
          e.preventDefault();
        }
        shortcut.action();
        return;
      }
    },
    [shortcuts],
  );

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
}

/**
 * Get display string for a shortcut (platform-aware)
 */
export function formatShortcut(keys: string): string {
  const isMac = typeof navigator !== 'undefined' && navigator.platform.includes('Mac');
  const parts = keys.split('+').map(normalizeKey);

  return parts
    .map((part) => {
      switch (part) {
        case 'meta':
        case 'cmd':
          return isMac ? '⌘' : 'Ctrl';
        case 'ctrl':
          return isMac ? '⌃' : 'Ctrl';
        case 'alt':
          return isMac ? '⌥' : 'Alt';
        case 'shift':
          return isMac ? '⇧' : 'Shift';
        case 'enter':
          return '↵';
        case 'escape':
          return 'Esc';
        case 'backspace':
          return '⌫';
        case 'delete':
          return 'Del';
        case 'arrowup':
          return '↑';
        case 'arrowdown':
          return '↓';
        case 'arrowleft':
          return '←';
        case 'arrowright':
          return '→';
        default:
          return part.toUpperCase();
      }
    })
    .join(isMac ? '' : '+');
}

export default useKeyboardShortcuts;
