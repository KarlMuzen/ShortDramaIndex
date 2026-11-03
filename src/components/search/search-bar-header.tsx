'use client';

import React, { useState } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { Button } from '@/src/components/ui/button';
import { Dialog } from '@/src/components/ui/dialog';
import { Select } from '@/src/components/ui/select';
import { SearchFilters } from './search-filters';
import { Platform, Tag } from '@/src/data/types';
import { SEARCH_PLACEHOLDER } from '@/src/config/site';
import { Search, SlidersHorizontal, Link as LinkIcon, X } from 'lucide-react';

interface SearchBarHeaderProps {
  initialQuery?: string;
  totalResults: number;
  platforms: Platform[];
  tags: Tag[];
}

export function SearchBarHeader({
  initialQuery = '',
  totalResults,
  platforms,
  tags,
}: SearchBarHeaderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [query, setQuery] = useState(initialQuery);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [pasteLinkOpen, setPasteLinkOpen] = useState(false);
  const [pasteLinkInput, setPasteLinkInput] = useState('');

  const currentSort = searchParams?.get('sort') || 'relevance';

  // Count active filters (excluding query, sort, page)
  const activeFilterCount = [
    'platform',
    'lang',
    'tag',
    'year',
    'status',
    'episodes',
  ].filter((key) => Boolean(searchParams?.get(key))).length;

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams(searchParams ? searchParams.toString() : '');
    if (query.trim()) {
      params.set('q', query.trim());
    } else {
      params.delete('q');
    }
    params.delete('page');
    router.push(`${pathname}?${params.toString()}`);
  };

  const handleSortChange = (newSort: string) => {
    const params = new URLSearchParams(searchParams ? searchParams.toString() : '');
    if (newSort && newSort !== 'relevance') {
      params.set('sort', newSort);
    } else {
      params.delete('sort');
    }
    params.delete('page');
    router.push(`${pathname}?${params.toString()}`);
  };

  const handlePasteLinkSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pasteLinkInput.trim()) {
      const params = new URLSearchParams();
      params.set('q', pasteLinkInput.trim());
      router.push(`${pathname}?${params.toString()}`);
      setPasteLinkOpen(false);
    }
  };

  return (
    <div className="space-y-4 text-left">
      {/* Top Search Input Row */}
      <form onSubmit={handleSearchSubmit} className="flex items-center gap-2">
        <div className="relative flex-1 flex items-center">
          <Search className="w-4 h-4 text-[var(--muted)] absolute left-3 pointer-events-none" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={SEARCH_PLACEHOLDER}
            className="w-full h-11 pl-9 pr-8 text-[14px] bg-[var(--surface)] text-[var(--ink)] placeholder:text-[var(--muted)] rounded-[8px] border border-[var(--line)] hover:border-[var(--line-strong)] focus:border-[var(--crimson)] outline-none transition-colors"
          />
          {query && (
            <button
              type="button"
              onClick={() => {
                setQuery('');
                const params = new URLSearchParams(searchParams ? searchParams.toString() : '');
                params.delete('q');
                params.delete('page');
                router.push(`${pathname}?${params.toString()}`);
              }}
              className="absolute right-2.5 p-1 text-[var(--muted)] hover:text-[var(--ink)]"
              aria-label="Clear search"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <Button type="submit" variant="primary" size="md" className="h-11 px-4">
          Search
        </Button>

        <Button
          type="button"
          variant="secondary"
          size="md"
          onClick={() => {
            setPasteLinkOpen(true);
            setPasteLinkInput('');
          }}
          leftIcon={<LinkIcon className="w-4 h-4 text-[var(--muted)]" />}
          className="h-11 px-3 text-[13px] hidden sm:inline-flex"
        >
          Paste a link
        </Button>
      </form>

      {/* Search count on its own line */}
      <div className="text-[13px] text-[var(--muted)] pt-1">
        Showing <strong className="text-[var(--ink)] tabular-nums font-semibold">{totalResults}</strong> {totalResults === 1 ? 'short drama' : 'short dramas'}
      </div>

      {/* Controls row: Filters button & Sort select */}
      <div className="flex items-center justify-between gap-2.5">
        {/* Mobile Filters button */}
        <div className="lg:hidden">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setMobileFiltersOpen(true)}
            leftIcon={<SlidersHorizontal className="w-3.5 h-3.5" />}
            className="relative"
          >
            <span>Filters</span>
            {activeFilterCount > 0 && (
              <span className="w-4 h-4 rounded-full bg-[var(--crimson)] text-white text-[10px] font-bold flex items-center justify-center -mr-1">
                {activeFilterCount}
              </span>
            )}
          </Button>
        </div>

        {/* Desktop / Mobile Sort Selector */}
        <div className="flex items-center gap-1.5 shrink-0 ml-auto">
          <span className="text-[12px] text-[var(--muted)] hidden sm:inline">
            Sort:
          </span>
          <div className="w-32 sm:w-36">
            <Select
              value={currentSort}
              onChange={(e) => handleSortChange(e.target.value)}
              options={[
                { value: 'relevance', label: 'Best match' },
                { value: 'popularity', label: 'Popular' },
                { value: 'newest', label: 'Newest' },
                { value: 'rating', label: 'Highest rated' },
              ]}
              className="h-8 text-[12px]"
            />
          </div>
        </div>
      </div>

      {/* Mobile Filters Bottom Sheet Dialog */}
      <Dialog
        open={mobileFiltersOpen}
        onClose={() => setMobileFiltersOpen(false)}
        title="Filter results"
        footer={
          <div className="flex items-center justify-between w-full">
            <Button
              variant="quiet"
              size="sm"
              onClick={() => {
                const params = new URLSearchParams(searchParams ? searchParams.toString() : '');
                params.delete('platform');
                params.delete('lang');
                params.delete('tag');
                params.delete('year');
                params.delete('status');
                params.delete('episodes');
                params.delete('page');
                router.push(`${pathname}?${params.toString()}`);
                setMobileFiltersOpen(false);
              }}
            >
              Clear filters
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => setMobileFiltersOpen(false)}
            >
              Show results
            </Button>
          </div>
        }
      >
        <SearchFilters
          platforms={platforms}
          tags={tags}
          onApply={() => setMobileFiltersOpen(false)}
          hideHeader={true}
        />
      </Dialog>

      {/* Paste a link Modal / Bottom Sheet */}
      <Dialog
        open={pasteLinkOpen}
        onClose={() => setPasteLinkOpen(false)}
        title="Paste a link"
        maxWidth="md"
      >
        <form onSubmit={handlePasteLinkSubmit} className="space-y-4 text-left">
          <div className="space-y-1.5">
            <label className="text-[13px] font-medium text-[var(--ink)] block">
              Watch link URL
            </label>
            <input
              type="url"
              value={pasteLinkInput}
              onChange={(e) => setPasteLinkInput(e.target.value)}
              placeholder="https://www.reelshort.com/series/101"
              required
              className="w-full min-w-0 h-10 px-3 text-[14px] bg-[var(--surface)] text-[var(--ink)] placeholder:text-[var(--muted)] rounded-[8px] border border-[var(--line)] hover:border-[var(--line-strong)] focus:outline-2 focus:outline-[var(--crimson)] focus:outline-offset-0 outline-none transition-colors"
            />
          </div>

          <div className="flex items-center justify-between gap-2 pt-1">
            <div className="text-[12px] text-[var(--muted)]">
              <span className="mr-1">Sample:</span>
              <button
                type="button"
                onClick={() =>
                  setPasteLinkInput('https://www.reelshort.com/series/101')
                }
                className="underline hover:text-[var(--ink)] cursor-pointer"
              >
                ReelShort link
              </button>
            </div>

            <Button type="submit" variant="primary" size="sm">
              Look up link
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
}
