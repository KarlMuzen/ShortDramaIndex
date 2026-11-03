'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from '@/src/context/session-context';
import { useToast } from '@/src/components/ui/toast';
import { Button } from '@/src/components/ui/button';
import { TextField } from '@/src/components/ui/text-field';
import { Select } from '@/src/components/ui/select';
import { Radio } from '@/src/components/ui/radio';
import { Dialog } from '@/src/components/ui/dialog';
import { Breadcrumb } from '@/src/components/ui/breadcrumb';
import { siteConfig } from '@/src/config/site';
import {
  updateUserPreferencesAction,
  deleteAccountAction,
} from '@/src/data/actions';
import {
  Globe,
  Tv,
  Moon,
  Download,
  Trash2,
  AlertTriangle,
} from 'lucide-react';

export function SettingsContent() {
  const router = useRouter();
  const { user } = useSession();
  const { showToast } = useToast();

  const [displayName, setDisplayName] = useState(user?.name || '');

  useEffect(() => {
    if (user?.name) {
      setDisplayName(user.name);
    }
  }, [user?.name]);
  const [titleLanguage, setTitleLanguage] = useState<'english' | 'original' | 'romanized'>('english');
  const [defaultRegion, setDefaultRegion] = useState('any');
  const [themePreference, setThemePreference] = useState<'system' | 'light' | 'dark'>('system');
  const [isSaving, setIsSaving] = useState(false);

  // Delete account confirmation dialog
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await updateUserPreferencesAction({
        titleLanguage,
        defaultRegion,
        theme: themePreference,
      });

      // Apply theme preference to document element
      if (themePreference === 'dark') {
        document.documentElement.classList.add('dark');
        document.documentElement.setAttribute('data-theme', 'dark');
      } else if (themePreference === 'light') {
        document.documentElement.classList.remove('dark');
        document.documentElement.setAttribute('data-theme', 'light');
      } else {
        // System
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        document.documentElement.classList.toggle('dark', prefersDark);
        document.documentElement.removeAttribute('data-theme');
      }

      showToast({
        title: 'Settings saved',
        description: 'Your preferences have been updated.',
        type: 'success',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleExportData = () => {
    const exportPayload = {
      user: {
        id: user?.id,
        name: user?.name,
        handle: user?.handle,
        role: user?.role,
      },
      preferences: {
        titleLanguage,
        defaultRegion,
        themePreference,
      },
      exportedAt: new Date().toISOString(),
      exportVersion: '1.0',
    };

    const blob = new Blob([JSON.stringify(exportPayload, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `shortdramaindex_export_${user?.handle || 'user'}.json`;
    a.click();
    URL.revokeObjectURL(url);

    showToast({
      title: 'Data export downloaded',
      description: 'Your JSON reference file has been generated.',
      type: 'success',
    });
  };

  const handleDeleteAccount = async () => {
    setIsDeleting(true);
    try {
      await deleteAccountAction();
      setDeleteDialogOpen(false);
      showToast({
        title: 'Account deleted',
        description: 'Your user profile and list tracking have been removed.',
        type: 'info',
      });
      router.push('/');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-8 pb-16 text-left max-w-2xl mx-auto">
      <Breadcrumb
        items={[
          { label: 'Home', href: '/' },
          { label: 'Settings', isCurrent: true },
        ]}
      />

      <header className="space-y-1 border-b border-[var(--line)] pb-4">
        <h1 className="text-[24px] font-semibold text-[var(--ink)] tracking-tight">
          Account & Display Settings
        </h1>
        <p className="text-[13px] text-[var(--muted)]">
          Manage your profile name, title language display, default watch regions, and data export.
        </p>
      </header>

      <form onSubmit={handleSaveSettings} className="space-y-8">
        {/* Profile Section */}
        <section className="space-y-4 p-5 bg-[var(--surface)] border border-[var(--line)] rounded-[12px]">
          <h2 className="text-[15px] font-semibold text-[var(--ink)]">
            Profile information
          </h2>

          <div className="space-y-3">
            <TextField
              label="Display name"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              required
            />
            <div className="text-[12px] text-[var(--muted)]">
              Handle:{' '}
              <span className="font-mono text-[var(--ink)]">@{user?.handle || 'user'}</span>
            </div>
          </div>
        </section>

        {/* Title Language Preference */}
        <section className="space-y-4 p-5 bg-[var(--surface)] border border-[var(--line)] rounded-[12px]">
          <div className="space-y-1">
            <h2 className="text-[15px] font-semibold text-[var(--ink)] flex items-center gap-2">
              <Globe className="w-4 h-4 text-[var(--muted)]" />
              <span>Title language priority</span>
            </h2>
            <p className="text-[13px] text-[var(--muted)]">
              Select which language to emphasize first across catalog grids and search results.
            </p>
          </div>

          <div className="space-y-2 pt-1">
            <Radio
              name="title_lang_pref"
              value="english"
              checked={titleLanguage === 'english'}
              onChange={() => setTitleLanguage('english')}
              label="English title first (e.g. The Billionaire’s Secret Fiancée)"
            />
            <Radio
              name="title_lang_pref"
              value="original"
              checked={titleLanguage === 'original'}
              onChange={() => setTitleLanguage('original')}
              label="Original CJK title first (e.g. 霸总的秘密未婚妻)"
            />
            <Radio
              name="title_lang_pref"
              value="romanized"
              checked={titleLanguage === 'romanized'}
              onChange={() => setTitleLanguage('romanized')}
              label="Romanized title first (e.g. Ba Zong De Mi Mi Wei Hun Qi)"
            />
          </div>
        </section>

        {/* Region Default */}
        <section className="space-y-4 p-5 bg-[var(--surface)] border border-[var(--line)] rounded-[12px]">
          <div className="space-y-1">
            <h2 className="text-[15px] font-semibold text-[var(--ink)] flex items-center gap-2">
              <Tv className="w-4 h-4 text-[var(--muted)]" />
              <span>Default region for Where to watch</span>
            </h2>
            <p className="text-[13px] text-[var(--muted)]">
              Preselects your local distributor region when viewing watch options.
            </p>
          </div>

          <div className="max-w-xs">
            <Select
              value={defaultRegion}
              onChange={(e) => setDefaultRegion(e.target.value)}
              options={[
                { value: 'any', label: 'Any region (Global default)' },
                { value: 'Global', label: 'Global' },
                { value: 'US', label: 'United States & Canada' },
                { value: 'Latin America', label: 'Latin America' },
                { value: 'Asia', label: 'Asia-Pacific' },
              ]}
            />
          </div>
        </section>

        {/* Theme Preference */}
        <section className="space-y-4 p-5 bg-[var(--surface)] border border-[var(--line)] rounded-[12px]">
          <div className="space-y-1">
            <h2 className="text-[15px] font-semibold text-[var(--ink)] flex items-center gap-2">
              <Moon className="w-4 h-4 text-[var(--muted)]" />
              <span>Appearance & theme</span>
            </h2>
            <p className="text-[13px] text-[var(--muted)]">
              Choose your interface color mode.
            </p>
          </div>

          <div className="space-y-2 pt-1">
            <Radio
              name="theme_pref"
              value="system"
              checked={themePreference === 'system'}
              onChange={() => setThemePreference('system')}
              label="System (follow operating system preference)"
            />
            <Radio
              name="theme_pref"
              value="light"
              checked={themePreference === 'light'}
              onChange={() => setThemePreference('light')}
              label="Light mode (Paper #F6F7F9 & Surface #FFFFFF)"
            />
            <Radio
              name="theme_pref"
              value="dark"
              checked={themePreference === 'dark'}
              onChange={() => setThemePreference('dark')}
              label="Dark mode (Deep blue-grey #111318 & Surface #1B1E26)"
            />
          </div>
        </section>

        {/* Save button */}
        <div className="flex justify-end">
          <Button
            type="submit"
            variant="primary"
            size="md"
            isLoading={isSaving}
            className="px-6 font-semibold"
          >
            Save preferences
          </Button>
        </div>
      </form>

      {/* Data Management & Danger Zone */}
      <div className="pt-6 border-t border-[var(--line)] space-y-6">
        <h2 className="text-[16px] font-semibold text-[var(--ink)]">
          Data management
        </h2>

        {/* Export Data */}
        <div className="p-4 bg-[var(--surface)] border border-[var(--line)] rounded-[12px] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-[14px] font-semibold text-[var(--ink)]">
              Export my data
            </h3>
            <p className="text-[12px] text-[var(--muted)] mt-0.5">
              Download your full watchlist, ratings, and submission history in JSON format.
            </p>
          </div>

          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={handleExportData}
            leftIcon={<Download className="w-3.5 h-3.5" />}
          >
            Download JSON
          </Button>
        </div>

        {/* Delete Account */}
        <div className="p-4 bg-[var(--status-disputed-bg)] border border-[var(--crimson)]/30 rounded-[12px] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-[14px] font-semibold text-[var(--crimson)] flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4" />
              <span>Delete account</span>
            </h3>
            <p className="text-[12px] text-[var(--ink)] mt-0.5">
              Permanently remove your profile, personal lists, and score history.
            </p>
          </div>

          <Button
            type="button"
            variant="danger"
            size="sm"
            onClick={() => setDeleteDialogOpen(true)}
            leftIcon={<Trash2 className="w-3.5 h-3.5" />}
          >
            Delete account
          </Button>
        </div>
      </div>

      {/* Delete Account Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        title="Delete account permanently"
        description="Please confirm account deletion."
        maxWidth="sm"
        footer={
          <>
            <Button
              variant="quiet"
              size="sm"
              onClick={() => setDeleteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              size="sm"
              isLoading={isDeleting}
              onClick={handleDeleteAccount}
            >
              Confirm deletion
            </Button>
          </>
        }
      >
        <div className="space-y-3 text-left">
          <p className="text-[13px] text-[var(--ink)] leading-relaxed">
            This will permanently delete your watchlist, drama score ratings, and contribution history from {siteConfig.name}.
          </p>
          <div className="p-3 bg-[var(--surface-subtle)] rounded-[8px] text-[12px] text-[var(--muted)] border border-[var(--line)]">
            This action cannot be undone. All personal lists will be wiped immediately.
          </div>
        </div>
      </Dialog>
    </div>
  );
}
