import { Skeleton } from '@/src/components/ui/skeleton';

/**
 * Instant navigation feedback: Next.js renders this shell immediately on
 * tap while the destination's server queries run, instead of freezing the
 * previous screen for the 2-4s a database round-trip can take on mobile.
 */
export default function Loading() {
  return (
    <div
      className="space-y-6 pb-16 text-left max-w-4xl mx-auto"
      aria-busy="true"
      aria-label="Loading page"
    >
      {/* Breadcrumb */}
      <Skeleton className="h-4 w-40" />

      {/* Header block: poster beside title */}
      <div className="grid grid-cols-[96px_1fr] gap-4 items-start">
        <Skeleton className="w-24 aspect-[9/16]" />
        <div className="space-y-2 min-w-0 pt-1">
          <Skeleton className="h-7 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-4 w-2/3" />
        </div>
      </div>

      {/* Content sections */}
      <Skeleton className="h-24 w-full" />
      <Skeleton className="h-40 w-full" />
      <Skeleton className="h-24 w-full" />
    </div>
  );
}
