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

// Dark, high-contrast gradients. The palette is picked deterministically
// from the title so a series always gets the same cover, with no artwork
// file (and no "Poster coming soon" placeholder) involved.
const GRADIENTS: [string, string][] = [
  ['#312e81', '#7c2d12'],
  ['#1e3a8a', '#831843'],
  ['#134e4a', '#713f12'],
  ['#3b0764', '#7f1d1d'],
  ['#172554', '#422006'],
  ['#4a044e', '#1c1917'],
];

function gradientForTitle(title?: string): string {
  const text = title || 'Short drama';
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    hash = (hash * 31 + text.charCodeAt(i)) >>> 0;
  }
  const [from, to] = GRADIENTS[hash % GRADIENTS.length];
  return `linear-gradient(165deg, ${from} 0%, ${to} 100%)`;
}

function CoverCard({
  title,
  className,
  ...props
}: {
  title?: string;
} & React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'relative aspect-[9/16] w-full rounded-[12px] overflow-hidden border border-[var(--line)] select-none',
        className
      )}
      style={{ backgroundImage: gradientForTitle(title) }}
      role="img"
      aria-label={title ? `${title} short drama cover` : 'Short drama cover'}
      {...props}
    >
      <div className="absolute inset-0 flex items-center justify-center p-4 pb-10">
        <span className="text-center text-[15px] font-semibold leading-snug text-white break-words">
          {title || 'Short drama'}
        </span>
      </div>
      <span className="absolute bottom-2.5 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-black/40 px-2 py-0.5 text-[10px] font-medium tracking-wide text-white/90">
        Vertical drama
      </span>
    </div>
  );
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
  // (Kept from the previous version: an image that fails before hydration
  // never fires onError, so it must be caught by the check below.)
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    const img = imgRef.current;
    if (src && img && img.complete && img.naturalWidth === 0) {
      setFailedSrc(src);
    }
  }, [src]);

  const trimmedSrc = src?.trim();
  // Local placeholder files are never rendered: every /posters/ asset is
  // a generated "coming soon" graphic, so it gets the CSS cover instead.
  const useCoverCard =
    !trimmedSrc || trimmedSrc.startsWith('/posters/') || failedSrc === src;

  if (useCoverCard) {
    return <CoverCard title={title} className={className} {...props} />;
  }

  return (
    <div
      className={cn(
        'relative aspect-[9/16] w-full rounded-[12px] overflow-hidden bg-[var(--surface-subtle)] border border-[var(--line)] select-none',
        className
      )}
      {...props}
    >
      <Image
        ref={imgRef}
        src={trimmedSrc}
        alt={alt || (title ? `${title} short drama poster` : 'Short drama poster')}
        fill
        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 180px"
        priority={priority}
        referrerPolicy="no-referrer"
        unoptimized
        onError={() => setFailedSrc(src ?? null)}
        className="object-cover"
      />
    </div>
  );
}
