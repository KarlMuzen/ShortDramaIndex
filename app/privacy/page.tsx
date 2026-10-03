import React from 'react';
import { Metadata } from 'next';
import Link from 'next/link';
import { siteConfig } from '@/src/config/site';
import { Breadcrumb } from '@/src/components/ui/breadcrumb';
import { Lock, ArrowRight } from 'lucide-react';

export function generateMetadata(): Metadata {
  const title = `Privacy Policy | ${siteConfig.name}`;
  const description = `Privacy policy for ${siteConfig.name}. Information on account data, tracking-free cookies, local storage, and data export or deletion.`;
  const canonicalUrl = `${siteConfig.baseUrl}/privacy`;

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

export default function PrivacyPage() {
  return (
    <div className="space-y-8 pb-20 text-left max-w-3xl mx-auto">
      <Breadcrumb
        items={[
          { label: 'Home', href: '/' },
          { label: 'Privacy policy', isCurrent: true },
        ]}
      />

      <header className="space-y-2 border-b border-[var(--line)] pb-4">
        <div className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-[var(--crimson)] uppercase tracking-wider">
          <Lock className="w-3.5 h-3.5" />
          <span>Privacy & Data Protection</span>
        </div>
        <h1 className="text-[28px] sm:text-[36px] font-semibold text-[var(--ink)] tracking-tight">
          Privacy Policy
        </h1>
        <p className="text-[14px] text-[var(--muted)]">
          How {siteConfig.name} handles account information, storage, and user data.
        </p>
      </header>

      <article className="max-w-prose space-y-10 text-[15px] leading-relaxed text-[var(--ink)]">
        {/* Section 1: What we collect */}
        <section className="space-y-3">
          <h2 className="text-[20px] font-semibold text-[var(--ink)] border-b border-[var(--line)] pb-2">
            1. What we collect
          </h2>
          <p className="text-[var(--muted)]">
            {siteConfig.name} collects only the information necessary to provide account services and community curation features:
          </p>
          <ul className="list-disc pl-5 space-y-2 text-[var(--muted)] text-[14px]">
            <li>
              <strong className="text-[var(--ink)]">Account Information:</strong> When you register, we collect your email address and chosen display name or handle to manage your authentication session.
            </li>
            <li>
              <strong className="text-[var(--ink)]">Lists and Tracking Data:</strong> The titles you mark as watching, completed, planned, on hold, or dropped, along with episode progress.
            </li>
            <li>
              <strong className="text-[var(--ink)]">Ratings:</strong> The numerical ratings (1 through 10) you assign to short drama series.
            </li>
            <li>
              <strong className="text-[var(--ink)]">Contributions:</strong> Alternate title aliases, release links, and metadata edits you submit to the public ledger.
            </li>
            <li>
              <strong className="text-[var(--ink)]">Reports:</strong> Correction requests, broken link notices, and disambiguation feedback submitted through the report dialogs.
            </li>
          </ul>
        </section>

        {/* Section 2: Cookies and local storage */}
        <section className="space-y-3">
          <h2 className="text-[20px] font-semibold text-[var(--ink)] border-b border-[var(--line)] pb-2">
            2. Cookies and local storage
          </h2>
          <p className="text-[var(--muted)]">
            We use essential cookies and browser local storage strictly for core site functionality:
          </p>
          <ul className="list-disc pl-5 space-y-2 text-[var(--muted)] text-[14px]">
            <li>
              <strong className="text-[var(--ink)]">Session Authentication:</strong> Cookies maintain your logged-in state across page navigations.
            </li>
            <li>
              <strong className="text-[var(--ink)]">Theme Preference:</strong> Local storage preserves your preferred display mode (light, dark, or system default) to prevent screen flickering on load.
            </li>
          </ul>
        </section>

        {/* Section 3: No advertising or tracking cookies */}
        <section className="space-y-3">
          <h2 className="text-[20px] font-semibold text-[var(--ink)] border-b border-[var(--line)] pb-2">
            3. No advertising or tracking cookies
          </h2>
          <p className="text-[var(--muted)]">
            {siteConfig.name} does not use third-party advertising networks, behavioral tracking scripts, cross-site trackers, or data broker integrations. We do not sell, rent, or monetize your personal information or viewing lists.
          </p>
        </section>

        {/* Section 4: How to export or delete your data */}
        <section className="space-y-3">
          <h2 className="text-[20px] font-semibold text-[var(--ink)] border-b border-[var(--line)] pb-2">
            4. How to export or delete your data
          </h2>
          <p className="text-[var(--muted)]">
            You retain complete control over your personal data:
          </p>
          <ul className="list-disc pl-5 space-y-2 text-[var(--muted)] text-[14px]">
            <li>
              <strong className="text-[var(--ink)]">Data Export:</strong> You can download a complete JSON archive of your profile information, lists, ratings, and preferences at any time from your account settings.
            </li>
            <li>
              <strong className="text-[var(--ink)]">Account Deletion:</strong> You can permanently delete your account and all associated list entries directly from your account settings.
            </li>
          </ul>
          <p className="pt-1">
            <Link
              href="/settings"
              className="inline-flex items-center gap-1.5 text-[14px] font-medium text-[var(--crimson)] hover:underline"
            >
              <span>Manage data export and deletion in settings</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </p>
        </section>

        {/* Section 5: Contact */}
        <section className="space-y-3">
          <h2 className="text-[20px] font-semibold text-[var(--ink)] border-b border-[var(--line)] pb-2">
            5. Contact
          </h2>
          <p className="text-[var(--muted)]">
            For any questions, requests, or concerns regarding your privacy or personal data on {siteConfig.name}, please contact us at [contact email].
          </p>
        </section>
      </article>
    </div>
  );
}
