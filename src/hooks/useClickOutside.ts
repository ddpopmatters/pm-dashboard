/**
 * useClickOutside - Detect clicks outside a referenced element
 *
 * Calls the handler when a click occurs outside the referenced element.
 * Commonly used for closing dropdowns, modals, and menus.
 *
 * @example
 * const menuRef = useRef<HTMLDivElement>(null);
 * const [isOpen, setIsOpen] = useState(false);
 *
 * useClickOutside(menuRef, () => setIsOpen(false), isOpen);
 *
 * return (
 *   <div ref={menuRef}>
 *     {isOpen && <DropdownMenu />}
 *   </div>
 * );
 */
import { useEffect, type RefObject } from 'react';

export function useClickOutside<T extends HTMLElement>(
  ref: RefObject<T>,
  handler: (event: MouseEvent) => void,
  enabled: boolean = true,
): void {
  useEffect(() => {
    if (!enabled) return;

    const handleClick = (event: MouseEvent) => {
      if (!ref.current) return;
      if (!ref.current.contains(event.target as Node)) {
        handler(event);
      }
    };

    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [ref, handler, enabled]);
}

/**
 * useClickOutsideMultiple - Detect clicks outside multiple referenced elements
 *
 * Useful when you have a trigger button and a dropdown that are separate elements.
 *
 * @example
 * const triggerRef = useRef<HTMLButtonElement>(null);
 * const dropdownRef = useRef<HTMLDivElement>(null);
 *
 * useClickOutsideMultiple([triggerRef, dropdownRef], () => setIsOpen(false), isOpen);
 */
export function useClickOutsideMultiple<T extends HTMLElement>(
  refs: RefObject<T>[],
  handler: (event: MouseEvent) => void,
  enabled: boolean = true,
): void {
  useEffect(() => {
    if (!enabled) return;

    const handleClick = (event: MouseEvent) => {
      const target = event.target as Node;

      // Check if click is inside any of the refs
      const isInsideAny = refs.some((ref) => {
        return ref.current?.contains(target);
      });

      if (!isInsideAny) {
        handler(event);
      }
    };

    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [refs, handler, enabled]);
}

export default useClickOutside;
