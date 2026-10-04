import React from 'react';
import { cn } from '@/src/lib/utils';

export function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'animate-pulse rounded-[8px] bg-[var(--surface-subtle)] border border-[var(--line)]/40',
        className
      )}
      {...props}
    />
  );
}
