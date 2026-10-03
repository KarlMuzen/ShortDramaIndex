'use client';

import React from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange?: (page: number) => void;
  baseUrl?: string;
  className?: string;
}

export function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  baseUrl,
  className,
}: PaginationProps) {
  if (totalPages <= 1) return null;

  const pages: (number | 'ellipsis')[] = [];
  const delta = 1;

  for (let i = 1; i <= totalPages; i++) {
    if (
      i === 1 ||
      i === totalPages ||
      (i >= currentPage - delta && i <= currentPage + delta)
    ) {
      pages.push(i);
    } else if (pages[pages.length - 1] !== 'ellipsis') {
      pages.push('ellipsis');
    }
  }

  const getHref = (page: number) => {
    if (!baseUrl) return '#';
    const separator = baseUrl.includes('?') ? '&' : '?';
    return `${baseUrl}${separator}page=${page}`;
  };

  return (
    <nav
      role="navigation"
      aria-label="Pagination"
      className={cn('flex items-center justify-center gap-1 select-none', className)}
    >
      {baseUrl ? (
        <Link
          href={currentPage > 1 ? getHref(currentPage - 1) : '#'}
          aria-disabled={currentPage <= 1}
          className={cn(
            'inline-flex items-center justify-center w-9 h-9 rounded-[8px] border border-[var(--line)] bg-[var(--surface)] text-[var(--ink)] hover:bg-[var(--surface-hover)] transition-colors',
            currentPage <= 1 && 'opacity-40 pointer-events-none'
          )}
          aria-label="Previous page"
        >
          <ChevronLeft className="w-4 h-4" />
        </Link>
      ) : (
        <button
          type="button"
          disabled={currentPage <= 1}
          onClick={() => onPageChange?.(currentPage - 1)}
          className="inline-flex items-center justify-center w-9 h-9 rounded-[8px] border border-[var(--line)] bg-[var(--surface)] text-[var(--ink)] hover:bg-[var(--surface-hover)] disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
          aria-label="Previous page"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
      )}

      {pages.map((p, idx) => {
        if (p === 'ellipsis') {
          return (
            <span
              key={`ellipsis-${idx}`}
              className="w-9 h-9 flex items-center justify-center text-[var(--muted)] text-[13px]"
            >
              …
            </span>
          );
        }

        const isCurrent = p === currentPage;

        if (baseUrl) {
          return (
            <Link
              key={p}
              href={getHref(p)}
              aria-current={isCurrent ? 'page' : undefined}
              className={cn(
                'w-9 h-9 rounded-[8px] text-[13px] font-medium tabular-nums transition-colors flex items-center justify-center border',
                isCurrent
                  ? 'bg-[var(--crimson)] text-white border-[var(--crimson)] font-semibold'
                  : 'bg-[var(--surface)] text-[var(--ink)] border-[var(--line)] hover:bg-[var(--surface-hover)]'
              )}
            >
              {p}
            </Link>
          );
        }

        return (
          <button
            key={p}
            type="button"
            aria-current={isCurrent ? 'page' : undefined}
            onClick={() => onPageChange?.(p)}
            className={cn(
              'w-9 h-9 rounded-[8px] text-[13px] font-medium tabular-nums transition-colors cursor-pointer flex items-center justify-center border',
              isCurrent
                ? 'bg-[var(--crimson)] text-white border-[var(--crimson)] font-semibold'
                : 'bg-[var(--surface)] text-[var(--ink)] border-[var(--line)] hover:bg-[var(--surface-hover)]'
            )}
          >
            {p}
          </button>
        );
      })}

      {baseUrl ? (
        <Link
          href={currentPage < totalPages ? getHref(currentPage + 1) : '#'}
          aria-disabled={currentPage >= totalPages}
          className={cn(
            'inline-flex items-center justify-center w-9 h-9 rounded-[8px] border border-[var(--line)] bg-[var(--surface)] text-[var(--ink)] hover:bg-[var(--surface-hover)] transition-colors',
            currentPage >= totalPages && 'opacity-40 pointer-events-none'
          )}
          aria-label="Next page"
        >
          <ChevronRight className="w-4 h-4" />
        </Link>
      ) : (
        <button
          type="button"
          disabled={currentPage >= totalPages}
          onClick={() => onPageChange?.(currentPage + 1)}
          className="inline-flex items-center justify-center w-9 h-9 rounded-[8px] border border-[var(--line)] bg-[var(--surface)] text-[var(--ink)] hover:bg-[var(--surface-hover)] disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
          aria-label="Next page"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      )}
    </nav>
  );
}
