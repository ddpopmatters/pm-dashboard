/**
 * useDisclosure - Modal/popover open/close state management
 *
 * Provides a clean API for managing open/close states with
 * named methods instead of generic setters.
 *
 * @example
 * const modal = useDisclosure();
 *
 * <Button onClick={modal.open}>Open Modal</Button>
 * <Modal isOpen={modal.isOpen} onClose={modal.close}>
 *   ...
 * </Modal>
 *
 * @example
 * // With initial state
 * const dropdown = useDisclosure(true);
 *
 * @example
 * // With callbacks
 * const modal = useDisclosure(false, {
 *   onOpen: () => console.log('opened'),
 *   onClose: () => console.log('closed'),
 * });
 */
import { useState, useCallback, useMemo } from 'react';

export interface UseDisclosureOptions {
  /** Callback when opened */
  onOpen?: () => void;
  /** Callback when closed */
  onClose?: () => void;
}

export interface UseDisclosureReturn {
  /** Whether the disclosure is open */
  isOpen: boolean;
  /** Open the disclosure */
  open: () => void;
  /** Close the disclosure */
  close: () => void;
  /** Toggle the disclosure */
  toggle: () => void;
  /** Set open state directly */
  setIsOpen: (isOpen: boolean) => void;
}

export function useDisclosure(
  initialState: boolean = false,
  options?: UseDisclosureOptions,
): UseDisclosureReturn {
  const [isOpen, setIsOpen] = useState(initialState);
  const { onOpen, onClose } = options ?? {};

  const open = useCallback(() => {
    setIsOpen((prev) => {
      if (!prev) {
        onOpen?.();
      }
      return true;
    });
  }, [onOpen]);

  const close = useCallback(() => {
    setIsOpen((prev) => {
      if (prev) {
        onClose?.();
      }
      return false;
    });
  }, [onClose]);

  const toggle = useCallback(() => {
    setIsOpen((prev) => {
      const next = !prev;
      if (next) {
        onOpen?.();
      } else {
        onClose?.();
      }
      return next;
    });
  }, [onOpen, onClose]);

  return useMemo(
    () => ({
      isOpen,
      open,
      close,
      toggle,
      setIsOpen,
    }),
    [isOpen, open, close, toggle],
  );
}

/**
 * useDisclosureWithData - Disclosure that can carry associated data
 *
 * Useful for modals that need to display data about a selected item.
 *
 * @example
 * const editModal = useDisclosureWithData<User>();
 *
 * // Open with data
 * editModal.open(selectedUser);
 *
 * // In modal
 * {editModal.isOpen && editModal.data && (
 *   <EditUserModal user={editModal.data} onClose={editModal.close} />
 * )}
 */
export interface UseDisclosureWithDataReturn<T> {
  isOpen: boolean;
  data: T | null;
  open: (data: T) => void;
  close: () => void;
  setData: (data: T | null) => void;
}

export function useDisclosureWithData<T>(
  options?: UseDisclosureOptions,
): UseDisclosureWithDataReturn<T> {
  const [isOpen, setIsOpen] = useState(false);
  const [data, setData] = useState<T | null>(null);
  const { onOpen, onClose } = options ?? {};

  const open = useCallback(
    (newData: T) => {
      setData(newData);
      setIsOpen(true);
      onOpen?.();
    },
    [onOpen],
  );

  const close = useCallback(() => {
    setIsOpen((prev) => {
      if (prev) {
        onClose?.();
      }
      return false;
    });
    setData(null);
  }, [onClose]);

  return useMemo(
    () => ({
      isOpen,
      data,
      open,
      close,
      setData,
    }),
    [isOpen, data, open, close],
  );
}

export default useDisclosure;
