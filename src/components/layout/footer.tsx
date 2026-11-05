import React from 'react';
import Link from 'next/link';
import { siteConfig } from '@/src/config/site';

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="w-full border-t border-[var(--line)] bg-[var(--surface)] text-[var(--muted)] text-[13px] mt-auto">
      <div className="max-w-[1120px] mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Left: Product & Purpose statement */}
        <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4 text-center sm:text-left">
          <span className="font-semibold text-[var(--ink)]">
            {siteConfig.name}
          </span>
          <span className="hidden sm:inline text-[var(--line-strong)]">|</span>
          <span>The reference database for short dramas</span>
        </div>

        {/* Right: Minimal Footer Links */}
        <nav
          aria-label="Footer navigation"
          className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-[13px]"
        >
          <Link
            href={siteConfig.links.about}
            className="hover:text-[var(--crimson)] transition-colors"
          >
            About
          </Link>
          <Link
            href={siteConfig.links.guidelines}
            className="hover:text-[var(--crimson)] transition-colors"
          >
            Guidelines
          </Link>
          <Link
            href={siteConfig.links.insights}
            className="hover:text-[var(--crimson)] transition-colors"
          >
            Insights
          </Link>
          <Link
            href={siteConfig.links.terms}
            className="hover:text-[var(--crimson)] transition-colors"
          >
            Terms
          </Link>
          <Link
            href={siteConfig.links.privacy}
            className="hover:text-[var(--crimson)] transition-colors"
          >
            Privacy
          </Link>
          <Link
            href={siteConfig.links.takedown}
            className="hover:text-[var(--crimson)] transition-colors"
          >
            Takedown requests
          </Link>
        </nav>
      </div>

      {/* Bottom copyright */}
      <div className="border-t border-[var(--line)]/50 py-3 text-center text-[12px] text-[var(--muted)]">
        <span className="tabular-nums">&copy; {currentYear} {siteConfig.name}. All data curated by contributors.</span>
      </div>
    </footer>
  );
}
