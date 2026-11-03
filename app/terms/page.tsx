import React from 'react';
import { Metadata } from 'next';
import Link from 'next/link';
import { siteConfig } from '@/src/config/site';
import { Breadcrumb } from '@/src/components/ui/breadcrumb';
import { FileText, ArrowRight } from 'lucide-react';

export function generateMetadata(): Metadata {
  const title = `Terms of Service | ${siteConfig.name}`;
  const description = `Terms of service, acceptable use standards, contributor licensing terms, and disclaimer policies for ${siteConfig.name}.`;
  const canonicalUrl = `${siteConfig.baseUrl}/terms`;

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

export default function TermsPage() {
  return (
    <div className="space-y-8 pb-20 text-left max-w-3xl mx-auto">
      <Breadcrumb
        items={[
          { label: 'Home', href: '/' },
          { label: 'Terms of service', isCurrent: true },
        ]}
      />

      <header className="space-y-2 border-b border-[var(--line)] pb-4">
        <div className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-[var(--crimson)]">
          <FileText className="w-3.5 h-3.5" />
          <span>Legal agreement</span>
        </div>
        <h1 className="text-[28px] sm:text-[36px] font-semibold text-[var(--ink)] tracking-tight">
          Terms of Service
        </h1>
        <p className="text-[14px] text-[var(--muted)]">
          Terms governing the use of {siteConfig.name} and community contributions.
        </p>
      </header>

      <article className="max-w-prose space-y-10 text-[15px] leading-relaxed text-[var(--ink)]">
        {/* Section 1: What the site is */}
        <section className="space-y-3">
          <h2 className="text-[20px] font-semibold text-[var(--ink)] border-b border-[var(--line)] pb-2">
            1. What the site is
          </h2>
          <p className="text-[var(--muted)]">
            {siteConfig.name} is an informational reference database and catalog for serialized short dramas. The site indexes factual metadata, titles, alternate language aliases, cast credits, and external links to official and third-party distribution channels.
          </p>
          <p className="text-[var(--muted)]">
            {siteConfig.name} does not host, store, stream, upload, or embed any video files. All video playback occurs on external, independent third-party platforms.
          </p>
        </section>

        {/* Section 2: User accounts */}
        <section className="space-y-3">
          <h2 className="text-[20px] font-semibold text-[var(--ink)] border-b border-[var(--line)] pb-2">
            2. User accounts
          </h2>
          <p className="text-[var(--muted)]">
            Creating an account allows you to maintain personal watchlists, record ratings, submit title aliases, and report incorrect metadata. You are responsible for safeguarding your credentials and for all activities conducted through your account.
          </p>
          <p className="text-[var(--muted)]">
            You must provide accurate account information and may delete your account at any time through your profile settings.
          </p>
        </section>

        {/* Section 3: Community contributions */}
        <section className="space-y-3">
          <h2 className="text-[20px] font-semibold text-[var(--ink)] border-b border-[var(--line)] pb-2">
            3. Community contributions and licensing
          </h2>
          <p className="text-[var(--muted)]">
            By submitting title names, aliases, release links, cast associations, synopses, or edit proposals to {siteConfig.name}, you grant {siteConfig.name} a perpetual, worldwide, non-exclusive, royalty-free license to use, display, reproduce, distribute, index, and organize those contributions within the catalog.
          </p>
          <p className="text-[var(--muted)]">
            You confirm that your submissions are factual, accurate to the best of your knowledge, and do not infringe on the intellectual property or proprietary rights of third parties.
          </p>
        </section>

        {/* Section 4: Acceptable use */}
        <section className="space-y-3">
          <h2 className="text-[20px] font-semibold text-[var(--ink)] border-b border-[var(--line)] pb-2">
            4. Acceptable use
          </h2>
          <p className="text-[var(--muted)]">
            You agree to use the site in accordance with all applicable laws and our community standards. You agree not to:
          </p>
          <ul className="list-disc pl-5 space-y-1.5 text-[var(--muted)] text-[14px]">
            <li>Submit intentionally false, misleading, abusive, or defamatory catalog metadata.</li>
            <li>Attempt to bypass site security, probe system vulnerabilities, or disrupt normal site operations.</li>
            <li>Automate scraping or mass requests at a volume that interferes with site stability for other users.</li>
            <li>Impersonate another user, editor, rights holder, or administrator.</li>
          </ul>
        </section>

        {/* Section 5: Links to third-party platforms */}
        <section className="space-y-3">
          <h2 className="text-[20px] font-semibold text-[var(--ink)] border-b border-[var(--line)] pb-2">
            5. Links to third-party platforms
          </h2>
          <p className="text-[var(--muted)]">
            {siteConfig.name} contains external hyperlinks directing users to third-party services, streaming applications, and content platforms. These links are provided for informational and reference purposes only.
          </p>
          <p className="text-[var(--muted)]">
            We do not control, endorse, or assume responsibility for the content, privacy practices, terms, or availability of third-party platforms.
          </p>
        </section>

        {/* Section 6: Takedown requests */}
        <section className="space-y-3">
          <h2 className="text-[20px] font-semibold text-[var(--ink)] border-b border-[var(--line)] pb-2">
            6. Takedown requests
          </h2>
          <p className="text-[var(--muted)]">
            We respect the intellectual property rights of creators and distributors. If you are a copyright owner or authorized representative and believe an external watch link or entry on {siteConfig.name} should be removed or updated, please submit a formal notice through our dedicated review workflow.
          </p>
          <p className="pt-1">
            <Link
              href="/takedown"
              className="inline-flex items-center gap-1.5 text-[14px] font-medium text-[var(--crimson)] hover:underline"
            >
              <span>Submit a takedown or link removal notice</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </p>
        </section>

        {/* Section 7: Changes to the terms */}
        <section className="space-y-3">
          <h2 className="text-[20px] font-semibold text-[var(--ink)] border-b border-[var(--line)] pb-2">
            7. Changes to the terms
          </h2>
          <p className="text-[var(--muted)]">
            We may update these terms from time to time to reflect modifications in our reference database features or applicable legal requirements. The updated terms will be posted directly to this page with an updated effective date. Continued use of the site following any modifications constitutes acceptance of the revised terms.
          </p>
          <p className="text-[13px] text-[var(--muted)] pt-2 border-t border-[var(--line)]">
            Questions regarding these terms may be directed to legal@{siteConfig.domain}.
          </p>
        </section>
      </article>
    </div>
  );
}
