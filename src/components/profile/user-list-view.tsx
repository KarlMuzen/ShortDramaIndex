'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Series, ListStatus } from '@/src/data/types';
import { titlePath } from '@/src/lib/urls';
import { updateListEntryAction } from '@/src/data/actions';
import { useToast } from '@/src/components/ui/toast';
import { Poster } from '@/src/components/ui/poster';
import { Select } from '@/src/components/ui/select';
import { EmptyState } from '@/src/components/ui/empty-state';
import { Star, Plus, Minus, Check, ArrowRight } from 'lucide-react';

export interface UserListEntryItem {
  userId: string;
  seriesId: number;
  status: ListStatus;
  score?: number;
  episodesWatched?: number;
  updatedAt: string;
  series: Series;
}

interface UserListViewProps {
  initialEntries: UserListEntryItem[];
  isOwner?: boolean;
}

const SUB_FILTERS: { status: string; label: string }[] = [
  { status: 'all', label: 'All titles' },
  { status: 'watching', label: 'Watching' },
  { status: 'plan_to_watch', label: 'Plan to watch' },
  { status: 'completed', label: 'Completed' },
  { status: 'dropped', label: 'Dropped' },
];

export function UserListView({ initialEntries, isOwner = true }: UserListViewProps) {
  const { showToast } = useToast();
  const [entries, setEntries] = useState<UserListEntryItem[]>(initialEntries);
  const [activeFilter, setActiveFilter] = useState<string>('all');

  const filteredEntries = entries.filter((e) => {
    if (activeFilter === 'all') return true;
    return e.status === activeFilter;
  });

  const handleStatusChange = async (seriesId: number, newStatus: ListStatus) => {
    // Optimistic UI update
    setEntries((prev) =>
      prev.map((item) =>
        item.seriesId === seriesId ? { ...item, status: newStatus } : item
      )
    );

    const res = await updateListEntryAction({ seriesId, status: newStatus });
    if (res.success) {
      showToast({
        title: 'Status updated',
        description: `Updated status to ${newStatus.replace(/_/g, ' ')}.`,
        type: 'success',
      });
    }
  };

  const handleEpisodeProgress = async (seriesId: number, delta: number) => {
    const target = entries.find((e) => e.seriesId === seriesId);
    if (!target) return;

    const currentWatched = target.episodesWatched || 0;
    const maxEps = target.series.episodeCount || 100;
    const nextWatched = Math.min(maxEps, Math.max(0, currentWatched + delta));

    // Optimistic update
    setEntries((prev) =>
      prev.map((item) =>
        item.seriesId === seriesId ? { ...item, episodesWatched: nextWatched } : item
      )
    );

    await updateListEntryAction({ seriesId, episodesWatched: nextWatched });
  };

  return (
    <div className="space-y-4 text-left">
      {/* Sub-filter chips / buttons */}
      <div className="flex flex-wrap items-center gap-1.5 border-b border-[var(--line)] pb-3">
        {SUB_FILTERS.map((f) => {
          const count =
            f.status === 'all'
              ? entries.length
              : entries.filter((e) => e.status === f.status).length;
          const isActive = activeFilter === f.status;

          return (
            <button
              key={f.status}
              type="button"
              onClick={() => setActiveFilter(f.status)}
              className={`px-3 py-1.5 rounded-[8px] text-[13px] font-medium transition-colors flex items-center gap-1.5 cursor-pointer ${
                isActive
                  ? 'bg-[var(--crimson)] text-white'
                  : 'bg-[var(--surface)] text-[var(--ink)] border border-[var(--line)] hover:bg-[var(--surface-hover)]'
              }`}
            >
              <span>{f.label}</span>
              <span
                className={`text-[11px] tabular-nums font-semibold ${
                  isActive ? 'text-white/90' : 'text-[var(--muted)]'
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Results View */}
      {filteredEntries.length > 0 ? (
        <>
          {/* Desktop Dense Table */}
          <div className="hidden md:block w-full overflow-x-auto">
            <table className="w-full text-left border-collapse text-[13px]">
              <thead>
                <tr className="border-b border-[var(--line)] text-[12px] uppercase tracking-wider font-semibold text-[var(--muted)]">
                  <th scope="col" className="py-2.5 px-2 w-14">
                    Poster
                  </th>
                  <th scope="col" className="py-2.5 px-3">
                    Title
                  </th>
                  <th scope="col" className="py-2.5 px-3 w-36">
                    Progress
                  </th>
                  <th scope="col" className="py-2.5 px-3 w-24">
                    Rating
                  </th>
                  <th scope="col" className="py-2.5 pl-3 pr-2 w-36 text-right">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--line)]">
                {filteredEntries.map((item) => {
                  const watched = item.episodesWatched || 0;
                  const total = item.series.episodeCount || 80;

                  return (
                    <tr key={item.seriesId} className="hover:bg-[var(--surface-hover)] transition-colors">
                      {/* Thumbnail */}
                      <td className="py-2.5 px-2 align-middle">
                        <Link href={titlePath(item.series)} className="block w-10 aspect-[9/16]">
                          <Poster
                            title={item.series.title}
                            src={item.series.posterUrl}
                            className="rounded-[4px] h-full"
                          />
                        </Link>
                      </td>

                      {/* Title */}
                      <td className="py-2.5 px-3 align-middle">
                        <Link
                          href={titlePath(item.series)}
                          className="font-semibold text-[14px] text-[var(--ink)] hover:text-[var(--crimson)] hover:underline leading-snug line-clamp-1 block"
                        >
                          {item.series.title}
                        </Link>
                        <span className="text-[11px] text-[var(--muted)] tabular-nums">
                          {item.series.year} • {item.series.tags[0]?.name || 'Drama'}
                        </span>
                      </td>

                      {/* Progress Stepper */}
                      <td className="py-2.5 px-3 align-middle whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          {isOwner && (
                            <button
                              type="button"
                              onClick={() => handleEpisodeProgress(item.seriesId, -1)}
                              disabled={watched <= 0}
                              className="w-6 h-6 rounded-[4px] border border-[var(--line)] flex items-center justify-center text-[var(--muted)] hover:text-[var(--ink)] hover:bg-[var(--surface)] disabled:opacity-30 cursor-pointer"
                              aria-label="Decrease watched episode"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                          )}
                          <span className="text-[12px] font-medium text-[var(--ink)] tabular-nums">
                            ep {watched} of {total}
                          </span>
                          {isOwner && (
                            <button
                              type="button"
                              onClick={() => handleEpisodeProgress(item.seriesId, 1)}
                              disabled={watched >= total}
                              className="w-6 h-6 rounded-[4px] border border-[var(--line)] flex items-center justify-center text-[var(--muted)] hover:text-[var(--ink)] hover:bg-[var(--surface)] disabled:opacity-30 cursor-pointer"
                              aria-label="Increase watched episode"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      </td>

                      {/* Rating */}
                      <td className="py-2.5 px-3 align-middle">
                        {item.score ? (
                          <div className="flex items-center gap-1 text-[13px] font-semibold text-[var(--ink)]">
                            <Star className="w-3.5 h-3.5 fill-[var(--crimson)] text-[var(--crimson)]" />
                            <span className="tabular-nums">{item.score}/10</span>
                          </div>
                        ) : (
                          <span className="text-[12px] text-[var(--muted)]">—</span>
                        )}
                      </td>

                      {/* Inline Status Select */}
                      <td className="py-2.5 pl-3 pr-2 align-middle text-right">
                        {isOwner ? (
                          <div className="w-36 ml-auto">
                            <Select
                              value={item.status}
                              onChange={(e) =>
                                handleStatusChange(item.seriesId, e.target.value as ListStatus)
                              }
                              options={[
                                { value: 'watching', label: 'Watching' },
                                { value: 'plan_to_watch', label: 'Plan to watch' },
                                { value: 'completed', label: 'Completed' },
                                { value: 'on_hold', label: 'On hold' },
                                { value: 'dropped', label: 'Dropped' },
                              ]}
                              className="h-8 text-[12px]"
                            />
                          </div>
                        ) : (
                          <span className="text-[12px] font-medium text-[var(--muted)] capitalize">
                            {item.status.replace(/_/g, ' ')}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile Compact Rows */}
          <div className="md:hidden divide-y divide-[var(--line)] border-b border-[var(--line)]">
            {filteredEntries.map((item) => {
              const watched = item.episodesWatched || 0;
              const total = item.series.episodeCount || 80;

              return (
                <div key={item.seriesId} className="py-3 flex gap-3 items-start">
                  {/* Thumbnail */}
                  <Link href={titlePath(item.series)} className="w-14 shrink-0 aspect-[9/16]">
                    <Poster
                      title={item.series.title}
                      src={item.series.posterUrl}
                      className="rounded-[6px] h-full"
                    />
                  </Link>

                  {/* Details & Controls */}
                  <div className="flex-1 min-w-0 space-y-2">
                    <Link
                      href={titlePath(item.series)}
                      className="font-semibold text-[14px] text-[var(--ink)] leading-snug line-clamp-1 block hover:text-[var(--crimson)]"
                    >
                      {item.series.title}
                    </Link>

                    {/* Progress and score row */}
                    <div className="flex items-center justify-between gap-2 text-[12px]">
                      <div className="flex items-center gap-1.5">
                        {isOwner && (
                          <button
                            type="button"
                            onClick={() => handleEpisodeProgress(item.seriesId, -1)}
                            disabled={watched <= 0}
                            className="w-5 h-5 rounded-[4px] border border-[var(--line)] flex items-center justify-center text-[var(--muted)] active:bg-[var(--surface-hover)] disabled:opacity-30"
                            aria-label="Previous episode"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                        )}
                        <span className="tabular-nums font-medium text-[var(--ink)]">
                          ep {watched} / {total}
                        </span>
                        {isOwner && (
                          <button
                            type="button"
                            onClick={() => handleEpisodeProgress(item.seriesId, 1)}
                            disabled={watched >= total}
                            className="w-5 h-5 rounded-[4px] border border-[var(--line)] flex items-center justify-center text-[var(--muted)] active:bg-[var(--surface-hover)] disabled:opacity-30"
                            aria-label="Next episode"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        )}
                      </div>

                      {item.score && (
                        <div className="flex items-center gap-1 font-semibold text-[var(--ink)]">
                          <Star className="w-3 h-3 fill-[var(--crimson)] text-[var(--crimson)]" />
                          <span className="tabular-nums">{item.score}/10</span>
                        </div>
                      )}
                    </div>

                    {/* Mobile 2-Tap Status Selector */}
                    {isOwner && (
                      <div className="pt-0.5">
                        <Select
                          value={item.status}
                          onChange={(e) =>
                            handleStatusChange(item.seriesId, e.target.value as ListStatus)
                          }
                          options={[
                            { value: 'watching', label: 'Watching' },
                            { value: 'plan_to_watch', label: 'Plan to watch' },
                            { value: 'completed', label: 'Completed' },
                            { value: 'on_hold', label: 'On hold' },
                            { value: 'dropped', label: 'Dropped' },
                          ]}
                          className="h-8 text-[12px] w-full"
                        />
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      ) : (
        <EmptyState
          title={`No titles in "${activeFilter.replace(/_/g, ' ')}"`}
          description="To add a short drama to your list, visit any title page and click the 'Add to list' button."
          action={
            <Link href="/search" className="inline-flex items-center gap-1.5 text-[13px] font-medium text-[var(--crimson)] hover:underline">
              <span>Browse catalog</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          }
        />
      )}
    </div>
  );
}
