'use client';

import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { Star } from 'lucide-react';

export interface RatingInputProps {
  value?: number;
  maxScore?: number;
  onChange?: (score: number) => void;
  disabled?: boolean;
  className?: string;
  label?: string;
}

export function RatingInput({
  value = 0,
  maxScore = 10,
  onChange,
  disabled = false,
  className,
  label = 'Your rating',
}: RatingInputProps) {
  const [hoverValue, setHoverValue] = useState<number | null>(null);
  const activeScore = hoverValue !== null ? hoverValue : value;

  const handleSelect = (score: number) => {
    if (disabled) return;
    onChange?.(score);
  };

  return (
    <div className={cn('flex flex-col gap-1.5 text-left', className)}>
      {label && (
        <div className="flex items-center justify-between">
          <label className="text-[13px] font-medium text-[var(--ink)] select-none">
            {label}
          </label>
          <span className="text-[13px] font-medium text-[var(--crimson)] tabular-nums">
            {activeScore > 0 ? `${activeScore} / ${maxScore}` : 'Not rated'}
          </span>
        </div>
      )}

      {/* 10-point button track for precise and fast rating */}
      <div className="grid grid-cols-10 gap-1" role="radiogroup" aria-label={label}>
        {Array.from({ length: maxScore }, (_, i) => i + 1).map((num) => {
          const isFilled = activeScore >= num;
          const isSelected = value === num;

          return (
            <button
              key={num}
              type="button"
              role="radio"
              aria-checked={isSelected}
              disabled={disabled}
              onClick={() => handleSelect(num)}
              onMouseEnter={() => setHoverValue(num)}
              onMouseLeave={() => setHoverValue(null)}
              className={cn(
                'h-9 rounded-[6px] text-[12px] font-medium tabular-nums transition-colors cursor-pointer flex flex-col items-center justify-center border',
                isFilled
                  ? 'bg-[var(--crimson)] text-white border-[var(--crimson)]'
                  : 'bg-[var(--surface)] text-[var(--muted)] border-[var(--line)] hover:border-[var(--line-strong)] hover:text-[var(--ink)]',
                isSelected && 'ring-2 ring-[var(--ink)] ring-offset-1',
                disabled && 'opacity-50 cursor-not-allowed'
              )}
            >
              <span>{num}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
