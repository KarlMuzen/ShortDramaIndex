import React from 'react';
import { Skeleton } from '@/src/components/ui/skeleton';

export default function PersonLoading() {
  return (
    <div className="space-y-8 pb-16 text-left max-w-4xl mx-auto animate-pulse">
      <Skeleton className="h-5 w-36" />
      <div className="p-6 bg-[var(--surface)] border border-[var(--line)] rounded-[12px] flex items-center gap-4">
        <Skeleton className="w-16 h-16 rounded-full" />
        <div className="space-y-2 flex-1">
          <Skeleton className="h-7 w-48" />
          <Skeleton className="h-4 w-32" />
        </div>
      </div>

      <div className="space-y-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex gap-4 items-center">
            <Skeleton className="w-12 aspect-[9/16] rounded-[4px]" />
            <div className="space-y-2 flex-1">
              <Skeleton className="h-4 w-1/3" />
              <Skeleton className="h-3 w-1/4" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
