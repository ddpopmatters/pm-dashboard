import { useEffect, useRef, useCallback } from 'react';
import { cx } from '../../lib/utils';

let modalIdCounter = 0;

export function Modal({
  open,
  onClose,
  children,
  className = '',
  'aria-label': ariaLabel,
  'aria-labelledby': ariaLabelledBy,
}) {
  const modalRef = useRef(null);
  const previousFocusRef = useRef(null);
  const modalId = useRef(`modal-${++modalIdCounter}`);

  // Focus trap helper
  const getFocusableElements = useCallback(() => {
    if (!modalRef.current) return [];
    return Array.from(
      modalRef.current.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
      ),
    ).filter((el) => !el.disabled && el.offsetParent !== null);
  }, []);

  // Handle keyboard navigation
  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (e) => {
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

        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
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
    } else if (previousFocusRef.current) {
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

export function ModalHeader({ children, className = '', id }) {
  return (
    <div id={id} className={cx('border-b border-graystone-100 px-6 py-5', className)}>
      {children}
    </div>
  );
}

export function ModalContent({ children, className = '' }) {
  return <div className={cx('px-6 py-5', className)}>{children}</div>;
}

export function ModalFooter({ children, className = '' }) {
  return (
    <div
      className={cx('border-t border-graystone-100 px-6 py-4 flex justify-end gap-3', className)}
    >
      {children}
    </div>
  );
}

export default Modal;
