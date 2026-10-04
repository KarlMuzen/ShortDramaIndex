import React from 'react';
import { cn } from '@/src/lib/utils';
import { SearchX } from 'lucide-react';

export interface EmptyStateProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  description: string;
  action?: React.ReactNode;
  icon?: React.ReactNode;
}

export function EmptyState({
  title,
  description,
  action,
  icon,
  className,
  ...props
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'rounded-[12px] border border-[var(--line)] bg-[var(--surface)] p-8 text-center flex flex-col items-center justify-center max-w-lg mx-auto',
        className
      )}
      {...props}
    >
      <div className="w-10 h-10 rounded-[8px] bg-[var(--surface-subtle)] border border-[var(--line)] flex items-center justify-center text-[var(--muted)] mb-3">
        {icon || <SearchX className="w-5 h-5" aria-hidden="true" />}
      </div>
      <h3 className="text-[16px] font-semibold text-[var(--ink)] mb-1">
        {title}
      </h3>
      <p className="text-[14px] text-[var(--muted)] max-w-sm mb-4 leading-normal">
        {description}
      </p>
      {action && <div className="mt-1">{action}</div>}
    </div>
  );
}
