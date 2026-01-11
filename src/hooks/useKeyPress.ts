/**
 * useKeyPress - Detect keyboard key presses
 *
 * Provides keyboard shortcut detection with modifier key support.
 *
 * @example
 * // Simple key detection
 * const isEscapePressed = useKeyPress('Escape');
 *
 * @example
 * // With callback
 * useKeyPress('Escape', () => closeModal());
 *
 * @example
 * // With modifiers
 * useKeyPress('s', () => save(), { ctrl: true });
 * useKeyPress('k', () => openSearch(), { meta: true });
 */
import { useEffect, useCallback, useRef, useState } from 'react';

export interface KeyPressModifiers {
  /** Require Ctrl key (Windows/Linux) or Command key (Mac) */
  ctrl?: boolean;
  /** Require Shift key */
  shift?: boolean;
  /** Require Alt key (Windows/Linux) or Option key (Mac) */
  alt?: boolean;
  /** Require Meta key (Command on Mac, Windows key on Windows) */
  meta?: boolean;
  /** Use ctrlOrMeta to match Ctrl on Windows/Linux OR Meta on Mac */
  ctrlOrMeta?: boolean;
}

export interface UseKeyPressOptions extends KeyPressModifiers {
  /** Event type: 'keydown' (default) or 'keyup' */
  event?: 'keydown' | 'keyup';
  /** Prevent default browser behavior */
  preventDefault?: boolean;
  /** Target element (default: document) */
  target?: EventTarget | null;
  /** Only trigger when these elements are NOT focused */
  ignoreWhenFocused?: ('input' | 'textarea' | 'select' | '[contenteditable]')[];
  /** Disable the key press handler */
  enabled?: boolean;
}

function matchesModifiers(event: KeyboardEvent, modifiers: KeyPressModifiers): boolean {
  const { ctrl, shift, alt, meta, ctrlOrMeta } = modifiers;

  // Handle ctrlOrMeta - matches Ctrl on Windows/Linux or Meta on Mac
  if (ctrlOrMeta) {
    // SSR safety: check navigator exists and has platform
    const isMac =
      typeof navigator !== 'undefined' && navigator.platform
        ? navigator.platform.toUpperCase().indexOf('MAC') >= 0
        : false;
    const modifierPressed = isMac ? event.metaKey : event.ctrlKey;
    if (!modifierPressed) return false;
  } else {
    // Check individual modifiers
    if (ctrl !== undefined && event.ctrlKey !== ctrl) return false;
    if (meta !== undefined && event.metaKey !== meta) return false;
  }

  if (shift !== undefined && event.shiftKey !== shift) return false;
  if (alt !== undefined && event.altKey !== alt) return false;

  return true;
}

function isInputFocused(ignoreList: string[]): boolean {
  const activeElement = document.activeElement;
  if (!activeElement) return false;

  const tagName = activeElement.tagName.toLowerCase();

  for (const selector of ignoreList) {
    if (selector.startsWith('[')) {
      // Attribute selector
      if (activeElement.matches(selector)) return true;
    } else {
      // Tag name
      if (tagName === selector) return true;
    }
  }

  return false;
}

/**
 * useKeyPress - Hook for detecting key presses
 *
 * @param targetKey - The key to detect (e.g., 'Escape', 'Enter', 'a', 'ArrowDown')
 * @param callback - Optional callback to run when key is pressed
 * @param options - Configuration options
 * @returns Whether the key is currently pressed (for 'keydown' events)
 */
export function useKeyPress(
  targetKey: string,
  callback?: () => void,
  options: UseKeyPressOptions = {},
): boolean {
  const {
    event = 'keydown',
    preventDefault = false,
    target,
    ignoreWhenFocused = ['input', 'textarea', 'select', '[contenteditable]'],
    enabled = true,
    ...modifiers
  } = options;

  const callbackRef = useRef(callback);
  callbackRef.current = callback;

  // Use useState for pressed state so changes trigger re-renders
  const [pressed, setPressed] = useState(false);

  const handler = useCallback(
    (e: Event) => {
      const keyEvent = e as KeyboardEvent;

      // Check if the key matches
      if (keyEvent.key !== targetKey) return;

      // Check modifier keys
      if (!matchesModifiers(keyEvent, modifiers)) return;

      // Check if input is focused
      if (ignoreWhenFocused.length > 0 && isInputFocused(ignoreWhenFocused)) {
        return;
      }

      if (preventDefault) {
        keyEvent.preventDefault();
      }

      if (event === 'keydown') {
        setPressed(true);
      } else {
        setPressed(false);
      }

      callbackRef.current?.();
    },
    [targetKey, event, preventDefault, ignoreWhenFocused, modifiers],
  );

  useEffect(() => {
    if (!enabled) return;

    const targetElement = target ?? (typeof document !== 'undefined' ? document : null);
    if (!targetElement) return;

    targetElement.addEventListener(event, handler);

    // For keydown, also listen to keyup to reset pressed state
    const keyUpHandler = (e: Event) => {
      if ((e as KeyboardEvent).key === targetKey) {
        setPressed(false);
      }
    };

    if (event === 'keydown') {
      targetElement.addEventListener('keyup', keyUpHandler);
    }

    return () => {
      targetElement.removeEventListener(event, handler);
      if (event === 'keydown') {
        targetElement.removeEventListener('keyup', keyUpHandler);
      }
    };
  }, [enabled, event, handler, target, targetKey]);

  return pressed;
}

/**
 * useHotkey - Semantic alias for keyboard shortcuts
 *
 * @example
 * useHotkey('s', handleSave, { ctrlOrMeta: true });
 * useHotkey('Escape', closeModal);
 * useHotkey('/', openSearch, { ctrlOrMeta: true });
 */
export function useHotkey(
  key: string,
  callback: () => void,
  options: UseKeyPressOptions = {},
): void {
  useKeyPress(key, callback, options);
}

/**
 * useEscapeKey - Close handler for Escape key
 *
 * @example
 * useEscapeKey(() => setIsOpen(false));
 */
export function useEscapeKey(
  callback: () => void,
  options: Omit<UseKeyPressOptions, 'ignoreWhenFocused'> = {},
): void {
  // Escape should work even when inputs are focused
  useKeyPress('Escape', callback, { ...options, ignoreWhenFocused: [] });
}

export default useKeyPress;
