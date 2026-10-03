'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Series, Release, Alias, ReportType } from '@/src/data/types';
import { submitReport } from '@/src/data/actions';
import { useSession } from '@/src/context/session-context';
import { useToast } from '@/src/components/ui/toast';
import { Dialog } from '@/src/components/ui/dialog';
import { Button } from '@/src/components/ui/button';
import { TextField } from '@/src/components/ui/text-field';
import { Textarea } from '@/src/components/ui/textarea';
import { Select } from '@/src/components/ui/select';
import { Radio } from '@/src/components/ui/radio';
import {
  CheckCircle2,
  ExternalLink,
  ArrowRight,
  ShieldAlert,
  UserCheck,
} from 'lucide-react';

export interface ReportSheetProps {
  open: boolean;
  onClose: () => void;
  series: Series;
  initialType?: ReportType;
  targetAlias?: Alias | string;
  targetRelease?: Release;
}

const REPORT_TYPE_OPTIONS: { type: ReportType; label: string; description: string }[] = [
  {
    type: 'another_name',
    label: 'Another name for this drama',
    description: 'Add an alternate English, Chinese, Korean, or localized title.',
  },
  {
    type: 'wrong_name',
    label: 'This name is wrong',
    description: 'Report an incorrect, misattributed, or misspelled title.',
  },
  {
    type: 'same_drama',
    label: 'Same drama as another title',
    description: 'Merge this record with another existing entry in the database.',
  },
  {
    type: 'not_same_drama',
    label: 'Not the same drama',
    description: 'Separate conflated titles or distinct seasons.',
  },
  {
    type: 'wrong_details',
    label: 'Wrong details',
    description: 'Correct episode count, release year, origin, or synopsis.',
  },
  {
    type: 'broken_link',
    label: 'Link is broken or wrong',
    description: 'Report an unavailable watch URL or provide a working source.',
  },
];

