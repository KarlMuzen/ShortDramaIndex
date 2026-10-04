'use client';

import React from 'react';
import { cn } from '@/lib/utils';

export interface TextFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  helperText?: string;
  errorMessage?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  clearable?: boolean;
  onClear?: () => void;
}

export const TextField = React.forwardRef<HTMLInputElement, TextFieldProps>(
  (
    {
      label,
      helperText,
      errorMessage,
      leftIcon,
      rightIcon,
      clearable,
      onClear,
      id,
      className,
      disabled,
      value,
      ...props
    },
    ref
  ) => {
    const generatedId = React.useId();
    const inputId = id || generatedId;
    const hasError = Boolean(errorMessage);

    return (
      <div className="flex flex-col gap-1.5 w-full min-w-0 text-left">
        {label && (
          <label
            htmlFor={inputId}
            className="text-[13px] font-medium text-[var(--ink)] select-none"
          >
            {label}
          </label>
        )}

        <div className="relative flex items-center w-full min-w-0">
          {leftIcon && (
            <div className="absolute left-3 flex items-center pointer-events-none text-[var(--muted)]">
              {leftIcon}
            </div>
          )}

          <input
            ref={ref}
            id={inputId}
            disabled={disabled}
            value={value}
            aria-invalid={hasError}
            aria-describedby={
              hasError
                ? `${inputId}-error`
                : helperText
                ? `${inputId}-hint`
                : undefined
            }
            className={cn(
              'w-full min-w-0 h-10 px-3 text-[14px] bg-[var(--surface)] text-[var(--ink)] placeholder:text-[var(--muted)] rounded-[8px] border transition-colors outline-none focus:outline-2 focus:outline-[var(--crimson)] focus:outline-offset-0',
              hasError
                ? 'border-[var(--crimson)]'
                : 'border-[var(--line)] hover:border-[var(--line-strong)]',
              leftIcon ? 'pl-9' : '',
              rightIcon || (clearable && value) ? 'pr-9' : '',
              disabled && 'opacity-60 bg-[var(--surface-subtle)] cursor-not-allowed',
              className
            )}
            {...props}
          />

          {rightIcon && !clearable && (
            <div className="absolute right-3 flex items-center text-[var(--muted)]">
              {rightIcon}
            </div>
          )}

          {clearable && value && !disabled && (
            <button
              type="button"
              onClick={onClear}
              className="absolute right-2.5 p-1 text-[var(--muted)] hover:text-[var(--ink)] rounded-[4px]"
              aria-label="Clear input"
            >
              <span className="text-[14px] font-medium leading-none">&times;</span>
            </button>
          )}
        </div>

        {hasError ? (
          <p
            id={`${inputId}-error`}
            role="alert"
            className="text-[12px] text-[var(--crimson)] font-normal"
          >
            {errorMessage}
          </p>
        ) : helperText ? (
          <p
            id={`${inputId}-hint`}
            className="text-[12px] text-[var(--muted)] font-normal"
          >
            {helperText}
          </p>
        ) : null}
      </div>
    );
  }
);

TextField.displayName = 'TextField';
