'use client';

import React from 'react';
import { cn } from '@/src/lib/utils';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'quiet' | 'danger';
  size?: 'sm' | 'md';
  fullWidth?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  isLoading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      variant = 'secondary',
      size = 'md',
      fullWidth = false,
      leftIcon,
      rightIcon,
      isLoading = false,
      className,
      disabled,
      ...props
    },
    ref
  ) => {
    const sizeClasses =
      size === 'sm'
        ? 'h-9 px-3 text-[13px] gap-1.5'
        : 'h-11 px-4 text-[14px] gap-2';

    let variantClasses = '';
    if (variant === 'primary') {
      variantClasses =
        'bg-[var(--crimson)] text-white border border-[var(--crimson)] hover:bg-[var(--crimson-hover)] active:opacity-90';
    } else if (variant === 'secondary') {
      variantClasses =
        'bg-[var(--surface)] text-[var(--ink)] border border-[var(--line)] hover:bg-[var(--surface-hover)] hover:border-[var(--line-strong)] active:bg-[var(--surface-subtle)]';
    } else if (variant === 'quiet') {
      variantClasses =
        'bg-transparent text-[var(--ink)] border border-transparent hover:bg-[var(--surface-subtle)] active:bg-[var(--line)]/50';
    } else if (variant === 'danger') {
      variantClasses =
        'bg-transparent text-[var(--crimson)] border border-[var(--crimson)]/40 hover:bg-[var(--crimson-subtle)] active:opacity-90';
    }

    return (
      <button
        ref={ref}
        type={props.type || 'button'}
        disabled={disabled || isLoading}
        className={cn(
          'inline-flex items-center justify-center font-medium rounded-[8px] transition-colors select-none cursor-pointer disabled:cursor-not-allowed disabled:opacity-50',
          sizeClasses,
          variantClasses,
          fullWidth && 'w-full',
          className
        )}
        {...props}
      >
        {isLoading ? (
          <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
        ) : (
          <>
            {leftIcon && <span className="shrink-0">{leftIcon}</span>}
            <span>{children}</span>
            {rightIcon && <span className="shrink-0">{rightIcon}</span>}
          </>
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';
