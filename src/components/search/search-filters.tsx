'use client';

import React from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { Platform, Tag } from '@/src/data/types';
import { Select } from '@/src/components/ui/select';
import { Radio } from '@/src/components/ui/radio';
import { RotateCcw } from 'lucide-react';

interface SearchFiltersProps {
  platforms: Platform[];
  tags: Tag[];
  onApply?: () => void;
  className?: string;
  hideHeader?: boolean;
}

export function SearchFilters({
  platforms,
  tags,
  onApply,
  className,
  hideHeader = false,
}: SearchFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const currentPlatform = searchParams?.get('platform') || '';
  const currentLang = searchParams?.get('lang') || '';
  const currentTag = searchParams?.get('tag') || '';
  const currentYear = searchParams?.get('year') || '';
  const currentStatus = searchParams?.get('status') || '';

  const hasActiveFilters = Boolean(
    currentPlatform ||
    currentLang ||
    currentTag ||
    currentYear ||
    currentStatus
  );

  const updateParam = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams ? searchParams.toString() : '');
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    params.delete('page'); // Reset to page 1 on filter change
    router.push(`${pathname}?${params.toString()}`);
    onApply?.();
  };

  const clearAllFilters = () => {
    const params = new URLSearchParams(searchParams ? searchParams.toString() : '');
    params.delete('platform');
    params.delete('lang');
    params.delete('tag');
    params.delete('year');
    params.delete('status');
    params.delete('episodes');
    params.delete('page');
    router.push(`${pathname}?${params.toString()}`);
    onApply?.();
  };

  return (
    <div className={`space-y-5 text-left w-full min-w-0 ${className || ''}`}>
      {/* Optional Header for Desktop Sidebar without "FILTERS" label */}
      {!hideHeader && (
        <div className="flex items-center justify-between pb-2 border-b border-[var(--line)]">
          <span className="text-[14px] font-semibold text-[var(--ink)]">
            Filter options
          </span>
          {hasActiveFilters && (
            <button
              type="button"
              onClick={clearAllFilters}
              className="text-[12px] text-[var(--crimson)] hover:underline flex items-center gap-1 font-medium cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Clear filters</span>
            </button>
          )}
        </div>
      )}

      {/* 1. Platform Filter */}
      <div className="space-y-1.5 w-full min-w-0">
        <label className="text-[13px] font-semibold text-[var(--ink)] block">
          Platform
        </label>
        <Select
          value={currentPlatform}
          onChange={(e) => updateParam('platform', e.target.value)}
          options={[
            { value: '', label: 'All platforms' },
            ...platforms.map((p) => ({
              value: p.slug,
              label: p.name,
            })),
          ]}
        />
      </div>

      {/* 2. Language Filter */}
      <div className="space-y-1.5 w-full min-w-0">
        <label className="text-[13px] font-semibold text-[var(--ink)] block">
          Language
        </label>
        <Select
          value={currentLang}
          onChange={(e) => updateParam('lang', e.target.value)}
          options={[
            { value: '', label: 'All languages' },
            { value: 'en', label: 'English' },
            { value: 'zh', label: 'Chinese (中文)' },
            { value: 'ko', label: 'Korean (한국어)' },
            { value: 'es', label: 'Spanish (Español)' },
            { value: 'ja', label: 'Japanese (日本語)' },
          ]}
        />
      </div>

      {/* 3. Tag Filter */}
      <div className="space-y-1.5 w-full min-w-0">
        <label className="text-[13px] font-semibold text-[var(--ink)] block">
          Tag
        </label>
        <Select
          value={currentTag}
          onChange={(e) => updateParam('tag', e.target.value)}
          options={[
            { value: '', label: 'All tags' },
            ...tags.map((t) => ({
              value: t.slug,
              label: t.name,
            })),
          ]}
        />
      </div>

      {/* 4. Release Year Filter */}
      <div className="space-y-1.5 w-full min-w-0">
        <label className="text-[13px] font-semibold text-[var(--ink)] block">
          Release year
        </label>
        <Select
          value={currentYear}
          onChange={(e) => updateParam('year', e.target.value)}
          options={[
            { value: '', label: 'All years' },
            { value: '2026', label: '2026' },
            { value: '2025', label: '2025' },
            { value: '2024', label: '2024' },
            { value: '2023', label: '2023' },
          ]}
        />
      </div>

      {/* 5. Status: Stacked vertically as 44px rows */}
      <div className="space-y-1.5 w-full min-w-0">
        <label className="text-[13px] font-semibold text-[var(--ink)] block">
          Status
        </label>
        <div className="space-y-1 w-full min-w-0">
          <Radio
            name="status_filter"
            value=""
            checked={currentStatus === ''}
            onChange={() => updateParam('status', '')}
            label="All statuses"
            className="w-full min-h-[44px] flex items-center px-3 py-2 rounded-[8px] bg-[var(--surface-subtle)]/50 hover:bg-[var(--surface-subtle)] border border-transparent hover:border-[var(--line)] transition-colors box-border"
          />
          <Radio
            name="status_filter"
            value="completed"
            checked={currentStatus === 'completed'}
            onChange={() => updateParam('status', 'completed')}
            label="Completed"
            className="w-full min-h-[44px] flex items-center px-3 py-2 rounded-[8px] bg-[var(--surface-subtle)]/50 hover:bg-[var(--surface-subtle)] border border-transparent hover:border-[var(--line)] transition-colors box-border"
          />
          <Radio
            name="status_filter"
            value="ongoing"
            checked={currentStatus === 'ongoing'}
            onChange={() => updateParam('status', 'ongoing')}
            label="Ongoing"
            className="w-full min-h-[44px] flex items-center px-3 py-2 rounded-[8px] bg-[var(--surface-subtle)]/50 hover:bg-[var(--surface-subtle)] border border-transparent hover:border-[var(--line)] transition-colors box-border"
          />
        </div>
      </div>
    </div>
  );
}
