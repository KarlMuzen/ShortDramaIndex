import React from 'react';
import { RatingDisplay } from '@/src/components/ui/rating-display';

interface CommunityStatsProps {
  score: number;
  ratingCount: number;
  popularity?: number;
}

export function CommunityStats({
  score,
  ratingCount,
  popularity = 5000,
}: CommunityStatsProps) {
  // All 10 score distribution rows
  const distribution = [
    { score: 10, percent: 30 },
    { score: 9, percent: 26 },
    { score: 8, percent: 20 },
    { score: 7, percent: 11 },
    { score: 6, percent: 6 },
    { score: 5, percent: 3 },
    { score: 4, percent: 2 },
    { score: 3, percent: 1 },
    { score: 2, percent: 1 },
    { score: 1, percent: 0 },
  ];

  // Community list counts
  const watchingCount = Math.round(popularity * 0.42);
  const planToWatchCount = Math.round(popularity * 0.35);
  const completedCount = Math.round(popularity * 0.23);
  const totalTracking = watchingCount + planToWatchCount + completedCount;

  return (
    <div className="space-y-4 text-left w-full">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
        {/* Left: Overall score & 10-tier breakdown */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[13px] font-semibold text-[var(--ink)]">
              Score rating
            </span>
            <span className="text-[12px] text-[var(--muted)] tabular-nums">
              {ratingCount.toLocaleString()} ratings
            </span>
          </div>

          <div className="flex items-baseline gap-2">
            <RatingDisplay score={score} size="lg" showCount={false} />
          </div>

          {/* 10 Score Rows (No star icon, bars in Muted) */}
          <div className="space-y-1.5 pt-1">
            {distribution.map((d) => (
              <div
                key={d.score}
                className="flex items-center gap-2 text-[12px] text-[var(--muted)]"
              >
                <span className="w-5 tabular-nums text-right font-medium">
                  {d.score}
                </span>
                <div className="flex-1 h-2 bg-[var(--surface-subtle)] rounded-full overflow-hidden border border-[var(--line)]">
                  <div
                    className="h-full bg-[var(--line-strong)] rounded-full"
                    style={{ width: `${d.percent}%` }}
                  />
                </div>
                <span className="w-8 tabular-nums text-right text-[11px]">
                  {d.percent}%
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Watchlist tracking stats */}
        <div className="space-y-3">
          <span className="text-[13px] font-semibold text-[var(--ink)] block">
            Watchlist tracking
          </span>

          <div className="space-y-2 divide-y divide-[var(--line)] text-[13px] border-y border-[var(--line)]">
            <div className="flex items-center justify-between py-2">
              <span className="text-[var(--muted)]">Watching</span>
              <span className="font-semibold text-[var(--ink)] tabular-nums">
                {watchingCount.toLocaleString()}
              </span>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-[var(--muted)]">Plan to watch</span>
              <span className="font-semibold text-[var(--ink)] tabular-nums">
                {planToWatchCount.toLocaleString()}
              </span>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-[var(--muted)]">Completed</span>
              <span className="font-semibold text-[var(--ink)] tabular-nums">
                {completedCount.toLocaleString()}
              </span>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-[var(--muted)]">Total tracking</span>
              <span className="font-bold text-[var(--ink)] tabular-nums">
                {totalTracking.toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
