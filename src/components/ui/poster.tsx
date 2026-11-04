'use client';

import React, { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { cn } from '@/src/lib/utils';

export interface PosterProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
  src?: string;
  alt?: string;
  priority?: boolean;
}

export function Poster({
  title,
  src,
  alt,
  priority = false,
  className,
  ...props
}: PosterProps) {
  // Remember which URL failed, so a different src gets a fresh attempt.
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const label =
    alt || (title ? `${title} short drama poster` : 'Short drama poster');

  // An image that fails before hydration never fires onError, so check once.
  useEffect(() => {
    const img = imgRef.current;
    if (src && img && img.complete && img.naturalWidth === 0) {
      setFailedSrc(src);
    }
  }, [src]);

  return (
    <div
      className={cn(
        'relative aspect-[9/16] w-full rounded-[12px] overflow-hidden bg-[var(--surface-subtle)] border border-[var(--line)] select-none',
        className
      )}
      {...props}
    >
      {src && failedSrc !== src ? (
        <Image
          ref={imgRef}
          src={src}
          alt={label}
          fill
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 180px"
          priority={priority}
          referrerPolicy="no-referrer"
          className="object-cover"
          onError={() => setFailedSrc(src)}
        />
      ) : (
        <div
          role="img"
          aria-label={label}
          className="absolute inset-0 flex items-center justify-center p-3 text-center"
        >
          <span className="text-[13px] sm:text-[14px] font-semibold leading-snug text-[var(--muted)] line-clamp-5 break-words">
            {title || 'No poster yet'}
          </span>
        </div>
      )}
    </div>
  );
}
