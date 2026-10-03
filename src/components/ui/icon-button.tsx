'use client';

import React from 'react';
import { cn } from '@/lib/utils';

export interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  'aria-label': string;
  variant?: 'primary' | 'secondary' | 'quiet';
  size?: 'sm' | 'md';
}

export const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(
  (
    {
      children,
      variant = 'quiet',
      size = 'md',
      className,
      disabled,
      ...props
    },
    ref
  ) => {
    const sizeClasses =
      size === 'sm'
        ? 'w-8 h-8 p-1.5'
        : 'w-10 h-10 p-2';

    let variantClasses = '';
    if (variant === 'primary') {
      variantClasses =
        'bg-[var(--crimson)] text-white hover:bg-[var(--crimson-hover)] border border-[var(--crimson)]';
    } else if (variant === 'secondary') {
      variantClasses =
        'bg-[var(--surface)] text-[var(--ink)] border border-[var(--line)] hover:bg-[var(--surface-hover)]';
    } else {
      variantClasses =
        'bg-transparent text-[var(--muted)] hover:text-[var(--ink)] hover:bg-[var(--surface-subtle)]';
    }

    return (
      <button
        ref={ref}
        type={props.type || 'button'}
        disabled={disabled}
        className={cn(
          'inline-flex items-center justify-center rounded-[8px] transition-colors select-none cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 shrink-0',
          sizeClasses,
          variantClasses,
          className
        )}
        {...props}
      >
        {children}
      </button>
    );
  }
);

IconButton.displayName = 'IconButton';
