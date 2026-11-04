'use client';

import React, { useState } from 'react';
import { Series, Release } from '@/src/data/types';
import { siteConfig } from '@/src/config/site';
import { Button } from '@/src/components/ui/button';
import { ReportSheet } from '@/src/components/report/report-sheet';
import { ExternalLink, CheckCircle2, AlertTriangle, ChevronDown, Plus } from 'lucide-react';

interface WhereToWatchProps {
  series: Series;
}

function isOlderThan90Days(dateStr: string): boolean {
  if (!dateStr) return false;
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) {
      // Check if it says something like "2023" or "2022"
      if (dateStr.includes('2023') || dateStr.includes('2022') || dateStr.includes('2021')) return true;
      return false;
    }
    const diffMs = Date.now() - d.getTime();
    return diffMs > 90 * 24 * 60 * 60 * 1000;
  } catch {
    return false;
  }
}

export function WhereToWatch({ series }: WhereToWatchProps) {
  const { releases } = series;
  const [reportSheetOpen, setReportSheetOpen] = useState(false);
  const [reportTargetRelease, setReportTargetRelease] = useState<Release | undefined>(undefined);

  const officialReleases = releases.filter((r) => r.isOfficial);
  const otherReleases = releases.filter((r) => !r.isOfficial);

  const handleOpenReportLink = (release?: Release) => {
    setReportTargetRelease(release);
    setReportSheetOpen(true);
  };

  const renderReleaseRow = (release: Release, isOtherSource = false) => {
    const isOutdated = isOlderThan90Days(release.lastChecked);
    const versionParts: string[] = [];

    if (release.dubLanguage) {
      versionParts.push(`${release.dubLanguage.toUpperCase()} dub`);
    }
    if (release.subtitleLanguages && release.subtitleLanguages.length > 0) {
      versionParts.push(
        `${release.subtitleLanguages.map((l) => l.toUpperCase()).join('/')} subs`
      );
    }
    if (release.episodeCount) {
      versionParts.push(`${release.episodeCount} eps`);
    }

    const versionText = versionParts.join(', ');

    return (
      <div
        key={release.id || release.url}
        className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-left"
      >
        {/* Left: Platform, Status Label, Specs, Region & Last checked */}
        <div className="space-y-1 min-w-0 flex-1">
          <div className="flex items-center gap-2.5 flex-wrap">
            <span className="font-semibold text-[15px] text-[var(--ink)]">
              {release.platform}
            </span>

            {/* Status Label (Official or Unverified uploader) */}
            {release.isOfficial ? (
              <span className="text-[12px] font-medium text-[var(--status-verified)] flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Official</span>
              </span>
            ) : (
              <span className="text-[12px] font-medium text-[var(--status-pending)] flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Unverified uploader</span>
              </span>
            )}
          </div>

          {versionText && (
            <p className="text-[13px] text-[var(--muted)]">
              {versionText}
            </p>
          )}

          {/* Monetization: never render 0 or blank as a fact; null means unverified */}
          {release.monetizationType ? (
            <p className="text-[13px] text-[var(--muted)]">
              {[
                release.freeEpisodes != null
                  ? `First ${release.freeEpisodes} eps free`
                  : null,
                release.monetizationType === 'coin_per_episode'
                  ? 'Coin unlock'
                  : release.monetizationType === 'subscription'
                    ? 'Subscription'
                    : release.monetizationType === 'ad_supported'
                      ? 'Ad-supported'
                      : release.monetizationType === 'free_with_ads'
                        ? 'Free with ads'
                        : 'Hybrid',
                release.estimatedUnlockCostUsd != null
                  ? `~$${Number(release.estimatedUnlockCostUsd).toFixed(2)} full series`
                  : null,
                release.coinsPerEpisode != null
                  ? `${release.coinsPerEpisode} coins/ep`
                  : null,
              ]
                .filter(Boolean)
                .join(' • ')}
            </p>
          ) : (
            <p className="text-[13px] text-[var(--muted)]">
              Monetization details unverified
            </p>
          )}

          {/* Region as plain text + Last checked */}
          <div className="flex flex-wrap items-center gap-x-2.5 gap-y-0.5 text-[12px] text-[var(--muted)] tabular-nums">
            <span>Region: {release.region}</span>
            {release.lastChecked && (
              <>
                <span>•</span>
                <span>Last checked {release.lastChecked}</span>
                {isOutdated && (
                  <span className="text-[var(--status-pending)] font-medium">
                    (may be out of date)
                  </span>
                )}
              </>
            )}
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2 self-start sm:self-center shrink-0">
          <Button
            variant="quiet"
            size="sm"
            onClick={() => handleOpenReportLink(release)}
            className="text-[12px] text-[var(--muted)] hover:text-[var(--crimson)]"
          >
            Report a link
          </Button>

          <a
            href={release.directWatchUrl || release.url}
            target="_blank"
            rel="noreferrer noopener"
            className="inline-flex items-center justify-center font-medium rounded-[8px] h-9 px-3.5 text-[13px] gap-1.5 bg-[var(--surface)] text-[var(--ink)] border border-[var(--line)] hover:bg-[var(--surface-hover)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--crimson)]"
          >
            <span>Open on {release.platform}</span>
            <ExternalLink className="w-3.5 h-3.5 text-[var(--muted)]" />
          </a>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4 text-left w-full">
      {/* Section Header */}
      <div className="flex items-baseline justify-between border-b border-[var(--line)] pb-2.5">
        <div>
          <h2 className="text-[18px] sm:text-[20px] font-semibold text-[var(--ink)]">
            Where to watch
          </h2>
          <p className="text-[13px] text-[var(--muted)] mt-0.5">
            Verified official releases and community sources
          </p>
        </div>
      </div>

      {/* Official Releases List (First) */}
      {officialReleases.length > 0 ? (
        <div className="divide-y divide-[var(--line)] border-y border-[var(--line)]">
          {officialReleases.map((release) => renderReleaseRow(release, false))}
        </div>
      ) : (
        <div className="p-5 bg-[var(--surface-subtle)] border border-[var(--line)] rounded-[12px] text-center space-y-2">
          <p className="text-[13px] text-[var(--muted)]">
            No official streaming sources indexed yet.
          </p>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => handleOpenReportLink(undefined)}
            leftIcon={<Plus className="w-3.5 h-3.5" />}
          >
            Report a link
          </Button>
        </div>
      )}

      {/* Other Sources in <details> */}
      {otherReleases.length > 0 && (
        <details className="group border border-[var(--line)] rounded-[12px] p-4 bg-[var(--surface)] text-left [&_summary::-webkit-details-marker]:hidden">
          <summary className="font-semibold text-[15px] text-[var(--ink)] cursor-pointer flex items-center justify-between select-none">
            <span className="flex items-center gap-2">
              <span>Other sources ({otherReleases.length})</span>
            </span>
            <ChevronDown className="w-4 h-4 text-[var(--muted)] transition-transform group-open:rotate-180" />
          </summary>
          <div className="divide-y divide-[var(--line)] border-t border-[var(--line)] mt-3">
            {otherReleases.map((release) => renderReleaseRow(release, true))}
          </div>
        </details>
      )}

      {/* Disclaimer */}
      <div className="pt-1 text-[12px] text-[var(--muted)]">
        <span>{siteConfig.name} does not host video. Links go to external pages.</span>
      </div>

      {/* Unified Report Flow Sheet */}
      <ReportSheet
        open={reportSheetOpen}
        onClose={() => setReportSheetOpen(false)}
        series={series}
        entry="link"
        initialType="broken_link"
        targetRelease={reportTargetRelease}
      />
    </div>
  );
}
