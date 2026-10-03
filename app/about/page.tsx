import React from 'react';
import { Metadata } from 'next';
import Link from 'next/link';
import { siteConfig } from '@/src/config/site';
import { Breadcrumb } from '@/src/components/ui/breadcrumb';
import { Info, Database, Search, ShieldCheck, ArrowRight } from 'lucide-react';

export const metadata: Metadata = {
  title: `About ${siteConfig.name} | The Reference Index`,
  description: `Learn about ${siteConfig.name}, the calm reference library and disambiguation catalog for global short vertical dramas.`,
};

export default function AboutPage() {
  return (
    <div className="space-y-8 pb-20 text-left max-w-3xl mx-auto">
      <Breadcrumb
        items={[
          { label: 'Home', href: '/' },
          { label: 'About', isCurrent: true },
        ]}
      />

      <header className="space-y-2 border-b border-[var(--line)] pb-4">
        <div className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-[var(--crimson)] uppercase tracking-wider">
          <Info className="w-3.5 h-3.5" />
          <span>About the Index</span>
        </div>
        <h1 className="text-[28px] sm:text-[36px] font-semibold text-[var(--ink)] tracking-tight">
          About {siteConfig.name}
        </h1>
        <p className="text-[14px] text-[var(--muted)]">
          The global reference database for serialized short vertical dramas.
        </p>
      </header>

      <div className="space-y-8 text-[15px] leading-relaxed text-[var(--ink)]">
        {/* Explainer Block */}
        <section className="p-6 bg-[var(--surface)] border border-[var(--line)] rounded-[12px] space-y-3">
          <h2 className="text-[18px] font-semibold text-[var(--ink)]">
            What is a short drama?
          </h2>
          <p className="text-[var(--muted)] leading-relaxed">
            A <strong>short drama</strong> is a fast-paced serialized narrative designed specifically for mobile screens with episodes lasting between one and three minutes. Popularized globally under various names, a <strong>mini drama</strong> emphasizes bingeable, high-stakes storytelling with frequent cliffhangers. The format is also known in international tech sectors as a <strong>micro drama</strong> because of its bite-sized episodic length and rapid release schedules. Filmed natively in portrait orientation as a <strong>vertical drama</strong>, the phenomenon originates from the viral Chinese web genre known as <strong>duanju</strong>.
          </p>
        </section>

        {/* What the site is */}
        <section className="space-y-3">
          <h2 className="text-[20px] font-semibold text-[var(--ink)]">
            What {siteConfig.name} is
          </h2>
          <p className="text-[var(--muted)]">
            {siteConfig.name} is a comprehensive reference catalog and title ledger. Like MyAnimeList or Discogs, our mission is to make every short drama findable by any name it is known by, catalog every alternate language alias, and guide viewers to legitimate places to watch online.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
            <div className="p-4 bg-[var(--surface-subtle)] border border-[var(--line)] rounded-[8px] space-y-1">
              <Database className="w-4 h-4 text-[var(--crimson)]" />
              <h3 className="text-[13px] font-semibold text-[var(--ink)]">
                Unified Alias Ledger
              </h3>
              <p className="text-[12px] text-[var(--muted)]">
                Every title variation, native CJK script, and fan translation cross-referenced.
              </p>
            </div>

            <div className="p-4 bg-[var(--surface-subtle)] border border-[var(--line)] rounded-[8px] space-y-1">
              <Search className="w-4 h-4 text-[var(--crimson)]" />
              <h3 className="text-[13px] font-semibold text-[var(--ink)]">
                Link & URL Reverse Search
              </h3>
              <p className="text-[12px] text-[var(--muted)]">
                Paste any watch link or social share clip to identify the drama instantly.
              </p>
            </div>

            <div className="p-4 bg-[var(--surface-subtle)] border border-[var(--line)] rounded-[8px] space-y-1">
              <ShieldCheck className="w-4 h-4 text-[var(--crimson)]" />
              <h3 className="text-[13px] font-semibold text-[var(--ink)]">
                Community Moderated
              </h3>
              <p className="text-[12px] text-[var(--muted)]">
                Audited edit histories and strict verification guidelines maintain data integrity.
              </p>
            </div>
          </div>
        </section>

        {/* What we do not do */}
        <section className="space-y-3 p-5 bg-[var(--surface-subtle)] border border-[var(--line)] rounded-[12px]">
          <h2 className="text-[16px] font-semibold text-[var(--ink)]">
            Non-Hosting Policy
          </h2>
          <p className="text-[13px] text-[var(--muted)] leading-relaxed">
            {siteConfig.name} is strictly an informational index. We do not host, store, stream, or embed any video files. Our &ldquo;Where to watch&rdquo; listings are external hyperlinks directing viewers to official distribution channels and publisher platforms.
          </p>
        </section>

        <div className="pt-4 flex items-center justify-between border-t border-[var(--line)]">
          <Link
            href="/guidelines"
            className="inline-flex items-center gap-1.5 text-[13px] font-medium text-[var(--crimson)] hover:underline"
          >
            <span>Read community editing guidelines</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>

          <Link
            href="/takedown"
            className="text-[13px] text-[var(--muted)] hover:text-[var(--ink)] hover:underline"
          >
            Takedown requests
          </Link>
        </div>
      </div>
    </div>
  );
}
