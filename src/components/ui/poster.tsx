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
  ['#0f766e', '#431407'],
  ['#1d4ed8', '#3f0d12'],
  ['#365314', '#500724'],
  ['#0e7490', '#3b0764'],
  ['#7f1d1d', '#12283b'],
  ['#44403c', '#1e1b4b'],
];

// FNV-1a over the full title, finished with a murmur-style mix so that
// titles differing by a single character (and adjacent cards) land on
// different gradients instead of clustering on the same purple-brown pair.
function gradientForTitle(title?: string): string {
  const text = title || 'Short drama';
  let hash = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  hash ^= hash >>> 16;
  hash = Math.imul(hash, 0x7feb352d) >>> 0;
  // Keep the hash unsigned: a signed value here makes `hash % length`
  // negative for some titles, and destructuring GRADIENTS[negative]
  // throws "undefined is not iterable" during prerender.
  hash = (hash ^ (hash >>> 15)) >>> 0;
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
      {/* Subtle grid + vignette over the gradient: a film-grain feel that
          keeps the fallback from reading as a flat colour block. */}
      <div
        className="absolute inset-0 opacity-40"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)',
          backgroundSize: '12px 12px',
        }}
      />
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse at center, transparent 55%, rgba(0,0,0,0.35) 100%)',
        }}
      />
      {/* Small uppercase editorial type: it labels the card without
          competing with the series title shown underneath it. */}
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 p-4 text-center">
        <span className="text-[9px] font-medium uppercase tracking-[0.22em] text-white/50">
          Short drama
        </span>
        <span className="text-[12px] font-semibold uppercase leading-relaxed tracking-[0.14em] text-white/90 break-words">
          {title || 'Short drama'}
        </span>
      </div>
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
