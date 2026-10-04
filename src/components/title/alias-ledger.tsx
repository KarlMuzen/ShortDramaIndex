'use client';

import React, { useState } from 'react';
import { Series, Alias } from '@/src/data/types';
import { getLanguageName } from '@/src/lib/languages';
import { StatusMark } from '@/src/components/ui/status-mark';
import { Button } from '@/src/components/ui/button';
import { IconButton } from '@/src/components/ui/icon-button';
import { Menu, MenuItem, MenuDivider } from '@/src/components/ui/menu';
import { ReportSheet } from '@/src/components/report/report-sheet';
import { useToast } from '@/src/components/ui/toast';
import { Copy, MoreHorizontal, Plus, Check, Flag } from 'lucide-react';

interface AliasLedgerProps {
  series: Series;
}

export function AliasLedger({ series }: AliasLedgerProps) {
  const { aliases } = series;
  const { showToast } = useToast();
  const [showAll, setShowAll] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Report Flow Sheet state
  const [reportSheetOpen, setReportSheetOpen] = useState(false);
  const [reportType, setReportType] = useState<'another_name' | 'wrong_name'>('another_name');
  const [reportTargetAlias, setReportTargetAlias] = useState<Alias | undefined>(undefined);

  const initialLimit = 6;
  const hasMore = aliases.length > initialLimit;
  const displayedAliases = showAll ? aliases : aliases.slice(0, initialLimit);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    showToast({
      title: 'Name copied to clipboard',
      description: `"${text}" copied.`,
      type: 'info',
    });
    setTimeout(() => {
      setCopiedId(null);
    }, 2000);
  };

  const handleOpenReportAName = () => {
    setReportType('another_name');
    setReportTargetAlias(undefined);
    setReportSheetOpen(true);
  };

  const handleOpenReportWrong = (alias: Alias) => {
    setReportType('wrong_name');
    setReportTargetAlias(alias);
    setReportSheetOpen(true);
  };

  return (
    <div className="space-y-3.5 text-left w-full">
      {/* Heading Row: Title, Subtitle & No-wrap "Report a name" button */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 border-b border-[var(--line)] pb-3">
        <div>
          <h2 className="text-[18px] sm:text-[20px] font-semibold text-[var(--ink)]">
            Also known as
          </h2>
          <p className="text-[13px] text-[var(--muted)] mt-0.5">
            Every known name, with its source and review state.
          </p>
        </div>

        <Button
          variant="secondary"
          size="sm"
          onClick={handleOpenReportAName}
          leftIcon={<Plus className="w-3.5 h-3.5" />}
          className="whitespace-nowrap shrink-0 self-start sm:self-center"
        >
          Report a name
        </Button>
      </div>

      {/* List Rows (No table, no sideways scroll) */}
      <div className="divide-y divide-[var(--line)] border-y border-[var(--line)] w-full">
        {displayedAliases.map((item, index) => {
          const rowId = `alias-${index}`;
          const langName = getLanguageName(item.language);

          return (
            <div
              key={index}
              className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 hover:bg-[var(--surface-hover)] transition-colors rounded-[8px] px-1"
            >
              {/* Left Column: Name (16px 600) + Muted second line (Lang, Code, Source) */}
              <div className="space-y-0.5 min-w-0 flex-1">
                <div className="flex items-baseline gap-2 flex-wrap">
                  <span
                    lang={item.language}
                    className="text-[16px] font-semibold text-[var(--ink)] break-words leading-snug select-text"
                  >
                    {item.text}
                  </span>
                </div>

                <div className="text-[12px] text-[var(--muted)] flex flex-wrap items-center gap-x-2 gap-y-0.5">
                  <span>
                    {langName} [{item.language}]
                  </span>
                  <span>•</span>
                  <span>
                    {item.sourceUrl ? (
                      <a
                        href={item.sourceUrl}
                        target="_blank"
                        rel="noreferrer noopener"
                        className="hover:text-[var(--crimson)] hover:underline"
                      >
                        {item.source}
                      </a>
                    ) : (
                      <span>{item.source}</span>
                    )}
                  </span>
                  {item.notes && (
                    <>
                      <span>•</span>
                      <span className="italic">{item.notes}</span>
                    </>
                  )}
                </div>
              </div>

              {/* Right Column: State Badge + Copy / More actions */}
              <div className="flex items-center gap-2 self-start sm:self-center shrink-0">
                <StatusMark status={item.status} size="sm" />

                <div className="flex items-center gap-0.5">
                  <IconButton
                    size="sm"
                    aria-label={`Copy name: ${item.text}`}
                    onClick={() => handleCopy(item.text, rowId)}
                    title="Copy name"
                  >
                    {copiedId === rowId ? (
                      <Check className="w-3.5 h-3.5 text-[var(--status-verified)]" />
                    ) : (
                      <Copy className="w-3.5 h-3.5 text-[var(--muted)]" />
                    )}
                  </IconButton>

                  <Menu
                    align="right"
                    trigger={
                      <IconButton
                        size="sm"
                        aria-label="More actions"
                      >
                        <MoreHorizontal className="w-3.5 h-3.5 text-[var(--muted)]" />
                      </IconButton>
                    }
                  >
                    <MenuItem
                      icon={<Copy className="w-3.5 h-3.5" />}
                      onClick={() => handleCopy(item.text, rowId)}
                    >
                      Copy name
                    </MenuItem>
                    <MenuDivider />
                    <MenuItem
                      icon={<Flag className="w-3.5 h-3.5" />}
                      variant="danger"
                      onClick={() => handleOpenReportWrong(item)}
                    >
                      Report as wrong
                    </MenuItem>
                  </Menu>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Show all N names control */}
      {hasMore && (
        <div className="pt-1">
          <button
            type="button"
            onClick={() => setShowAll((prev) => !prev)}
            className="text-[13px] font-medium text-[var(--crimson)] hover:underline cursor-pointer"
          >
            {showAll ? 'Show fewer names' : `Show all ${aliases.length} names`}
          </button>
        </div>
      )}

      {/* Unified Report Flow Sheet */}
      <ReportSheet
        open={reportSheetOpen}
        onClose={() => setReportSheetOpen(false)}
        series={series}
        entry="name"
        initialType={reportType}
        targetAlias={reportTargetAlias}
      />
    </div>
  );
}
