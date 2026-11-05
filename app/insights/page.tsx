import React from 'react';
import { Metadata } from 'next';
import { siteConfig } from '@/src/config/site';
import { Breadcrumb } from '@/src/components/ui/breadcrumb';
import { getMarketInsights } from '@/src/data/repository';
import { BarChart3 } from 'lucide-react';

export const revalidate = 300;

export const metadata: Metadata = {
  title: 'Vertical Drama Market Intelligence & Benchmarks | ShortDramaIndex',
  description:
    'Market benchmarks computed from the ShortDramaIndex catalog: monetization model split across US and Indian platforms, average episode counts by platform, top tropes, and production formats.',
  alternates: {
    canonical: `${siteConfig.baseUrl}/insights`,
  },
  openGraph: {
    title: 'Vertical Drama Market Intelligence & Benchmarks | ShortDramaIndex',
    description:
      'Market benchmarks computed from the ShortDramaIndex catalog: monetization, episode averages, top tropes, and production formats.',
    url: `${siteConfig.baseUrl}/insights`,
    type: 'website',
    siteName: siteConfig.name,
  },
  twitter: {
    card: 'summary',
    title: 'Vertical Drama Market Intelligence & Benchmarks | ShortDramaIndex',
    description:
      'Market benchmarks computed from the ShortDramaIndex catalog: monetization, episode averages, top tropes, and production formats.',
  },
};

function formatPct(value: number): string {
  return `${value.toFixed(1)}%`;
}

function formatAvg(value: number): string {
  return value.toFixed(1);
}

function SplitBar({
  label,
  count,
  total,
  pct,
  tone,
}: {
  label: string;
  count: number;
  total: number;
  pct: number;
  tone: 'crimson' | 'verified';
}) {
  return (
    <div className="space-y-1">
      <div className="flex items-baseline justify-between text-[13px]">
        <span className="text-[var(--ink)]">{label}</span>
        <span className="text-[var(--muted)] tabular-nums">
          {total === 0 ? (
            'Not recorded'
          ) : (
            <>
              <span className="font-semibold text-[var(--ink)]">{formatPct(pct)}</span>
              {' · '}
              {count} of {total}
            </>
          )}
        </span>
      </div>
      <div
        className="h-2 w-full rounded-full bg-[var(--surface-subtle)] overflow-hidden"
        role="img"
        aria-label={`${label}: ${formatPct(pct)}`}
      >
        <div
          className={
            tone === 'crimson'
              ? 'h-full rounded-full bg-[var(--crimson)]'
              : 'h-full rounded-full bg-[var(--status-verified)]'
          }
          style={{ width: `${Math.min(100, Math.max(0, pct))}%` }}
        />
      </div>
    </div>
  );
}

