import React, { useState, useEffect, useCallback } from 'react';
import { cx } from '../../lib/utils';

const variants = {
  default: 'bg-white border-graystone-200 text-graystone-900',
  success: 'bg-emerald-50 border-emerald-200 text-emerald-900',
  error: 'bg-rose-50 border-rose-200 text-rose-900',
  warning: 'bg-amber-50 border-amber-200 text-amber-900',
  info: 'bg-ocean-50 border-ocean-200 text-ocean-900',
};

const icons = {
  success: (
    <svg className="w-5 h-5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  ),
  error: (
    <svg className="w-5 h-5 text-rose-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  ),
  warning: (
    <svg className="w-5 h-5 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
      />
    </svg>
  ),
  info: (
    <svg className="w-5 h-5 text-ocean-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  ),
  default: null,
};

export function Toast({ id, variant = 'default', title, message, onClose, duration = 5000 }) {
  const [isExiting, setIsExiting] = useState(false);

  const handleClose = useCallback(() => {
    setIsExiting(true);
    setTimeout(() => onClose?.(id), 200);
  }, [id, onClose]);

  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(handleClose, duration);
      return () => clearTimeout(timer);
    }
  }, [duration, handleClose]);

  return (
    <div
      role="alert"
      aria-live="polite"
      className={cx(
        'pointer-events-auto w-full max-w-sm overflow-hidden rounded-xl border shadow-lg transition-all duration-200',
        variants[variant],
        isExiting ? 'opacity-0 translate-x-4' : 'opacity-100 translate-x-0',
      )}
    >
      <div className="flex items-start gap-3 p-4">
        {icons[variant] && <div className="flex-shrink-0">{icons[variant]}</div>}
        <div className="flex-1 min-w-0">
          {title && <p className="text-sm font-semibold">{title}</p>}
          {message && <p className="text-sm mt-0.5 opacity-90">{message}</p>}
        </div>
        <button
          onClick={handleClose}
          className="flex-shrink-0 rounded-lg p-1 hover:bg-black/5 transition-colors"
          aria-label="Dismiss"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>
    </div>
  );
}

export function ToastContainer({ toasts, onClose }) {
  return (
    <div
      aria-live="polite"
      aria-label="Notifications"
      className="fixed bottom-4 right-4 z-50 flex flex-col-reverse gap-2 pointer-events-none"
    >
      {toasts.map((toast) => (
        <Toast key={toast.id} {...toast} onClose={onClose} />
      ))}
    </div>
  );
}

export default Toast;
