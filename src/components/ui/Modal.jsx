import { useEffect } from 'react';
import { cx } from '../../lib/utils';

export function Modal({ open, onClose, children, className = '' }) {
  useEffect(() => {
    if (!open) return;
    const handleEsc = (e) => {
      if (e.key === 'Escape') onClose?.();
    };
    document.addEventListener('keydown', handleEsc);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div
        className={cx(
          'relative z-10 max-h-[90vh] w-full max-w-2xl overflow-auto rounded-3xl bg-white shadow-2xl',
          className,
        )}
      >
        {children}
      </div>
    </div>
  );
}

export function ModalHeader({ children, className = '' }) {
  return <div className={cx('border-b border-graystone-100 px-6 py-5', className)}>{children}</div>;
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
