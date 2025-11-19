import React, { createContext, useContext, useState, useCallback } from 'react';
import { Alert, AlertGroup, AlertVariant, AlertActionCloseButton } from '@patternfly/react-core';

interface Toast {
  id: string;
  title: string;
  variant: AlertVariant;
  message?: string;
}

interface ToastContextType {
  addToast: (title: string, variant: 'success' | 'danger' | 'warning' | 'info' | 'default', message?: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((title: string, variant: 'success' | 'danger' | 'warning' | 'info' | 'default', message?: string) => {
    const id = `toast-${Date.now()}-${Math.random()}`;
    const newToast: Toast = { id, title, variant: variant as AlertVariant, message };
    
    setToasts((prev) => [...prev, newToast]);

    // Auto-remove toast after 5 seconds
    setTimeout(() => {
      setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, 5000);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      <AlertGroup isToast isLiveRegion>
        {toasts.map((toast) => (
          <Alert
            key={toast.id}
            variant={toast.variant}
            title={toast.title}
            timeout={5000}
            actionClose={
              <AlertActionCloseButton
                title={toast.title}
                variantLabel={`${toast.variant} alert`}
                onClose={() => removeToast(toast.id)}
              />
            }
          >
            {toast.message}
          </Alert>
        ))}
      </AlertGroup>
    </ToastContext.Provider>
  );
};
