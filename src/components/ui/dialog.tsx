'use client';

import React, { useEffect, useRef } from 'react';
import { cn } from '@/src/lib/utils';
import { X } from 'lucide-react';

export interface DialogProps {
  open: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  description?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export function Dialog({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  maxWidth = 'md',
  className,
}: DialogProps) {
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && open) {
        onClose();
      }
    };

    if (open) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [open, onClose]);

  if (!open) return null;

  const maxWidthClass =
    maxWidth === 'sm'
      ? 'sm:max-w-sm'
      : maxWidth === 'lg'
      ? 'sm:max-w-xl'
      : maxWidth === 'xl'
      ? 'sm:max-w-2xl'
      : 'sm:max-w-md';

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 box-border"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 transition-opacity animate-in fade-in"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Dialog Surface / Shared Sheet */}
      <div
        ref={dialogRef}
        className={cn(
          'relative w-full max-w-full box-border bg-[var(--surface)] border-t sm:border border-[var(--line)] rounded-t-[16px] sm:rounded-[12px] max-h-[90vh] flex flex-col z-10 transition-transform overflow-hidden shadow-none animate-in slide-in-from-bottom duration-200 sm:slide-in-from-bottom-0 sm:zoom-in-95',
          maxWidthClass,
          className
        )}
      >
        {/* Mobile drag handle indicator */}
        <div className="w-10 h-1 rounded-full bg-[var(--line-strong)] mx-auto mt-2 sm:hidden shrink-0" />

        {/* Header */}
        <div className="flex items-start justify-between gap-3 px-4 sm:px-6 py-3.5 border-b border-[var(--line)] shrink-0 box-border">
          <div className="flex flex-col gap-0.5 min-w-0 pr-2 text-left">
            {title && (
              <h2 className="text-[17px] font-semibold text-[var(--ink)] leading-snug break-words">
                {title}
              </h2>
            )}
            {description && (
              <p className="text-[13px] text-[var(--muted)] font-normal leading-normal break-words">
                {description}
              </p>
            )}
          </div>
          {/* 44px close button inside padding */}
          <button
            type="button"
            aria-label="Close dialog"
            onClick={onClose}
            className="w-11 h-11 min-w-[44px] min-h-[44px] -mr-2 -my-1 rounded-[8px] flex items-center justify-center text-[var(--muted)] hover:text-[var(--ink)] hover:bg-[var(--surface-subtle)] transition-colors cursor-pointer outline-none focus-visible:outline-2 focus-visible:outline-[var(--crimson)] focus-visible:outline-offset-0 shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body - scrolls inside */}
        <div className="px-4 sm:px-6 py-4 overflow-y-auto flex-1 min-w-0 text-[14px] text-[var(--ink)] text-left box-border">
          {children}
        </div>

        {/* Footer - sticky with safe-area bottom padding */}
        {footer && (
          <div className="sticky bottom-0 px-4 sm:px-6 py-3.5 pb-[max(0.875rem,env(safe-area-inset-bottom))] border-t border-[var(--line)] bg-[var(--surface)] flex items-center justify-end gap-2.5 z-10 shrink-0 box-border">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
