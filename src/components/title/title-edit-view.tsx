'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { titlePath } from '@/src/lib/urls';
import { Series, Alias, Release, Tag } from '@/src/data/types';
import { saveSeriesEditsAction } from '@/src/data/actions';
import { useToast } from '@/src/components/ui/toast';
import { RoleGate } from '@/src/components/auth/role-gate';
import { Button } from '@/src/components/ui/button';
import { TextField } from '@/src/components/ui/text-field';
import { Textarea } from '@/src/components/ui/textarea';
import { Select } from '@/src/components/ui/select';
import { StatusMark } from '@/src/components/ui/status-mark';
import { Breadcrumb } from '@/src/components/ui/breadcrumb';
import {
  Save,
  Plus,
  Trash2,
  ArrowLeft,
  ExternalLink,
  GitMerge,
  History,
} from 'lucide-react';

export function TitleEditView({ initialSeries }: { initialSeries: Series }) {
  return (
    <RoleGate requiredRole="editor">
      <TitleEditContent initialSeries={initialSeries} />
    </RoleGate>
  );
}

function TitleEditContent({
  initialSeries,
}: {
  initialSeries: Series;
}) {
  const router = useRouter();
  const { showToast } = useToast();

  const [details, setDetails] = useState({
    title: initialSeries.title,
    romanizedTitle: initialSeries.romanizedTitle || '',
    originalLanguage: initialSeries.originalLanguage,
    year: initialSeries.year,
    episodeCount: initialSeries.episodeCount,
    synopsis: initialSeries.synopsis,
    productionStatus: initialSeries.productionStatus || 'completed',
  });

  const [aliases, setAliases] = useState<Alias[]>(initialSeries.aliases);
  const [releases, setReleases] = useState<Release[]>(initialSeries.releases);
  const [tags, setTags] = useState<Tag[]>(initialSeries.tags);
  const [newTagInput, setNewTagInput] = useState('');
  const [summary, setSummary] = useState('');
  const [summaryError, setSummaryError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // New alias form
  const [newAliasText, setNewAliasText] = useState('');
  const [newAliasLang, setNewAliasLang] = useState('zh');
  const [newAliasSource, setNewAliasSource] = useState('Official Uploader');

  // New release form
  const [newRelPlatform, setNewRelPlatform] = useState('ReelShort');
  const [newRelRegion, setNewRelRegion] = useState('Global');
  const [newRelUrl, setNewRelUrl] = useState('');
  const [newRelEps, setNewRelEps] = useState(initialSeries.episodeCount);

  const handleAddAlias = () => {
    if (!newAliasText.trim()) return;
    const newEntry: Alias = {
      text: newAliasText.trim(),
      language: newAliasLang,
      source: newAliasSource.trim() || 'Editor entry',
      status: 'verified',
      addedBy: 'Editor',
      addedAt: new Date().toISOString().split('T')[0],
    };
    setAliases([...aliases, newEntry]);
    setNewAliasText('');
  };

  const handleRemoveAlias = (index: number) => {
    setAliases(aliases.filter((_, i) => i !== index));
  };

  const handleAliasStatusToggle = (index: number) => {
    setAliases(
      aliases.map((a, i) => {
        if (i !== index) return a;
        const nextStatus = a.status === 'verified' ? 'disputed' : 'verified';
        return { ...a, status: nextStatus };
      })
    );
  };

  const handleAddRelease = () => {
    if (!newRelUrl.trim()) return;
    const newRel: Release = {
      id: `rel_custom_${Date.now()}`,
      platform: newRelPlatform,
      platformSlug: newRelPlatform.toLowerCase().replace(/\s+/g, '-'),
      region: newRelRegion,
      episodeCount: Number(newRelEps) || details.episodeCount,
      url: newRelUrl.trim(),
      lastChecked: 'Today',
      linkStatus: 'active',
      isOfficial: true,
      monetizationType: null,
      freeEpisodes: null,
      coinsPerEpisode: null,
      estimatedUnlockCostUsd: null,
      directWatchUrl: null,
    };
    setReleases([...releases, newRel]);
    setNewRelUrl('');
  };

  const handleRemoveRelease = (index: number) => {
    setReleases(releases.filter((_, i) => i !== index));
  };

  const handleAddTag = () => {
    if (!newTagInput.trim()) return;
    const slug = newTagInput.toLowerCase().trim().replace(/\s+/g, '-');
    if (tags.some((t) => t.slug === slug)) return;
    setTags([...tags, { slug, name: newTagInput.trim() }]);
    setNewTagInput('');
  };

  const handleRemoveTag = (slug: string) => {
    setTags(tags.filter((t) => t.slug !== slug));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSummaryError('');

    if (!summary.trim()) {
      setSummaryError('A concise summary of changes is required before saving.');
      return;
    }

    setIsSaving(true);
    try {
      const res = await saveSeriesEditsAction({
        seriesId: initialSeries.id,
        summary: summary.trim(),
        details,
        aliases,
        releases,
        tags,
      });

      if (res.success) {
        showToast({
          title: 'Changes saved',
          description: `Created revision #${res.revisionId} for "${details.title}".`,
          type: 'success',
        });
        router.push(titlePath(initialSeries));
      } else if (res.errors?.summary) {
        setSummaryError(res.errors.summary);
      }
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-8 pb-20 text-left max-w-4xl mx-auto">
      <Breadcrumb
        items={[
          { label: 'Home', href: '/' },
          { label: initialSeries.title, href: titlePath(initialSeries) },
          { label: 'Edit catalog entry', isCurrent: true },
        ]}
      />

      {/* Header with Quick Jump / Tools */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--line)] pb-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-[var(--crimson)]">
            <span>Editor workspace</span>
          </div>
          <h1 className="text-[24px] font-semibold text-[var(--ink)] tracking-tight">
            Editing: {initialSeries.title}
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href={`${titlePath(initialSeries)}/merge`}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[13px] font-medium text-[var(--ink)] bg-[var(--surface)] border border-[var(--line)] rounded-[8px] hover:bg-[var(--surface-hover)] transition-colors"
          >
            <GitMerge className="w-3.5 h-3.5 text-[var(--muted)]" />
            <span>Merge / split</span>
          </Link>

          <Link
            href={`${titlePath(initialSeries)}/history`}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[13px] font-medium text-[var(--ink)] bg-[var(--surface)] border border-[var(--line)] rounded-[8px] hover:bg-[var(--surface-hover)] transition-colors"
          >
            <History className="w-3.5 h-3.5 text-[var(--muted)]" />
            <span>History</span>
          </Link>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-10">
        {/* Section 1: Details */}
        <section className="p-5 bg-[var(--surface)] border border-[var(--line)] rounded-[12px] space-y-4">
          <h2 className="text-[16px] font-semibold text-[var(--ink)] border-b border-[var(--line)] pb-2">
            1. Core details
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <TextField
              label="Canonical Title"
              value={details.title}
              onChange={(e) => setDetails({ ...details, title: e.target.value })}
              required
            />
            <TextField
              label="Romanized Title (e.g. Pinyin)"
              value={details.romanizedTitle}
              onChange={(e) =>
                setDetails({ ...details, romanizedTitle: e.target.value })
              }
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Select
              label="Original Language"
              value={details.originalLanguage}
              onChange={(e) =>
                setDetails({ ...details, originalLanguage: e.target.value })
              }
              options={[
                { value: 'zh', label: 'Chinese (China)' },
                { value: 'ko', label: 'Korean (South Korea)' },
                { value: 'en', label: 'English' },
                { value: 'ja', label: 'Japanese' },
                { value: 'es', label: 'Spanish' },
              ]}
            />
            <TextField
              label="Release Year"
              type="number"
              value={details.year}
              onChange={(e) =>
                setDetails({ ...details, year: Number(e.target.value) })
              }
              required
            />
            <TextField
              label="Episode Count"
              type="number"
              value={details.episodeCount}
              onChange={(e) =>
                setDetails({ ...details, episodeCount: Number(e.target.value) })
              }
              required
            />
          </div>

          <Textarea
            label="Synopsis"
            value={details.synopsis}
            onChange={(e) =>
              setDetails({ ...details, synopsis: e.target.value })
            }
            rows={4}
            required
          />
        </section>

        {/* Section 2: Names / Aliases Table */}
        <section className="p-5 bg-[var(--surface)] border border-[var(--line)] rounded-[12px] space-y-4">
          <div className="flex items-center justify-between border-b border-[var(--line)] pb-2">
            <div>
              <h2 className="text-[16px] font-semibold text-[var(--ink)]">
                2. Alternate names & translations
              </h2>
              <p className="text-[12px] text-[var(--muted)]">
                Manage all verified titles, romanizations, and regional release names
              </p>
            </div>
            <span className="text-[12px] text-[var(--muted)] tabular-nums">
              {aliases.length} names
            </span>
          </div>

          {/* Existing Aliases Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-[13px]">
              <thead>
                <tr className="border-b border-[var(--line)] text-[11px] text-[var(--muted)] font-semibold">
                  <th className="py-2 pr-3">Name</th>
                  <th className="py-2 px-2 w-20">Lang</th>
                  <th className="py-2 px-2 hidden sm:table-cell">Source / contributor</th>
                  <th className="py-2 px-2 w-28">Status</th>
                  <th className="py-2 pl-2 text-right w-16">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--line)]">
                {aliases.map((alias, idx) => (
                  <tr key={idx} className="hover:bg-[var(--surface-hover)]">
                    <td className="py-2.5 pr-3 font-medium text-[var(--ink)]">
                      <span lang={alias.language}>{alias.text}</span>
                    </td>
                    <td className="py-2.5 px-2 text-[var(--muted)] font-mono text-[12px]">
                      {alias.language}
                    </td>
                    <td className="py-2.5 px-2 text-[12px] text-[var(--muted)] hidden sm:table-cell">
                      <span>{alias.source}</span>
                      {alias.addedBy && (
                        <span className="block text-[11px]">by {alias.addedBy}</span>
                      )}
                    </td>
                    <td className="py-2.5 px-2">
                      <button
                        type="button"
                        onClick={() => handleAliasStatusToggle(idx)}
                        className="cursor-pointer"
                        title="Click to toggle verification status"
                      >
                        <StatusMark status={alias.status} size="sm" />
                      </button>
                    </td>
                    <td className="py-2.5 pl-2 text-right">
                      <button
                        type="button"
                        onClick={() => handleRemoveAlias(idx)}
                        className="text-[var(--muted)] hover:text-[var(--crimson)] p-1 cursor-pointer"
                        aria-label="Remove alias"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Add Name Row */}
          <div className="p-3 bg-[var(--surface-subtle)] border border-[var(--line)] rounded-[8px] space-y-3">
            <span className="text-[12px] font-semibold text-[var(--ink)] block">
              Add new alternate title
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
              <div className="sm:col-span-5">
                <input
                  type="text"
                  placeholder="New title or alias..."
                  value={newAliasText}
                  onChange={(e) => setNewAliasText(e.target.value)}
                  className="w-full h-9 px-3 text-[13px] bg-[var(--surface)] text-[var(--ink)] rounded-[6px] border border-[var(--line)] outline-none focus:border-[var(--crimson)]"
                />
              </div>
              <div className="sm:col-span-3">
                <select
                  value={newAliasLang}
                  onChange={(e) => setNewAliasLang(e.target.value)}
                  className="w-full h-9 px-2 text-[13px] bg-[var(--surface)] text-[var(--ink)] rounded-[6px] border border-[var(--line)] outline-none"
                >
                  <option value="zh">Chinese (zh)</option>
                  <option value="en">English (en)</option>
                  <option value="ko">Korean (ko)</option>
                  <option value="es">Spanish (es)</option>
                  <option value="ja">Japanese (ja)</option>
                </select>
              </div>
              <div className="sm:col-span-3">
                <input
                  type="text"
                  placeholder="Source (e.g. ReelShort)"
                  value={newAliasSource}
                  onChange={(e) => setNewAliasSource(e.target.value)}
                  className="w-full h-9 px-3 text-[13px] bg-[var(--surface)] text-[var(--ink)] rounded-[6px] border border-[var(--line)] outline-none"
                />
              </div>
              <div className="sm:col-span-1">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  fullWidth
                  onClick={handleAddAlias}
                  className="h-9"
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Section 3: Releases Table */}
        <section className="p-5 bg-[var(--surface)] border border-[var(--line)] rounded-[12px] space-y-4">
          <div className="flex items-center justify-between border-b border-[var(--line)] pb-2">
            <div>
              <h2 className="text-[16px] font-semibold text-[var(--ink)]">
                3. Where to watch & releases
              </h2>
              <p className="text-[12px] text-[var(--muted)]">
                Official platforms, regions, dubs, and stream URLs
              </p>
            </div>
            <span className="text-[12px] text-[var(--muted)] tabular-nums">
              {releases.length} releases
            </span>
          </div>

          {/* Existing Releases Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-[13px]">
              <thead>
                <tr className="border-b border-[var(--line)] text-[11px] text-[var(--muted)] font-semibold">
                  <th className="py-2 pr-3">Platform</th>
                  <th className="py-2 px-2 w-24">Region</th>
                  <th className="py-2 px-2 w-20">Eps</th>
                  <th className="py-2 px-2">URL</th>
                  <th className="py-2 pl-2 text-right w-16">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--line)]">
                {releases.map((rel, idx) => (
                  <tr key={idx} className="hover:bg-[var(--surface-hover)]">
                    <td className="py-2.5 pr-3 font-semibold text-[var(--ink)]">
                      {rel.platform}
                    </td>
                    <td className="py-2.5 px-2 text-[var(--muted)]">
                      {rel.region}
                    </td>
                    <td className="py-2.5 px-2 tabular-nums">
                      {rel.episodeCount || details.episodeCount} eps
                    </td>
                    <td className="py-2.5 px-2 text-[12px] truncate max-w-xs text-[var(--muted)]">
                      <a
                        href={rel.url}
                        target="_blank"
                        rel="noreferrer"
                        className="hover:text-[var(--crimson)] hover:underline inline-flex items-center gap-1"
                      >
                        <span className="truncate">{rel.url}</span>
                        <ExternalLink className="w-3 h-3 shrink-0" />
                      </a>
                    </td>
                    <td className="py-2.5 pl-2 text-right">
                      <button
                        type="button"
                        onClick={() => handleRemoveRelease(idx)}
                        className="text-[var(--muted)] hover:text-[var(--crimson)] p-1 cursor-pointer"
                        aria-label="Remove release"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Add Release Row */}
          <div className="p-3 bg-[var(--surface-subtle)] border border-[var(--line)] rounded-[8px] space-y-3">
            <span className="text-[12px] font-semibold text-[var(--ink)] block">
              Add new release source
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
              <div className="sm:col-span-3">
                <select
                  value={newRelPlatform}
                  onChange={(e) => setNewRelPlatform(e.target.value)}
                  className="w-full h-9 px-2 text-[13px] bg-[var(--surface)] text-[var(--ink)] rounded-[6px] border border-[var(--line)] outline-none"
                >
                  <option value="ReelShort">ReelShort</option>
                  <option value="DramaBox">DramaBox</option>
                  <option value="ShortMax">ShortMax</option>
                  <option value="Kalos TV">Kalos TV</option>
                  <option value="GoodShort">GoodShort</option>
                  <option value="NetShort">NetShort</option>
                  <option value="FlexTV">FlexTV</option>
                  <option value="YouTube">YouTube</option>
                </select>
              </div>
              <div className="sm:col-span-2">
                <select
                  value={newRelRegion}
                  onChange={(e) => setNewRelRegion(e.target.value)}
                  className="w-full h-9 px-2 text-[13px] bg-[var(--surface)] text-[var(--ink)] rounded-[6px] border border-[var(--line)] outline-none"
                >
                  <option value="Global">Global</option>
                  <option value="US">US</option>
                  <option value="Latin America">Latin America</option>
                  <option value="Asia">Asia</option>
                </select>
              </div>
              <div className="sm:col-span-5">
                <input
                  type="url"
                  placeholder="https://example.com/watch/series..."
                  value={newRelUrl}
                  onChange={(e) => setNewRelUrl(e.target.value)}
                  className="w-full h-9 px-3 text-[13px] bg-[var(--surface)] text-[var(--ink)] rounded-[6px] border border-[var(--line)] outline-none"
                />
              </div>
              <div className="sm:col-span-2">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  fullWidth
                  onClick={handleAddRelease}
                  className="h-9"
                >
                  Add link
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Section 4: Tags */}
        <section className="p-5 bg-[var(--surface)] border border-[var(--line)] rounded-[12px] space-y-4">
          <h2 className="text-[16px] font-semibold text-[var(--ink)] border-b border-[var(--line)] pb-2">
            4. Genre tags
          </h2>

          <div className="flex flex-wrap gap-2">
            {tags.map((t) => (
              <span
                key={t.slug}
                className="inline-flex items-center gap-1.5 px-3 py-1 bg-[var(--surface-subtle)] border border-[var(--line)] rounded-[6px] text-[13px] font-medium text-[var(--ink)]"
              >
                <span>{t.name}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveTag(t.slug)}
                  className="text-[var(--muted)] hover:text-[var(--crimson)] cursor-pointer"
                >
                  ×
                </button>
              </span>
            ))}
          </div>

          <div className="flex items-center gap-2 max-w-xs">
            <input
              type="text"
              placeholder="New tag..."
              value={newTagInput}
              onChange={(e) => setNewTagInput(e.target.value)}
              className="w-full h-9 px-3 text-[13px] bg-[var(--surface)] text-[var(--ink)] rounded-[6px] border border-[var(--line)] outline-none"
            />
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={handleAddTag}
            >
              Add
            </Button>
          </div>
        </section>

        {/* Required Change Summary & Save Bar */}
        <section className="p-5 bg-[var(--surface-subtle)] border-2 border-[var(--line-strong)] rounded-[12px] space-y-4">
          <div className="space-y-1">
            <label className="text-[14px] font-semibold text-[var(--ink)] block">
              Summary of change <span className="text-[var(--crimson)]">*</span>
            </label>
            <p className="text-[12px] text-[var(--muted)]">
              Explain why this change was made. This will be preserved in the public revision audit log.
            </p>
          </div>

          <TextField
            placeholder="e.g. Added Spanish aliases and verified YouTube watch link"
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            errorMessage={summaryError}
            required
          />

          <div className="flex items-center justify-between pt-2 border-t border-[var(--line)]">
            <Link
              href={titlePath(initialSeries)}
              className="text-[13px] text-[var(--muted)] hover:underline inline-flex items-center gap-1"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Cancel without saving</span>
            </Link>

            <Button
              type="submit"
              variant="primary"
              size="md"
              isLoading={isSaving}
              leftIcon={<Save className="w-4 h-4" />}
              className="px-6 font-semibold"
            >
              Save revisions
            </Button>
          </div>
        </section>
      </form>
    </div>
  );
}
