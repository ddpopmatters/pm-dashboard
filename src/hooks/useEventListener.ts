/**
 * useEventListener - Attach event listeners declaratively
 *
 * Handles adding and removing event listeners with proper cleanup.
 * Supports window, document, and element refs.
 *
 * @example
 * // Listen to window resize
 * useEventListener('resize', handleResize);
 *
 * // Listen to document keydown
 * useEventListener('keydown', handleKeyDown, document);
 *
 * // Listen to element click
 * const buttonRef = useRef<HTMLButtonElement>(null);
 * useEventListener('click', handleClick, buttonRef);
 */
import { useEffect, useRef, type RefObject } from 'react';

type EventTarget = Window | Document | HTMLElement | null;

// Overload for window events (default)
export function useEventListener<K extends keyof WindowEventMap>(
  eventName: K,
  handler: (event: WindowEventMap[K]) => void,
  element?: undefined,
  options?: boolean | AddEventListenerOptions,
): void;

// Overload for document events
export function useEventListener<K extends keyof DocumentEventMap>(
  eventName: K,
  handler: (event: DocumentEventMap[K]) => void,
  element: Document,
  options?: boolean | AddEventListenerOptions,
): void;

// Overload for HTML element events
export function useEventListener<K extends keyof HTMLElementEventMap>(
  eventName: K,
  handler: (event: HTMLElementEventMap[K]) => void,
  element: RefObject<HTMLElement> | HTMLElement,
  options?: boolean | AddEventListenerOptions,
): void;

// Implementation
export function useEventListener<
  KW extends keyof WindowEventMap,
  KD extends keyof DocumentEventMap,
  KH extends keyof HTMLElementEventMap,
>(
  eventName: KW | KD | KH,
  handler: (
    event: WindowEventMap[KW] | DocumentEventMap[KD] | HTMLElementEventMap[KH] | Event,
  ) => void,
  element?: EventTarget | RefObject<HTMLElement>,
  options?: boolean | AddEventListenerOptions,
): void {
  // Store handler in ref to avoid re-subscribing on handler change
  const savedHandler = useRef(handler);
  // Track the actual target element to detect ref.current changes
  const targetRef = useRef<EventTarget>(null);

  useEffect(() => {
    savedHandler.current = handler;
  }, [handler]);

  useEffect(() => {
    // Determine the target element
    let targetElement: EventTarget;

    if (element === undefined) {
      // Default to window
      targetElement = typeof window !== 'undefined' ? window : null;
    } else if (element !== null && 'current' in element) {
      // RefObject - get current value
      targetElement = element.current;
    } else {
      // Direct element reference (Window, Document, or HTMLElement)
      targetElement = element;
    }

    // Store for cleanup and change detection
    targetRef.current = targetElement;

    if (!targetElement?.addEventListener) {
      return;
    }

    const eventListener = (event: Event) => {
      savedHandler.current(event);
    };

    targetElement.addEventListener(eventName, eventListener, options);

    return () => {
      targetElement?.removeEventListener(eventName, eventListener, options);
    };
    // For RefObject, include element.current in deps to rebind when target changes
  }, [eventName, element, options, element && 'current' in element ? element.current : null]);
}

/**
 * useWindowEvent - Convenience wrapper for window events
 *
 * @example
 * useWindowEvent('scroll', handleScroll);
 * useWindowEvent('beforeunload', handleBeforeUnload);
 */
export function useWindowEvent<K extends keyof WindowEventMap>(
  eventName: K,
  handler: (event: WindowEventMap[K]) => void,
  options?: boolean | AddEventListenerOptions,
): void {
  useEventListener(eventName, handler, undefined, options);
}

/**
 * useDocumentEvent - Convenience wrapper for document events
 *
 * @example
 * useDocumentEvent('visibilitychange', handleVisibilityChange);
 * useDocumentEvent('selectionchange', handleSelectionChange);
 */
export function useDocumentEvent<K extends keyof DocumentEventMap>(
  eventName: K,
  handler: (event: DocumentEventMap[K]) => void,
  options?: boolean | AddEventListenerOptions,
): void {
  // SSR safety: pass undefined if document is not available
  const target = typeof document !== 'undefined' ? document : undefined;
  useEventListener(eventName, handler, target as Document, options);
}

export default useEventListener;
