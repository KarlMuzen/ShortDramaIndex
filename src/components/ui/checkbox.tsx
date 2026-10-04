'use client';

import React from 'react';
import { cn } from '@/src/lib/utils';
import { Check, Minus } from 'lucide-react';

export interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: React.ReactNode;
  description?: React.ReactNode;
  indeterminate?: boolean;
}

export const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  (
    {
      label,
      description,
      indeterminate = false,
      checked,
      disabled,
      className,
      id,
      onChange,
      ...props
    },
    ref
  ) => {
    const generatedId = React.useId();
    const checkboxId = id || generatedId;

    return (
      <label
        htmlFor={checkboxId}
        className={cn(
          'inline-flex items-start gap-2.5 cursor-pointer select-none text-left group',
          disabled && 'opacity-60 cursor-not-allowed',
          className
        )}
      >
        <div className="relative flex items-center justify-center shrink-0 mt-0.5">
          <input
            ref={ref}
            id={checkboxId}
            type="checkbox"
            checked={checked}
            disabled={disabled}
            onChange={onChange}
            className="peer sr-only"
            {...props}
          />
          <div
            className={cn(
              'w-4 h-4 rounded-[4px] border transition-colors flex items-center justify-center bg-[var(--surface)]',
              checked || indeterminate
                ? 'bg-[var(--crimson)] border-[var(--crimson)] text-white'
                : 'border-[var(--line-strong)] group-hover:border-[var(--muted)]',
              'peer-focus-visible:ring-2 peer-focus-visible:ring-[var(--crimson)] peer-focus-visible:ring-offset-2'
            )}
          >
            {checked && !indeterminate && (
              <Check className="w-3 h-3 stroke-[3]" aria-hidden="true" />
            )}
            {indeterminate && (
              <Minus className="w-3 h-3 stroke-[3]" aria-hidden="true" />
            )}
          </div>
        </div>

        {(label || description) && (
          <div className="flex flex-col">
            {label && (
              <span className="text-[14px] font-medium text-[var(--ink)] leading-snug">
                {label}
              </span>
            )}
            {description && (
              <span className="text-[12px] text-[var(--muted)] leading-normal mt-0.5">
                {description}
              </span>
            )}
          </div>
        )}
      </label>
    );
  }
);

Checkbox.displayName = 'Checkbox';
