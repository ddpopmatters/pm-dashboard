import React, { createContext, useContext, useState, useCallback } from 'react';
import { ToastContainer } from '../components/ui/Toast';

const ToastContext = createContext(null);

let toastId = 0;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback((options) => {
    const id = ++toastId;
    const toast =
      typeof options === 'string'
        ? { id, message: options, variant: 'default' }
        : { id, ...options };

    setToasts((prev) => [...prev, toast]);
    return id;
  }, []);

  const toast = useCallback(
    (message, options = {}) => {
      return addToast({ message, ...options });
    },
    [addToast],
  );

  toast.success = (message, options = {}) => addToast({ message, variant: 'success', ...options });
  toast.error = (message, options = {}) => addToast({ message, variant: 'error', ...options });
  toast.warning = (message, options = {}) => addToast({ message, variant: 'warning', ...options });
  toast.info = (message, options = {}) => addToast({ message, variant: 'info', ...options });

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <ToastContainer toasts={toasts} onClose={removeToast} />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

export default ToastContext;
