'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';
import { cn } from '@/src/lib/utils';
import { CheckCircle2, AlertTriangle, Info, X } from 'lucide-react';
import { IconButton } from './icon-button';

export interface ToastItem {
  id: string;
  title: string;
  description?: string;
  type?: 'success' | 'error' | 'info';
  duration?: number;
}

interface ToastContextValue {
  showToast: (toast: Omit<ToastItem, 'id'>) => void;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    ({ title, description, type = 'info', duration = 4000 }: Omit<ToastItem, 'id'>) => {
      const id = Math.random().toString(36).substring(2, 9);
      const newToast: ToastItem = { id, title, description, type, duration };

      setToasts((prev) => [...prev, newToast]);

      if (duration > 0) {
        setTimeout(() => {
          removeToast(id);
        }, duration);
      }
    },
    [removeToast]
  );

  return (
    <ToastContext.Provider value={{ showToast, removeToast }}>
      {children}
      <div
        role="region"
        aria-label="Notifications"
        className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none p-2"
      >
        {toasts.map((toast) => {
          return (
            <div
              key={toast.id}
              role="alert"
              className={cn(
                'pointer-events-auto flex items-start gap-3 p-3.5 rounded-[8px] bg-[var(--surface)] border text-left transition-all duration-200 animate-in slide-in-from-bottom-2',
                toast.type === 'success' && 'border-[var(--status-verified)]/30',
                toast.type === 'error' && 'border-[var(--crimson)]/40',
                toast.type === 'info' && 'border-[var(--line)]'
              )}
            >
              <div className="shrink-0 mt-0.5">
                {toast.type === 'success' && (
                  <CheckCircle2 className="w-4 h-4 text-[var(--status-verified)]" />
                )}
                {toast.type === 'error' && (
                  <AlertTriangle className="w-4 h-4 text-[var(--crimson)]" />
                )}
                {toast.type === 'info' && (
                  <Info className="w-4 h-4 text-[var(--muted)]" />
                )}
              </div>

              <div className="flex-1">
                <p className="text-[13px] font-semibold text-[var(--ink)]">
                  {toast.title}
                </p>
                {toast.description && (
                  <p className="text-[12px] text-[var(--muted)] mt-0.5 leading-normal">
                    {toast.description}
                  </p>
                )}
              </div>

              <IconButton
                size="sm"
                aria-label="Dismiss toast"
                onClick={() => removeToast(toast.id)}
                className="-mr-1.5 -mt-1.5 opacity-60 hover:opacity-100"
              >
                <X className="w-3.5 h-3.5" />
              </IconButton>
            </div>
          );
        })}
      </div>
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
