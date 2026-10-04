'use client';

import React from 'react';
import { cn } from '@/lib/utils';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  helperText?: string;
  errorMessage?: string;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    {
      label,
      helperText,
      errorMessage,
      id,
      className,
      disabled,
      rows = 4,
      ...props
    },
    ref
  ) => {
    const generatedId = React.useId();
    const textareaId = id || generatedId;
    const hasError = Boolean(errorMessage);

    return (
      <div className="flex flex-col gap-1.5 w-full min-w-0 text-left">
        {label && (
          <label
            htmlFor={textareaId}
            className="text-[13px] font-medium text-[var(--ink)] select-none"
          >
            {label}
          </label>
        )}

        <textarea
          ref={ref}
          id={textareaId}
          disabled={disabled}
          rows={rows}
          aria-invalid={hasError}
          aria-describedby={
            hasError
              ? `${textareaId}-error`
              : helperText
              ? `${textareaId}-hint`
              : undefined
          }
          className={cn(
            'w-full min-w-0 p-3 text-[14px] bg-[var(--surface)] text-[var(--ink)] placeholder:text-[var(--muted)] rounded-[8px] border transition-colors outline-none focus:outline-2 focus:outline-[var(--crimson)] focus:outline-offset-0 resize-y',
            hasError
              ? 'border-[var(--crimson)]'
              : 'border-[var(--line)] hover:border-[var(--line-strong)]',
            disabled && 'opacity-60 bg-[var(--surface-subtle)] cursor-not-allowed',
            className
          )}
          {...props}
        />

        {hasError ? (
          <p
            id={`${textareaId}-error`}
            role="alert"
            className="text-[12px] text-[var(--crimson)] font-normal"
          >
            {errorMessage}
          </p>
        ) : helperText ? (
          <p
            id={`${textareaId}-hint`}
            className="text-[12px] text-[var(--muted)] font-normal"
          >
            {helperText}
          </p>
        ) : null}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';
