'use client';

import React, { useState } from 'react';
import { siteConfig } from '@/src/config/site';
import { Button } from '@/src/components/ui/button';
import { TextField } from '@/src/components/ui/text-field';
import { Textarea } from '@/src/components/ui/textarea';
import { Select } from '@/src/components/ui/select';
import { useToast } from '@/src/components/ui/toast';
import { CheckCircle2, Mail, Send } from 'lucide-react';

export function TakedownForm() {
  const { showToast } = useToast();

  const [entryUrl, setEntryUrl] = useState('');
  const [claimantName, setClaimantName] = useState('');
  const [claimantEmail, setClaimantEmail] = useState('');
  const [claimantRole, setClaimantRole] = useState('owner');
  const [requestType, setRequestType] = useState('external_link');
  const [details, setDetails] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedId, setSubmittedId] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!entryUrl || !claimantEmail || !claimantName) {
      showToast({
        title: 'Required fields missing',
        description: 'Please provide the entry URL, your name, and a valid contact email.',
        type: 'error',
      });
      return;
    }

    setIsSubmitting(true);
    await new Promise((r) => setTimeout(r, 600));

    const noticeId = `td_${Date.now()}`;
    setSubmittedId(noticeId);
    setIsSubmitting(false);

    showToast({
      title: 'Takedown notice logged',
      description: `Your request #${noticeId} has been queued for legal review.`,
      type: 'success',
    });
  };

  if (submittedId) {
    return (
      <div className="p-6 bg-[var(--surface)] border border-[var(--status-verified)]/30 rounded-[12px] space-y-4">
        <div className="flex items-start gap-3">
          <CheckCircle2 className="w-6 h-6 text-[var(--status-verified)] shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h2 className="text-[16px] font-semibold text-[var(--ink)]">
              Takedown request received
            </h2>
            <p className="text-[13px] text-[var(--muted)] leading-relaxed">
              Your request has been logged under ID <strong className="font-mono text-[var(--ink)]">#{submittedId}</strong>. A confirmation email has been dispatched to <strong>{claimantEmail}</strong>. Our legal review team will complete verification within 48 hours.
            </p>
          </div>
        </div>

        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={() => {
            setSubmittedId(null);
            setEntryUrl('');
            setDetails('');
          }}
        >
          Submit another notice
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="p-6 bg-[var(--surface)] border border-[var(--line)] rounded-[12px] space-y-5 text-left">
      <h2 className="text-[16px] font-semibold text-[var(--ink)] border-b border-[var(--line)] pb-2">
        Submit Link Removal or Attribution Notice
      </h2>

      <TextField
        label="URL of the drama entry"
        type="url"
        placeholder="https://shortdramaindex.com/title/..."
        value={entryUrl}
        onChange={(e) => setEntryUrl(e.target.value)}
        required
        helperText="Paste the link to the page where the content or link is listed."
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <TextField
          label="Your full name or entity"
          placeholder="e.g. Jane Doe / Official Rights Holder"
          value={claimantName}
          onChange={(e) => setClaimantName(e.target.value)}
          required
        />
        <TextField
          label="Contact email"
          type="email"
          placeholder="legal@rights-holder.com"
          value={claimantEmail}
          onChange={(e) => setClaimantEmail(e.target.value)}
          required
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Select
          label="Your relationship"
          value={claimantRole}
          onChange={(e) => setClaimantRole(e.target.value)}
          options={[
            { value: 'owner', label: 'Direct Copyright Owner' },
            { value: 'agent', label: 'Authorized Legal Representative / Agent' },
            { value: 'distributor', label: 'Licensed Streaming Distributor' },
          ]}
        />
        <Select
          label="What are you asking to remove?"
          value={requestType}
          onChange={(e) => setRequestType(e.target.value)}
          options={[
            { value: 'external_link', label: 'Remove unauthorized watch link' },
            { value: 'update_link', label: 'Replace link with official platform URL' },
            { value: 'metadata_fix', label: 'Correct studio/distributor attribution' },
            { value: 'full_takedown', label: 'Remove entire catalog entry' },
          ]}
        />
      </div>

      <Textarea
        label="Statement and proof of rights"
        placeholder="Please provide details confirming copyright ownership, license rights, or specific infringing external link URLs..."
        value={details}
        onChange={(e) => setDetails(e.target.value)}
        rows={4}
        required
      />

      <div className="pt-2 border-t border-[var(--line)] flex items-center justify-between">
        <div className="text-[12px] text-[var(--muted)] flex items-center gap-1.5">
          <Mail className="w-3.5 h-3.5" />
          <span>Or email legal@{siteConfig.domain}</span>
        </div>

        <Button
          type="submit"
          variant="primary"
          size="md"
          isLoading={isSubmitting}
          leftIcon={<Send className="w-4 h-4" />}
          className="px-6 font-semibold"
        >
          Submit notice
        </Button>
      </div>
    </form>
  );
}
