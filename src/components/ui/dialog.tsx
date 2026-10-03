'use client';

import React, { useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import { X } from 'lucide-react';
import { IconButton } from './icon-button';

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
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 transition-opacity animate-in fade-in"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Dialog Surface (Bottom sheet on mobile, Centered Modal on desktop) */}
      <div
        ref={dialogRef}
        className={cn(
          'relative w-full bg-[var(--surface)] border-t sm:border border-[var(--line)] rounded-t-[16px] sm:rounded-[12px] max-h-[90vh] flex flex-col z-10 transition-transform animate-in slide-in-from-bottom duration-200 sm:slide-in-from-bottom-0 sm:zoom-in-95',
          maxWidthClass,
          className
        )}
      >
        {/* Mobile drag handle indicator */}
        <div className="w-12 h-1 rounded-full bg-[var(--line-strong)] mx-auto mt-2.5 sm:hidden" />

        {/* Header */}
        <div className="flex items-start justify-between p-4 sm:p-5 border-b border-[var(--line)]">
          <div className="flex flex-col gap-1 pr-6 text-left">
            {title && (
              <h2 className="text-[17px] font-semibold text-[var(--ink)]">
                {title}
              </h2>
            )}
            {description && (
              <p className="text-[13px] text-[var(--muted)] font-normal">
                {description}
              </p>
            )}
          </div>
          <IconButton
            size="sm"
            aria-label="Close dialog"
            onClick={onClose}
            className="-mr-1 -mt-1"
          >
            <X className="w-4 h-4" />
          </IconButton>
        </div>

        {/* Body */}
        <div className="p-4 sm:p-5 overflow-y-auto flex-1 text-[14px] text-[var(--ink)] text-left">
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div className="p-4 sm:p-5 border-t border-[var(--line)] bg-[var(--surface-subtle)]/40 rounded-b-[12px] flex items-center justify-end gap-2.5">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
