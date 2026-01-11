/**
 * useLocalStorage - Persist state to localStorage
 *
 * A typed hook for storing and retrieving values from localStorage
 * with automatic JSON serialization/deserialization.
 *
 * @example
 * const [theme, setTheme, removeTheme] = useLocalStorage('theme', 'light');
 */
import { useState, useCallback } from 'react';
import { storageAvailable } from '../lib/utils';

type SetValue<T> = T | ((prevValue: T) => T);

export function useLocalStorage<T>(
  key: string,
  initialValue: T,
): [T, (value: SetValue<T>) => void, () => void] {
  const [storedValue, setStoredValue] = useState<T>(() => {
    if (!storageAvailable) return initialValue;
    try {
      const item = window.localStorage.getItem(key);
      return item ? (JSON.parse(item) as T) : initialValue;
    } catch (error) {
      console.warn(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  });

  const setValue = useCallback(
    (value: SetValue<T>) => {
      try {
        setStoredValue((prev) => {
          const valueToStore = value instanceof Function ? value(prev) : value;
          if (storageAvailable) {
            window.localStorage.setItem(key, JSON.stringify(valueToStore));
          }
          return valueToStore;
        });
      } catch (error) {
        console.warn(`Error setting localStorage key "${key}":`, error);
      }
    },
    [key],
  );

  const removeValue = useCallback(() => {
    try {
      setStoredValue(initialValue);
      if (storageAvailable) {
        window.localStorage.removeItem(key);
      }
    } catch (error) {
      console.warn(`Error removing localStorage key "${key}":`, error);
    }
  }, [key, initialValue]);

  return [storedValue, setValue, removeValue];
}

export default useLocalStorage;
