'use client';

import React from 'react';
import { cn } from '@/src/lib/utils';

export interface RadioOption {
  value: string;
  label: React.ReactNode;
  description?: React.ReactNode;
  disabled?: boolean;
}

export interface RadioProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: React.ReactNode;
  description?: React.ReactNode;
}

export const Radio = React.forwardRef<HTMLInputElement, RadioProps>(
  (
    {
      label,
      description,
      checked,
      disabled,
      className,
      id,
      ...props
    },
    ref
  ) => {
    const generatedId = React.useId();
    const radioId = id || generatedId;

    return (
      <label
        htmlFor={radioId}
        className={cn(
          'inline-flex items-start gap-2.5 cursor-pointer select-none text-left group',
          disabled && 'opacity-60 cursor-not-allowed',
          className
        )}
      >
        <div className="relative flex items-center justify-center shrink-0 mt-0.5">
          <input
            ref={ref}
            id={radioId}
            type="radio"
            checked={checked}
            disabled={disabled}
            className="peer sr-only"
            {...props}
          />
          <div
            className={cn(
              'w-4 h-4 rounded-full border transition-colors flex items-center justify-center bg-[var(--surface)]',
              checked
                ? 'border-[var(--crimson)]'
                : 'border-[var(--line-strong)] group-hover:border-[var(--muted)]',
              'peer-focus-visible:ring-2 peer-focus-visible:ring-[var(--crimson)] peer-focus-visible:ring-offset-2'
            )}
          >
            {checked && (
              <div className="w-2 h-2 rounded-full bg-[var(--crimson)]" />
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

Radio.displayName = 'Radio';
