import React from 'react';
import { Metadata } from 'next';
import Link from 'next/link';
import { siteConfig } from '@/src/config/site';
import { Breadcrumb } from '@/src/components/ui/breadcrumb';
import { BookOpen, CheckCircle2, HelpCircle, Shield, FileText } from 'lucide-react';

export function generateMetadata(): Metadata {
  const title = 'Community Editing Guidelines';
  const description = `Standards for title naming conventions, disambiguation rules, aliases, and verification on ${siteConfig.name}.`;
  const canonicalUrl = `${siteConfig.baseUrl}/guidelines`;

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

export default function GuidelinesPage() {
  return (
    <div className="space-y-8 pb-20 text-left max-w-5xl mx-auto">
      <Breadcrumb
        items={[
          { label: 'Home', href: '/' },
          { label: 'Editing guidelines', isCurrent: true },
        ]}
      />

      <header className="space-y-2 border-b border-[var(--line)] pb-4">
        <div className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-[var(--crimson)]">
          <BookOpen className="w-3.5 h-3.5" />
          <span>Reference Standard</span>
        </div>
        <h1 className="text-[28px] sm:text-[36px] font-semibold text-[var(--ink)] tracking-tight">
          Community Editing Guidelines
        </h1>
        <p className="text-[14px] text-[var(--muted)]">
          The reference standards for cataloging, naming, and verifying short vertical drama releases on {siteConfig.name}.
        </p>
      </header>

      {/* Two-column layout with Desktop Sticky Table of Contents */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Desktop Sticky Anchored TOC */}
        <aside className="hidden lg:block lg:col-span-4 sticky top-16 space-y-3 p-4 bg-[var(--surface)] border border-[var(--line)] rounded-[12px]">
          <span className="text-[12px] font-semibold text-[var(--muted)] block">
            Table of Contents
          </span>
          <nav className="space-y-2 text-[13px]">
            <a
              href="#naming-conventions"
              className="block text-[var(--muted)] hover:text-[var(--crimson)] transition-colors"
            >
              1. Naming Conventions & Aliases
            </a>
            <a
              href="#disambiguation"
              className="block text-[var(--muted)] hover:text-[var(--crimson)] transition-colors"
            >
              2. What Counts as the Same Drama
            </a>
            <a
              href="#verification-workflow"
              className="block text-[var(--muted)] hover:text-[var(--crimson)] transition-colors"
            >
              3. How Reports Are Reviewed
            </a>
            <a
              href="#glossary"
              className="block text-[var(--muted)] hover:text-[var(--crimson)] transition-colors"
            >
              4. Terminology Glossary
            </a>
          </nav>
        </aside>

        {/* Long-form Article Body (65 Character Line Measure) */}
        <article className="lg:col-span-8 max-w-prose space-y-10 text-[15px] leading-relaxed text-[var(--ink)]">
          {/* Section 1: Naming Conventions */}
          <section id="naming-conventions" className="space-y-3.5 scroll-mt-20">
            <h2 className="text-[20px] font-semibold text-[var(--ink)] border-b border-[var(--line)] pb-2">
              1. Naming Conventions & Aliases
            </h2>
            <p className="text-[var(--muted)]">
              Because short vertical dramas are frequently retitled across distributors, social platforms, and international dubs, {siteConfig.name} maintains a rigorous ledger of all known names.
            </p>
            <ul className="list-disc pl-5 space-y-2 text-[var(--muted)] text-[14px]">
              <li>
                <strong className="text-[var(--ink)]">Canonical Title:</strong> The primary title should match the official English license name if one exists with wide circulation, or the official native CJK release title.
              </li>
              <li>
                <strong className="text-[var(--ink)]">Original Script & Romanization:</strong> Always provide native characters (Simplified Chinese, Traditional Chinese, Hangul) and standard Pinyin or Romaja transliteration.
              </li>
              <li>
                <strong className="text-[var(--ink)]">Language Tags:</strong> Every alias in the ledger must specify its ISO language tag (e.g. <code>zh</code>, <code>en</code>, <code>ko</code>, <code>es</code>) so screen readers and search indexes parse it correctly.
              </li>
              <li>
                <strong className="text-[var(--ink)]">Machine Translations:</strong> Do not invent literal translations. Only record fan titles or localized names that have circulated on public streaming channels or official app listings.
              </li>
            </ul>
          </section>

          {/* Section 2: What Counts as the Same Drama */}
          <section id="disambiguation" className="space-y-3.5 scroll-mt-20">
            <h2 className="text-[20px] font-semibold text-[var(--ink)] border-b border-[var(--line)] pb-2">
              2. What Counts as the Same Drama
            </h2>
            <p className="text-[var(--muted)]">
              Short dramas are often re-edited, split into different episode lengths (e.g. 80 one-minute episodes vs 20 four-minute compilations), or uploaded under different subtitles.
            </p>
            <div className="p-4 bg-[var(--surface-subtle)] border border-[var(--line)] rounded-[8px] space-y-2 text-[13px]">
              <span className="font-semibold text-[var(--ink)] block">
                Rule of Thumb for Merging:
              </span>
              <p className="text-[var(--muted)]">
                If the underlying cast, footage, director, and plotline are identical, it is the <strong>same drama</strong> regardless of platform retitling, episode duration cuts, or language dubbing. All platform links belong under one canonical title.
              </p>
            </div>
            <p className="text-[var(--muted)] text-[14px]">
              Distinct remakes featuring different actors, studio re-shoots, or separate prequel/sequel storylines must remain distinct entries, cross-referenced using the disambiguation tools.
            </p>
          </section>

          {/* Section 3: How Reports Are Reviewed */}
          <section id="verification-workflow" className="space-y-3.5 scroll-mt-20">
            <h2 className="text-[20px] font-semibold text-[var(--ink)] border-b border-[var(--line)] pb-2">
              3. How Reports Are Reviewed
            </h2>
            <p className="text-[var(--muted)]">
              Every community report flows directly to the moderation queue. Submissions are classified into three verifiable states:
            </p>
            <div className="space-y-2 text-[13px]">
              <div className="p-3 bg-[var(--surface)] border border-[var(--line)] rounded-[8px] flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-[var(--status-verified)] shrink-0 mt-0.5" />
                <div>
                  <strong className="text-[var(--ink)]">Verified:</strong> Supported by official distributor links, publisher credits, or confirmed playlist URLs.
                </div>
              </div>

              <div className="p-3 bg-[var(--surface)] border border-[var(--line)] rounded-[8px] flex items-start gap-2.5">
                <HelpCircle className="w-4 h-4 text-[var(--status-pending)] shrink-0 mt-0.5" />
                <div>
                  <strong className="text-[var(--ink)]">Pending:</strong> Newly submitted community alias awaiting moderator cross-referencing.
                </div>
              </div>

              <div className="p-3 bg-[var(--surface)] border border-[var(--line)] rounded-[8px] flex items-start gap-2.5">
                <Shield className="w-4 h-4 text-[var(--crimson)] shrink-0 mt-0.5" />
                <div>
                  <strong className="text-[var(--ink)]">Disputed:</strong> Conflicting submissions or unverified machine translations flagged for editor review.
                </div>
              </div>
            </div>
          </section>

          {/* Section 4: Terminology Glossary */}
          <section id="glossary" className="space-y-3.5 scroll-mt-20">
            <h2 className="text-[20px] font-semibold text-[var(--ink)] border-b border-[var(--line)] pb-2">
              4. Terminology Glossary
            </h2>
            <p className="text-[var(--muted)]">
              To ensure international search compatibility and catalog consistency across regional markets, {siteConfig.name} defines the core industry terminology:
            </p>

            <dl className="space-y-3 text-[14px]">
              <div>
                <dt className="font-semibold text-[var(--ink)]">Short drama</dt>
                <dd className="text-[var(--muted)] pl-4 border-l-2 border-[var(--line)] mt-0.5">
                  The standard universal term used across {siteConfig.name} describing serialized episodic video narratives produced in 1 to 3-minute episode increments.
                </dd>
              </div>

              <div>
                <dt className="font-semibold text-[var(--ink)]">Mini drama</dt>
                <dd className="text-[var(--muted)] pl-4 border-l-2 border-[var(--line)] mt-0.5">
                  A common international term for bite-sized episodic drama productions with compact runtimes designed for fast mobile consumption.
                </dd>
              </div>

              <div>
                <dt className="font-semibold text-[var(--ink)]">Micro drama</dt>
                <dd className="text-[var(--muted)] pl-4 border-l-2 border-[var(--line)] mt-0.5">
                  An industry term emphasizing hyper-condensed story pacing, rapid cliffhangers, and short 60-to-90 second episode durations.
                </dd>
              </div>

              <div>
                <dt className="font-semibold text-[var(--ink)]">Vertical drama</dt>
                <dd className="text-[var(--muted)] pl-4 border-l-2 border-[var(--line)] mt-0.5">
                  Dramas framed natively in 9:16 portrait aspect ratio for full-screen smartphone viewing without device rotation.
                </dd>
              </div>

              <div>
                <dt className="font-semibold text-[var(--ink)]">Duanju (短剧)</dt>
                <dd className="text-[var(--muted)] pl-4 border-l-2 border-[var(--line)] mt-0.5">
                  The foundational Chinese term for vertical episodic web serials that pioneered the high-velocity format and CEO romance archetypes globally.
                </dd>
              </div>
            </dl>
          </section>

          {/* Section 5: Global & Regional Curation Policy */}
          <section id="english-curation" className="space-y-3.5 scroll-mt-20">
            <h2 className="text-[20px] font-semibold text-[var(--ink)] border-b border-[var(--line)] pb-2">
              5. Global &amp; Regional Curation Policy
            </h2>
            <p className="text-[var(--muted)]">
              ShortDramaIndex curates global and regional vertical dramas. We cover original English-cast productions, Hindi short dramas from India, and Asian vertical drama productions, prioritizing verified human-subtitled dramas so readers can find titles that were made for, or carefully adapted for, their language.
            </p>
            <p className="text-[var(--muted)]">
              We exclude low-effort robotic AI dubs. A title with an AI dub is only listed if it achieves widespread community acclaim, with a rating of 8.0 or higher, rather than being included by default.
            </p>
          </section>
        </article>
      </div>
    </div>
  );
}
