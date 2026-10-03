'use client';

import React, { useState } from 'react';
import { Button } from '@/src/components/ui/button';
import { Dialog } from '@/src/components/ui/dialog';
import { TextField } from '@/src/components/ui/text-field';
import { Textarea } from '@/src/components/ui/textarea';
import { useToast } from '@/src/components/ui/toast';
import { SearchX, Plus, HelpCircle } from 'lucide-react';

interface SearchNoResultsProps {
  query?: string;
}

export function SearchNoResults({ query }: SearchNoResultsProps) {
  const { showToast } = useToast();
  const [reportModalOpen, setReportModalOpen] = useState(false);

  return (
    <div className="p-8 sm:p-10 bg-[var(--surface)] border border-[var(--line)] rounded-[12px] text-center max-w-xl mx-auto space-y-6">
      <div className="w-12 h-12 rounded-[8px] bg-[var(--surface-subtle)] border border-[var(--line)] flex items-center justify-center text-[var(--muted)] mx-auto">
        <SearchX className="w-6 h-6" />
      </div>

      <div className="space-y-2">
        <h3 className="text-[17px] font-semibold text-[var(--ink)]">
          No short dramas found {query ? `for “${query}”` : ''}
        </h3>
        <p className="text-[14px] text-[var(--muted)] leading-relaxed">
          We could not locate any titles or aliases matching your query.
        </p>
      </div>

      {/* Helpful suggestions */}
      <div className="p-4 bg-[var(--surface-subtle)] border border-[var(--line)] rounded-[8px] text-left space-y-2 text-[13px] text-[var(--muted)]">
        <div className="font-semibold text-[var(--ink)] flex items-center gap-1.5">
          <HelpCircle className="w-4 h-4 text-[var(--muted)]" />
          <span>Suggestions:</span>
        </div>
        <ul className="list-disc pl-5 space-y-1">
          <li>Check for typos or romanization spellings.</li>
          <li>Try searching with the original Chinese characters (e.g. 霸总, 顾少, 逆袭).</li>
          <li>Paste a direct watch link from YouTube, Lumen TV, or Reelway to run an automated link check.</li>
        </ul>
      </div>

      <div className="pt-2 flex justify-center">
        <Button
          variant="secondary"
          size="md"
          onClick={() => setReportModalOpen(true)}
          leftIcon={<Plus className="w-4 h-4" />}
        >
          Report a missing drama
        </Button>
      </div>

      {/* Report Modal */}
      <Dialog
        open={reportModalOpen}
        onClose={() => setReportModalOpen(false)}
        title="Report a missing drama"
        description="Let our community know about a short drama that isn't yet in the database."
        footer={
          <>
            <Button
              variant="quiet"
              size="sm"
              onClick={() => setReportModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                setReportModalOpen(false);
                showToast({
                  title: 'Report sent',
                  description: 'Thank you for helping improve the catalog!',
                  type: 'success',
                });
              }}
            >
              Send report
            </Button>
          </>
        }
      >
        <div className="space-y-4 text-left">
          <TextField
            label="Drama name you were looking for"
            defaultValue={query || ''}
            placeholder="e.g. The CEO's Secret Wife"
            required
          />
          <TextField
            label="Original name or language (if known)"
            placeholder="e.g. 霸总的契约娇妻 / Chinese"
          />
          <Textarea
            label="Where did you see it? (Optional)"
            placeholder="Platform name, uploader link, or clip reference"
            rows={3}
          />
        </div>
      </Dialog>
    </div>
  );
}
