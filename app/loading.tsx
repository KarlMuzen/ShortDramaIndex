import React from 'react';
import { Skeleton } from '@/src/components/ui/skeleton';

export default function Loading() {
  return (
    <div className="space-y-8 pb-16 text-left max-w-5xl mx-auto animate-pulse">
      <Skeleton className="h-6 w-32" />
      <div className="p-6 bg-[var(--surface)] border border-[var(--line)] rounded-[12px] space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-full max-w-md" />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="aspect-[9/16] w-full rounded-[8px]" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        ))}
      </div>
    </div>
  );
}
