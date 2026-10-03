'use client';

import React, { useState } from 'react';
import { cn } from '@/lib/utils';

export interface TooltipProps {
  content: React.ReactNode;
  children: React.ReactElement<React.HTMLAttributes<HTMLElement>>;
  position?: 'top' | 'bottom';
  className?: string;
}

export function Tooltip({
  content,
  children,
  position = 'top',
  className,
}: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <div
      className="relative inline-flex"
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
      onFocus={() => setIsVisible(true)}
      onBlur={() => setIsVisible(false)}
    >
      {children}
      {isVisible && (
        <div
          role="tooltip"
          className={cn(
            'absolute left-1/2 -translate-x-1/2 z-50 px-2 py-1 text-[11px] font-normal leading-tight text-[var(--paper)] bg-[var(--ink)] rounded-[4px] whitespace-nowrap pointer-events-none transition-opacity duration-150',
            position === 'top' ? 'bottom-full mb-1.5' : 'top-full mt-1.5',
            className
          )}
        >
          {content}
        </div>
      )}
    </div>
  );
}
