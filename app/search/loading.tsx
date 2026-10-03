import { Skeleton } from '@/src/components/ui/skeleton';

export default function SearchLoading() {
  return (
    <div className="space-y-6 pb-12 animate-pulse text-left">
      {/* Top Search bar skeleton */}
      <div className="space-y-3">
        <div className="flex gap-2">
          <Skeleton className="h-11 flex-1 rounded-[8px]" />
          <Skeleton className="h-11 w-24 rounded-[8px]" />
        </div>
        <div className="flex justify-between items-center">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-8 w-32 rounded-[8px]" />
        </div>
      </div>

      {/* Grid: Left Rail + Rows Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start pt-2">
        {/* Left Rail */}
        <aside className="hidden lg:block lg:col-span-4 xl:col-span-3 p-4 bg-[var(--surface)] border border-[var(--line)] rounded-[12px] space-y-4">
          <Skeleton className="h-5 w-24" />
          <Skeleton className="h-9 w-full" />
          <Skeleton className="h-9 w-full" />
          <Skeleton className="h-9 w-full" />
        </aside>

        {/* Results List */}
        <div className="lg:col-span-8 xl:col-span-9 space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="p-4 bg-[var(--surface)] border border-[var(--line)] rounded-[12px] flex gap-4"
            >
              <Skeleton className="w-16 sm:w-20 aspect-[9/16] rounded-[8px] shrink-0" />
              <div className="flex-1 space-y-2 py-1">
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-4 w-1/3" />
                <div className="pt-3 flex gap-2">
                  <Skeleton className="h-6 w-16 rounded-[6px]" />
                  <Skeleton className="h-6 w-16 rounded-[6px]" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
