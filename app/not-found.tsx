import React from 'react';
import Link from 'next/link';
import { siteConfig } from '@/src/config/site';
import { Button } from '@/src/components/ui/button';
import { Search, Home, HelpCircle } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="py-20 px-4 max-w-lg mx-auto text-center space-y-6">
      <div className="w-16 h-16 rounded-full bg-[var(--surface-subtle)] border border-[var(--line)] mx-auto flex items-center justify-center text-[var(--crimson)] text-[24px] font-bold">
        404
      </div>

      <div className="space-y-2">
        <h1 className="text-[24px] font-semibold text-[var(--ink)] tracking-tight">
          Page not found
        </h1>
        <p className="text-[14px] text-[var(--muted)] leading-relaxed">
          The short drama, alias ledger, or page you were looking for does not exist, or has been merged into a canonical title.
        </p>
      </div>

      {/* Action / Next step */}
      <div className="p-4 bg-[var(--surface)] border border-[var(--line)] rounded-[12px] space-y-3 text-left">
        <span className="text-[12px] font-semibold text-[var(--muted)] uppercase tracking-wider block">
          Suggested next steps
        </span>

        <div className="flex flex-col sm:flex-row gap-2">
          <Link href="/search" className="flex-1">
            <Button
              variant="primary"
              size="md"
              fullWidth
              leftIcon={<Search className="w-4 h-4" />}
            >
              Search by title or link
            </Button>
          </Link>

          <Link href="/" className="flex-1">
            <Button
              variant="secondary"
              size="md"
              fullWidth
              leftIcon={<Home className="w-4 h-4" />}
            >
              Return home
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
