'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { titlePath } from '@/src/lib/urls';
import { Series, Revision } from '@/src/data/types';
import { revertRevisionAction } from '@/src/data/actions';
import { useSession } from '@/src/context/session-context';
import { useToast } from '@/src/components/ui/toast';
import { Breadcrumb } from '@/src/components/ui/breadcrumb';
import { Button } from '@/src/components/ui/button';
import { Dialog } from '@/src/components/ui/dialog';
import {
  History,
  RotateCcw,
  User,
  Clock,
} from 'lucide-react';

export function TitleHistoryView({
  series,
  revisions,
}: {
  series: Series;
  revisions: Revision[];
}) {
  const { user } = useSession();
  const { showToast } = useToast();
  const isModerator = user?.role === 'moderator';

  const [selectedRevision, setSelectedRevision] = useState<Revision>(revisions[0]);
  const [revertDialogOpen, setRevertDialogOpen] = useState(false);
  const [isReverting, setIsReverting] = useState(false);
  const [revertedIds, setRevertedIds] = useState<string[]>([]);

  const handleConfirmRevert = async () => {
    setIsReverting(true);
    try {
      const res = await revertRevisionAction(selectedRevision.id);
      if (res.success) {
        setRevertedIds([...revertedIds, selectedRevision.id]);
        setRevertDialogOpen(false);
        showToast({
          title: 'Revision reverted',
          description: `Rollback completed for revision #${selectedRevision.id}.`,
          type: 'success',
        });
      }
    } finally {
      setIsReverting(false);
    }
  };

  return (
    <div className="space-y-8 pb-16 text-left max-w-5xl mx-auto">
      <Breadcrumb
        items={[
          { label: 'Home', href: '/' },
          { label: series.title, href: titlePath(series) },
          { label: 'Revision history', isCurrent: true },
        ]}
      />

      <header className="space-y-1 border-b border-[var(--line)] pb-4">
        <div className="flex items-center gap-1.5 text-[12px] text-[var(--muted)]">
          <History className="w-3.5 h-3.5" />
          <span>Audit trail</span>
        </div>
        <h1 className="text-[28px] font-semibold text-[var(--ink)] tracking-tight">
          Revision history: {series.title}
        </h1>
        <p className="text-[14px] text-[var(--muted)]">
          Complete, immutable timeline of metadata edits, alias additions, and watch link updates.
        </p>
      </header>

      {/* Two Column Layout: Revisions list on left, Diff viewer on right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Revisions List */}
        <div className="lg:col-span-5 space-y-2">
          <span className="text-[12px] text-[var(--muted)] block pb-1">
            Timeline ({revisions.length} revisions)
          </span>

          <div className="space-y-2">
            {revisions.map((rev) => {
              const isSelected = selectedRevision.id === rev.id;
              const isReverted = rev.reverted || revertedIds.includes(rev.id);

              return (
                <div
                  key={rev.id}
                  onClick={() => setSelectedRevision(rev)}
                  className={`p-3.5 rounded-[8px] border cursor-pointer transition-colors text-left space-y-1.5 ${
                    isSelected
                      ? 'bg-[var(--surface)] border-[var(--crimson)]'
                      : 'bg-[var(--surface)] border-[var(--line)] hover:border-[var(--line-strong)]'
                  }`}
                >
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-mono text-[var(--muted)]">
                      #{rev.id}
                    </span>
                    <span className="text-[var(--muted)] tabular-nums">
                      {rev.submittedAt}
                    </span>
                  </div>

                  <p className="text-[13px] font-medium text-[var(--ink)] leading-snug line-clamp-2">
                    {rev.summary}
                  </p>

                  <div className="flex items-center justify-between text-[11px] text-[var(--muted)] pt-1">
                    <span>
                      by {rev.submittedByName}{' '}
                      <span className="capitalize font-medium">({rev.submittedByRole})</span>
                    </span>

                    {isReverted && (
                      <span className="text-[var(--crimson)] font-medium">
                        [Reverted]
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Selected Diff Details */}
        <div className="lg:col-span-7 p-5 bg-[var(--surface)] border border-[var(--line)] rounded-[12px] space-y-5 sticky top-16">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[var(--line)] pb-3">
            <div>
              <span className="text-[11px] font-mono text-[var(--muted)] block">
                Revision Details: #{selectedRevision.id}
              </span>
              <h2 className="text-[16px] font-semibold text-[var(--ink)]">
                {selectedRevision.summary}
              </h2>
            </div>

            {/* Moderator Revert Button */}
            {isModerator && (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setRevertDialogOpen(true)}
                disabled={selectedRevision.reverted || revertedIds.includes(selectedRevision.id)}
                leftIcon={<RotateCcw className="w-3.5 h-3.5 text-[var(--crimson)]" />}
              >
                Revert this change
              </Button>
            )}
          </div>

          <div className="flex items-center gap-4 text-[12px] text-[var(--muted)]">
            <div className="flex items-center gap-1.5">
              <User className="w-3.5 h-3.5" />
              <span>
                {selectedRevision.submittedByName} ({selectedRevision.submittedByRole})
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" />
              <span className="tabular-nums">{selectedRevision.submittedAt}</span>
            </div>
          </div>

          {/* Field-level Before/After Diffs */}
          <div className="space-y-3">
            <span className="text-[12px] text-[var(--muted)] block">
              Field changes
            </span>

            {selectedRevision.diffs && selectedRevision.diffs.length > 0 ? (
              <div className="space-y-3">
                {selectedRevision.diffs.map((diff, i) => (
                  <div
                    key={i}
                    className="p-3 bg-[var(--surface-subtle)] border border-[var(--line)] rounded-[8px] space-y-2 text-[14px]"
                  >
                    <span className="font-semibold text-[var(--ink)] text-[12px] capitalize">
                      {diff.label || diff.field}
                    </span>

                    <div className="space-y-1 font-mono text-[12px]">
                      {/* Old Value */}
                      <div className="p-2 bg-[var(--status-disputed-bg)] border border-[var(--crimson)]/20 rounded-[4px] text-[var(--crimson)]">
                        <span className="font-bold select-none mr-2">-</span>
                        <span>{diff.oldValue}</span>
                      </div>

                      {/* New Value */}
                      <div className="p-2 bg-[var(--status-verified-bg)] border border-[var(--status-verified)]/20 rounded-[4px] text-[var(--status-verified)]">
                        <span className="font-bold select-none mr-2">+</span>
                        <span>{diff.newValue}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4 bg-[var(--surface-subtle)] rounded-[8px] text-[13px] text-[var(--muted)]">
                General metadata baseline established.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Confirm Revert Dialog */}
      <Dialog
        open={revertDialogOpen}
        onClose={() => setRevertDialogOpen(false)}
        title="Revert revision?"
        description={`Confirm rolling back revision #${selectedRevision.id}.`}
        maxWidth="sm"
        footer={
          <>
            <Button
              variant="quiet"
              size="sm"
              onClick={() => setRevertDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              size="sm"
              isLoading={isReverting}
              onClick={handleConfirmRevert}
            >
              Confirm revert
            </Button>
          </>
        }
      >
        <div className="space-y-2 text-left text-[13px] text-[var(--ink)]">
          <p>
            This will mark revision <strong>#{selectedRevision.id}</strong> as reverted and create an inverse rollback revision in the catalog log.
          </p>
        </div>
      </Dialog>
    </div>
  );
}
