'use client';

import React, { useState } from 'react';
import { cn } from '@/src/lib/utils';

interface SynopsisExpandProps {
  synopsis: string;
}

export function SynopsisExpand({ synopsis }: SynopsisExpandProps) {
  const [expanded, setExpanded] = useState(false);
  const isLong = synopsis.length > 220;

  return (
    <div className="space-y-1 text-left">
      <p
        className={cn(
          'text-[14px] sm:text-[15px] text-[var(--ink)] leading-relaxed transition-all max-w-[75ch]',
          !expanded && isLong && 'line-clamp-4'
        )}
      >
        {synopsis}
      </p>

      {isLong && (
        <button
          type="button"
          onClick={() => setExpanded((prev) => !prev)}
          className="text-[13px] font-medium text-[var(--crimson)] hover:underline cursor-pointer pt-0.5"
        >
          {expanded ? 'Show less' : 'Show more'}
        </button>
      )}
    </div>
  );
}
