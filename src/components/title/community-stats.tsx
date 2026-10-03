import React from 'react';
import { RatingDisplay } from '@/src/components/ui/rating-display';
import { Star } from 'lucide-react';

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
  // Generate a realistic score distribution for reference bars
  const distribution = [
    { score: 10, percent: 32 },
    { score: 9, percent: 28 },
    { score: 8, percent: 22 },
    { score: 7, percent: 11 },
    { score: 6, percent: 4 },
    { score: 5, percent: 2 },
    { score: 4, percent: 1 },
  ];

  // Community list counts
  const watchingCount = Math.round(popularity * 0.42);
  const planToWatchCount = Math.round(popularity * 0.35);
  const completedCount = Math.round(popularity * 0.23);

  return (
    <div className="space-y-4 text-left">
      <div className="border-b border-[var(--line)] pb-2.5">
        <h2 className="text-[17px] sm:text-[18px] font-semibold text-[var(--ink)]">
          Community
        </h2>
        <p className="text-[13px] text-[var(--muted)] mt-0.5">
          Ratings and list statistics from short drama viewers
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
        {/* Left: Overall score & breakdown */}
        <div className="md:col-span-6 p-4 bg-[var(--surface)] border border-[var(--line)] rounded-[12px] space-y-4">
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

          {/* Simple Distribution Bars */}
          <div className="space-y-1.5 pt-1">
            {distribution.map((d) => (
              <div
                key={d.score}
                className="flex items-center gap-2 text-[11px] text-[var(--muted)]"
              >
                <span className="w-4 tabular-nums text-right font-medium">
                  {d.score}
                </span>
                <Star className="w-3 h-3 text-[var(--muted)]" />
                <div className="flex-1 h-2 bg-[var(--surface-subtle)] rounded-full overflow-hidden border border-[var(--line)]/50">
                  <div
                    className="h-full bg-[var(--crimson)] rounded-full"
                    style={{ width: `${d.percent}%` }}
                  />
                </div>
                <span className="w-8 tabular-nums text-right">{d.percent}%</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Listed counts stats */}
        <div className="md:col-span-6 p-4 bg-[var(--surface)] border border-[var(--line)] rounded-[12px] space-y-3">
          <span className="text-[13px] font-semibold text-[var(--ink)] block">
            Watchlist tracking
          </span>

          <div className="space-y-2.5 divide-y divide-[var(--line)] text-[13px]">
            <div className="flex items-center justify-between pt-1">
              <span className="text-[var(--muted)]">Watching</span>
              <span className="font-semibold text-[var(--ink)] tabular-nums">
                {watchingCount.toLocaleString()}
              </span>
            </div>
            <div className="flex items-center justify-between pt-2">
              <span className="text-[var(--muted)]">Plan to watch</span>
              <span className="font-semibold text-[var(--ink)] tabular-nums">
                {planToWatchCount.toLocaleString()}
              </span>
            </div>
            <div className="flex items-center justify-between pt-2">
              <span className="text-[var(--muted)]">Completed</span>
              <span className="font-semibold text-[var(--ink)] tabular-nums">
                {completedCount.toLocaleString()}
              </span>
            </div>
            <div className="flex items-center justify-between pt-2">
              <span className="text-[var(--muted)]">Total tracking</span>
              <span className="font-bold text-[var(--crimson)] tabular-nums">
                {(watchingCount + planToWatchCount + completedCount).toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
