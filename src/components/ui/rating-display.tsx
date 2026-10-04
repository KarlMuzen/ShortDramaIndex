import React from 'react';
import { cn } from '@/src/lib/utils';
import { Star } from 'lucide-react';

export interface RatingDisplayProps extends React.HTMLAttributes<HTMLDivElement> {
  score: number;
  maxScore?: number;
  count?: number;
  size?: 'sm' | 'md' | 'lg';
  showCount?: boolean;
}

export function RatingDisplay({
  score,
  maxScore = 10,
  count,
  size = 'md',
  showCount = true,
  className,
  ...props
}: RatingDisplayProps) {
  const formattedScore = score.toFixed(1);

  return (
    <div
      className={cn('inline-flex items-baseline gap-1.5 select-none', className)}
      {...props}
    >
      <div className="inline-flex items-center gap-1 text-[var(--crimson)]">
        <Star
          className={cn(
            'fill-current',
            size === 'sm' && 'w-3 h-3',
            size === 'md' && 'w-3.5 h-3.5',
            size === 'lg' && 'w-4 h-4'
          )}
          aria-hidden="true"
        />
        <span
          className={cn(
            'font-semibold tabular-nums text-[var(--ink)]',
            size === 'sm' && 'text-[12px]',
            size === 'md' && 'text-[14px]',
            size === 'lg' && 'text-[16px]'
          )}
        >
          {formattedScore}
        </span>
      </div>

      <span
        className={cn(
          'text-[var(--muted)] tabular-nums font-normal',
          size === 'sm' && 'text-[11px]',
          size === 'md' && 'text-[12px]',
          size === 'lg' && 'text-[13px]'
        )}
      >
        /{maxScore}
      </span>

      {showCount && typeof count === 'number' && (
        <span
          className={cn(
            'text-[var(--muted)] tabular-nums font-normal ml-1',
            size === 'sm' && 'text-[11px]',
            size === 'md' && 'text-[12px]',
            size === 'lg' && 'text-[13px]'
          )}
        >
          ({count.toLocaleString()})
        </span>
      )}
    </div>
  );
}
