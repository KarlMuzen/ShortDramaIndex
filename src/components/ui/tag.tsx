import React from 'react';
import { cn } from '@/lib/utils';

export interface TagProps extends React.HTMLAttributes<HTMLSpanElement> {
  size?: 'sm' | 'md';
  variant?: 'default' | 'subtle' | 'outline';
  count?: number;
}

export function Tag({
  children,
  size = 'md',
  variant = 'default',
  count,
  className,
  ...props
}: TagProps) {
  const sizeClasses =
    size === 'sm'
      ? 'text-[12px] px-2 py-0.5 gap-1.5'
      : 'text-[14px] px-2.5 py-1 gap-2';

  const variantClasses =
    variant === 'outline'
      ? 'border border-[var(--line)] text-[var(--ink)] bg-transparent'
      : variant === 'subtle'
      ? 'bg-[var(--surface-subtle)] text-[var(--muted)] border border-transparent'
      : 'bg-[var(--surface)] text-[var(--ink)] border border-[var(--line)]';

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-[8px] font-normal leading-tight tracking-normal transition-colors select-none',
        sizeClasses,
        variantClasses,
        className
      )}
      {...props}
    >
      <span>{children}</span>
      {typeof count === 'number' && (
        <span className="text-[var(--muted)] text-[12px] font-normal tabular-nums">
          {count}
        </span>
      )}
    </span>
  );
}
