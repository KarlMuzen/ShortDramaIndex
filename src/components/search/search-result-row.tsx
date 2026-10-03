import React from 'react';
import Link from 'next/link';
import { SearchResultItem } from '@/src/data/types';
import { titlePath } from '@/src/lib/urls';
import { Poster } from '@/src/components/ui/poster';
import { Tag } from '@/src/components/ui/tag';
import { StatusMark } from '@/src/components/ui/status-mark';
import { Tv, ExternalLink } from 'lucide-react';

interface SearchResultRowProps {
  item: SearchResultItem;
}

export function SearchResultRow({ item }: SearchResultRowProps) {
  const { series, matchedAlias } = item;
  const path = titlePath(series);
  const placesToWatchCount = series.releases.length;
  const tagsToShow = series.tags.slice(0, 3);

  return (
    <div className="flex gap-3.5 sm:gap-4 p-3.5 sm:p-4 bg-[var(--surface)] border border-[var(--line)] hover:border-[var(--line-strong)] rounded-[12px] transition-colors text-left group">
      {/* 9:16 Compact Poster Thumbnail */}
      <Link
        href={path}
        className="w-16 sm:w-20 shrink-0 select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--crimson)] rounded-[8px]"
        tabIndex={-1}
        aria-hidden="true"
      >
        <Poster
          title={series.title}
          year={series.year}
          episodeCount={series.episodeCount}
          className="rounded-[8px] h-full"
        />
      </Link>

      {/* Details Container */}
      <div className="flex-1 flex flex-col justify-between min-w-0">
        <div className="space-y-1">
          {/* Canonical Title */}
          <div className="flex items-start justify-between gap-2">
            <Link
              href={path}
              className="text-[15px] sm:text-[16px] font-semibold text-[var(--ink)] group-hover:text-[var(--crimson)] transition-colors leading-snug line-clamp-1"
            >
              {series.title}
            </Link>
          </div>

          {/* Matched alias when differing from canonical title */}
          {matchedAlias && (
            <div className="text-[13px] text-[var(--muted)] flex items-baseline gap-1.5 flex-wrap">
              <span className="font-normal text-[var(--muted)]">Matched name:</span>
              <span
                lang={matchedAlias.alias.language}
                className="text-[var(--ink)] font-medium"
              >
                {matchedAlias.matchSnippet ? (
                  <>
                    <span>{matchedAlias.matchSnippet.before}</span>
                    <mark className="bg-[var(--crimson-subtle)] text-[var(--crimson)] font-semibold rounded-[2px] px-0.5">
                      {matchedAlias.matchSnippet.matched}
                    </mark>
                    <span>{matchedAlias.matchSnippet.after}</span>
                  </>
                ) : (
                  <span>{matchedAlias.alias.text}</span>
                )}
              </span>
              <span className="text-[11px] text-[var(--muted)] uppercase tracking-wider">
                ({matchedAlias.languageName})
              </span>
            </div>
          )}

          {/* Metadata: Year, Episode count */}
          <div className="flex items-center gap-3 text-[12px] text-[var(--muted)]">
            <span className="tabular-nums font-semibold text-[var(--ink)]">
              {series.year}
            </span>
            <span className="tabular-nums">
              {series.episodeCount} episodes
            </span>
            <span className="capitalize">{series.productionStatus || 'Completed'}</span>
          </div>
        </div>

        {/* Bottom Row: Tags & Places to Watch */}
        <div className="mt-3 pt-2 border-t border-[var(--line)]/60 flex flex-wrap items-center justify-between gap-2">
          {/* Tags */}
          <div className="flex flex-wrap items-center gap-1.5">
            {tagsToShow.map((t) => (
              <Tag key={t.slug} size="sm" variant="subtle">
                {t.name}
              </Tag>
            ))}
          </div>

          {/* Places to watch */}
          <div className="flex items-center gap-1.5 text-[12px] font-medium text-[var(--muted)]">
            <Tv className="w-3.5 h-3.5 text-[var(--muted)]" />
            <span className="tabular-nums">
              {placesToWatchCount}{' '}
              {placesToWatchCount === 1 ? 'place to watch' : 'places to watch'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
