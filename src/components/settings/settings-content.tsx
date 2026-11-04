'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from '@/src/context/session-context';
import { useTheme } from '@/src/context/theme-context';
import { useToast } from '@/src/components/ui/toast';
import { Button } from '@/src/components/ui/button';
import { TextField } from '@/src/components/ui/text-field';
import { Radio } from '@/src/components/ui/radio';
import { Dialog } from '@/src/components/ui/dialog';
import { Breadcrumb } from '@/src/components/ui/breadcrumb';
import { siteConfig } from '@/src/config/site';
import {
  updateUserPreferencesAction,
  deleteAccountAction,
  getExportDataAction,
} from '@/src/data/actions';
import {
  Moon,
  Download,
  Trash2,
  AlertTriangle,
} from 'lucide-react';

export function SettingsContent() {
  const router = useRouter();
  const { user, refreshSession } = useSession();
  const { theme, setTheme } = useTheme();
  const { showToast } = useToast();

  const [displayName, setDisplayName] = useState(user?.name || '');

  useEffect(() => {
    if (user?.name) {
      setDisplayName(user.name);
    }
  }, [user?.name]);
  // Appearance is owned by useTheme (localStorage); the radios mirror it
  // and Save applies the choice through setTheme.
  const [themePreference, setThemePreference] = useState<'system' | 'light' | 'dark'>(theme);

  useEffect(() => {
    setThemePreference(theme);
  }, [theme]);
  const [isSaving, setIsSaving] = useState(false);

  // Delete account confirmation dialog
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const result = await updateUserPreferencesAction({
        displayName,
      });
      if (!result.success) {
        showToast({
          title: 'Save failed',
          description: 'Sign in and try again.',
          type: 'error',
        });
        return;
      }

      // Appearance lives in useTheme (localStorage); applying it here
      // updates the document theme immediately.
      setTheme(themePreference);
      await refreshSession();

      showToast({
        title: 'Settings saved',
        description: 'Your preferences have been updated.',
        type: 'success',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleExportData = async () => {
    const result = await getExportDataAction();
    if (!result.success || !result.data) {
      showToast({
        title: 'Export failed',
        description: 'Sign in and try again.',
        type: 'error',
      });
      return;
    }
    const exportPayload = {
      user: result.data.user,
      listEntries: result.data.listEntries,
      ratings: result.data.ratings,
      contributions: result.data.contributions,
      reports: result.data.reports,
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
          Manage your profile name, appearance, and data export.
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
