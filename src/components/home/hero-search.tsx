'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/src/components/ui/button';
import { Dialog } from '@/src/components/ui/dialog';
import { TextField } from '@/src/components/ui/text-field';
import { StatusMark } from '@/src/components/ui/status-mark';
import { lookupLinkAction } from '@/src/data/actions';
import { titlePath } from '@/src/lib/urls';
import { SEARCH_PLACEHOLDER } from '@/src/config/site';
import { Search, Link as LinkIcon, ArrowRight, CheckCircle2, AlertCircle } from 'lucide-react';

export function HeroSearch() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [linkDialogOpen, setLinkDialogOpen] = useState(false);
  const [linkInput, setLinkInput] = useState('');
  const [isLookingUp, setIsLookingUp] = useState(false);
  const [lookupResult, setLookupResult] = useState<{
    searched: boolean;
    found: boolean;
    series?: {
      id: number;
      slug: string;
      title: string;
      year: number;
      episodeCount: number;
    };
    release?: {
      platform: string;
      url: string;
      isOfficial: boolean;
    };
  } | null>(null);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/search?q=${encodeURIComponent(query.trim())}`);
    }
  };

  const handleLookupLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!linkInput.trim()) return;

    setIsLookingUp(true);
    try {
      const res = await lookupLinkAction(linkInput.trim());
      setLookupResult({
        searched: true,
        found: res.found,
        series: res.series,
        release: res.release,
      });
    } finally {
      setIsLookingUp(false);
    }
  };

  const handleSampleLink = (sample: string) => {
    setLinkInput(sample);
  };

  return (
    <div className="w-full text-left py-6 sm:py-10 border-b border-[var(--line)]">
      <div className="max-w-3xl">
        <h1 className="text-[28px] sm:text-[36px] font-semibold text-[var(--ink)] tracking-tight leading-[1.2]">
          Find a short drama by any name
        </h1>
        <p className="text-[14px] sm:text-[15px] text-[var(--muted)] mt-2 leading-relaxed">
          Search a title in any language, or paste a link to see its other names and where to watch.
        </p>

        {/* Large Hero Search Field */}
        <form
          onSubmit={handleSearchSubmit}
          className="mt-6 flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5"
        >
          <div className="relative flex-1 flex items-center">
            <Search className="w-4 h-4 text-[var(--muted)] absolute left-3.5 pointer-events-none" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={SEARCH_PLACEHOLDER}
              className="w-full h-12 pl-10 pr-4 text-[15px] bg-[var(--surface)] text-[var(--ink)] placeholder:text-[var(--muted)] rounded-[8px] border border-[var(--line)] hover:border-[var(--line-strong)] focus:border-[var(--crimson)] focus:ring-1 focus:ring-[var(--crimson)] outline-none transition-colors"
            />
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Button
              type="submit"
              variant="primary"
              size="md"
              className="h-12 px-5 font-semibold text-[14px]"
            >
              Search
            </Button>

            <Button
              type="button"
              variant="secondary"
              size="md"
              onClick={() => {
                setLinkDialogOpen(true);
                setLookupResult(null);
                setLinkInput('');
              }}
              leftIcon={<LinkIcon className="w-4 h-4 text-[var(--muted)]" />}
              className="h-12 px-4 text-[14px]"
            >
              Paste a link
            </Button>
          </div>
        </form>
      </div>

      {/* Paste a link Dialog */}
      <Dialog
        open={linkDialogOpen}
        onClose={() => setLinkDialogOpen(false)}
        title="Paste a link"
        maxWidth="md"
      >
        <div className="space-y-4">
          <form onSubmit={handleLookupLink} className="space-y-3">
            <TextField
              label="Platform URL or watch link"
              placeholder="https://example.com/lumentv/series/101"
              value={linkInput}
              onChange={(e) => setLinkInput(e.target.value)}
              leftIcon={<LinkIcon className="w-4 h-4" />}
              autoFocus
            />

            <div className="flex items-center justify-between gap-2 pt-1">
              <div className="text-[12px] text-[var(--muted)] truncate">
                <span className="mr-1">Try:</span>
                <button
                  type="button"
                  onClick={() => handleSampleLink('https://example.com/lumentv/series/101')}
                  className="underline hover:text-[var(--ink)] cursor-pointer mr-2"
                >
                  Lumen TV link
                </button>
                <button
                  type="button"
                  onClick={() => handleSampleLink('https://www.youtube.com/playlist?list=PL_invented_fiancee_101')}
                  className="underline hover:text-[var(--ink)] cursor-pointer"
                >
                  YouTube playlist
                </button>
              </div>

              <Button
                type="submit"
                variant="primary"
                size="sm"
                isLoading={isLookingUp}
              >
                Look up link
              </Button>
            </div>
          </form>

          {/* Results State */}
          {lookupResult && lookupResult.searched && (
            <div className="pt-3 border-t border-[var(--line)]">
              {lookupResult.found && lookupResult.series ? (
                <div className="p-3.5 bg-[var(--surface-subtle)] border border-[var(--line)] rounded-[8px] space-y-2">
                  <div className="flex items-center gap-1.5 text-[12px] font-semibold text-[var(--status-verified)]">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Match found in database</span>
                  </div>

                  <div className="text-[14px] font-semibold text-[var(--ink)]">
                    {lookupResult.series.title}
                  </div>

                  <div className="text-[12px] text-[var(--muted)] flex items-center gap-2">
                    <span className="tabular-nums">{lookupResult.series.year}</span>
                    <span>•</span>
                    <span className="tabular-nums">{lookupResult.series.episodeCount} episodes</span>
                    {lookupResult.release && (
                      <>
                        <span>•</span>
                        <span>{lookupResult.release.platform}</span>
                      </>
                    )}
                  </div>

                  <div className="pt-2">
                    <Link
                      href={titlePath({
                        id: lookupResult.series.id,
                        slug: lookupResult.series.slug,
                      })}
                      onClick={() => setLinkDialogOpen(false)}
                      className="inline-flex items-center gap-1.5 text-[13px] font-medium text-[var(--crimson)] hover:underline"
                    >
                      <span>View drama entry and all known names</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="p-3.5 bg-[var(--surface-subtle)] border border-[var(--line)] rounded-[8px] space-y-1.5 text-left">
                  <div className="flex items-center gap-1.5 text-[12px] font-semibold text-[var(--muted)]">
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>No match found for this link</span>
                  </div>
                  <p className="text-[12px] text-[var(--muted)] leading-normal">
                    This watch link has not been indexed yet. Search by the drama’s text title or submit a new entry.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </Dialog>
    </div>
  );
}
