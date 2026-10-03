import React from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { Film } from 'lucide-react';

export interface PosterProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  src?: string;
  alt?: string;
  episodeCount?: number;
  year?: number;
  priority?: boolean;
}

export function Poster({
  title,
  src,
  alt,
  episodeCount,
  year,
  priority = false,
  className,
  ...props
}: PosterProps) {
  return (
    <div
      className={cn(
        'relative aspect-[9/16] w-full rounded-[12px] overflow-hidden bg-[var(--surface-subtle)] border border-[var(--line)] flex flex-col justify-between p-3 select-none transition-colors group',
        className
      )}
      {...props}
    >
      {src ? (
        <Image
          src={src}
          alt={alt || `${title} short drama poster`}
          fill
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 180px"
          priority={priority}
          referrerPolicy="no-referrer"
          className="object-cover"
        />
      ) : (
        <>
          {/* Top Header info (if available) */}
          <div className="flex items-center justify-between gap-1 z-10">
            {year && (
              <span className="text-[11px] font-normal text-[var(--muted)] tabular-nums bg-[var(--surface)]/90 px-1.5 py-0.5 rounded-[4px] border border-[var(--line)]">
                {year}
              </span>
            )}
            {episodeCount && (
              <span className="text-[11px] font-normal text-[var(--muted)] tabular-nums bg-[var(--surface)]/90 px-1.5 py-0.5 rounded-[4px] border border-[var(--line)] ml-auto">
                {episodeCount} eps
              </span>
            )}
          </div>

          {/* Center Icon Graphic / Neutral Block */}
          <div className="my-auto flex flex-col items-center justify-center text-center p-2 z-10">
            <div className="w-8 h-8 rounded-[8px] bg-[var(--surface)] border border-[var(--line)] flex items-center justify-center text-[var(--muted)] mb-2 group-hover:border-[var(--line-strong)]">
              <Film className="w-4 h-4" aria-hidden="true" />
            </div>
            <p className="text-[13px] font-semibold text-[var(--ink)] line-clamp-3 leading-snug px-1">
              {title}
            </p>
          </div>

          {/* Bottom Subtle Ratio Marker */}
          <div className="flex items-center justify-center z-10">
            <span className="text-[12px] text-[var(--muted)]">
              Short drama
            </span>
          </div>
        </>
      )}
    </div>
  );
}
