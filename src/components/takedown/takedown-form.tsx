'use client';

import React, { useState } from 'react';
import { siteConfig } from '@/src/config/site';
import { Button } from '@/src/components/ui/button';
import { TextField } from '@/src/components/ui/text-field';
import { Textarea } from '@/src/components/ui/textarea';
import { Select } from '@/src/components/ui/select';
import { useToast } from '@/src/components/ui/toast';
import { Mail, Send } from 'lucide-react';

export function TakedownForm() {
  const { showToast } = useToast();

  const [entryUrl, setEntryUrl] = useState('');
  const [claimantName, setClaimantName] = useState('');
  const [claimantEmail, setClaimantEmail] = useState('');
  const [claimantRole, setClaimantRole] = useState('owner');
  const [requestType, setRequestType] = useState('external_link');
  const [details, setDetails] = useState('');
  const [emailOpened, setEmailOpened] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!entryUrl || !claimantEmail || !claimantName) {
      showToast({
        title: 'Required fields missing',
        description: 'Please provide the entry URL, your name, and a valid contact email.',
        type: 'error',
      });
      return;
    }

    // Honest handoff: nothing is stored or logged by this form. It opens
    // the visitor's own email client with the notice pre-filled, addressed
    // to the site's legal contact. The notice is only sent if the visitor
    // sends that email themselves.
    const contactEmail = `legal@${siteConfig.domain}`;
    const subject = `Takedown notice: ${entryUrl}`;
    const body = [
      `Entry URL: ${entryUrl}`,
      `Name / entity: ${claimantName}`,
      `Contact email: ${claimantEmail}`,
      `Relationship: ${claimantRole}`,
      `Request: ${requestType}`,
      '',
      'Statement and proof of rights:',
      details,
    ].join('\n');
    const mailto = `mailto:${contactEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.location.href = mailto;
    setEmailOpened(true);

    showToast({
      title: 'Email draft opened',
      description: `Your email client should have opened with the notice addressed to ${contactEmail}. Send it from there to complete the notice — nothing has been submitted yet.`,
      type: 'success',
    });
  };

  if (emailOpened) {
    return (
      <div className="p-6 bg-[var(--surface)] border border-[var(--line)] rounded-[12px] space-y-4">
        <div className="space-y-1">
          <h2 className="text-[16px] font-semibold text-[var(--ink)]">
            Email draft opened
          </h2>
          <p className="text-[13px] text-[var(--muted)] leading-relaxed">
            Your email client should have opened with the notice pre-filled and addressed to <strong>legal@{siteConfig.domain}</strong>. Nothing has been submitted or stored by this site — please send the email from your email client to complete the notice. If no email client opened, copy the details from the form and email them directly to legal@{siteConfig.domain}.
          </p>
        </div>

        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={() => setEmailOpened(false)}
        >
          Back to the form
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
          leftIcon={<Send className="w-4 h-4" />}
          className="px-6 font-semibold"
        >
          Open email to legal@{siteConfig.domain}
        </Button>
      </div>
    </form>
  );
}
