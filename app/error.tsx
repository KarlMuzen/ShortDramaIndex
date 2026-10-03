'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/src/components/ui/button';
import { AlertTriangle, RotateCcw, Home } from 'lucide-react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log error cleanly
    console.error('Applet error occurred:', error);
  }, [error]);

  return (
    <div className="py-20 px-4 max-w-lg mx-auto text-center space-y-6">
      <div className="w-16 h-16 rounded-full bg-[var(--status-disputed-bg)] border border-[var(--crimson)]/30 mx-auto flex items-center justify-center text-[var(--crimson)]">
        <AlertTriangle className="w-8 h-8" />
      </div>

      <div className="space-y-2">
        <h1 className="text-[24px] font-semibold text-[var(--ink)] tracking-tight">
          Something went wrong
        </h1>
        <p className="text-[14px] text-[var(--muted)] leading-relaxed">
          We encountered an unexpected issue while retrieving catalog data. You can retry the request or return to the main database index.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-2 justify-center pt-2">
        <Button
          variant="primary"
          size="md"
          onClick={() => reset()}
          leftIcon={<RotateCcw className="w-4 h-4" />}
          className="font-semibold"
        >
          Try again
        </Button>

        <Link href="/">
          <Button
            variant="secondary"
            size="md"
            leftIcon={<Home className="w-4 h-4" />}
          >
            Go to home page
          </Button>
        </Link>
      </div>
    </div>
  );
}
