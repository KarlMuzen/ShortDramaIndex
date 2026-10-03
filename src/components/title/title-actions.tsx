'use client';

import React, { useState } from 'react';
import { Button } from '@/src/components/ui/button';
import { Dialog } from '@/src/components/ui/dialog';
import { RatingInput } from '@/src/components/ui/rating-input';
import { ReportSheet } from '@/src/components/report/report-sheet';
import { useToast } from '@/src/components/ui/toast';
import { Series, ListStatus } from '@/src/data/types';
import { Bookmark, Star, Flag, Check } from 'lucide-react';

interface TitleActionsProps {
  series: Series;
}

export function TitleActions({ series }: TitleActionsProps) {
  const { showToast } = useToast();

  const [listStatus, setListStatus] = useState<ListStatus | null>(null);
  const [listDialogOpen, setListDialogOpen] = useState(false);
  const [rateDialogOpen, setRateDialogOpen] = useState(false);
  const [reportSheetOpen, setReportSheetOpen] = useState(false);
  const [userRating, setUserRating] = useState<number>(0);

  const handleSaveListStatus = (status: ListStatus) => {
    setListStatus(status);
    setListDialogOpen(false);
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

  const handleSaveRating = (score: number) => {
    setUserRating(score);
    setRateDialogOpen(false);
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
    <div className="flex flex-col gap-2 w-full">
      {/* 1. Add to list (Sole primary button) */}
      <Button
        variant="primary"
        size="md"
        fullWidth
        onClick={() => setListDialogOpen(true)}
        leftIcon={<Bookmark className="w-4 h-4" />}
      >
        {listStatus ? statusDisplayLabels[listStatus] : 'Add to list'}
      </Button>

      <div className="grid grid-cols-2 gap-2">
        {/* 2. Rate (Secondary button) */}
        <Button
          variant="secondary"
          size="md"
          onClick={() => setRateDialogOpen(true)}
          leftIcon={<Star className="w-4 h-4 text-[var(--muted)]" />}
        >
          {userRating > 0 ? `${userRating}/10` : 'Rate'}
        </Button>

        {/* 3. Report (Quiet button) */}
        <Button
          variant="quiet"
          size="md"
          onClick={() => setReportSheetOpen(true)}
          leftIcon={<Flag className="w-4 h-4 text-[var(--muted)]" />}
        >
          Report
        </Button>
      </div>

      {/* List Status Picker Dialog */}
      <Dialog
        open={listDialogOpen}
        onClose={() => setListDialogOpen(false)}
        title="Add to list"
        description={`Choose your tracking status for "${series.title}".`}
        maxWidth="sm"
      >
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
      </Dialog>

      {/* Rate Dialog */}
      <Dialog
        open={rateDialogOpen}
        onClose={() => setRateDialogOpen(false)}
        title={`Rate ${series.title}`}
        description="Select your score from 1 (poor) to 10 (masterpiece)."
        maxWidth="sm"
      >
        <div className="py-2 space-y-4">
          <RatingInput
            value={userRating}
            onChange={(score) => handleSaveRating(score)}
            label="Rating score"
          />
        </div>
      </Dialog>

      {/* Unified Report Flow Sheet */}
      <ReportSheet
        open={reportSheetOpen}
        onClose={() => setReportSheetOpen(false)}
        series={series}
        initialType="another_name"
      />
    </div>
  );
}
