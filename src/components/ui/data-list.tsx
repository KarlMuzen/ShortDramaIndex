import React from 'react';
import { cn } from '@/src/lib/utils';

export interface DataListItem {
  label: React.ReactNode;
  value: React.ReactNode;
  hint?: React.ReactNode;
}

export interface DataListProps extends React.HTMLAttributes<HTMLDListElement> {
  items: DataListItem[];
  orientation?: 'horizontal' | 'vertical';
  density?: 'compact' | 'normal';
}

export function DataList({
  items,
  orientation = 'horizontal',
  density = 'normal',
  className,
  ...props
}: DataListProps) {
  const pyClass = density === 'compact' ? 'py-2' : 'py-3';

  return (
    <dl
      className={cn('divide-y divide-[var(--line)] text-[14px]', className)}
      {...props}
    >
      {items.map((item, idx) => (
        <div
          key={idx}
          className={cn(
            'flex flex-col gap-1 first:pt-0 last:pb-0',
            pyClass,
            orientation === 'horizontal' && 'sm:flex-row sm:items-baseline sm:justify-between sm:gap-6'
          )}
        >
          <dt className="text-[var(--muted)] font-normal text-[13px] shrink-0 sm:w-1/3">
            {item.label}
          </dt>
          <dd className="text-[var(--ink)] font-normal sm:w-2/3 sm:text-right flex flex-col sm:items-end">
            <div className="w-full">{item.value}</div>
            {item.hint && (
              <span className="text-[12px] text-[var(--muted)] mt-0.5">
                {item.hint}
              </span>
            )}
          </dd>
        </div>
      ))}
    </dl>
  );
}
