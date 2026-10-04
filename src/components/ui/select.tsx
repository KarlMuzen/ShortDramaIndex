'use client';

import React from 'react';
import { cn } from '@/src/lib/utils';
import { ChevronDown } from 'lucide-react';

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  helperText?: string;
  errorMessage?: string;
  options?: SelectOption[];
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      label,
      helperText,
      errorMessage,
      options,
      children,
      id,
      className,
      disabled,
      ...props
    },
    ref
  ) => {
    const generatedId = React.useId();
    const selectId = id || generatedId;
    const hasError = Boolean(errorMessage);

    return (
      <div className="flex flex-col gap-1.5 w-full min-w-0 text-left">
        {label && (
          <label
            htmlFor={selectId}
            className="text-[13px] font-medium text-[var(--ink)] select-none"
          >
            {label}
          </label>
        )}

        <div className="relative flex items-center w-full min-w-0">
          <select
            ref={ref}
            id={selectId}
            disabled={disabled}
            aria-invalid={hasError}
            aria-describedby={
              hasError
                ? `${selectId}-error`
                : helperText
                ? `${selectId}-hint`
                : undefined
            }
            className={cn(
              'w-full min-w-0 h-10 pl-3 pr-9 text-[14px] bg-[var(--surface)] text-[var(--ink)] rounded-[8px] border transition-colors outline-none focus:outline-2 focus:outline-[var(--crimson)] focus:outline-offset-0 appearance-none cursor-pointer',
              hasError
                ? 'border-[var(--crimson)]'
                : 'border-[var(--line)] hover:border-[var(--line-strong)]',
              disabled && 'opacity-60 bg-[var(--surface-subtle)] cursor-not-allowed',
              className
            )}
            {...props}
          >
            {options
              ? options.map((opt) => (
                  <option
                    key={opt.value}
                    value={opt.value}
                    disabled={opt.disabled}
                  >
                    {opt.label}
                  </option>
                ))
              : children}
          </select>

          <ChevronDown
            className="absolute right-3 w-4 h-4 text-[var(--muted)] pointer-events-none"
            aria-hidden="true"
          />
        </div>

        {hasError ? (
          <p
            id={`${selectId}-error`}
            role="alert"
            className="text-[12px] text-[var(--crimson)] font-normal"
          >
            {errorMessage}
          </p>
        ) : helperText ? (
          <p
            id={`${selectId}-hint`}
            className="text-[12px] text-[var(--muted)] font-normal"
          >
            {helperText}
          </p>
        ) : null}
      </div>
    );
  }
);

Select.displayName = 'Select';
