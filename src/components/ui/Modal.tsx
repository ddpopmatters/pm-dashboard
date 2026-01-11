import { useEffect, useRef, useCallback, type ReactNode } from 'react';
import { cx } from '../../lib/utils';

let modalIdCounter = 0;

interface ModalPropsBase {
  /** Whether the modal is open */
  open: boolean;
  /** Callback when modal should close */
  onClose?: () => void;
  /** Modal content */
  children: ReactNode;
  /** Additional CSS classes for the modal dialog */
  className?: string;
}

// Require either aria-label OR aria-labelledby for accessibility
interface ModalPropsWithLabel extends ModalPropsBase {
  /** Accessible label for the modal */
  'aria-label': string;
  'aria-labelledby'?: never;
}

interface ModalPropsWithLabelledBy extends ModalPropsBase {
  'aria-label'?: never;
  /** ID of element that labels the modal */
  'aria-labelledby': string;
}

export type ModalProps = ModalPropsWithLabel | ModalPropsWithLabelledBy;

export function Modal({
  open,
  onClose,
  children,
  className = '',
  'aria-label': ariaLabel,
  'aria-labelledby': ariaLabelledBy,
}: ModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<Element | null>(null);
  const previousOverflowRef = useRef<string>('');
  const modalId = useRef(`modal-${++modalIdCounter}`);

  // Focus trap helper
  const getFocusableElements = useCallback((): HTMLElement[] => {
    if (!modalRef.current) return [];
    const elements = modalRef.current.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
    );
    const result: HTMLElement[] = [];
    elements.forEach((el) => {
      if (!el.hasAttribute('disabled') && el.offsetParent !== null) {
        result.push(el);
      }
    });
    return result;
  }, []);

  // Handle keyboard navigation
  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose?.();
        return;
      }

      // Focus trap
      if (e.key === 'Tab') {
        const focusable = getFocusableElements();
        if (focusable.length === 0) {
          e.preventDefault();
          return;
        }

        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        const activeElement = document.activeElement;

        // Check if focus is within the focusable elements
        const currentIndex = focusable.indexOf(activeElement as HTMLElement);
        const isInsideFocusableList = currentIndex !== -1;

        if (!isInsideFocusableList) {
          // Focus has escaped or is on the container - redirect to appropriate element
          e.preventDefault();
          if (e.shiftKey) {
            last.focus();
          } else {
            first.focus();
          }
        } else if (e.shiftKey && activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    // Store previous overflow value before hiding
    previousOverflowRef.current = document.body.style.overflow;
    document.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      // Restore previous overflow value
      document.body.style.overflow = previousOverflowRef.current;
    };
  }, [open, onClose, getFocusableElements]);

  // Focus management
  useEffect(() => {
    if (open) {
      previousFocusRef.current = document.activeElement;

      // Focus first focusable element or the modal itself
      window.requestAnimationFrame(() => {
        const focusable = getFocusableElements();
        if (focusable.length > 0) {
          focusable[0].focus();
        } else if (modalRef.current) {
          modalRef.current.focus();
        }
      });
    } else if (previousFocusRef.current && previousFocusRef.current instanceof HTMLElement) {
      previousFocusRef.current.focus();
      previousFocusRef.current = null;
    }
  }, [open, getFocusableElements]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />
      {/* Modal Dialog */}
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-label={ariaLabel}
        aria-labelledby={ariaLabelledBy}
        id={modalId.current}
        tabIndex={-1}
        className={cx(
          'relative z-10 max-h-[90vh] w-full max-w-2xl overflow-auto rounded-3xl bg-white shadow-2xl outline-none',
          className,
        )}
      >
        {children}
      </div>
    </div>
  );
}

export interface ModalHeaderProps {
  /** Header content */
  children: ReactNode;
  /** Additional CSS classes */
  className?: string;
  /** ID for aria-labelledby reference */
  id?: string;
}

export function ModalHeader({ children, className = '', id }: ModalHeaderProps) {
  return (
    <div id={id} className={cx('border-b border-graystone-100 px-6 py-5', className)}>
      {children}
    </div>
  );
}

export interface ModalContentProps {
  /** Content */
  children: ReactNode;
  /** Additional CSS classes */
  className?: string;
}

export function ModalContent({ children, className = '' }: ModalContentProps) {
  return <div className={cx('px-6 py-5', className)}>{children}</div>;
}

export interface ModalFooterProps {
  /** Footer content (typically buttons) */
  children: ReactNode;
  /** Additional CSS classes */
  className?: string;
}

export function ModalFooter({ children, className = '' }: ModalFooterProps) {
  return (
    <div
      className={cx('border-t border-graystone-100 px-6 py-4 flex justify-end gap-3', className)}
    >
      {children}
    </div>
  );
}

export default Modal;
