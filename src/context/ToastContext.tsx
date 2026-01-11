/**
 * ToastContext - Toast notification management
 *
 * Provides a simple API for showing toast notifications with
 * convenience methods for different variants (success, error, warning, info).
 */
import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import { ToastContainer } from '../components/ui/Toast';

// ============================================================================
// Types
// ============================================================================

export type ToastVariant = 'default' | 'success' | 'error' | 'warning' | 'info';

export interface ToastOptions {
  message: string;
  variant?: ToastVariant;
  title?: string;
  duration?: number;
}

export interface Toast extends ToastOptions {
  id: number;
}

export interface ToastFunction {
  (message: string, options?: Omit<ToastOptions, 'message'>): number;
  success: (message: string, options?: Omit<ToastOptions, 'message' | 'variant'>) => number;
  error: (message: string, options?: Omit<ToastOptions, 'message' | 'variant'>) => number;
  warning: (message: string, options?: Omit<ToastOptions, 'message' | 'variant'>) => number;
  info: (message: string, options?: Omit<ToastOptions, 'message' | 'variant'>) => number;
}

// ============================================================================
// Context
// ============================================================================

const ToastContext = createContext<ToastFunction | null>(null);

// ============================================================================
// Provider
// ============================================================================

let toastId = 0;

export interface ToastProviderProps {
  children: ReactNode;
}

export function ToastProvider({ children }: ToastProviderProps) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback((options: string | ToastOptions): number => {
    const id = ++toastId;
    const toast: Toast =
      typeof options === 'string'
        ? { id, message: options, variant: 'default' }
        : { id, variant: 'default', ...options };

    setToasts((prev) => [...prev, toast]);
    return id;
  }, []);

  const toast = useCallback(
    (message: string, options: Omit<ToastOptions, 'message'> = {}): number => {
      return addToast({ message, ...options });
    },
    [addToast],
  ) as ToastFunction;

  // Add convenience methods
  toast.success = (message: string, options = {}) =>
    addToast({ message, variant: 'success', ...options });
  toast.error = (message: string, options = {}) =>
    addToast({ message, variant: 'error', ...options });
  toast.warning = (message: string, options = {}) =>
    addToast({ message, variant: 'warning', ...options });
  toast.info = (message: string, options = {}) =>
    addToast({ message, variant: 'info', ...options });

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <ToastContainer toasts={toasts} onClose={removeToast} />
    </ToastContext.Provider>
  );
}

// ============================================================================
// Hook
// ============================================================================

export function useToast(): ToastFunction {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

export default ToastContext;
