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
  const { aliases, title } = series;
  const { showToast } = useToast();
  const [showAll, setShowAll] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Report Flow Sheet state
  const [reportSheetOpen, setReportSheetOpen] = useState(false);
  const [reportType, setReportType] = useState<'another_name' | 'wrong_name'>('another_name');
  const [reportTargetAlias, setReportTargetAlias] = useState<Alias | undefined>(undefined);

  const initialLimit = 6;
  const hasMore = aliases.length > initialLimit;

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
    <div className="space-y-4 text-left">
      {/* Section Header */}
      <div className="flex items-baseline justify-between border-b border-[var(--line)] pb-2.5">
        <div>
          <h2 className="text-[17px] sm:text-[18px] font-semibold text-[var(--ink)]">
            Also known as
          </h2>
          <p className="text-[13px] text-[var(--muted)] mt-0.5">
            Verified alternate titles, localized releases, and community translations
          </p>
        </div>

        <Button
          variant="quiet"
          size="sm"
          onClick={handleOpenReportAName}
          leftIcon={<Plus className="w-3.5 h-3.5" />}
          className="text-[var(--crimson)] hover:text-[var(--crimson-hover)]"
        >
          Report a name
        </Button>
      </div>

      {/* Ledger Table Container */}
      <div className="w-full overflow-x-auto">
        <table className="w-full text-left border-collapse text-[13px]">
          <thead>
            <tr className="border-b border-[var(--line)] text-[12px] font-semibold text-[var(--muted)]">
              <th scope="col" className="py-2.5 pr-4 pl-1 font-semibold w-2/5 sm:w-1/3">
                Name
              </th>
              <th scope="col" className="py-2.5 px-3 font-semibold w-24">
                Language
              </th>
              <th scope="col" className="py-2.5 px-3 font-semibold hidden md:table-cell">
                Source
              </th>
              <th scope="col" className="py-2.5 px-3 font-semibold w-28">
                State
              </th>
              <th scope="col" className="py-2.5 pl-3 pr-1 text-right w-16">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--line)]">
            {aliases.map((item, index) => {
              const rowId = `alias-${index}`;
              const isHidden = !showAll && index >= initialLimit;
              const langName = getLanguageName(item.language);

              return (
                <tr
                  key={index}
                  className={`hover:bg-[var(--surface-hover)] transition-colors group ${
                    isHidden ? 'hidden' : ''
                  }`}
                >
                  {/* Name Column with lang attribute */}
                  <td className="py-3 pr-4 pl-1 align-middle">
                    <span
                      lang={item.language}
                      className="font-medium text-[14px] text-[var(--ink)] break-words leading-snug block select-text"
                    >
                      {item.text}
                    </span>
                    {item.notes && (
                      <span className="text-[11px] text-[var(--muted)] block mt-0.5">
                        {item.notes}
                      </span>
                    )}
                  </td>

                  {/* Language Column */}
                  <td className="py-3 px-3 align-middle text-[var(--muted)] whitespace-nowrap">
                    <span>{langName}</span>
                    <span className="text-[11px] text-[var(--muted)] uppercase ml-1 block sm:inline">
                      [{item.language}]
                    </span>
                  </td>

                  {/* Source Column */}
                  <td className="py-3 px-3 align-middle text-[var(--muted)] hidden md:table-cell text-[12px]">
                    <span className="truncate max-w-xs block">{item.source}</span>
                  </td>

                  {/* Verification State */}
                  <td className="py-3 px-3 align-middle whitespace-nowrap">
                    <StatusMark status={item.status} size="sm" />
                  </td>

                  {/* Row Actions: Copy & Overflow Menu */}
                  <td className="py-3 pl-3 pr-1 align-middle text-right whitespace-nowrap">
                    <div className="flex items-center justify-end gap-1">
                      <IconButton
                        size="sm"
                        aria-label={`Copy name: ${item.text}`}
                        onClick={() => handleCopy(item.text, rowId)}
                        className="opacity-70 group-hover:opacity-100"
                        title="Copy name"
                      >
                        {copiedId === rowId ? (
                          <Check className="w-3.5 h-3.5 text-[var(--status-verified)]" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </IconButton>

                      <Menu
                        align="right"
                        trigger={
                          <IconButton
                            size="sm"
                            aria-label="More actions"
                            className="opacity-70 group-hover:opacity-100"
                          >
                            <MoreHorizontal className="w-3.5 h-3.5" />
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
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
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
        initialType={reportType}
        targetAlias={reportTargetAlias}
      />
    </div>
  );
}
