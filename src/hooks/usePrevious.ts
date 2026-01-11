/**
 * usePrevious - Track the previous value of a variable
 *
 * Returns the value from the previous render. Useful for comparing
 * current and previous values to detect changes.
 *
 * @example
 * const [count, setCount] = useState(0);
 * const prevCount = usePrevious(count);
 *
 * useEffect(() => {
 *   if (prevCount !== undefined && count > prevCount) {
 *     console.log('Count increased!');
 *   }
 * }, [count, prevCount]);
 */
import { useRef, useEffect } from 'react';

export function usePrevious<T>(value: T): T | undefined {
  const ref = useRef<T | undefined>(undefined);

  useEffect(() => {
    ref.current = value;
  }, [value]);

  return ref.current;
}

/**
 * usePreviousDistinct - Track the previous distinct value
 *
 * Only updates the previous value when it actually changes,
 * using a custom comparison function if provided.
 *
 * @example
 * const [user, setUser] = useState({ id: 1, name: 'John' });
 * const prevUser = usePreviousDistinct(user, (a, b) => a?.id === b?.id);
 */
export function usePreviousDistinct<T>(
  value: T,
  compare: (prev: T | undefined, next: T) => boolean = (a, b) => a === b,
): T | undefined {
  const currentRef = useRef<T | undefined>(undefined);
  const prevRef = useRef<T | undefined>(undefined);

  // Use useEffect to avoid render-phase side effects (React 18 Strict/Concurrent safe)
  useEffect(() => {
    if (!compare(currentRef.current, value)) {
      prevRef.current = currentRef.current;
      currentRef.current = value;
    }
  }, [value, compare]);

  return prevRef.current;
}

export default usePrevious;
