'use client';

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { parseTitleParam, titlePath } from '@/src/lib/urls';
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
  Split,
  Search,
  Check,
} from 'lucide-react';

export default function TitleMergePage() {
  const params = useParams();
  const slugParam = typeof params?.slug === 'string' ? params.slug : '';
  const seriesId = parseTitleParam(slugParam);

  return (
    <RoleGate requiredRole="editor">
      <TitleMergeContent seriesId={seriesId} />
    </RoleGate>
  );
}

function TitleMergeContent({ seriesId }: { seriesId: number | null }) {
  const router = useRouter();
  const { showToast } = useToast();

  const sourceSeries =
    mockSeriesList.find((s) => s.id === seriesId) || mockSeriesList[0];

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

  const handleConfirmMerge = async () => {
    setIsMerging(true);
    try {
      const res = await mergeSeriesAction({
        sourceId: sourceSeries.id,
        targetId: selectedTarget.id,
        reason: mergeReason,
      });

      if (res.success && res.redirectPath) {
        setMergeDialogOpen(false);
        showToast({
          title: 'Titles merged successfully',
          description: `Merged #${sourceSeries.id} into #${selectedTarget.id} (${selectedTarget.title}). Redirect active.`,
          type: 'success',
        });
        router.push(res.redirectPath);
      }
    } finally {
      setIsMerging(false);
    }
  };

  const handleMarkNotSame = () => {
    showToast({
      title: 'Disambiguation recorded',
      description: `Marked "${sourceSeries.title}" and "${selectedTarget.title}" as verified distinct short dramas.`,
      type: 'info',
    });
  };

  return (
    <div className="space-y-8 pb-16 text-left max-w-5xl mx-auto">
      <Breadcrumb
        items={[
          { label: 'Home', href: '/' },
          { label: sourceSeries.title, href: titlePath(sourceSeries) },
          { label: 'Merge & split', isCurrent: true },
        ]}
      />

      {/* Header */}
      <header className="space-y-1 border-b border-[var(--line)] pb-4">
        <div className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-[var(--crimson)] uppercase tracking-wider">
          <GitMerge className="w-3.5 h-3.5" />
          <span>Catalog Disambiguation</span>
        </div>
        <h1 className="text-[24px] font-semibold text-[var(--ink)] tracking-tight">
          Merge or Split Drama Records
        </h1>
        <p className="text-[13px] text-[var(--muted)]">
          Compare candidate entries side-by-side to merge duplicate titles or permanently distinguish distinct releases.
        </p>
      </header>

      {/* Target Selector Bar */}
      <div className="p-4 bg-[var(--surface)] border border-[var(--line)] rounded-[12px] space-y-3">
        <label className="text-[13px] font-semibold text-[var(--ink)] block">
          Select target drama for side-by-side comparison:
        </label>

        <div className="relative">
          <input
            type="search"
            placeholder={SEARCH_PLACEHOLDER}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-10 pl-9 pr-3 text-[14px] bg-[var(--surface-subtle)] text-[var(--ink)] placeholder:text-[var(--muted)] rounded-[8px] border border-[var(--line)] focus:border-[var(--crimson)] outline-none"
          />
          <Search className="w-4 h-4 text-[var(--muted)] absolute left-3 top-3 pointer-events-none" />
        </div>

        {/* Candidate chips */}
        <div className="flex flex-wrap gap-2 pt-1 max-h-32 overflow-y-auto">
          {filteredCandidates.map((cand) => (
            <button
              key={cand.id}
              type="button"
              onClick={() => setSelectedTarget(cand)}
              className={`px-3 py-1.5 rounded-[8px] text-[12px] font-medium border transition-colors cursor-pointer flex items-center gap-1.5 ${
                selectedTarget.id === cand.id
                  ? 'bg-[var(--crimson-subtle)] text-[var(--crimson)] border-[var(--crimson)]/50 font-semibold'
                  : 'bg-[var(--surface)] text-[var(--ink)] border-[var(--line)] hover:bg-[var(--surface-hover)]'
              }`}
            >
              <span>#{cand.id} {cand.title}</span>
              {selectedTarget.id === cand.id && (
                <Check className="w-3.5 h-3.5 stroke-[2.5]" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Side-by-Side Comparison */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
        {/* Source Card */}
        <div className="p-5 bg-[var(--surface)] border-2 border-[var(--line)] rounded-[12px] space-y-4">
          <div className="flex items-center justify-between border-b border-[var(--line)] pb-2">
            <span className="text-[12px] font-bold uppercase tracking-wider text-[var(--muted)]">
              Source Entry (Will be merged)
            </span>
            <span className="text-[12px] font-mono text-[var(--muted)]">
              ID #{sourceSeries.id}
            </span>
          </div>

          <div className="flex gap-3 items-start">
            <div className="w-20 shrink-0">
              <Poster
                title={sourceSeries.title}
                src={sourceSeries.posterUrl}
              />
            </div>
            <div className="space-y-1">
              <h2 className="text-[16px] font-semibold text-[var(--ink)] leading-snug">
                {sourceSeries.title}
              </h2>
              <div className="text-[12px] text-[var(--muted)]">
                {sourceSeries.year} • {sourceSeries.episodeCount} episodes
              </div>
            </div>
          </div>

          {/* Names */}
          <div className="space-y-1.5 pt-2 border-t border-[var(--line)]">
            <span className="text-[12px] font-semibold text-[var(--muted)] uppercase">
              Aliases ({sourceSeries.aliases.length})
            </span>
            <ul className="text-[13px] text-[var(--ink)] space-y-1 list-disc pl-4">
              {sourceSeries.aliases.map((a, i) => (
                <li key={i}>
                  <span lang={a.language}>{a.text}</span>{' '}
                  <span className="text-[11px] text-[var(--muted)]">[{a.language}]</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Cast */}
          <div className="space-y-1 pt-2 border-t border-[var(--line)]">
            <span className="text-[12px] font-semibold text-[var(--muted)] uppercase">
              Cast
            </span>
            <p className="text-[13px] text-[var(--ink)]">
              {sourceSeries.cast?.map((c) => c.person.name).join(', ') || 'No cast cataloged'}
            </p>
          </div>
        </div>

        {/* Target Card */}
        <div className="p-5 bg-[var(--surface)] border-2 border-[var(--crimson)]/50 rounded-[12px] space-y-4">
          <div className="flex items-center justify-between border-b border-[var(--line)] pb-2">
            <span className="text-[12px] font-bold uppercase tracking-wider text-[var(--crimson)]">
              Target Canonical Entry (Preserved)
            </span>
            <span className="text-[12px] font-mono text-[var(--muted)]">
              ID #{selectedTarget.id}
            </span>
          </div>

          <div className="flex gap-3 items-start">
            <div className="w-20 shrink-0">
              <Poster
                title={selectedTarget.title}
                src={selectedTarget.posterUrl}
              />
            </div>
            <div className="space-y-1">
              <h2 className="text-[16px] font-semibold text-[var(--ink)] leading-snug">
                {selectedTarget.title}
              </h2>
              <div className="text-[12px] text-[var(--muted)]">
                {selectedTarget.year} • {selectedTarget.episodeCount} episodes
                {selectedTarget.episodeCount !== sourceSeries.episodeCount && (
                  <span className="ml-1 text-[var(--crimson)] font-semibold">
                    (Difference: {Math.abs(selectedTarget.episodeCount - sourceSeries.episodeCount)} eps)
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Names */}
          <div className="space-y-1.5 pt-2 border-t border-[var(--line)]">
            <span className="text-[12px] font-semibold text-[var(--muted)] uppercase">
              Aliases ({selectedTarget.aliases.length})
            </span>
            <ul className="text-[13px] text-[var(--ink)] space-y-1 list-disc pl-4">
              {selectedTarget.aliases.map((a, i) => (
                <li key={i}>
                  <span lang={a.language}>{a.text}</span>{' '}
                  <span className="text-[11px] text-[var(--muted)]">[{a.language}]</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Cast */}
          <div className="space-y-1 pt-2 border-t border-[var(--line)]">
            <span className="text-[12px] font-semibold text-[var(--muted)] uppercase">
              Cast
            </span>
            <p className="text-[13px] text-[var(--ink)]">
              {selectedTarget.cast?.map((c) => c.person.name).join(', ') || 'No cast cataloged'}
            </p>
          </div>
        </div>
      </div>

      {/* Action Bar */}
      <div className="p-5 bg-[var(--surface-subtle)] border border-[var(--line)] rounded-[12px] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-0.5">
          <h3 className="text-[14px] font-semibold text-[var(--ink)]">
            Disambiguation Decision
          </h3>
          <p className="text-[12px] text-[var(--muted)]">
            Merging moves all alias entries and establishes permanent 301 redirection.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="secondary"
            size="md"
            onClick={handleMarkNotSame}
            leftIcon={<Split className="w-4 h-4" />}
          >
            Mark as not the same drama
          </Button>

          <Button
            type="button"
            variant="primary"
            size="md"
            onClick={() => setMergeDialogOpen(true)}
            leftIcon={<GitMerge className="w-4 h-4" />}
            className="font-semibold"
          >
            Merge into #{selectedTarget.id}
          </Button>
        </div>
      </div>

      {/* Confirm Merge Dialog */}
      <Dialog
        open={mergeDialogOpen}
        onClose={() => setMergeDialogOpen(false)}
        title={`Merge #${sourceSeries.id} into #${selectedTarget.id}?`}
        description="This action will consolidate records and permanently redirect the source URL."
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
              variant="danger"
              size="sm"
              isLoading={isMerging}
              onClick={handleConfirmMerge}
            >
              Confirm merge & redirect
            </Button>
          </>
        }
      >
        <div className="space-y-3.5 text-left text-[13px]">
          <div className="p-3 bg-[var(--surface-subtle)] rounded-[8px] space-y-1.5 border border-[var(--line)]">
            <span className="font-semibold text-[var(--ink)] block">
              What will happen:
            </span>
            <ul className="list-disc pl-4 space-y-1 text-[var(--muted)]">
              <li>
                <strong>{sourceSeries.aliases.length} aliases</strong> will be merged into <em>{selectedTarget.title}</em>.
              </li>
              <li>
                All watch platform release URLs will be transferred.
              </li>
              <li>
                A permanent redirect (301) from <code>/title/{sourceSeries.id}</code> to <code>/title/{selectedTarget.id}</code> will be created.
              </li>
            </ul>
          </div>

          <Textarea
            label="Merge justification note"
            value={mergeReason}
            onChange={(e) => setMergeReason(e.target.value)}
            rows={2}
            required
          />
        </div>
      </Dialog>
    </div>
  );
}
