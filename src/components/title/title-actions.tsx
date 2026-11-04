'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/src/components/ui/button';
import { Dialog } from '@/src/components/ui/dialog';
import { RatingInput } from '@/src/components/ui/rating-input';
import { ReportSheet } from '@/src/components/report/report-sheet';
import { useToast } from '@/src/components/ui/toast';
import { Series, ListStatus } from '@/src/data/types';
import { updateListEntryAction } from '@/src/data/actions';
import { useSession } from '@/src/context/session-context';
import { Bookmark, Star, Flag, Check } from 'lucide-react';

interface TitleActionsProps {
  series: Series;
}

export function TitleActions({ series }: TitleActionsProps) {
  const { showToast } = useToast();
  const { user } = useSession();

  const [listStatus, setListStatus] = useState<ListStatus | null>(null);
  const [listDialogOpen, setListDialogOpen] = useState(false);
  const [rateDialogOpen, setRateDialogOpen] = useState(false);
  const [reportSheetOpen, setReportSheetOpen] = useState(false);
  const [userRating, setUserRating] = useState<number>(0);

  const handleSaveListStatus = async (status: ListStatus) => {
    setListDialogOpen(false);
    if (!user) {
      showToast({
        title: 'Sign in required',
        description: `Sign in to save "${series.title}" to your tracking list.`,
        type: 'error',
      });
      return;
    }
    const result = await updateListEntryAction({ seriesId: series.id, status });
    if (!result.success) {
      showToast({
        title: 'Could not save to your list',
        description: result.message || 'Something went wrong. Try again.',
        type: 'error',
      });
      return;
    }
    setListStatus(status);
    const statusLabels: Record<ListStatus, string> = {
      watching: 'Watching',
      plan_to_watch: 'Plan to watch',
      completed: 'Completed',
      on_hold: 'On hold',
      dropped: 'Dropped',
    };
    showToast({
      title: `Saved to ${statusLabels[status]}`,
      description: `Added "${series.title}" to your tracking list.`,
      type: 'success',
    });
  };

  const handleSaveRating = async (score: number) => {
    setRateDialogOpen(false);
    if (!user) {
      showToast({
        title: 'Sign in required',
        description: `Sign in to rate "${series.title}".`,
        type: 'error',
      });
      return;
    }
    const result = await updateListEntryAction({ seriesId: series.id, score });
    if (!result.success) {
      showToast({
        title: 'Could not save your rating',
        description: result.message || 'Something went wrong. Try again.',
        type: 'error',
      });
      return;
    }
    setUserRating(score);
    showToast({
      title: 'Rating recorded',
      description: `You rated "${series.title}" ${score}/10.`,
      type: 'success',
    });
  };

  const statusDisplayLabels: Record<ListStatus, string> = {
    watching: 'Watching',
    plan_to_watch: 'Plan to watch',
    completed: 'Completed',
    on_hold: 'On hold',
    dropped: 'Dropped',
  };

  return (
    <div className="flex flex-wrap items-center gap-2 w-full">
      {/* 1. Add to list (Primary button) */}
      <Button
        variant="primary"
        size="md"
        onClick={() => setListDialogOpen(true)}
        leftIcon={<Bookmark className="w-4 h-4" />}
        className="flex-1 min-w-[130px]"
      >
        {listStatus ? statusDisplayLabels[listStatus] : 'Add to list'}
      </Button>

      {/* 2. Rate (Secondary button) */}
      <Button
        variant="secondary"
        size="md"
        onClick={() => setRateDialogOpen(true)}
        leftIcon={<Star className="w-4 h-4 text-[var(--muted)]" />}
      >
        {userRating > 0 ? `${userRating}/10` : 'Rate'}
      </Button>

      {/* 3. Report a problem (Secondary button) */}
      <Button
        variant="secondary"
        size="md"
        onClick={() => setReportSheetOpen(true)}
        leftIcon={<Flag className="w-4 h-4 text-[var(--muted)]" />}
      >
        Report a problem
      </Button>

      {/* List Status Picker Dialog */}
      <Dialog
        open={listDialogOpen}
        onClose={() => setListDialogOpen(false)}
        title="Add to list"
        description={`Choose your tracking status for "${series.title}".`}
        maxWidth="sm"
      >
        {!user ? (
          <div className="py-6 text-center space-y-4">
            <p className="text-[14px] text-[var(--ink)]">
              Sign in to track short dramas on your list.
            </p>
            <div>
              <Link href="/sign-in">
                <Button variant="primary" size="md">
                  Sign in
                </Button>
              </Link>
            </div>
          </div>
        ) : (
        <div className="space-y-1.5 py-1">
          {(
            [
              { status: 'watching', label: 'Watching' },
              { status: 'plan_to_watch', label: 'Plan to watch' },
              { status: 'completed', label: 'Completed' },
              { status: 'on_hold', label: 'On hold' },
              { status: 'dropped', label: 'Dropped' },
            ] as const
          ).map((item) => {
            const isSelected = listStatus === item.status;
            return (
              <button
                key={item.status}
                type="button"
                onClick={() => handleSaveListStatus(item.status)}
                className={`w-full flex items-center justify-between p-3 rounded-[8px] text-[14px] font-medium border transition-colors cursor-pointer text-left ${
                  isSelected
                    ? 'bg-[var(--crimson-subtle)] text-[var(--crimson)] border-[var(--crimson)]/40'
                    : 'bg-[var(--surface)] text-[var(--ink)] border-[var(--line)] hover:bg-[var(--surface-hover)]'
                }`}
              >
                <span>{item.label}</span>
                {isSelected && <Check className="w-4 h-4 stroke-[2.5]" />}
              </button>
            );
          })}
        </div>
        )}
      </Dialog>

      {/* Rate Dialog */}
      <Dialog
        open={rateDialogOpen}
        onClose={() => setRateDialogOpen(false)}
        title={`Rate ${series.title}`}
        description="Select your score from 1 (poor) to 10 (masterpiece)."
        maxWidth="sm"
      >
        {!user ? (
          <div className="py-6 text-center space-y-4">
            <p className="text-[14px] text-[var(--ink)]">
              Sign in to rate this short drama.
            </p>
            <div>
              <Link href="/sign-in">
                <Button variant="primary" size="md">
                  Sign in
                </Button>
              </Link>
            </div>
          </div>
        ) : (
          <div className="py-2 space-y-4">
            <RatingInput
              value={userRating}
              onChange={(score) => handleSaveRating(score)}
              label="Rating score"
            />
          </div>
        )}
      </Dialog>

      {/* Unified Report Flow Sheet */}
      <ReportSheet
        open={reportSheetOpen}
        onClose={() => setReportSheetOpen(false)}
        series={series}
        entry="problem"
      />
    </div>
  );
}
