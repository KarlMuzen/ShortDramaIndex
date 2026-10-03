import React from 'react';
import { Skeleton } from '@/src/components/ui/skeleton';

export default function TitleLoading() {
  return (
    <div className="space-y-8 pb-16 text-left max-w-5xl mx-auto animate-pulse">
      <Skeleton className="h-5 w-48" />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-4 space-y-4">
          <Skeleton className="aspect-[9/16] w-full rounded-[12px]" />
          <Skeleton className="h-10 w-full rounded-[8px]" />
        </div>

        <div className="lg:col-span-8 space-y-6">
          <div className="space-y-2">
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-5 w-1/2" />
            <Skeleton className="h-4 w-1/3" />
          </div>

          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
          </div>

          <div className="p-4 bg-[var(--surface)] border border-[var(--line)] rounded-[12px] space-y-3">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        </div>
      </div>
    </div>
  );
}
