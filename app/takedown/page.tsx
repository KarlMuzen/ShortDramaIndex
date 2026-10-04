import React from 'react';
import { Metadata } from 'next';
import { siteConfig } from '@/src/config/site';
import { Breadcrumb } from '@/src/components/ui/breadcrumb';
import { TakedownForm } from '@/src/components/takedown/takedown-form';
import { ShieldCheck, Info } from 'lucide-react';

export function generateMetadata(): Metadata {
  const title = `Takedown & Link Removal Requests | ${siteConfig.name}`;
  const description = `Procedures for copyright owners, distributors, and licensed producers to submit link removal notices or attribution corrections on ${siteConfig.name}.`;
  const canonicalUrl = `${siteConfig.baseUrl}/takedown`;

  return {
    title,
    description,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      type: 'website',
      siteName: siteConfig.name,
    },
    twitter: {
      card: 'summary',
      title,
      description,
    },
  };
}

export default function TakedownPage() {
  return (
    <div className="space-y-8 pb-20 text-left max-w-3xl mx-auto">
      <Breadcrumb
        items={[
          { label: 'Home', href: '/' },
          { label: 'Takedown requests', isCurrent: true },
        ]}
      />

      <header className="space-y-2 border-b border-[var(--line)] pb-4">
        <div className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-[var(--crimson)]">
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
          {siteConfig.name} is an informational index and community database for short dramas. <strong>We do not host, store, stream, or embed video files.</strong> We index factual metadata and direct links to third-party or official platforms.
        </p>
        <p className="text-[var(--muted)] text-[13px]">
          Upon receiving a verified request from a rights holder, our team will review the claim within <strong>2 business days</strong> to remove unauthorized external watch links or update official distributor links.
        </p>
      </div>

      <TakedownForm />
    </div>
  );
}
