'use client';

import React, { useState } from 'react';
import { useSession } from '@/src/context/session-context';
import { Button } from '@/src/components/ui/button';
import { Dialog } from '@/src/components/ui/dialog';
import { TextField } from '@/src/components/ui/text-field';
import { Textarea } from '@/src/components/ui/textarea';
import { useToast } from '@/src/components/ui/toast';
import { Series } from '@/src/data/types';
import { History, Edit3, UserCheck } from 'lucide-react';

interface TitleFooterHistoryProps {
  series: Series;
}

export function TitleFooterHistory({ series }: TitleFooterHistoryProps) {
  const { user } = useSession();
  const { showToast } = useToast();
  const [historyOpen, setHistoryOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);

  const isEditor = user?.role === 'editor' || user?.role === 'moderator';

  // Mock revision history items
  const revisions = [
    {
      id: 'rev-01',
      field: 'Aliases',
      summary: 'Added verified Chinese and Spanish release aliases',
      user: 'Marcus Chen',
      role: 'Editor',
      date: series.updatedAt,
    },
    {
      id: 'rev-02',
      field: 'Releases',
      summary: 'Updated Lumen TV and YouTube watch source links',
      user: 'Sarah Sterling',
      role: 'Moderator',
      date: '2024-03-15',
    },
    {
      id: 'rev-03',
      field: 'Creation',
      summary: 'Initial short drama database catalog entry created',
      user: 'Sarah Sterling',
      role: 'Moderator',
      date: '2024-01-10',
    },
  ];

  return (
    <div className="pt-6 border-t border-[var(--line)] flex flex-wrap items-center justify-between gap-3 text-[13px] text-[var(--muted)]">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setHistoryOpen(true)}
          className="hover:text-[var(--crimson)] hover:underline flex items-center gap-1.5 cursor-pointer"
        >
          <History className="w-3.5 h-3.5" />
          <span>View edit history</span>
        </button>

        <span>•</span>
        <span className="tabular-nums">Updated {series.updatedAt}</span>
      </div>

      {isEditor && (
        <Button
          variant="secondary"
          size="sm"
          onClick={() => setEditOpen(true)}
          leftIcon={<Edit3 className="w-3.5 h-3.5 text-[var(--muted)]" />}
        >
          Edit entry
        </Button>
      )}

      {/* Edit History Dialog */}
      <Dialog
        open={historyOpen}
        onClose={() => setHistoryOpen(false)}
        title="Revision History"
        description={`Audit log and changes made to "${series.title}".`}
        maxWidth="md"
      >
        <div className="divide-y divide-[var(--line)] text-left">
          {revisions.map((rev) => (
            <div key={rev.id} className="py-3 space-y-1">
              <div className="flex items-center justify-between text-[12px]">
                <span className="font-semibold text-[var(--ink)]">
                  {rev.field}
                </span>
                <span className="text-[var(--muted)] tabular-nums">{rev.date}</span>
              </div>
              <p className="text-[13px] text-[var(--ink)]">{rev.summary}</p>
              <p className="text-[11px] text-[var(--muted)]">
                By {rev.user} ({rev.role})
              </p>
            </div>
          ))}
        </div>
      </Dialog>

      {/* Editor Modal */}
      {isEditor && (
        <Dialog
          open={editOpen}
          onClose={() => setEditOpen(false)}
          title="Edit short drama metadata"
          description={`Logged in as ${user?.name} (${user?.role}).`}
          footer={
            <>
              <Button
                variant="quiet"
                size="sm"
                onClick={() => setEditOpen(false)}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  setEditOpen(false);
                  showToast({
                    title: 'Metadata updated',
                    description: 'Changes have been saved to the reference catalog.',
                    type: 'success',
                  });
                }}
              >
                Save changes
              </Button>
            </>
          }
        >
          <div className="space-y-3.5 text-left">
            <TextField
              label="Canonical Title"
              defaultValue={series.title}
              required
            />
            <TextField
              label="Romanized Title"
              defaultValue={series.romanizedTitle || ''}
            />
            <div className="grid grid-cols-2 gap-3">
              <TextField
                label="Release Year"
                type="number"
                defaultValue={series.year}
              />
              <TextField
                label="Episode Count"
                type="number"
                defaultValue={series.episodeCount}
              />
            </div>
            <Textarea
              label="Synopsis"
              defaultValue={series.synopsis}
              rows={4}
            />
          </div>
        </Dialog>
      )}
    </div>
  );
}
