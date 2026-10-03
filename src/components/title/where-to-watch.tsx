'use client';

import React, { useState } from 'react';
import { Series, Release } from '@/src/data/types';
import { siteConfig } from '@/src/config/site';
import { Select } from '@/src/components/ui/select';
import { Button } from '@/src/components/ui/button';
import { ReportSheet } from '@/src/components/report/report-sheet';
import { ExternalLink, AlertTriangle, CheckCircle2, Tv, Plus } from 'lucide-react';

interface WhereToWatchProps {
  series: Series;
}

export function WhereToWatch({ series }: WhereToWatchProps) {
  const { releases, title } = series;
  const [selectedRegion, setSelectedRegion] = useState('any');
  const [reportSheetOpen, setReportSheetOpen] = useState(false);
  const [reportTargetRelease, setReportTargetRelease] = useState<Release | undefined>(undefined);

  // Extract unique regions for filter
  const allRegions = Array.from(new Set(releases.map((r) => r.region)));
  const filteredReleases = releases.filter((r) => {
    if (selectedRegion === 'any') return true;
    return r.region === selectedRegion;
  });

  const handleOpenReportBroken = (release: Release) => {
    setReportTargetRelease(release);
    setReportSheetOpen(true);
  };

  const handleOpenReportNewLink = () => {
    setReportTargetRelease(undefined);
    setReportSheetOpen(true);
  };

  return (
    <div className="space-y-4 text-left">
      {/* Section Header with Region selector */}
      <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 border-b border-[var(--line)] pb-2.5">
        <div>
          <h2 className="text-[17px] sm:text-[18px] font-semibold text-[var(--ink)]">
            Where to watch
          </h2>
          <p className="text-[13px] text-[var(--muted)] mt-0.5">
            Verified official releases and community sources
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <span className="text-[12px] text-[var(--muted)] whitespace-nowrap">
            Region:
          </span>
          <div className="w-32">
            <Select
              value={selectedRegion}
              onChange={(e) => setSelectedRegion(e.target.value)}
              options={[
                { value: 'any', label: 'Any region' },
                ...allRegions.map((reg) => ({
                  value: reg,
                  label: reg,
                })),
              ]}
              className="h-8 text-[12px]"
            />
          </div>
        </div>
      </div>

      {/* Releases List */}
      {filteredReleases.length > 0 ? (
        <div className="divide-y divide-[var(--line)] border-b border-[var(--line)]">
          {filteredReleases.map((release, idx) => {
            const isBroken = release.linkStatus === 'broken' || release.linkStatus === 'disputed';
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
              versionParts.push(`${release.episodeCount} episodes`);
            }

            const versionText = versionParts.join(', ') || 'Full release';

            return (
              <div
                key={release.id || idx}
                className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                {/* Left: Platform & Specs */}
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-[14px] text-[var(--ink)]">
                      {release.platform}
                    </span>
                    <span className="text-[11px] font-medium text-[var(--muted)] bg-[var(--surface-subtle)] border border-[var(--line)] px-2 py-0.5 rounded-[4px]">
                      {release.region}
                    </span>
                    {release.isOfficial && (
                      <span className="text-[11px] font-medium text-[var(--status-verified)] flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>Official</span>
                      </span>
                    )}
                  </div>

                  <p className="text-[13px] text-[var(--muted)]">
                    {versionText}
                  </p>

                  <div className="flex items-center gap-3 text-[12px] text-[var(--muted)] tabular-nums">
                    <span>Last checked {release.lastChecked}</span>
                    {isBroken && (
                      <span className="text-[var(--crimson)] font-semibold flex items-center gap-1">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        <span>This link may be broken</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Right: Actions */}
                <div className="flex items-center gap-2 self-start sm:self-center shrink-0">
                  {isBroken ? (
                    <Button
                      variant="quiet"
                      size="sm"
                      onClick={() => handleOpenReportBroken(release)}
                      className="text-[var(--crimson)]"
                    >
                      Report broken
                    </Button>
                  ) : null}

                  <a
                    href={release.url}
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
          })}
        </div>
      ) : (
        <div className="p-6 bg-[var(--surface-subtle)] border border-[var(--line)] rounded-[12px] text-center space-y-2">
          <p className="text-[13px] text-[var(--muted)]">
            No active watch sources found for region: &ldquo;{selectedRegion}&rdquo;.
          </p>
          <Button
            variant="secondary"
            size="sm"
            onClick={handleOpenReportNewLink}
            leftIcon={<Plus className="w-3.5 h-3.5" />}
          >
            Report a link
          </Button>
        </div>
      )}

      {/* Required Legal / Architecture Disclosure Line */}
      <div className="pt-1 text-[12px] text-[var(--muted)]">
        <span>{siteConfig.name} links to official pages and does not host video.</span>
      </div>

      {/* Unified Report Flow Sheet */}
      <ReportSheet
        open={reportSheetOpen}
        onClose={() => setReportSheetOpen(false)}
        series={series}
        initialType="broken_link"
        targetRelease={reportTargetRelease}
      />
    </div>
  );
}
