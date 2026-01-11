import React, { useState, useEffect, useCallback, useRef, type ReactNode } from 'react';
import { cx } from '../../lib/utils';

export type ToastVariant = 'default' | 'success' | 'error' | 'warning' | 'info';

export interface ToastData {
  /** Unique identifier for the toast */
  id: string;
  /** Visual style variant */
  variant?: ToastVariant;
  /** Toast title */
  title?: string;
  /** Toast message */
  message?: string;
  /** Auto-dismiss duration in ms (0 to disable) */
  duration?: number;
}

export interface ToastProps extends ToastData {
  /** Callback when toast is dismissed */
  onClose?: (id: string) => void;
}

/** Internal props type that includes React's key for list rendering */
type ToastListItemProps = ToastProps & { key?: React.Key };

export interface ToastContainerProps {
  /** Array of toast data to display */
  toasts: ToastData[];
  /** Callback when a toast is dismissed */
  onClose?: (id: string) => void;
}

const variants: Record<ToastVariant, string> = {
  default: 'bg-white border-graystone-200 text-graystone-900',
  success: 'bg-emerald-50 border-emerald-200 text-emerald-900',
  error: 'bg-rose-50 border-rose-200 text-rose-900',
  warning: 'bg-amber-50 border-amber-200 text-amber-900',
  info: 'bg-ocean-50 border-ocean-200 text-ocean-900',
};

const icons: Record<ToastVariant, ReactNode> = {
  success: (
    <svg className="h-5 w-5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  ),
  error: (
    <svg className="h-5 w-5 text-rose-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  ),
  warning: (
    <svg className="h-5 w-5 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
      />
    </svg>
  ),
  info: (
    <svg className="h-5 w-5 text-ocean-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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

export function Toast({
  id,
  variant = 'default',
  title,
  message,
  onClose,
  duration = 5000,
}: ToastProps): React.ReactElement {
  const [isExiting, setIsExiting] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleClose = useCallback(() => {
    if (isExiting) return; // Guard against double close
    setIsExiting(true);
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    setTimeout(() => onClose?.(id), 200);
  }, [id, onClose, isExiting]);

  useEffect(() => {
    if (duration > 0 && !isExiting) {
      timerRef.current = setTimeout(handleClose, duration);
      return () => {
        if (timerRef.current) {
          clearTimeout(timerRef.current);
          timerRef.current = null;
        }
      };
    }
  }, [duration, handleClose, isExiting]);

  return (
    <div
      role="alert"
      className={cx(
        'pointer-events-auto w-full max-w-sm overflow-hidden rounded-xl border shadow-lg transition-all duration-200',
        variants[variant],
        isExiting ? 'translate-x-4 opacity-0' : 'translate-x-0 opacity-100',
      )}
    >
      <div className="flex items-start gap-3 p-4">
        {icons[variant] && <div className="flex-shrink-0">{icons[variant]}</div>}
        <div className="min-w-0 flex-1">
          {title && <p className="text-sm font-semibold">{title}</p>}
          {message && <p className="mt-0.5 text-sm opacity-90">{message}</p>}
        </div>
        <button
          type="button"
          onClick={handleClose}
          className="flex-shrink-0 rounded-lg p-1 transition-colors hover:bg-black/5"
          aria-label="Dismiss"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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

export function ToastContainer({ toasts, onClose }: ToastContainerProps): React.ReactElement {
  return (
    <div
      aria-live="polite"
      aria-label="Notifications"
      className="pointer-events-none fixed bottom-4 right-4 z-50 flex flex-col-reverse gap-2"
    >
      {toasts.map((toast) => {
        const toastProps: ToastListItemProps = {
          key: toast.id,
          id: toast.id,
          variant: toast.variant,
          title: toast.title,
          message: toast.message,
          duration: toast.duration,
          onClose,
        };
        return <Toast {...toastProps} />;
      })}
    </div>
  );
}

export default Toast;