export default async function InsightsPage() {
  const insights = await getMarketInsights();
  const topTropeCount = insights.topTropes[0]?.seriesCount || 0;
  const aiAssistedCount =
    insights.productionFormat.find((row) => row.type === 'ai_assisted')
      ?.seriesCount || 0;

  return (
    <div className="space-y-8 pb-20 text-left max-w-5xl mx-auto">
      <Breadcrumb
        items={[
          { label: 'Home', href: '/' },
          { label: 'Market insights', isCurrent: true },
        ]}
      />

      <header className="space-y-2 border-b border-[var(--line)] pb-4">
        <div className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-[var(--crimson)]">
          <BarChart3 className="w-3.5 h-3.5" />
          <span>Market Intelligence</span>
        </div>
        <h1 className="text-[28px] sm:text-[36px] font-semibold text-[var(--ink)] tracking-tight">
          Vertical Drama Market Intelligence &amp; Benchmarks
        </h1>
        <p className="text-[14px] text-[var(--muted)]">
          Benchmarks computed live from the {siteConfig.name} catalog —{' '}
          <span className="font-semibold text-[var(--ink)] tabular-nums">
            {insights.totalSeries} public titles
          </span>{' '}
          across{' '}
          <span className="font-semibold text-[var(--ink)] tabular-nums">
            {insights.totalReleases} releases
          </span>{' '}
          on{' '}
          <span className="font-semibold text-[var(--ink)] tabular-nums">
            {insights.platformsWithReleases} platforms
          </span>
          , refreshed every 5 minutes. No estimates: every number below is
          counted from indexed titles, releases, and tags.
        </p>
      </header>

      {insights.totalSeries === 0 ? (
        <section className="p-6 bg-[var(--surface)] border border-[var(--line)] rounded-[12px]">
          <p className="text-[14px] text-[var(--muted)]">
            No public titles are indexed yet, so there is nothing to benchmark.
            Benchmarks will appear here once titles are imported.
          </p>
        </section>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
          {/* Card 1: Monetization Model Split */}
          <section
            aria-labelledby="monetization-heading"
            className="p-5 sm:p-6 bg-[var(--surface)] border border-[var(--line)] rounded-[12px] space-y-5"
          >
            <div className="space-y-1">
              <h2
                id="monetization-heading"
                className="text-[18px] font-semibold text-[var(--ink)]"
              >
                Monetization Model Split
              </h2>
              <p className="text-[13px] text-[var(--muted)]">
                Ad-supported vs coin paywall, by market. Percentages are over
                releases in each market that record a monetization type.
              </p>
            </div>

            <div className="space-y-4">
              <div className="space-y-2.5">
                <h3 className="text-[13px] font-semibold text-[var(--ink)]">
                  US platforms{' '}
                  <span className="font-normal text-[var(--muted)] tabular-nums">
                    — {insights.monetization.us.total} releases
                  </span>
                </h3>
                <SplitBar
                  label="Coin paywall"
                  count={insights.monetization.us.coinPerEpisode}
                  total={insights.monetization.us.knownTotal}
                  pct={insights.monetization.us.coinPct}
                  tone="crimson"
                />
                <SplitBar
                  label="Ad-supported"
                  count={insights.monetization.us.adSupported}
                  total={insights.monetization.us.knownTotal}
                  pct={insights.monetization.us.adPct}
                  tone="verified"
                />
              </div>

              <div className="space-y-2.5 border-t border-[var(--line)] pt-4">
                <h3 className="text-[13px] font-semibold text-[var(--ink)]">
                  Indian platforms{' '}
                  <span className="font-normal text-[var(--muted)] tabular-nums">
                    — {insights.monetization.india.total} releases
                  </span>
                </h3>
                <SplitBar
                  label="Coin paywall"
                  count={insights.monetization.india.coinPerEpisode}
                  total={insights.monetization.india.knownTotal}
                  pct={insights.monetization.india.coinPct}
                  tone="crimson"
                />
                <SplitBar
                  label="Ad-supported"
                  count={insights.monetization.india.adSupported}
                  total={insights.monetization.india.knownTotal}
                  pct={insights.monetization.india.adPct}
                  tone="verified"
                />
              </div>
            </div>

            <p className="text-[12px] text-[var(--muted)] border-t border-[var(--line)] pt-3">
              US: ReelShort, DramaBox, ShortMax, GoodShort. India: Kuku TV, ZO
              TV, Pocket Saga.
              {insights.monetization.otherReleases > 0
                ? ` ${insights.monetization.otherReleases} release(s) on other platforms are outside this split.`
                : ' Every catalogued release falls in one of the two markets.'}
            </p>
          </section>

          {/* Card 2: Platform Episode Averages */}
          <section
            aria-labelledby="episodes-heading"
            className="p-5 sm:p-6 bg-[var(--surface)] border border-[var(--line)] rounded-[12px] space-y-5"
          >
            <div className="space-y-1">
              <h2
                id="episodes-heading"
                className="text-[18px] font-semibold text-[var(--ink)]"
              >
                Platform Episode Averages
              </h2>
              <p className="text-[13px] text-[var(--muted)]">
                Average, median, and range of episode counts per title on each
                platform.
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-[13px]">
                <thead>
                  <tr className="text-left text-[var(--muted)] border-b border-[var(--line)]">
                    <th scope="col" className="py-2 pr-2 font-medium">
                      Platform
                    </th>
                    <th scope="col" className="py-2 px-2 font-medium text-right tabular-nums">
                      Titles
                    </th>
                    <th scope="col" className="py-2 px-2 font-medium text-right tabular-nums">
                      Avg eps
                    </th>
                    <th scope="col" className="py-2 px-2 font-medium text-right tabular-nums">
                      Median
                    </th>
                    <th scope="col" className="py-2 pl-2 font-medium text-right tabular-nums">
                      Range
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {insights.platformEpisodeAverages.map((row) => (
                    <tr
                      key={row.slug}
                      className="border-b border-[var(--line)] last:border-0"
                    >
                      <th
                        scope="row"
                        className="py-2.5 pr-2 font-medium text-[var(--ink)] text-left"
                      >
                        {row.name}
                      </th>
                      <td className="py-2.5 px-2 text-right tabular-nums text-[var(--muted)]">
                        {row.seriesCount}
                      </td>
                      <td className="py-2.5 px-2 text-right tabular-nums font-semibold text-[var(--ink)]">
                        {formatAvg(row.avgEpisodes)}
                      </td>
                      <td className="py-2.5 px-2 text-right tabular-nums text-[var(--muted)]">
                        {formatAvg(row.medianEpisodes)}
                      </td>
                      <td className="py-2.5 pl-2 text-right tabular-nums text-[var(--muted)]">
                        {row.minEpisodes}–{row.maxEpisodes}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <p className="text-[12px] text-[var(--muted)] border-t border-[var(--line)] pt-3">
              ZO TV titles are single-episode listings (1 episode each), so
              its 1.0 average is a listing format, not a series length.
            </p>
          </section>

          {/* Card 3: Top Tropes & Themes */}
          <section
            aria-labelledby="tropes-heading"
            className="p-5 sm:p-6 bg-[var(--surface)] border border-[var(--line)] rounded-[12px] space-y-5"
          >
            <div className="space-y-1">
              <h2
                id="tropes-heading"
                className="text-[18px] font-semibold text-[var(--ink)]"
              >
                Top Tropes &amp; Themes
              </h2>
              <p className="text-[13px] text-[var(--muted)]">
                The 6 most indexed tropes across all {insights.totalSeries}{' '}
                titles. Bars show share of the catalog; a title can carry
                more than one trope.
              </p>
            </div>

            <div className="space-y-3.5">
              {insights.topTropes.map((trope) => (
                <div key={trope.slug} className="space-y-1">
                  <div className="flex items-baseline justify-between text-[13px]">
                    <span className="text-[var(--ink)]">{trope.name}</span>
                    <span className="text-[var(--muted)] tabular-nums">
                      <span className="font-semibold text-[var(--ink)]">
                        {formatPct(trope.pctOfSeries)}
                      </span>
                      {' · '}
                      {trope.seriesCount} titles
                    </span>
                  </div>
                  <div
                    className="h-2 w-full rounded-full bg-[var(--surface-subtle)] overflow-hidden"
                    role="img"
                    aria-label={`${trope.name}: ${trope.seriesCount} titles, ${formatPct(trope.pctOfSeries)} of catalog`}
                  >
                    <div
                      className="h-full rounded-full bg-[var(--crimson)]"
                      style={{
                        width: `${
                          topTropeCount === 0
                            ? 0
                            : Math.min(
                                100,
                                Math.max(0, (trope.seriesCount / topTropeCount) * 100)
                              )
                        }%`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>

            <p className="text-[12px] text-[var(--muted)] border-t border-[var(--line)] pt-3">
              {insights.tagsIndexed} distinct tropes are indexed in total.
            </p>
          </section>

          {/* Card 4: Production Format */}
          <section
            aria-labelledby="format-heading"
            className="p-5 sm:p-6 bg-[var(--surface)] border border-[var(--line)] rounded-[12px] space-y-5"
          >
            <div className="space-y-1">
              <h2
                id="format-heading"
                className="text-[18px] font-semibold text-[var(--ink)]"
              >
                Production Format
              </h2>
              <p className="text-[13px] text-[var(--muted)]">
                Live-action vs AI-assisted and other formats, with pacing
                (average episodes) and average runtime per episode.
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-[13px]">
                <thead>
                  <tr className="text-left text-[var(--muted)] border-b border-[var(--line)]">
                    <th scope="col" className="py-2 pr-2 font-medium">
                      Format
                    </th>
                    <th scope="col" className="py-2 px-2 font-medium text-right tabular-nums">
                      Titles
                    </th>
                    <th scope="col" className="py-2 px-2 font-medium text-right tabular-nums">
                      Share
                    </th>
                    <th scope="col" className="py-2 px-2 font-medium text-right tabular-nums">
                      Avg eps
                    </th>
                    <th scope="col" className="py-2 pl-2 font-medium text-right tabular-nums">
                      Avg runtime
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {insights.productionFormat.map((row) => (
                    <tr
                      key={row.type}
                      className="border-b border-[var(--line)] last:border-0"
                    >
                      <th
                        scope="row"
                        className="py-2.5 pr-2 font-medium text-[var(--ink)] text-left"
                      >
                        {row.label}
                      </th>
                      <td className="py-2.5 px-2 text-right tabular-nums text-[var(--muted)]">
                        {row.seriesCount}
                      </td>
                      <td className="py-2.5 px-2 text-right tabular-nums font-semibold text-[var(--ink)]">
                        {formatPct(row.pctOfSeries)}
                      </td>
                      <td className="py-2.5 px-2 text-right tabular-nums text-[var(--muted)]">
                        {row.avgEpisodes == null ? '—' : formatAvg(row.avgEpisodes)}
                      </td>
                      <td className="py-2.5 pl-2 text-right tabular-nums text-[var(--muted)]">
                        {row.avgRuntimeMinutes == null
                          ? '—'
                          : `${formatAvg(row.avgRuntimeMinutes)} min`}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <p className="text-[12px] text-[var(--muted)] border-t border-[var(--line)] pt-3">
              {insights.humanCastSeries} of {insights.totalSeries} titles have
              a human cast.
              {aiAssistedCount === 0
                ? ' No AI-assisted titles are in the catalog — the curation policy excludes robotic AI dubs unless a title reaches 8.0+ community acclaim — so AI pacing has no titles to average yet.'
                : ' The curation policy excludes robotic AI dubs unless a title reaches 8.0+ community acclaim.'}
            </p>
          </section>
        </div>
      )}

      <p className="text-[12px] text-[var(--muted)]">
        Methodology: counts are taken from the public series, releases,
        platforms, and series_tags tables. Monetization percentages use only
        releases that record a monetization type; episode averages count each
        title once per platform.
      </p>
    </div>
  );
}
