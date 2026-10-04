'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { LinkLookupResult } from '@/src/data/types';
import { titlePath } from '@/src/lib/urls';
import { Button } from '@/src/components/ui/button';
import { Poster } from '@/src/components/ui/poster';
import { Dialog } from '@/src/components/ui/dialog';
import { TextField } from '@/src/components/ui/text-field';
import { useToast } from '@/src/components/ui/toast';
import {
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  ExternalLink,
  Plus,
  ArrowRight,
} from 'lucide-react';

interface LinkLookupViewProps {
  lookupResult: LinkLookupResult;
}

export function LinkLookupView({ lookupResult }: LinkLookupViewProps) {
  const { showToast } = useToast();
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [dismissedPossible, setDismissedPossible] = useState<number[]>([]);

  // 1. Invalid URL State
  if (lookupResult.type === 'invalid_url') {
    return (
      <div className="p-6 bg-[var(--status-disputed-bg)] border border-[var(--crimson)]/30 rounded-[12px] text-left space-y-3">
        <div className="flex items-center gap-2 text-[var(--crimson)] font-semibold text-[15px]">
          <AlertCircle className="w-5 h-5" />
          <span>Invalid link format</span>
        </div>
        <p className="text-[13px] text-[var(--ink)]">
          {lookupResult.errorMessage ||
            'The URL you entered is malformed. Please provide a full link starting with https:// or http:// (for example: https://example.com/watch/series-101).'}
        </p>
        <div className="text-[12px] text-[var(--muted)] font-mono bg-[var(--surface)] p-2 rounded-[6px] border border-[var(--line)] break-all">
          {lookupResult.url}
        </div>
      </div>
    );
  }

  // 2. Exact Match Found
  if (lookupResult.type === 'exact' && lookupResult.exactMatch) {
    const { series, release } = lookupResult.exactMatch;
    const path = titlePath(series);

    return (
      <div className="space-y-4 text-left">
        <div className="p-4 bg-[var(--status-verified-bg)] border border-[var(--status-verified)]/20 rounded-[12px] flex items-start gap-3">
          <CheckCircle2 className="w-5 h-5 text-[var(--status-verified)] shrink-0 mt-0.5" />
          <div className="flex-1">
            <h3 className="text-[14px] font-semibold text-[var(--status-verified)]">
              Verified watch link recognized
            </h3>
            <p className="text-[14px] text-[var(--ink)] mt-0.5 leading-normal">
              This link is the <span className="font-semibold">{release.platform}</span> version of{' '}
              <span className="font-semibold">{series.title}</span>.
            </p>
          </div>
        </div>

        {/* Full Drama Result Row */}
        <div className="flex gap-4 p-4 bg-[var(--surface)] border border-[var(--line)] rounded-[12px]">
          <div className="w-20 shrink-0">
            <Poster
              title={series.title}
              src={series.posterUrl}
            />
          </div>

          <div className="flex-1 flex flex-col justify-between">
            <div className="space-y-1.5">
              <Link
                href={path}
                className="text-[17px] font-semibold text-[var(--ink)] hover:text-[var(--crimson)] transition-colors inline-block"
              >
                {series.title}
              </Link>

              {series.romanizedTitle && (
                <p className="text-[13px] text-[var(--muted)]">
                  {series.romanizedTitle}
                </p>
              )}

              <p className="text-[13px] text-[var(--muted)] line-clamp-2">
                {series.synopsis}
              </p>
            </div>

            <div className="mt-4 pt-3 border-t border-[var(--line)] flex flex-wrap items-center gap-3">
              <Link href={path}>
                <Button variant="primary" size="sm" rightIcon={<ArrowRight className="w-3.5 h-3.5" />}>
                  View all names and sources
                </Button>
              </Link>

              <a
                href={release.url}
                target="_blank"
                rel="noreferrer noopener"
                className="inline-flex items-center gap-1.5 text-[13px] text-[var(--muted)] hover:text-[var(--ink)] hover:underline"
              >
                <span>Open {release.platform} page</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 3. Possible Matches Candidates
  if (lookupResult.type === 'candidates' && lookupResult.possibleMatches) {
    const activeCandidates = lookupResult.possibleMatches.filter(
      (s) => !dismissedPossible.includes(s.id)
    );

    return (
      <div className="space-y-4 text-left">
        <div className="p-4 bg-[var(--surface)] border border-[var(--line)] rounded-[12px] flex items-start gap-3">
          <HelpCircle className="w-5 h-5 text-[var(--muted)] shrink-0 mt-0.5" />
          <div>
            <h3 className="text-[15px] font-semibold text-[var(--ink)]">
              Possible drama matches
            </h3>
            <p className="text-[13px] text-[var(--muted)] mt-0.5">
              We identified keywords in this URL that may correspond to one of these titles:
            </p>
          </div>
        </div>

        {activeCandidates.length > 0 ? (
          <div className="space-y-3">
            {activeCandidates.map((series) => {
              const path = titlePath(series);

              return (
                <div
                  key={series.id}
                  className="p-4 bg-[var(--surface)] border border-[var(--line)] rounded-[12px] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-12 shrink-0">
                      <Poster
                        title={series.title}
                        src={series.posterUrl}
                      />
                    </div>
                    <div>
                      <h4 className="text-[14px] font-semibold text-[var(--ink)]">
                        {series.title}
                      </h4>
                      <p className="text-[12px] text-[var(--muted)] tabular-nums">
                        {series.year} • {series.episodeCount} eps • {series.releases.length} watch sources
                      </p>
                    </div>
                  </div>

                  {/* "Is this the same drama?" Action prompts */}
                  <div className="flex items-center gap-2 sm:self-center shrink-0 w-full sm:w-auto justify-end pt-2 sm:pt-0 border-t sm:border-t-0 border-[var(--line)]">
                    <span className="text-[12px] text-[var(--muted)] mr-1">
                      Is this the same drama?
                    </span>
                    <Link href={path}>
                      <Button variant="primary" size="sm">
                        Yes
                      </Button>
                    </Link>
                    <Button
                      variant="quiet"
                      size="sm"
                      onClick={() =>
                        setDismissedPossible((prev) => [...prev, series.id])
                      }
                    >
                      No
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-5 bg-[var(--surface-subtle)] border border-[var(--line)] rounded-[12px] text-center space-y-2">
            <p className="text-[13px] text-[var(--muted)]">
              No other candidates match this link.
            </p>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setAddDialogOpen(true)}
            >
              Add as new drama entry
            </Button>
          </div>
        )}
      </div>
    );
  }

  // 4. Not Found State
  return (
    <div className="p-8 bg-[var(--surface)] border border-[var(--line)] rounded-[12px] text-center max-w-lg mx-auto space-y-4">
      <div className="w-10 h-10 rounded-[8px] bg-[var(--surface-subtle)] border border-[var(--line)] flex items-center justify-center text-[var(--muted)] mx-auto">
        <AlertCircle className="w-5 h-5" />
      </div>

      <div className="space-y-1">
        <h3 className="text-[16px] font-semibold text-[var(--ink)]">
          No matching short drama found
        </h3>
        <p className="text-[13px] text-[var(--muted)] leading-relaxed">
          Nothing in the index currently links to this URL. You can contribute this title or submit a catalog request.
        </p>
      </div>

      <div className="text-[12px] text-[var(--muted)] font-mono bg-[var(--surface-subtle)] p-2 rounded-[6px] border border-[var(--line)] break-all max-w-md mx-auto">
        {lookupResult.url}
      </div>

      <div className="flex items-center justify-center gap-2.5 pt-2">
        <Button
          variant="primary"
          size="sm"
          onClick={() => setAddDialogOpen(true)}
          leftIcon={<Plus className="w-3.5 h-3.5" />}
        >
          Add this drama
        </Button>
        <Button
          variant="secondary"
          size="sm"
          onClick={() =>
            showToast({
              title: 'Request logged',
              description: 'Our contributors will verify and index this watch source.',
              type: 'success',
            })
          }
        >
          Request this drama
        </Button>
      </div>

      {/* Add Drama Dialog */}
      <Dialog
        open={addDialogOpen}
        onClose={() => setAddDialogOpen(false)}
        title="Add a short drama"
        description="Submit a new title entry with its known name and platform watch link."
        footer={
          <>
            <Button
              variant="quiet"
              size="sm"
              onClick={() => setAddDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                setAddDialogOpen(false);
                showToast({
                  title: 'Submission received',
                  description: 'Your title submission is pending moderator approval.',
                  type: 'success',
                });
              }}
            >
              Submit title
            </Button>
          </>
        }
      >
        <div className="space-y-3.5 text-left">
          <TextField
            label="Primary title"
            placeholder="e.g. The Heir's Secret Bride"
            required
          />
          <TextField
            label="Original / Alternate name (e.g. Chinese)"
            placeholder="e.g. 霸总的秘密未婚妻"
          />
          <TextField
            label="Watch link URL"
            value={lookupResult.url}
            readOnly
          />
        </div>
      </Dialog>
    </div>
  );
}
