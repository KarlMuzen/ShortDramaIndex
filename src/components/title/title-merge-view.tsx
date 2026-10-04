'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { titlePath } from '@/src/lib/urls';
import { mockSeriesList } from '@/src/data/mock';
import { Series } from '@/src/data/types';
import { mergeSeriesAction } from '@/src/data/actions';
import { RoleGate } from '@/src/components/auth/role-gate';
import { useToast } from '@/src/components/ui/toast';
import { Poster } from '@/src/components/ui/poster';
import { Button } from '@/src/components/ui/button';
import { Dialog } from '@/src/components/ui/dialog';
import { TextField } from '@/src/components/ui/text-field';
import { Textarea } from '@/src/components/ui/textarea';
import { Breadcrumb } from '@/src/components/ui/breadcrumb';
import { SEARCH_PLACEHOLDER } from '@/src/config/site';
import {
  GitMerge,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Search,
  Check,
} from 'lucide-react';

export function TitleMergeView({ sourceSeries }: { sourceSeries: Series }) {
  return (
    <RoleGate requiredRole="editor">
      <TitleMergeContent sourceSeries={sourceSeries} />
    </RoleGate>
  );
}

function TitleMergeContent({ sourceSeries }: { sourceSeries: Series }) {
  const router = useRouter();
  const { showToast } = useToast();

  // Candidates for merge
  const candidatePool = mockSeriesList.filter((s) => s.id !== sourceSeries.id);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTarget, setSelectedTarget] = useState<Series>(candidatePool[0]);
  const [mergeDialogOpen, setMergeDialogOpen] = useState(false);
  const [mergeReason, setMergeReason] = useState('Duplicate catalog entry with identical storyline and cast');
  const [isMerging, setIsMerging] = useState(false);

  // Search filtered candidates
  const filteredCandidates = candidatePool.filter((c) =>
    c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.aliases.some((a) => a.text.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleMergeConfirm = async () => {
    if (!selectedTarget) return;
    setIsMerging(true);
    try {
      const res = await mergeSeriesAction({
        sourceId: sourceSeries.id,
        targetId: selectedTarget.id,
        reason: mergeReason.trim(),
      });

      if (res.success) {
        showToast({
          title: 'Merge completed',
          description: `Merged "${sourceSeries.title}" into canonical record "${selectedTarget.title}".`,
          type: 'success',
        });
        router.push(titlePath(selectedTarget));
      }
    } finally {
      setIsMerging(false);
    }
  };

  return (
    <div className="space-y-8 pb-20 text-left max-w-4xl mx-auto">
      <Breadcrumb
        items={[
          { label: 'Home', href: '/' },
          { label: sourceSeries.title, href: titlePath(sourceSeries) },
          { label: 'Merge or split entries', isCurrent: true },
        ]}
      />

      {/* Header */}
      <header className="space-y-1 border-b border-[var(--line)] pb-4">
        <div className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-[var(--crimson)]">
          <GitMerge className="w-4 h-4" />
          <span>Catalog deduplication</span>
        </div>
        <h1 className="text-[24px] font-semibold text-[var(--ink)] tracking-tight">
          Merge Duplicate Drama Entry
        </h1>
        <p className="text-[14px] text-[var(--muted)]">
          Combine duplicate title listings, aliases, and watch sources into a single canonical entry.
        </p>
      </header>

      {/* Merge Step Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
        {/* Source Drama (to be merged/redirected) */}
        <div className="p-5 bg-[var(--surface)] border-2 border-[var(--crimson)]/40 rounded-[12px] space-y-4">
          <div className="flex items-center justify-between border-b border-[var(--line)] pb-2">
            <span className="text-[12px] font-semibold text-[var(--crimson)]">
              Source (Will be merged)
            </span>
            <span className="text-[11px] font-mono text-[var(--muted)]">
              ID: #{sourceSeries.id}
            </span>
          </div>

          <div className="flex gap-4">
            <div className="w-16 aspect-[9/16] shrink-0">
              <Poster
                title={sourceSeries.title}
                src={sourceSeries.posterUrl}
                className="rounded-[4px] h-full"
              />
            </div>
            <div className="space-y-1 min-w-0">
              <h2 className="text-[16px] font-semibold text-[var(--ink)] leading-snug">
                {sourceSeries.title}
              </h2>
              <div className="text-[12px] text-[var(--muted)]">
                <span>{sourceSeries.year}</span> •{' '}
                <span>{sourceSeries.episodeCount} eps</span> •{' '}
                <span>{sourceSeries.originalLanguage.toUpperCase()}</span>
              </div>
              <p className="text-[12px] text-[var(--muted)] line-clamp-2 pt-1">
                {sourceSeries.synopsis}
              </p>
            </div>
          </div>

          <div className="p-3 bg-[var(--surface-subtle)] rounded-[8px] space-y-1 text-[12px]">
            <span className="font-semibold text-[var(--ink)] block">
              Aliases ({sourceSeries.aliases.length}):
            </span>
            <div className="flex flex-wrap gap-1">
              {sourceSeries.aliases.map((a, i) => (
                <span
                  key={i}
                  className="px-2 py-0.5 bg-[var(--surface)] border border-[var(--line)] rounded-[4px] text-[11px]"
                >
                  {a.text}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Target Canonical Drama (will absorb data) */}
        <div className="p-5 bg-[var(--surface)] border-2 border-[var(--status-verified)]/50 rounded-[12px] space-y-4">
          <div className="flex items-center justify-between border-b border-[var(--line)] pb-2">
            <span className="text-[12px] font-semibold text-[var(--status-verified)]">
              Target (Canonical record)
            </span>
            {selectedTarget && (
              <span className="text-[11px] font-mono text-[var(--muted)]">
                ID: #{selectedTarget.id}
              </span>
            )}
          </div>

          {selectedTarget ? (
            <>
              <div className="flex gap-4">
                <div className="w-16 aspect-[9/16] shrink-0">
                  <Poster
                    title={selectedTarget.title}
                    src={selectedTarget.posterUrl}
                    className="rounded-[4px] h-full"
                  />
                </div>
                <div className="space-y-1 min-w-0">
                  <h2 className="text-[16px] font-semibold text-[var(--ink)] leading-snug">
                    {selectedTarget.title}
                  </h2>
                  <div className="text-[12px] text-[var(--muted)]">
                    <span>{selectedTarget.year}</span> •{' '}
                    <span>{selectedTarget.episodeCount} eps</span> •{' '}
                    <span>{selectedTarget.originalLanguage.toUpperCase()}</span>
                  </div>
                  <p className="text-[12px] text-[var(--muted)] line-clamp-2 pt-1">
                    {selectedTarget.synopsis}
                  </p>
                </div>
              </div>

              <div className="p-3 bg-[var(--surface-subtle)] rounded-[8px] space-y-1 text-[12px]">
                <span className="font-semibold text-[var(--ink)] block">
                  Aliases ({selectedTarget.aliases.length}):
                </span>
                <div className="flex flex-wrap gap-1">
                  {selectedTarget.aliases.map((a, i) => (
                    <span
                      key={i}
                      className="px-2 py-0.5 bg-[var(--surface)] border border-[var(--line)] rounded-[4px] text-[11px]"
                    >
                      {a.text}
                    </span>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <div className="py-10 text-center text-[13px] text-[var(--muted)]">
              Search and select a target drama from below
            </div>
          )}
        </div>
      </div>

      {/* Target Selector & Search */}
      <section className="p-5 bg-[var(--surface)] border border-[var(--line)] rounded-[12px] space-y-4">
        <h2 className="text-[16px] font-semibold text-[var(--ink)] border-b border-[var(--line)] pb-2">
          Select canonical target entry
        </h2>

        <div className="relative max-w-md">
          <Search className="w-4 h-4 text-[var(--muted)] absolute left-3 top-2.5 pointer-events-none" />
          <input
            type="search"
            placeholder={SEARCH_PLACEHOLDER}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-9 pl-9 pr-3 text-[13px] bg-[var(--surface)] text-[var(--ink)] placeholder:text-[var(--muted)] rounded-[6px] border border-[var(--line)] outline-none focus:border-[var(--crimson)]"
          />
        </div>

        <div className="divide-y divide-[var(--line)] border border-[var(--line)] rounded-[8px] max-h-60 overflow-y-auto">
          {filteredCandidates.map((candidate) => {
            const isSelected = selectedTarget?.id === candidate.id;

            return (
              <div
                key={candidate.id}
                onClick={() => setSelectedTarget(candidate)}
                className={`p-3 flex items-center justify-between cursor-pointer transition-colors ${
                  isSelected
                    ? 'bg-[var(--surface-hover)]'
                    : 'hover:bg-[var(--surface-hover)]'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 aspect-[9/16] shrink-0">
                    <Poster
                      title={candidate.title}
                      src={candidate.posterUrl}
                      className="rounded-[2px] h-full"
                    />
                  </div>
                  <div className="min-w-0">
                    <div className="text-[13px] font-semibold text-[var(--ink)] truncate">
                      {candidate.title}
                    </div>
                    <div className="text-[11px] text-[var(--muted)] flex items-center gap-2">
                      <span>{candidate.year}</span>
                      <span>{candidate.episodeCount} eps</span>
                      <span>{candidate.aliases.length} aliases</span>
                    </div>
                  </div>
                </div>

                <div className="shrink-0 pl-3">
                  {isSelected ? (
                    <span className="inline-flex items-center gap-1 text-[12px] font-semibold text-[var(--status-verified)]">
                      <Check className="w-4 h-4" />
                      <span>Selected</span>
                    </span>
                  ) : (
                    <Button variant="quiet" size="sm">
                      Select
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Confirmation CTA Bar */}
      <div className="p-5 bg-[var(--surface-subtle)] border-2 border-[var(--line-strong)] rounded-[12px] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="text-[14px] font-semibold text-[var(--ink)]">
            Ready to merge #{sourceSeries.id} into #{selectedTarget?.id}?
          </div>
          <p className="text-[12px] text-[var(--muted)]">
            All aliases and links will be combined under &ldquo;{selectedTarget?.title}&rdquo;.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href={titlePath(sourceSeries)}
            className="text-[13px] text-[var(--muted)] hover:underline"
          >
            Cancel
          </Link>

          <Button
            type="button"
            variant="primary"
            size="md"
            onClick={() => setMergeDialogOpen(true)}
            disabled={!selectedTarget}
            leftIcon={<GitMerge className="w-4 h-4" />}
            className="font-semibold"
          >
            Proceed to merge
          </Button>
        </div>
      </div>

      {/* Merge Reason Dialog */}
      <Dialog
        open={mergeDialogOpen}
        onClose={() => setMergeDialogOpen(false)}
        title="Confirm Catalog Merge"
        description={`This action will transfer all aliases and watch sources from "${sourceSeries.title}" to "${selectedTarget?.title}".`}
        maxWidth="md"
        footer={
          <>
            <Button
              variant="quiet"
              size="sm"
              onClick={() => setMergeDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              isLoading={isMerging}
              onClick={handleMergeConfirm}
            >
              Confirm and merge
            </Button>
          </>
        }
      >
        <div className="space-y-4 text-left">
          <div className="p-3.5 bg-[var(--status-disputed-bg)] border border-[var(--crimson)]/30 rounded-[8px] text-[13px] text-[var(--crimson)] space-y-1">
            <div className="font-semibold flex items-center gap-1.5">
              <AlertCircle className="w-4 h-4" />
              <span>Permanent audit action</span>
            </div>
            <p className="text-[12px] text-[var(--muted)] leading-relaxed">
              Merging will point future lookups and permanent links of #{sourceSeries.id} to #{selectedTarget?.id}.
            </p>
          </div>

          <Textarea
            label="Reason for merge *"
            value={mergeReason}
            onChange={(e) => setMergeReason(e.target.value)}
            placeholder="Explain why these entries are identical..."
            rows={3}
            required
          />
        </div>
      </Dialog>
    </div>
  );
}
