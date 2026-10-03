'use client';

import React from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { Platform, Tag } from '@/src/data/types';
import { Button } from '@/src/components/ui/button';
import { Select } from '@/src/components/ui/select';
import { Radio } from '@/src/components/ui/radio';
import { RotateCcw } from 'lucide-react';

interface SearchFiltersProps {
  platforms: Platform[];
  tags: Tag[];
  onApply?: () => void;
  className?: string;
}

export function SearchFilters({
  platforms,
  tags,
  onApply,
  className,
}: SearchFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const currentPlatform = searchParams.get('platform') || '';
  const currentLang = searchParams.get('lang') || '';
  const currentTag = searchParams.get('tag') || '';
  const currentYear = searchParams.get('year') || '';
  const currentStatus = searchParams.get('status') || '';
  const currentEpisodeRange = searchParams.get('episodes') || '';

  const hasActiveFilters = Boolean(
    currentPlatform ||
    currentLang ||
    currentTag ||
    currentYear ||
    currentStatus ||
    currentEpisodeRange
  );

  const updateParam = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
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
    const params = new URLSearchParams(searchParams.toString());
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
    <div className={`space-y-6 text-left ${className || ''}`}>
      {/* Filter Header with Clear Action */}
      <div className="flex items-center justify-between pb-2 border-b border-[var(--line)]">
        <span className="text-[13px] font-semibold text-[var(--ink)] uppercase tracking-wider">
          Filters
        </span>
        {hasActiveFilters && (
          <button
            type="button"
            onClick={clearAllFilters}
            className="text-[12px] text-[var(--crimson)] hover:underline flex items-center gap-1 font-medium cursor-pointer"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Clear all</span>
          </button>
        )}
      </div>

      {/* Platform Filter */}
      <div className="space-y-2">
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

      {/* Title / Original Language Filter */}
      <div className="space-y-2">
        <label className="text-[13px] font-semibold text-[var(--ink)] block">
          Language
        </label>
        <Select
          value={currentLang}
          onChange={(e) => updateParam('lang', e.target.value)}
          options={[
            { value: '', label: 'All languages' },
            { value: 'zh', label: 'Chinese (中文)' },
            { value: 'ko', label: 'Korean (한국어)' },
            { value: 'en', label: 'English' },
            { value: 'es', label: 'Spanish (Español)' },
            { value: 'ja', label: 'Japanese (日本語)' },
          ]}
        />
      </div>

      {/* Tag Filter */}
      <div className="space-y-2">
        <label className="text-[13px] font-semibold text-[var(--ink)] block">
          Genre & Tag
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

      {/* Year Filter */}
      <div className="space-y-2">
        <label className="text-[13px] font-semibold text-[var(--ink)] block">
          Release Year
        </label>
        <Select
          value={currentYear}
          onChange={(e) => updateParam('year', e.target.value)}
          options={[
            { value: '', label: 'All years' },
            { value: '2024', label: '2024' },
            { value: '2023', label: '2023' },
          ]}
        />
      </div>

      {/* Production Status */}
      <div className="space-y-2">
        <label className="text-[13px] font-semibold text-[var(--ink)] block">
          Status
        </label>
        <div className="space-y-1.5">
          <Radio
            name="status_filter"
            value=""
            checked={currentStatus === ''}
            onChange={() => updateParam('status', '')}
            label="All statuses"
          />
          <Radio
            name="status_filter"
            value="completed"
            checked={currentStatus === 'completed'}
            onChange={() => updateParam('status', 'completed')}
            label="Completed"
          />
          <Radio
            name="status_filter"
            value="ongoing"
            checked={currentStatus === 'ongoing'}
            onChange={() => updateParam('status', 'ongoing')}
            label="Ongoing"
          />
        </div>
      </div>

      {/* Episode Count Range */}
      <div className="space-y-2">
        <label className="text-[13px] font-semibold text-[var(--ink)] block">
          Episode count
        </label>
        <div className="space-y-1.5">
          <Radio
            name="episodes_filter"
            value=""
            checked={currentEpisodeRange === ''}
            onChange={() => updateParam('episodes', '')}
            label="Any length"
          />
          <Radio
            name="episodes_filter"
            value="<50"
            checked={currentEpisodeRange === '<50'}
            onChange={() => updateParam('episodes', '<50')}
            label="Under 50 episodes"
          />
          <Radio
            name="episodes_filter"
            value="50-80"
            checked={currentEpisodeRange === '50-80'}
            onChange={() => updateParam('episodes', '50-80')}
            label="50 - 80 episodes"
          />
          <Radio
            name="episodes_filter"
            value="80+"
            checked={currentEpisodeRange === '80+'}
            onChange={() => updateParam('episodes', '80+')}
            label="80+ episodes"
          />
        </div>
      </div>
    </div>
  );
}
