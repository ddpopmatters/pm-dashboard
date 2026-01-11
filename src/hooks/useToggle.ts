/**
 * useToggle - Boolean state toggle
 *
 * A simple hook for managing boolean state with toggle functionality.
 * Useful for switches, checkboxes, show/hide states, etc.
 *
 * @example
 * const [isEnabled, toggle, setEnabled] = useToggle(false);
 *
 * // Toggle the value
 * toggle();
 *
 * // Set to specific value
 * setEnabled(true);
 */
import { useState, useCallback } from 'react';

export type UseToggleReturn = [
  /** Current boolean value */
  boolean,
  /** Toggle the value */
  () => void,
  /** Set to specific value */
  (value: boolean) => void,
];

export function useToggle(initialValue: boolean = false): UseToggleReturn {
  const [value, setValue] = useState(initialValue);

  const toggle = useCallback(() => {
    setValue((prev) => !prev);
  }, []);

  return [value, toggle, setValue];
}

/**
 * useToggleWithReset - Boolean toggle with reset to initial value
 *
 * @example
 * const [isOpen, toggle, setOpen, reset] = useToggleWithReset(false);
 *
 * toggle();    // true
 * toggle();    // false
 * setOpen(true);
 * reset();     // false (back to initial)
 */
export type UseToggleWithResetReturn = [boolean, () => void, (value: boolean) => void, () => void];

export function useToggleWithReset(initialValue: boolean = false): UseToggleWithResetReturn {
  const [value, setValue] = useState(initialValue);

  const toggle = useCallback(() => {
    setValue((prev) => !prev);
  }, []);

  const reset = useCallback(() => {
    setValue(initialValue);
  }, [initialValue]);

  return [value, toggle, setValue, reset];
}

export default useToggle;
