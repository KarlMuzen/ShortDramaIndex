import React from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';

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
  return (
    <div
      className={cn(
        'relative aspect-[9/16] w-full rounded-[12px] overflow-hidden bg-[var(--surface-subtle)] border border-[var(--line)] select-none',
        className
      )}
      {...props}
    >
      {src ? (
        <Image
          src={src}
          alt={alt || (title ? `${title} short drama poster` : 'Short drama poster')}
          fill
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 180px"
          priority={priority}
          referrerPolicy="no-referrer"
          className="object-cover"
        />
      ) : null}
    </div>
  );
}
