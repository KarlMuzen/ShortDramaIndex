'use client';

import React from 'react';
import Link from 'next/link';
import { useSession } from '@/src/context/session-context';
import { titlePath } from '@/src/lib/urls';
import { Series } from '@/src/data/types';
import { History, Edit3 } from 'lucide-react';

interface TitleFooterHistoryProps {
  series: Series;
}

export function TitleFooterHistory({ series }: TitleFooterHistoryProps) {
  const { user } = useSession();
  const isEditor = user?.role === 'editor' || user?.role === 'moderator';

  return (
    <div className="pt-6 border-t border-[var(--line)] flex flex-wrap items-center justify-between gap-3 text-[13px] text-[var(--muted)]">
      <div className="flex flex-wrap items-center gap-4">
        <Link
          href={`${titlePath(series)}/history`}
          className="hover:text-[var(--crimson)] hover:underline flex items-center gap-1.5 text-[var(--muted)]"
        >
          <History className="w-3.5 h-3.5" />
          <span>View edit history</span>
        </Link>

        <span className="tabular-nums">Updated {series.updatedAt}</span>
      </div>

      {isEditor && (
        <Link
          href={`${titlePath(series)}/edit`}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[13px] font-medium rounded-[8px] bg-[var(--surface)] text-[var(--ink)] border border-[var(--line)] hover:bg-[var(--surface-hover)] hover:border-[var(--line-strong)] transition-colors"
        >
          <Edit3 className="w-3.5 h-3.5 text-[var(--muted)]" />
          <span>Edit entry</span>
        </Link>
      )}
    </div>
  );
}

