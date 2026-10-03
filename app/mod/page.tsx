'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { UserReport, ReportType } from '@/src/data/types';
import { mockReports, mockSeriesList } from '@/src/data/mock';
import { resolveModerationReportAction } from '@/src/data/actions';
import { RoleGate } from '@/src/components/auth/role-gate';
import { useToast } from '@/src/components/ui/toast';
import { Button } from '@/src/components/ui/button';
import { Dialog } from '@/src/components/ui/dialog';
import { Textarea } from '@/src/components/ui/textarea';
import { Select } from '@/src/components/ui/select';
import { EmptyState } from '@/src/components/ui/empty-state';
import { Breadcrumb } from '@/src/components/ui/breadcrumb';
import {
  ShieldCheck,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Clock,
  User,
  AlertTriangle,
  CornerDownRight,
  ExternalLink,
  Keyboard,
} from 'lucide-react';

export default function ModQueuePage() {
  return (
    <RoleGate requiredRole="moderator">
      <ModQueueContent />
    </RoleGate>
  );
}

function ModQueueContent() {
  const { showToast } = useToast();

  const [reports, setReports] = useState<UserReport[]>(mockReports);
  const [selectedIndex, setSelectedIndex] = useState<number>(0);
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('open');

  // Decline Dialog state
  const [declineDialogOpen, setDeclineDialogOpen] = useState(false);
  const [declineReason, setDeclineReason] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const filteredReports = reports.filter((r) => {
    if (statusFilter !== 'all' && r.status !== statusFilter) return false;
    if (typeFilter !== 'all' && r.type !== typeFilter) return false;
    return true;
  });

  const selectedReport = filteredReports[selectedIndex] || filteredReports[0];

  const handleAccept = async () => {
    if (!selectedReport) return;
    setIsProcessing(true);
    try {
      await resolveModerationReportAction({
        reportId: selectedReport.id,
        decision: 'accept',
      });

      // Update state in place
      setReports((prev) =>
        prev.map((r) =>
          r.id === selectedReport.id ? { ...r, status: 'accepted' } : r
        )
      );

      showToast({
        title: 'Report accepted',
        description: `Accepted update for "${selectedReport.seriesTitle}".`,
        type: 'success',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDeclineConfirm = async () => {
    if (!selectedReport) return;
    if (!declineReason.trim()) {
      showToast({
        title: 'Reason required',
        description: 'Please specify a reason when declining a report.',
        type: 'error',
      });
      return;
    }

    setIsProcessing(true);
    try {
      await resolveModerationReportAction({
        reportId: selectedReport.id,
        decision: 'decline',
        moderatorNote: declineReason.trim(),
      });

      setReports((prev) =>
        prev.map((r) =>
          r.id === selectedReport.id
            ? { ...r, status: 'declined', moderatorNote: declineReason.trim() }
            : r
        )
      );

      setDeclineDialogOpen(false);
      setDeclineReason('');
      showToast({
        title: 'Report declined',
        description: 'Feedback recorded and report marked declined.',
        type: 'info',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleAskInfo = () => {
    showToast({
      title: 'Information requested',
      description: 'Follow-up notification sent to the reporter.',
      type: 'info',
    });
  };

  // Keyboard navigation shortcuts: j, k to navigate, a to accept, d to decline
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.tagName === 'SELECT' ||
        declineDialogOpen
      ) {
        return;
      }

      if (e.key === 'j' || e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) =>
          Math.min(filteredReports.length - 1, prev + 1)
        );
      } else if (e.key === 'k' || e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => Math.max(0, prev - 1));
      } else if (e.key === 'a') {
        e.preventDefault();
        if (selectedReport && selectedReport.status !== 'accepted') {
          resolveModerationReportAction({
            reportId: selectedReport.id,
            decision: 'accept',
          }).then((res) => {
            if (res.success) {
              setReports((prev) =>
                prev.map((r) =>
                  r.id === selectedReport.id ? { ...r, status: 'accepted' } : r
                )
              );
              showToast({
                title: 'Report accepted',
                description: `Accepted update for "${selectedReport.seriesTitle}".`,
                type: 'success',
              });
            }
          });
        }
      } else if (e.key === 'd') {
        e.preventDefault();
        setDeclineDialogOpen(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [filteredReports.length, selectedReport, declineDialogOpen, showToast]);

  // Find referenced series
  const currentSeries = selectedReport
    ? mockSeriesList.find((s) => s.id === selectedReport.seriesId)
    : null;

  return (
    <div className="space-y-6 pb-16 text-left max-w-6xl mx-auto">
      <Breadcrumb
        items={[
          { label: 'Home', href: '/' },
          { label: 'Moderation queue', isCurrent: true },
        ]}
      />

      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--line)] pb-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-[var(--crimson)] uppercase tracking-wider">
            <ShieldCheck className="w-4 h-4" />
            <span>Moderator Desk</span>
          </div>
          <h1 className="text-[24px] font-semibold text-[var(--ink)] tracking-tight">
            Moderation Review Queue
          </h1>
        </div>

        {/* Keyboard Shortcuts Hint Bar */}
        <div className="hidden lg:flex items-center gap-3 px-3 py-1.5 bg-[var(--surface-subtle)] border border-[var(--line)] rounded-[8px] text-[12px] text-[var(--muted)]">
          <Keyboard className="w-3.5 h-3.5 text-[var(--muted)]" />
          <span>
            <kbd className="px-1.5 py-0.5 bg-[var(--surface)] border border-[var(--line)] rounded text-[11px] font-mono">j</kbd> / <kbd className="px-1.5 py-0.5 bg-[var(--surface)] border border-[var(--line)] rounded text-[11px] font-mono">k</kbd> navigate
          </span>
          <span>•</span>
          <span>
            <kbd className="px-1.5 py-0.5 bg-[var(--surface)] border border-[var(--line)] rounded text-[11px] font-mono">a</kbd> accept
          </span>
          <span>•</span>
          <span>
            <kbd className="px-1.5 py-0.5 bg-[var(--surface)] border border-[var(--line)] rounded text-[11px] font-mono">d</kbd> decline
          </span>
        </div>
      </header>

      {/* Queue Filters */}
      <div className="flex flex-wrap items-center gap-3 p-3 bg-[var(--surface)] border border-[var(--line)] rounded-[10px]">
        <span className="text-[12px] font-semibold text-[var(--muted)] uppercase tracking-wider">
          Filter:
        </span>
        <div className="w-36">
          <Select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setSelectedIndex(0);
            }}
            options={[
              { value: 'open', label: 'Open (Pending)' },
              { value: 'all', label: 'All statuses' },
              { value: 'accepted', label: 'Accepted' },
              { value: 'declined', label: 'Declined' },
            ]}
            className="h-8 text-[12px]"
          />
        </div>

        <div className="w-48">
          <Select
            value={typeFilter}
            onChange={(e) => {
              setTypeFilter(e.target.value);
              setSelectedIndex(0);
            }}
            options={[
              { value: 'all', label: 'All report types' },
              { value: 'another_name', label: 'Another name' },
              { value: 'wrong_name', label: 'This name is wrong' },
              { value: 'broken_link', label: 'Broken link' },
              { value: 'same_drama', label: 'Same drama' },
            ]}
            className="h-8 text-[12px]"
          />
        </div>

        <span className="ml-auto text-[12px] text-[var(--muted)] tabular-nums">
          {filteredReports.length} reports in queue
        </span>
      </div>

      {filteredReports.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: List of Reports */}
          <div className="lg:col-span-5 space-y-2 max-h-[680px] overflow-y-auto pr-1">
            {filteredReports.map((rep, idx) => {
              const isSelected = selectedReport?.id === rep.id;

              return (
                <div
                  key={rep.id}
                  onClick={() => setSelectedIndex(idx)}
                  className={`p-3.5 rounded-[10px] border cursor-pointer transition-colors text-left space-y-1.5 ${
                    isSelected
                      ? 'bg-[var(--surface)] border-[var(--crimson)] shadow-xs'
                      : 'bg-[var(--surface)] border-[var(--line)] hover:border-[var(--line-strong)]'
                  }`}
                >
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-semibold uppercase tracking-wider text-[var(--muted)]">
                      {rep.type.replace(/_/g, ' ')}
                    </span>
                    <span className="text-[var(--muted)] tabular-nums">
                      {rep.submittedAt}
                    </span>
                  </div>

                  <h3 className="text-[14px] font-semibold text-[var(--ink)] leading-snug line-clamp-1">
                    {rep.seriesTitle}
                  </h3>

                  <div className="text-[12px] text-[var(--muted)] flex items-center justify-between">
                    <span>by @{rep.submittedBy}</span>
                    <span
                      className={`capitalize font-medium text-[11px] ${
                        rep.status === 'accepted'
                          ? 'text-[var(--status-verified)]'
                          : rep.status === 'declined'
                          ? 'text-[var(--crimson)]'
                          : 'text-[var(--status-pending)]'
                      }`}
                    >
                      {rep.status}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Right Column: Selected Report Review Panel */}
          {selectedReport && (
            <div className="lg:col-span-7 p-6 bg-[var(--surface)] border border-[var(--line)] rounded-[12px] space-y-6 sticky top-16">
              {/* Header Details */}
              <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 border-b border-[var(--line)] pb-3">
                <div className="space-y-0.5">
                  <span className="text-[11px] font-mono text-[var(--muted)] uppercase">
                    Report ID: #{selectedReport.id}
                  </span>
                  <h2 className="text-[18px] font-semibold text-[var(--ink)]">
                    {selectedReport.typeName}
                  </h2>
                </div>

                <Link
                  href={`/title/${selectedReport.seriesId}-drama`}
                  target="_blank"
                  className="text-[13px] text-[var(--crimson)] hover:underline inline-flex items-center gap-1 font-medium"
                >
                  <span>Open target entry</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </Link>
              </div>

              {/* Target Drama Facts */}
              <div className="p-3 bg-[var(--surface-subtle)] rounded-[8px] text-[13px] space-y-1">
                <div className="font-semibold text-[var(--ink)]">
                  {selectedReport.seriesTitle}
                </div>
                {currentSeries && (
                  <p className="text-[12px] text-[var(--muted)]">
                    {currentSeries.year} • {currentSeries.episodeCount} eps • {currentSeries.aliases.length} existing aliases
                  </p>
                )}
              </div>

              {/* Visual Diff: Proposed Change vs Existing Data */}
              <div className="space-y-2">
                <span className="text-[12px] font-semibold text-[var(--muted)] uppercase tracking-wider block">
                  Proposed Change & Evidence
                </span>

                <div className="p-4 bg-[var(--surface-subtle)] border border-[var(--line)] rounded-[8px] space-y-3 text-[13px]">
                  {selectedReport.data.name && (
                    <div className="space-y-1 font-mono text-[12px]">
                      <span className="text-[11px] uppercase text-[var(--muted)] block font-sans font-semibold">
                        New Alias Proposal:
                      </span>
                      <div className="p-2 bg-[var(--status-verified-bg)] border border-[var(--status-verified)]/20 rounded text-[var(--status-verified)]">
                        + &ldquo;{selectedReport.data.name}&rdquo; ({selectedReport.data.language?.toUpperCase() || 'ZH'})
                      </div>
                    </div>
                  )}

                  {selectedReport.data.targetAlias && (
                    <div className="space-y-1 font-mono text-[12px]">
                      <span className="text-[11px] uppercase text-[var(--muted)] block font-sans font-semibold">
                        Disputed Alias:
                      </span>
                      <div className="p-2 bg-[var(--status-disputed-bg)] border border-[var(--crimson)]/20 rounded text-[var(--crimson)]">
                        - &ldquo;{selectedReport.data.targetAlias}&rdquo; (Reason: {selectedReport.data.reason})
                      </div>
                    </div>
                  )}

                  {selectedReport.data.replacementUrl && (
                    <div className="space-y-1 text-[12px]">
                      <span className="text-[11px] uppercase text-[var(--muted)] block font-sans font-semibold">
                        Replacement Watch Link:
                      </span>
                      <a
                        href={selectedReport.data.replacementUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[var(--crimson)] hover:underline break-all"
                      >
                        {selectedReport.data.replacementUrl}
                      </a>
                    </div>
                  )}

                  {selectedReport.data.note && (
                    <div className="space-y-1 pt-1 text-[13px] border-t border-[var(--line)]">
                      <span className="font-semibold text-[var(--ink)] block">
                        Reporter&apos;s Notes:
                      </span>
                      <p className="text-[var(--muted)] leading-relaxed">
                        {selectedReport.data.note}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Reporter Track Record */}
              <div className="p-3 bg-[var(--surface-subtle)] border border-[var(--line)] rounded-[8px] flex items-center justify-between text-[12px] text-[var(--muted)]">
                <div className="flex items-center gap-2">
                  <User className="w-3.5 h-3.5" />
                  <span>
                    Reporter: <strong className="text-[var(--ink)]">@{selectedReport.submittedBy}</strong>
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[var(--status-verified)] font-medium">
                    8 reports accepted
                  </span>
                  <span>•</span>
                  <span>88% accuracy</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 border-t border-[var(--line)] flex items-center justify-between gap-3">
                <Button
                  type="button"
                  variant="quiet"
                  size="sm"
                  onClick={handleAskInfo}
                  leftIcon={<HelpCircle className="w-4 h-4 text-[var(--muted)]" />}
                >
                  Ask for info
                </Button>

                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="danger"
                    size="md"
                    onClick={() => setDeclineDialogOpen(true)}
                    disabled={selectedReport.status === 'declined' || isProcessing}
                    leftIcon={<XCircle className="w-4 h-4" />}
                  >
                    Decline (d)
                  </Button>

                  <Button
                    type="button"
                    variant="primary"
                    size="md"
                    onClick={handleAccept}
                    disabled={selectedReport.status === 'accepted' || isProcessing}
                    leftIcon={<CheckCircle2 className="w-4 h-4" />}
                    className="font-semibold"
                  >
                    Accept (a)
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        <EmptyState
          title="No reports to review"
          description="The moderation queue is clear. All submitted alias updates and link corrections have been processed."
        />
      )}

      {/* Decline Reason Modal */}
      <Dialog
        open={declineDialogOpen}
        onClose={() => setDeclineDialogOpen(false)}
        title="Decline report"
        description="A clear explanation is required to give feedback to the contributor."
        maxWidth="sm"
        footer={
          <>
            <Button
              variant="quiet"
              size="sm"
              onClick={() => setDeclineDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              size="sm"
              isLoading={isProcessing}
              onClick={handleDeclineConfirm}
            >
              Decline report
            </Button>
          </>
        }
      >
        <div className="space-y-3.5 text-left">
          <Select
            label="Pre-set reason"
            onChange={(e) => setDeclineReason(e.target.value)}
            options={[
              { value: '', label: 'Select standard feedback...' },
              { value: 'Title belongs to a different short drama release.', label: 'Belongs to different short drama' },
              { value: 'Unable to verify circulation or source reference URL.', label: 'Source link unverifiable' },
              { value: 'Duplicate alias already recorded under a standard spelling.', label: 'Duplicate alias' },
              { value: 'Machine translation without circulation in distributors.', label: 'Unsupported machine translation' },
            ]}
          />

          <Textarea
            label="Explanation for contributor"
            value={declineReason}
            onChange={(e) => setDeclineReason(e.target.value)}
            placeholder="Explain why this report was declined..."
            rows={3}
            required
          />
        </div>
      </Dialog>
    </div>
  );
}
