import React from 'react';
import Link from 'next/link';
import { SearchResultItem } from '@/src/data/types';
import { titlePath } from '@/src/lib/urls';
import { getLanguageName } from '@/src/lib/languages';
import { Poster } from '@/src/components/ui/poster';
import { Star } from 'lucide-react';

interface SearchResultRowProps {
  item: SearchResultItem;
}

export function SearchResultRow({ item }: SearchResultRowProps) {
  const { series, matchedAlias } = item;
  const path = titlePath(series);
  // Search listings carry releaseCount from the RPC (migration 00009);
  // fall back to loaded releases for detail/homepage series objects.
  const placesToWatchCount = series.releaseCount ?? series.releases.length;

  return (
    <div className="flex gap-4 items-start py-4 border-b border-[var(--line)] text-left group">
      {/* 72px Poster Thumbnail - no card around it */}
      <Link
        href={path}
        className="w-[72px] shrink-0 aspect-[9/16] select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--crimson)] rounded-[8px]"
        tabIndex={-1}
        aria-hidden="true"
      >
        <Poster
          title={series.title}
          src={series.posterUrl}
          className="rounded-[8px] h-full group-hover:border-[var(--line-strong)] transition-colors"
        />
      </Link>

      {/* Details Container */}
      <div className="flex-1 min-w-0 space-y-1.5">
        {/* Title */}
        <Link
          href={path}
          className="text-[15px] sm:text-[16px] font-semibold text-[var(--ink)] group-hover:text-[var(--crimson)] transition-colors leading-snug line-clamp-1 block"
        >
          {series.title}
        </Link>

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
            <span className="text-[11px] text-[var(--muted)]">
              ({matchedAlias.languageName})
            </span>
          </div>
        )}

        {/* Meta line: separate spans with 8px gaps */}
        <div className="flex items-center gap-2 text-[12px] text-[var(--muted)] tabular-nums">
          <span>{series.year}</span>
          <span>{series.episodeCount} eps</span>
          <span className="font-medium text-[var(--status-verified)]">
            Original {getLanguageName(series.originalLanguage)}
          </span>
          {series.ratingScore > 0 && (
            <span className="inline-flex items-center gap-1 text-[var(--ink)] font-semibold">
              <Star className="w-3 h-3 fill-[var(--crimson)] text-[var(--crimson)] shrink-0" />
              {series.ratingScore.toFixed(1)}
            </span>
          )}
        </div>

        {/* Tags as plain muted text */}
        {series.tags && series.tags.length > 0 && (
          <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[12px] text-[var(--muted)]">
            {series.tags.map((t) => (
              <span key={t.slug}>{t.name}</span>
            ))}
          </div>
        )}

        {/* Places to watch */}
        <div className="text-[12px] text-[var(--muted)] tabular-nums pt-0.5">
          {placesToWatchCount}{' '}
          {placesToWatchCount === 1 ? 'place to watch' : 'places to watch'}
        </div>
      </div>
    </div>
  );
}
