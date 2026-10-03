import React from 'react';
import { cn } from '@/lib/utils';
import { AlertTriangle } from 'lucide-react';

export interface ErrorStateProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
  description?: string;
  retryAction?: React.ReactNode;
}

export function ErrorState({
  title = 'Unable to load data',
  description = 'A network or server issue prevented this section from loading. Check your connection or try again.',
  retryAction,
  className,
  ...props
}: ErrorStateProps) {
  return (
    <div
      className={cn(
        'rounded-[12px] border border-[var(--crimson)]/30 bg-[var(--status-disputed-bg)] p-6 text-left flex items-start gap-4 max-w-xl mx-auto',
        className
      )}
      role="alert"
      {...props}
    >
      <div className="w-8 h-8 rounded-[8px] bg-[var(--surface)] border border-[var(--crimson)]/40 flex items-center justify-center text-[var(--crimson)] shrink-0 mt-0.5">
        <AlertTriangle className="w-4 h-4" aria-hidden="true" />
      </div>
      <div className="flex-1">
        <h3 className="text-[15px] font-semibold text-[var(--ink)] mb-1">
          {title}
        </h3>
        <p className="text-[13px] text-[var(--muted)] mb-3 leading-normal">
          {description}
        </p>
        {retryAction && <div>{retryAction}</div>}
      </div>
    </div>
  );
}
