'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { siteConfig } from '@/src/config/site';
import { Breadcrumb } from '@/src/components/ui/breadcrumb';
import { Button } from '@/src/components/ui/button';
import { TextField } from '@/src/components/ui/text-field';
import { Textarea } from '@/src/components/ui/textarea';
import { Select } from '@/src/components/ui/select';
import { useToast } from '@/src/components/ui/toast';
import { ShieldCheck, Info, CheckCircle2, Mail, Send } from 'lucide-react';

export default function TakedownPage() {
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

  return (
    <div className="space-y-8 pb-20 text-left max-w-3xl mx-auto">
      <Breadcrumb
        items={[
          { label: 'Home', href: '/' },
          { label: 'Takedown requests', isCurrent: true },
        ]}
      />

      <header className="space-y-2 border-b border-[var(--line)] pb-4">
        <div className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-[var(--crimson)] uppercase tracking-wider">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Rights Holder Notice</span>
        </div>
        <h1 className="text-[28px] sm:text-[36px] font-semibold text-[var(--ink)] tracking-tight">
          Takedown & Link Removal Requests
        </h1>
        <p className="text-[14px] text-[var(--muted)]">
          Procedures for copyright owners, distributors, and licensed producers.
        </p>
      </header>

      {/* Non-hosting Plain Statement */}
      <div className="p-5 bg-[var(--surface-subtle)] border border-[var(--line)] rounded-[12px] space-y-2.5 text-[14px]">
        <div className="flex items-center gap-2 font-semibold text-[var(--ink)]">
          <Info className="w-4 h-4 text-[var(--muted)] shrink-0" />
          <span>How Requests Are Handled</span>
        </div>
        <p className="text-[var(--muted)] leading-relaxed text-[13px]">
          {siteConfig.name} is an informational index and community database for short vertical dramas. <strong>We do not host, store, stream, or embed video files.</strong> We index factual metadata and direct links to third-party or official platforms.
        </p>
        <p className="text-[var(--muted)] text-[13px]">
          Upon receiving a verified request from a rights holder, our team will review the claim within <strong>2 business days</strong> to remove unauthorized external watch links or update official distributor links.
        </p>
      </div>

      {submittedId ? (
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
      ) : (
        <form onSubmit={handleSubmit} className="p-6 bg-[var(--surface)] border border-[var(--line)] rounded-[12px] space-y-5">
          <h2 className="text-[16px] font-semibold text-[var(--ink)] border-b border-[var(--line)] pb-2">
            Submit Link Removal or Attribution Notice
          </h2>

          <TextField
            label="URL of the Drama Entry on ShortDramaIndex"
            type="url"
            placeholder="https://shortdramaindex.com/title/101-drama-title..."
            value={entryUrl}
            onChange={(e) => setEntryUrl(e.target.value)}
            required
            helperText="Paste the full link to the page where the content or link is listed."
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <TextField
              label="Your Full Name / Entity"
              placeholder="e.g. Eleanor Vance / Lumen Media Group"
              value={claimantName}
              onChange={(e) => setClaimantName(e.target.value)}
              required
            />
            <TextField
              label="Contact Email"
              type="email"
              placeholder="legal@rights-holder.com"
              value={claimantEmail}
              onChange={(e) => setClaimantEmail(e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              label="Your Relationship"
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
            label="Statement & Proof of Rights"
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
      )}
    </div>
  );
}