export function ReportSheet({
  open,
  onClose,
  series,
  initialType = 'another_name',
  targetAlias,
  targetRelease,
}: ReportSheetProps) {
  const { user } = useSession();
  const { showToast } = useToast();

  const [selectedType, setSelectedType] = useState<ReportType>(initialType);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedReportId, setSubmittedReportId] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // Form Fields State
  const [aliasName, setAliasName] = useState('');
  const [aliasLanguage, setAliasLanguage] = useState('zh');
  const [aliasSourceUrl, setAliasSourceUrl] = useState('');
  const [aliasNote, setAliasNote] = useState('');

  const [selectedTargetAlias, setSelectedTargetAlias] = useState<string>(
    typeof targetAlias === 'string'
      ? targetAlias
      : targetAlias?.text || series.aliases[0]?.text || ''
  );
  const [wrongReason, setWrongReason] = useState('wrong_show');
  const [wrongNote, setWrongNote] = useState('');

  const [otherDramaTitle, setOtherDramaTitle] = useState('');
  const [mergeEvidence, setMergeEvidence] = useState('');

  const [detailField, setDetailField] = useState('episodes');
  const [proposedValue, setProposedValue] = useState('');
  const [detailSourceUrl, setDetailSourceUrl] = useState('');

  const [releasePlatform, setReleasePlatform] = useState(
    targetRelease?.platform || series.releases[0]?.platform || 'Lumen TV'
  );
  const [replacementUrl, setReplacementUrl] = useState('');
  const [brokenNote, setBrokenNote] = useState('');

  const handleClose = () => {
    setSubmittedReportId(null);
    setFieldErrors({});
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFieldErrors({});

    let payloadData: any = {};

    switch (selectedType) {
      case 'another_name':
        payloadData = {
          name: aliasName,
          language: aliasLanguage,
          url: aliasSourceUrl,
          note: aliasNote,
        };
        break;
      case 'wrong_name':
        payloadData = {
          targetAlias: selectedTargetAlias,
          reason: wrongReason,
          note: wrongNote,
        };
        break;
      case 'same_drama':
      case 'not_same_drama':
        payloadData = {
          otherSeriesTitle: otherDramaTitle,
          note: mergeEvidence,
        };
        break;
      case 'wrong_details':
        payloadData = {
          field: detailField,
          proposedValue: proposedValue,
          url: detailSourceUrl,
        };
        break;
      case 'broken_link':
        payloadData = {
          releasePlatform: releasePlatform,
          replacementUrl: replacementUrl,
          note: brokenNote,
        };
        break;
    }

    try {
      const result = await submitReport({
        seriesId: series.id,
        seriesTitle: series.title,
        type: selectedType,
        data: payloadData,
      });

      if (result.success && result.reportId) {
        setSubmittedReportId(result.reportId);
        showToast({
          title: 'Report sent',
          description: 'Thank you for contributing to the reference catalog.',
          type: 'success',
        });
      } else if (result.errors) {
        setFieldErrors(result.errors);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      title="Report an update"
      description={`Contributing reference data for "${series.title}".`}
      maxWidth="md"
      footer={
        submittedReportId ? (
          <Button variant="secondary" size="sm" onClick={handleClose}>
            Close
          </Button>
        ) : (
          <>
            <Button variant="quiet" size="sm" onClick={handleClose}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              isLoading={isSubmitting}
              onClick={handleSubmit}
            >
              Send report
            </Button>
          </>
        )
      }
    >
      {/* Confirmation View after successful submission */}
      {submittedReportId ? (
        <div className="py-4 space-y-4 text-left">
          <div className="p-4 bg-[var(--status-verified-bg)] border border-[var(--status-verified)]/20 rounded-[8px] flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-[var(--status-verified)] shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h3 className="text-[14px] font-semibold text-[var(--status-verified)]">
                Report sent
              </h3>
              <p className="text-[13px] text-[var(--ink)]">
                Your report has been logged with ID #{submittedReportId}. Contributors and moderators will review and verify your submission.
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <Link
              href="/profile#reports"
              onClick={handleClose}
              className="inline-flex items-center gap-1.5 text-[13px] font-medium text-[var(--crimson)] hover:underline"
            >
              <span>View in My reports</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>

            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                setSubmittedReportId(null);
                setAliasName('');
              }}
            >
              Submit another report
            </Button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5 text-left">
          {/* Step 1: Report Type Radio Options */}
          <div className="space-y-2">
            <label className="text-[13px] font-semibold text-[var(--ink)] block">
              What would you like to report?
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {REPORT_TYPE_OPTIONS.map((opt) => (
                <div
                  key={opt.type}
                  onClick={() => setSelectedType(opt.type)}
                  className={`p-2.5 rounded-[8px] border cursor-pointer transition-colors flex items-start gap-2.5 ${
                    selectedType === opt.type
                      ? 'border-[var(--crimson)] bg-[var(--crimson-subtle)]'
                      : 'border-[var(--line)] hover:border-[var(--line-strong)] bg-[var(--surface)]'
                  }`}
                >
                  <Radio
                    name="report_type_selection"
                    checked={selectedType === opt.type}
                    onChange={() => setSelectedType(opt.type)}
                    className="mt-0.5"
                  />
                  <div className="flex-1 min-w-0">
                    <span className="text-[13px] font-medium text-[var(--ink)] block leading-snug">
                      {opt.label}
                    </span>
                    <span className="text-[11px] text-[var(--muted)] line-clamp-1 mt-0.5">
                      {opt.description}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Takedown Option */}
            <div className="pt-1">
              <Link
                href="/takedown"
                onClick={handleClose}
                className="inline-flex items-center gap-1 text-[12px] text-[var(--muted)] hover:text-[var(--crimson)] hover:underline"
              >
                <ShieldAlert className="w-3.5 h-3.5" />
                <span>Copyright owner? Submit a Takedown request</span>
                <ExternalLink className="w-3 h-3" />
              </Link>
            </div>
          </div>

          <div className="border-t border-[var(--line)] pt-4 space-y-3.5">
            {/* Type 1: Another Name */}
            {selectedType === 'another_name' && (
              <>
                <TextField
                  label="Title or Alias Name"
                  placeholder="e.g. 霸总的契约娇妻 / The Secret Matriarch"
                  value={aliasName}
                  onChange={(e) => setAliasName(e.target.value)}
                  errorMessage={fieldErrors.name}
                  autoFocus
                  required
                />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Select
                    label="Language"
                    value={aliasLanguage}
                    onChange={(e) => setAliasLanguage(e.target.value)}
                    options={[
                      { value: 'zh', label: 'Chinese (中文)' },
                      { value: 'en', label: 'English' },
                      { value: 'ko', label: 'Korean (한국어)' },
                      { value: 'es', label: 'Spanish (Español)' },
                      { value: 'ja', label: 'Japanese (日本語)' },
                      { value: 'pt', label: 'Portuguese' },
                    ]}
                  />
                  <TextField
                    label="Where you saw it (optional)"
                    placeholder="e.g. Lumen TV app search, YouTube playlist"
                    value={aliasSourceUrl}
                    onChange={(e) => setAliasSourceUrl(e.target.value)}
                  />
                </div>
              </>
            )}

            {/* Type 2: This Name is Wrong */}
            {selectedType === 'wrong_name' && (
              <>
                <Select
                  label="Which name is incorrect?"
                  value={selectedTargetAlias}
                  onChange={(e) => setSelectedTargetAlias(e.target.value)}
                  errorMessage={fieldErrors.targetAlias}
                  options={series.aliases.map((a) => ({
                    value: a.text,
                    label: `${a.text} (${a.language.toUpperCase()})`,
                  }))}
                />
                <Select
                  label="Reason"
                  value={wrongReason}
                  onChange={(e) => setWrongReason(e.target.value)}
                  errorMessage={fieldErrors.reason}
                  options={[
                    { value: 'wrong_show', label: 'Belongs to a completely different short drama' },
                    { value: 'typo', label: 'Spelling mistake or incorrect Chinese character' },
                    { value: 'unauthorized', label: 'Unauthorized fan coinage without circulation' },
                    { value: 'other', label: 'Other issue' },
                  ]}
                />
                <Textarea
                  label="Notes or Evidence"
                  placeholder="Explain why this name is incorrect..."
                  value={wrongNote}
                  onChange={(e) => setWrongNote(e.target.value)}
                  rows={2}
                />
              </>
            )}

            {/* Type 3 & 4: Same Drama / Not Same Drama */}
            {(selectedType === 'same_drama' || selectedType === 'not_same_drama') && (
              <>
                <TextField
                  label="Other Drama Title"
                  placeholder="Enter the title or URL of the other drama"
                  value={otherDramaTitle}
                  onChange={(e) => setOtherDramaTitle(e.target.value)}
                  errorMessage={fieldErrors.otherSeriesTitle}
                  helperText="Search by title or paste the URL of the other drama record"
                  required
                />
                <Textarea
                  label="Evidence Note"
                  placeholder="Provide reasons, character names, or release links demonstrating they are the same or different dramas."
                  value={mergeEvidence}
                  onChange={(e) => setMergeEvidence(e.target.value)}
                  rows={3}
                />
              </>
            )}

            {/* Type 5: Wrong Details */}
            {selectedType === 'wrong_details' && (
              <>
                <Select
                  label="Which detail is incorrect?"
                  value={detailField}
                  onChange={(e) => setDetailField(e.target.value)}
                  errorMessage={fieldErrors.field}
                  options={[
                    { value: 'episodes', label: 'Episode count' },
                    { value: 'year', label: 'Release year' },
                    { value: 'origin', label: 'Original language / Country' },
                    { value: 'synopsis', label: 'Synopsis / Plot summary' },
                    { value: 'cast', label: 'Cast & Crew credits' },
                  ]}
                />
                <TextField
                  label="Proposed correct value"
                  placeholder="Enter the correct detail value..."
                  value={proposedValue}
                  onChange={(e) => setProposedValue(e.target.value)}
                  errorMessage={fieldErrors.proposedValue}
                  required
                />
                <TextField
                  label="Source URL (optional)"
                  placeholder="https://example.com/official-credits..."
                  value={detailSourceUrl}
                  onChange={(e) => setDetailSourceUrl(e.target.value)}
                />
              </>
            )}

            {/* Type 6: Link is Broken or Wrong */}
            {selectedType === 'broken_link' && (
              <>
                <Select
                  label="Affected Release Platform"
                  value={releasePlatform}
                  onChange={(e) => setReleasePlatform(e.target.value)}
                  errorMessage={fieldErrors.releasePlatform}
                  options={series.releases.map((r) => ({
                    value: r.platform,
                    label: `${r.platform} (${r.region})`,
                  }))}
                />
                <TextField
                  label="Working replacement URL (optional)"
                  placeholder="https://example.com/watch/series..."
                  value={replacementUrl}
                  onChange={(e) => setReplacementUrl(e.target.value)}
                  helperText="If you know where to watch this legally, paste the new link"
                />
                <Textarea
                  label="Additional notes (optional)"
                  placeholder="e.g. Geoblocked, video removed, paywall error..."
                  value={brokenNote}
                  onChange={(e) => setBrokenNote(e.target.value)}
                  rows={2}
                />
              </>
            )}
          </div>

          {/* User Sign-in Status Prompt */}
          <div className="pt-2 border-t border-[var(--line)] flex items-center justify-between text-[12px] text-[var(--muted)]">
            <div className="flex items-center gap-1.5">
              <UserCheck className="w-3.5 h-3.5 text-[var(--muted)]" />
              <span>
                Submitting as <strong className="text-[var(--ink)] font-semibold">{user?.name || 'Guest Contributor'}</strong> ({user?.role || 'reader'})
              </span>
            </div>
            <span className="text-[11px] text-[var(--muted)]">Form data preserved</span>
          </div>
        </form>
      )}
    </Dialog>
  );
}
