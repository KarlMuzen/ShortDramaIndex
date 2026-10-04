'use client';

import React from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { Select, SelectOption } from './select';

interface SortSelectProps {
  currentSort?: string;
  options?: SelectOption[];
  className?: string;
}

const DEFAULT_SORT_OPTIONS: SelectOption[] = [
  { value: 'popularity', label: 'Popular' },
  { value: 'newest', label: 'Newest' },
  { value: 'rating', label: 'Highest rated' },
];

export function SortSelect({
  currentSort = 'popularity',
  options = DEFAULT_SORT_OPTIONS,
  className,
}: SortSelectProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const handleSortChange = (newSort: string) => {
    const params = new URLSearchParams(searchParams ? searchParams.toString() : '');
    if (newSort && newSort !== 'popularity') {
      params.set('sort', newSort);
    } else {
      params.delete('sort');
    }
    params.delete('page');
    const queryString = params.toString();
    router.push(queryString ? `${pathname}?${queryString}` : pathname);
  };

  return (
    <div className={`flex items-center gap-1.5 shrink-0 ml-auto ${className || ''}`}>
      <span className="text-[12px] text-[var(--muted)] hidden sm:inline">
        Sort:
      </span>
      <div className="w-32 sm:w-36">
        <Select
          value={currentSort}
          onChange={(e) => handleSortChange(e.target.value)}
          options={options}
          className="h-8 text-[12px]"
          aria-label="Sort order"
        />
      </div>
    </div>
  );
}
