'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, AlertTriangle, Info, X } from 'lucide-react';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info';
  title: string;
  message?: string;
  duration?: number;
}

// Global dispatcher using custom events
export function showToast(toast: Omit<ToastMessage, 'id'>) {
  if (typeof window === 'undefined') return;
  const event = new CustomEvent('microsplit-toast', {
    detail: { ...toast, id: `toast_${Date.now()}_${Math.random().toString(36).substring(2, 6)}` },
  });
  window.dispatchEvent(event);
}

export default function ToastContainer() {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  useEffect(() => {
    const handleToast = (e: Event) => {
      const customEvent = e as CustomEvent<ToastMessage>;
      const newToast = customEvent.detail;
      setToasts((prev) => [...prev, newToast]);

      const duration = newToast.duration || 4500;
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== newToast.id));
      }, duration);
    };

    window.addEventListener('microsplit-toast', handleToast);
    return () => window.removeEventListener('microsplit-toast', handleToast);
  }, []);

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none">
      <AnimatePresence>
        {toasts.map((toast) => {
          const isSuccess = toast.type === 'success';
          const isError = toast.type === 'error';
          return (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="pointer-events-auto p-4 rounded-xl flex items-start gap-3 border backdrop-blur-md"
              style={{
                background: 'var(--background)',
                borderColor: isSuccess
                  ? 'var(--status-success)'
                  : isError
                  ? 'var(--status-error)'
                  : 'var(--status-info)',
                boxShadow: '0 8px 24px color-mix(in srgb, var(--primary) 8%, transparent)',
              }}
            >
              <div className="mt-0.5 flex-shrink-0">
                {isSuccess && <CheckCircle2 size={18} style={{ color: 'var(--status-success)' }} />}
                {isError && <AlertTriangle size={18} style={{ color: 'var(--status-error)' }} />}
                {!isSuccess && !isError && <Info size={18} style={{ color: 'var(--status-info)' }} />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold tracking-tight" style={{ color: 'var(--text)' }}>
                  {toast.title}
                </p>
                {toast.message && (
                  <p className="text-xs mt-0.5 leading-relaxed" style={{ color: 'var(--muted)' }}>
                    {toast.message}
                  </p>
                )}
              </div>
              <button
                onClick={() => removeToast(toast.id)}
                className="transition-colors p-1"
                style={{ color: 'var(--muted-light)' }}
                aria-label="Dismiss toast"
              >
                <X size={14} />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
