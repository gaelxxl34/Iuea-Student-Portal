'use client';

import { useEffect, useState } from 'react';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  duration?: number;
}

interface ToastProps {
  toast: ToastMessage;
  onClose: (id: string) => void;
}

const Toast: React.FC<ToastProps> = ({ toast, onClose }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);

  useEffect(() => {
    // Trigger animation after component mounts
    const timer = setTimeout(() => setIsVisible(true), 50);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (toast.duration && toast.duration > 0) {
      const timer = setTimeout(() => {
        handleClose();
      }, toast.duration);
      return () => clearTimeout(timer);
    }
  }, [toast.duration]);

  const handleClose = () => {
    setIsLeaving(true);
    setTimeout(() => {
      onClose(toast.id);
    }, 300); // Match the animation duration
  };

  const getToastStyles = () => {
    const baseStyles = "border-l-4 shadow-lg rounded-lg p-4 mb-3 transition-all duration-300 transform backdrop-blur-sm";
    
    switch (toast.type) {
      case 'success':
        return `${baseStyles} bg-green-50/95 border-green-500 text-green-900`;
      case 'error':
        return `${baseStyles} bg-red-50/95 border-red-500 text-red-900`;
      case 'warning':
        return `${baseStyles} bg-amber-50/95 border-amber-500 text-amber-900`;
      case 'info':
        return `${baseStyles} bg-blue-50/95 border-blue-500 text-blue-900`;
      default:
        return `${baseStyles} bg-gray-50/95 border-gray-500 text-gray-900`;
    }
  };

  const getIcon = () => {
    switch (toast.type) {
      case 'success':
        return 'ri-check-circle-line';
      case 'error':
        return 'ri-error-warning-line';
      case 'warning':
        return 'ri-alert-line';
      case 'info':
        return 'ri-information-line';
      default:
        return 'ri-notification-line';
    }
  };

  const animationClasses = isLeaving 
    ? 'opacity-0 translate-x-full' 
    : isVisible 
    ? 'opacity-100 translate-x-0' 
    : 'opacity-0 translate-x-full';

  return (
    <div className={`${getToastStyles()} ${animationClasses}`}>
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <i className={`${getIcon()} text-xl mr-3`}></i>
        </div>
        <div className="flex-1">
          <h4 className="font-semibold text-sm mb-1">{toast.title}</h4>
          <p className="text-sm opacity-90 whitespace-pre-line">{toast.message}</p>
        </div>
        <button
          onClick={handleClose}
          className="flex-shrink-0 ml-3 opacity-60 hover:opacity-100 transition-opacity"
        >
          <i className="ri-close-line text-lg"></i>
        </button>
      </div>
    </div>
  );
};

interface ToastContainerProps {
  toasts: ToastMessage[];
  onClose: (id: string) => void;
}

export const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, onClose }) => {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 w-96 max-w-[calc(100vw-2rem)] md:max-w-96">
      {toasts.map((toast) => (
        <Toast key={toast.id} toast={toast} onClose={onClose} />
      ))}
    </div>
  );
};

// Hook for managing toasts
export const useToast = () => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = (toast: Omit<ToastMessage, 'id'>) => {
    const id = Math.random().toString(36).substr(2, 9);
    const newToast: ToastMessage = {
      ...toast,
      id,
      duration: toast.duration || 5000, // Default 5 seconds
    };

    setToasts(prev => [...prev, newToast]);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  const showSuccess = (title: string, message: string, duration?: number) => {
    addToast({ type: 'success', title, message, duration });
  };

  const showError = (title: string, message: string, duration?: number) => {
    addToast({ type: 'error', title, message, duration });
  };

  const showWarning = (title: string, message: string, duration?: number) => {
    addToast({ type: 'warning', title, message, duration });
  };

  const showInfo = (title: string, message: string, duration?: number) => {
    addToast({ type: 'info', title, message, duration });
  };

  return {
    toasts,
    addToast,
    removeToast,
    showSuccess,
    showError,
    showWarning,
    showInfo,
  };
};

export default Toast;
