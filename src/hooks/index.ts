// Hooks barrel export

// Storage
export { useLocalStorage } from './useLocalStorage';

// API & Async
export { useApi } from './useApi';
export {
  useAsyncCallback,
  useAsyncCallbackWithRetry,
  type AsyncState,
  type AsyncCallback,
  type UseAsyncCallbackReturn,
  type RetryOptions,
  type AsyncStateWithRetry,
} from './useAsyncCallback';

// Timing & Debounce
export { useDebounce, useDebouncedCallback } from './useDebounce';
export { useInterval, useIntervalWhen, type UseIntervalOptions } from './useInterval';
export { useTimeout, useTimeoutFn, useTimeoutWhen, type UseTimeoutFnReturn } from './useTimeout';

// DOM Interaction
export { useClickOutside, useClickOutsideMultiple } from './useClickOutside';
export { useEventListener, useWindowEvent, useDocumentEvent } from './useEventListener';

// Keyboard
export {
  useKeyPress,
  useHotkey,
  useEscapeKey,
  type KeyPressModifiers,
  type UseKeyPressOptions,
} from './useKeyPress';

// State Utilities
export { useToggle, useToggleWithReset } from './useToggle';
export {
  useDisclosure,
  useDisclosureWithData,
  type UseDisclosureOptions,
  type UseDisclosureReturn,
  type UseDisclosureWithDataReturn,
} from './useDisclosure';
export { usePrevious, usePreviousDistinct } from './usePrevious';

// Lifecycle
export { useOnMount, useOnUnmount, useIsMounted } from './useOnMount';

// Responsive
export {
  useWindowSize,
  useMediaQuery,
  useBreakpoint,
  breakpoints,
  type WindowSize,
  type UseWindowSizeOptions,
} from './useWindowSize';
