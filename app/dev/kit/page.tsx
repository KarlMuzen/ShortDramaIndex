'use client';

import React, { useState } from 'react';
import {
  Button,
  IconButton,
  TextField,
  Textarea,
  Select,
  Checkbox,
  Radio,
  Tabs,
  TabList,
  TabTrigger,
  TabContent,
  Dialog,
  Menu,
  MenuItem,
  MenuDivider,
  Tag,
  StatusMark,
  Poster,
  RatingInput,
  RatingDisplay,
  DataList,
  Breadcrumb,
  Skeleton,
  EmptyState,
  ErrorState,
  Pagination,
  Tooltip,
} from '@/src/components/ui';
import { useToast } from '@/src/components/ui/toast';
import { useSession } from '@/src/context/session-context';
import { useTheme } from '@/src/context/theme-context';
import {
  Search,
  Plus,
  Share2,
  Trash2,
  Edit3,
  ExternalLink,
  ShieldCheck,
  UserCheck,
  Sun,
  Moon,
  Laptop,
  Check,
} from 'lucide-react';

export default function DevKitPage() {
  const { user, availableUsers, switchUser } = useSession();
  const { theme, resolvedTheme, setTheme } = useTheme();
  const { showToast } = useToast();

  // Component test states
  const [dialogOpen, setDialogOpen] = useState(false);
  const [sampleText, setSampleText] = useState('霸总的秘密未婚妻');
  const [sampleTextarea, setSampleTextarea] = useState(
    'A contract marriage forced by family circumstances quickly develops into genuine loyalty.'
  );
  const [selectValue, setSelectValue] = useState('zh');
  const [checkbox1, setCheckbox1] = useState(true);
  const [checkbox2, setCheckbox2] = useState(false);
  const [checkbox3] = useState(false); // indeterminate test
  const [selectedRadio, setSelectedRadio] = useState('verified');
  const [ratingScore, setRatingScore] = useState(8);
  const [currentPage, setCurrentPage] = useState(2);
  const [activeTab, setActiveTab] = useState('buttons');

  return (
    <div className="space-y-10 pb-16">
      {/* Dev Kit Header */}
      <div className="border-b border-[var(--line)] pb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[12px] uppercase font-semibold tracking-wider text-[var(--crimson)] bg-[var(--crimson-subtle)] px-2 py-0.5 rounded-[4px]">
              Design System Foundation
            </span>
            <span className="text-[12px] text-[var(--muted)] tabular-nums">
              v1.0
            </span>
          </div>
          <h1 className="text-[28px] sm:text-[32px] font-semibold text-[var(--ink)]">
            UI Component Kit
          </h1>
          <p className="text-[14px] text-[var(--muted)] mt-1 max-w-xl">
            Calm reference library aesthetic. Strict token hierarchy with no hardcoded colors, WCAG AA compliance, and responsive touch ergonomics.
          </p>
        </div>

        {/* Global Controls: Theme & User Switcher */}
        <div className="flex flex-wrap items-center gap-2 p-2 bg-[var(--surface)] border border-[var(--line)] rounded-[12px]">
          {/* Theme Selector */}
          <div className="flex items-center border border-[var(--line)] rounded-[8px] p-0.5 bg-[var(--surface-subtle)]">
            <button
              type="button"
              onClick={() => setTheme('light')}
              className={`p-1.5 rounded-[6px] transition-colors ${
                theme === 'light'
                  ? 'bg-[var(--surface)] text-[var(--crimson)] shadow-xs'
                  : 'text-[var(--muted)] hover:text-[var(--ink)]'
              }`}
              title="Light theme"
              aria-label="Light theme"
            >
              <Sun className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setTheme('dark')}
              className={`p-1.5 rounded-[6px] transition-colors ${
                theme === 'dark'
                  ? 'bg-[var(--surface)] text-[var(--crimson)] shadow-xs'
                  : 'text-[var(--muted)] hover:text-[var(--ink)]'
              }`}
              title="Dark theme"
              aria-label="Dark theme"
            >
              <Moon className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setTheme('system')}
              className={`p-1.5 rounded-[6px] transition-colors ${
                theme === 'system'
                  ? 'bg-[var(--surface)] text-[var(--crimson)] shadow-xs'
                  : 'text-[var(--muted)] hover:text-[var(--ink)]'
              }`}
              title="System theme"
              aria-label="System theme"
            >
              <Laptop className="w-4 h-4" />
            </button>
          </div>

          {/* User Role Switcher */}
          <div className="flex items-center gap-1.5">
            <span className="text-[12px] text-[var(--muted)] font-medium pl-1">
              Role:
            </span>
            <div className="flex items-center gap-1">
              {availableUsers.map((u) => (
                <button
                  key={u.id}
                  type="button"
                  onClick={() => switchUser(u.id)}
                  className={`px-2.5 py-1 text-[12px] font-medium rounded-[6px] border transition-colors cursor-pointer capitalize ${
                    user?.id === u.id
                      ? 'bg-[var(--crimson)] text-white border-[var(--crimson)]'
                      : 'bg-[var(--surface)] text-[var(--muted)] border-[var(--line)] hover:text-[var(--ink)]'
                  }`}
                >
                  {u.role}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Design Tokens Matrix */}
      <section className="space-y-4">
        <h2 className="text-[20px] font-semibold text-[var(--ink)]">
          1. Tokens & Color Palette
        </h2>
        <p className="text-[13px] text-[var(--muted)]">
          Resolved Theme: <span className="font-semibold capitalize text-[var(--ink)]">{resolvedTheme}</span>
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3 text-left">
          <div className="p-3 bg-[var(--surface)] border border-[var(--line)] rounded-[8px]">
            <div className="w-full h-8 rounded-[4px] bg-[var(--ink)] mb-2" />
            <div className="text-[12px] font-semibold text-[var(--ink)]">Ink</div>
            <div className="text-[11px] text-[var(--muted)]">Main Text</div>
          </div>

          <div className="p-3 bg-[var(--surface)] border border-[var(--line)] rounded-[8px]">
            <div className="w-full h-8 rounded-[4px] bg-[var(--paper)] border border-[var(--line)] mb-2" />
            <div className="text-[12px] font-semibold text-[var(--ink)]">Paper</div>
            <div className="text-[11px] text-[var(--muted)]">Page Canvas</div>
          </div>

          <div className="p-3 bg-[var(--surface)] border border-[var(--line)] rounded-[8px]">
            <div className="w-full h-8 rounded-[4px] bg-[var(--surface)] border border-[var(--line)] mb-2" />
            <div className="text-[12px] font-semibold text-[var(--ink)]">Surface</div>
            <div className="text-[11px] text-[var(--muted)]">Containers</div>
          </div>

          <div className="p-3 bg-[var(--surface)] border border-[var(--line)] rounded-[8px]">
            <div className="w-full h-8 rounded-[4px] bg-[var(--line)] mb-2" />
            <div className="text-[12px] font-semibold text-[var(--ink)]">Line</div>
            <div className="text-[11px] text-[var(--muted)]">Borders</div>
          </div>

          <div className="p-3 bg-[var(--surface)] border border-[var(--line)] rounded-[8px]">
            <div className="w-full h-8 rounded-[4px] bg-[var(--muted)] mb-2" />
            <div className="text-[12px] font-semibold text-[var(--ink)]">Muted</div>
            <div className="text-[11px] text-[var(--muted)]">Secondary</div>
          </div>

          <div className="p-3 bg-[var(--surface)] border border-[var(--line)] rounded-[8px]">
            <div className="w-full h-8 rounded-[4px] bg-[var(--crimson)] mb-2" />
            <div className="text-[12px] font-semibold text-[var(--crimson)]">Crimson</div>
            <div className="text-[11px] text-[var(--muted)]">Sole Accent</div>
          </div>

          <div className="p-3 bg-[var(--surface)] border border-[var(--line)] rounded-[8px]">
            <div className="w-full h-8 rounded-[4px] bg-[var(--status-verified)] mb-2" />
            <div className="text-[12px] font-semibold text-[var(--status-verified)]">Verified</div>
            <div className="text-[11px] text-[var(--muted)]">Status Mark</div>
          </div>
        </div>
      </section>

      {/* Tabs navigation for showcase categories */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabList className="mb-6">
          <TabTrigger value="buttons">Buttons & Inputs</TabTrigger>
          <TabTrigger value="status">Status & Tags</TabTrigger>
          <TabTrigger value="overlays">Dialog, Menu & Toast</TabTrigger>
          <TabTrigger value="data">Data & Layout</TabTrigger>
        </TabList>

        {/* TAB 1: Buttons & Inputs */}
        <TabContent value="buttons" className="space-y-8">
          {/* Buttons showcase */}
          <div className="p-5 bg-[var(--surface)] border border-[var(--line)] rounded-[12px] space-y-4">
            <h3 className="text-[16px] font-semibold text-[var(--ink)]">
              Buttons & Icon Buttons
            </h3>
            <div className="flex flex-wrap items-center gap-3">
              <Button variant="primary" size="md">
                Primary md
              </Button>
              <Button variant="primary" size="sm">
                Primary sm
              </Button>
              <Button variant="secondary" size="md">
                Secondary md
              </Button>
              <Button variant="secondary" size="sm">
                Secondary sm
              </Button>
              <Button variant="quiet" size="md">
                Quiet md
              </Button>
              <Button variant="quiet" size="sm">
                Quiet sm
              </Button>
              <Button variant="danger" size="sm">
                Danger
              </Button>
              <Button variant="primary" size="sm" isLoading>
                Loading
              </Button>
              <Button variant="secondary" size="sm" disabled>
                Disabled
              </Button>
            </div>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <IconButton aria-label="Search" size="md" variant="secondary">
                <Search className="w-4 h-4" />
              </IconButton>
              <IconButton aria-label="Add" size="sm" variant="primary">
                <Plus className="w-4 h-4" />
              </IconButton>
              <IconButton aria-label="Share" size="md" variant="quiet">
                <Share2 className="w-4 h-4" />
              </IconButton>
              <IconButton aria-label="Delete" size="sm" variant="quiet">
                <Trash2 className="w-4 h-4" />
              </IconButton>
            </div>
          </div>

          {/* Form controls showcase */}
          <div className="p-5 bg-[var(--surface)] border border-[var(--line)] rounded-[12px] space-y-5">
            <h3 className="text-[16px] font-semibold text-[var(--ink)]">
              Form Controls
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <TextField
                label="Drama title or alias"
                helperText="Enter name in English, Chinese (汉字) or romanized pinyin"
                value={sampleText}
                onChange={(e) => setSampleText(e.target.value)}
                clearable
                onClear={() => setSampleText('')}
                leftIcon={<Search className="w-4 h-4" />}
              />

              <TextField
                label="Invalid input test"
                value="broken-url"
                errorMessage="Please provide a valid https:// watch link"
              />

              <Select
                label="Original language"
                helperText="Language in which the drama was filmed"
                value={selectValue}
                onChange={(e) => setSelectValue(e.target.value)}
                options={[
                  { value: 'zh', label: 'Chinese (Mandarin)' },
                  { value: 'ko', label: 'Korean' },
                  { value: 'en', label: 'English' },
                  { value: 'es', label: 'Spanish' },
                  { value: 'ja', label: 'Japanese' },
                ]}
              />

              <div className="space-y-3 pt-1">
                <span className="text-[13px] font-medium text-[var(--ink)] block">
                  Checkboxes & Radios
                </span>
                <div className="flex flex-col gap-2">
                  <Checkbox
                    label="Official watch source"
                    description="Published by the verified copyright holder or platform"
                    checked={checkbox1}
                    onChange={(e) => setCheckbox1(e.target.checked)}
                  />
                  <Checkbox
                    label="Fan translated alias"
                    checked={checkbox2}
                    onChange={(e) => setCheckbox2(e.target.checked)}
                  />
                  <Checkbox
                    label="Indeterminate state"
                    indeterminate={true}
                    checked={checkbox3}
                    onChange={() => {}}
                  />
                </div>
              </div>
            </div>

            <div className="pt-2">
              <span className="text-[13px] font-medium text-[var(--ink)] block mb-2">
                Verification Filter (Radio Group)
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <Radio
                  name="ver_status"
                  value="verified"
                  checked={selectedRadio === 'verified'}
                  onChange={() => setSelectedRadio('verified')}
                  label="Verified only"
                  description="Confirmed against official credits"
                />
                <Radio
                  name="ver_status"
                  value="all"
                  checked={selectedRadio === 'all'}
                  onChange={() => setSelectedRadio('all')}
                  label="All records"
                  description="Includes unverified submissions"
                />
                <Radio
                  name="ver_status"
                  value="disputed"
                  checked={selectedRadio === 'disputed'}
                  onChange={() => setSelectedRadio('disputed')}
                  label="Disputed items"
                  description="Under contributor arbitration"
                />
              </div>
            </div>

            <Textarea
              label="Synopsis / Plot summary"
              helperText="Brief summary without spoilers. Max 300 characters."
              value={sampleTextarea}
              onChange={(e) => setSampleTextarea(e.target.value)}
              rows={3}
            />
          </div>
        </TabContent>

        {/* TAB 2: Status & Tags */}
        <TabContent value="status" className="space-y-6">
          <div className="p-5 bg-[var(--surface)] border border-[var(--line)] rounded-[12px] space-y-4">
            <h3 className="text-[16px] font-semibold text-[var(--ink)]">
              Status Marks (Verified, Pending, Disputed)
            </h3>
            <p className="text-[13px] text-[var(--muted)]">
              Always paired with an icon and text label; never color alone.
            </p>

            <div className="flex flex-wrap items-center gap-3">
              <StatusMark status="verified" size="md" />
              <StatusMark status="pending" size="md" />
              <StatusMark status="disputed" size="md" />
              <StatusMark status="verified" size="sm" />
              <StatusMark status="pending" size="sm" />
              <StatusMark status="disputed" size="sm" />
            </div>

            <div className="pt-2">
              <h4 className="text-[14px] font-semibold text-[var(--ink)] mb-2">
                Custom Context Labels
              </h4>
              <div className="flex flex-wrap items-center gap-3">
                <StatusMark status="verified" customLabel="Official release" />
                <StatusMark status="pending" customLabel="3 pending reports" />
                <StatusMark status="disputed" customLabel="Conflicting title" />
              </div>
            </div>
          </div>

          <div className="p-5 bg-[var(--surface)] border border-[var(--line)] rounded-[12px] space-y-4">
            <h3 className="text-[16px] font-semibold text-[var(--ink)]">
              Tags (Neutral)
            </h3>
            <div className="flex flex-wrap items-center gap-2">
              <Tag variant="default" count={8}>
                CEO Romance
              </Tag>
              <Tag variant="default" count={6}>
                Contract Marriage
              </Tag>
              <Tag variant="outline">Hidden Identity</Tag>
              <Tag variant="subtle" count={12}>
                Revenge
              </Tag>
              <Tag size="sm" variant="default" count={4}>
                Small Tag
              </Tag>
              <Tag size="sm" variant="outline">
                Small Outline
              </Tag>
            </div>
          </div>

          <div className="p-5 bg-[var(--surface)] border border-[var(--line)] rounded-[12px] space-y-4">
            <h3 className="text-[16px] font-semibold text-[var(--ink)]">
              Ratings (Display & Input)
            </h3>
            <div className="flex flex-col sm:flex-row sm:items-center gap-6">
              <div className="space-y-1">
                <span className="text-[12px] text-[var(--muted)] block">
                  Display sizes:
                </span>
                <div className="flex items-center gap-4">
                  <RatingDisplay score={8.7} count={2150} size="lg" />
                  <RatingDisplay score={8.4} count={1240} size="md" />
                  <RatingDisplay score={7.9} count={890} size="sm" />
                </div>
              </div>

              <div className="flex-1 max-w-sm border-t sm:border-t-0 sm:border-l border-[var(--line)] sm:pl-6 pt-4 sm:pt-0">
                <RatingInput
                  value={ratingScore}
                  onChange={(score) => {
                    setRatingScore(score);
                    showToast({
                      title: 'Rating recorded',
                      description: `You gave this title a score of ${score}/10.`,
                      type: 'success',
                    });
                  }}
                  label="Interactive rating score"
                />
              </div>
            </div>
          </div>
        </TabContent>

        {/* TAB 3: Overlays & Feedback */}
        <TabContent value="overlays" className="space-y-6">
          <div className="p-5 bg-[var(--surface)] border border-[var(--line)] rounded-[12px] space-y-4">
            <h3 className="text-[16px] font-semibold text-[var(--ink)]">
              Dialog / Bottom Sheet
            </h3>
            <p className="text-[13px] text-[var(--muted)]">
              Renders as a centered dialog on desktop (&ge;640px) and smoothly transitions into an ergonomic bottom sheet on mobile screens.
            </p>

            <Button
              variant="primary"
              size="md"
              onClick={() => setDialogOpen(true)}
              leftIcon={<Plus className="w-4 h-4" />}
            >
              Report a name
            </Button>

            <Dialog
              open={dialogOpen}
              onClose={() => setDialogOpen(false)}
              title="Report a name"
              description="Submit an alias or alternate title used for this short drama."
              footer={
                <>
                  <Button
                    variant="quiet"
                    size="sm"
                    onClick={() => setDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => {
                      setDialogOpen(false);
                      showToast({
                        title: 'Report sent',
                        description:
                          'Your alias submission has been logged for moderator review.',
                        type: 'success',
                      });
                    }}
                  >
                    Send report
                  </Button>
                </>
              }
            >
              <div className="space-y-4 text-left">
                <TextField
                  label="Alias title"
                  placeholder="e.g. 霸总的契约娇妻"
                  required
                />
                <Select
                  label="Language"
                  options={[
                    { value: 'zh', label: 'Chinese (中文)' },
                    { value: 'en', label: 'English' },
                    { value: 'es', label: 'Spanish (Español)' },
                    { value: 'ko', label: 'Korean (한국어)' },
                  ]}
                />
                <TextField
                  label="Source platform or URL"
                  placeholder="e.g. Lumen TV app search, YouTube clip title"
                />
              </div>
            </Dialog>
          </div>

          <div className="p-5 bg-[var(--surface)] border border-[var(--line)] rounded-[12px] space-y-4">
            <h3 className="text-[16px] font-semibold text-[var(--ink)]">
              Dropdown Menu & Tooltips
            </h3>

            <div className="flex flex-wrap items-center gap-4">
              <Menu
                trigger={
                  <Button variant="secondary" size="md">
                    Manage title actions
                  </Button>
                }
              >
                <MenuItem
                  icon={<Edit3 className="w-3.5 h-3.5" />}
                  onClick={() =>
                    showToast({
                      title: 'Edit mode opened',
                      type: 'info',
                    })
                  }
                >
                  Edit metadata
                </MenuItem>
                <MenuItem
                  icon={<ShieldCheck className="w-3.5 h-3.5" />}
                  onClick={() =>
                    showToast({
                      title: 'Verification updated',
                      type: 'success',
                    })
                  }
                >
                  Verify aliases
                </MenuItem>
                <MenuDivider />
                <MenuItem
                  icon={<Trash2 className="w-3.5 h-3.5" />}
                  variant="danger"
                  onClick={() =>
                    showToast({
                      title: 'Title flagged',
                      description: 'Item submitted to moderation queue.',
                      type: 'error',
                    })
                  }
                >
                  Flag duplicate
                </MenuItem>
              </Menu>

              <Tooltip content="Official release on Lumen TV">
                <Button variant="quiet" size="md" rightIcon={<ExternalLink className="w-3.5 h-3.5" />}>
                  Hover for tooltip
                </Button>
              </Tooltip>
            </div>
          </div>

          <div className="p-5 bg-[var(--surface)] border border-[var(--line)] rounded-[12px] space-y-4">
            <h3 className="text-[16px] font-semibold text-[var(--ink)]">
              Toasts (Notification System)
            </h3>
            <div className="flex flex-wrap items-center gap-3">
              <Button
                variant="secondary"
                size="sm"
                onClick={() =>
                  showToast({
                    title: 'Title added to watchlist',
                    description: 'Saved to your personal tracking catalog.',
                    type: 'success',
                  })
                }
              >
                Trigger Success Toast
              </Button>

              <Button
                variant="secondary"
                size="sm"
                onClick={() =>
                  showToast({
                    title: 'Link verification failed',
                    description: 'The requested external source URL returned 404.',
                    type: 'error',
                  })
                }
              >
                Trigger Error Toast
              </Button>

              <Button
                variant="secondary"
                size="sm"
                onClick={() =>
                  showToast({
                    title: 'Search indexing updated',
                    description: '12 new Chinese aliases indexed.',
                    type: 'info',
                  })
                }
              >
                Trigger Info Toast
              </Button>
            </div>
          </div>
        </TabContent>

        {/* TAB 4: Data & Layout */}
        <TabContent value="data" className="space-y-8">
          {/* Breadcrumb & Poster */}
          <div className="p-5 bg-[var(--surface)] border border-[var(--line)] rounded-[12px] space-y-6">
            <h3 className="text-[16px] font-semibold text-[var(--ink)]">
              Breadcrumb Navigation
            </h3>
            <Breadcrumb
              items={[
                { label: 'Catalog', href: '/search' },
                { label: 'Chinese Short Dramas', href: '/search?lang=zh' },
                { label: 'The Billionaire’s Secret Fiancée' },
              ]}
            />
          </div>

          {/* 9:16 Neutral Poster Placeholders */}
          <div className="p-5 bg-[var(--surface)] border border-[var(--line)] rounded-[12px] space-y-4">
            <h3 className="text-[16px] font-semibold text-[var(--ink)]">
              9:16 Ratio Posters (Neutral Placeholders)
            </h3>
            <p className="text-[13px] text-[var(--muted)]">
              Neutral geometry with title typography fallback. Never real posters or brand assets.
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-4 max-w-4xl">
              <Poster
                title="The Billionaire’s Secret Fiancée"
                year={2024}
                episodeCount={82}
              />
              <Poster
                title="重生千金逆袭录"
                year={2024}
                episodeCount={95}
              />
              <Poster
                title="Midnight Boardroom Romance"
                year={2024}
                episodeCount={60}
              />
              <Poster
                title="Accidental Empress in Metropolis"
                year={2024}
                episodeCount={75}
              />
            </div>
          </div>

          {/* DataList Component */}
          <div className="p-5 bg-[var(--surface)] border border-[var(--line)] rounded-[12px] space-y-4">
            <h3 className="text-[16px] font-semibold text-[var(--ink)]">
              DataList (Label and Value Rows)
            </h3>
            <div className="max-w-xl">
              <DataList
                items={[
                  {
                    label: 'Original Title',
                    value: (
                      <span lang="zh" className="font-medium text-[var(--ink)]">
                        霸总的秘密未婚妻 (Bà Zǒng De Mìmì Wèihūnqī)
                      </span>
                    ),
                    hint: 'Standard Mandarin release',
                  },
                  {
                    label: 'Episodes',
                    value: <span className="tabular-nums font-semibold">82 episodes (approx. 2 min / ep)</span>,
                  },
                  {
                    label: 'Verification Status',
                    value: <StatusMark status="verified" size="sm" />,
                  },
                  {
                    label: 'Primary Platform',
                    value: 'Lumen TV (Global)',
                    hint: 'Official distributor with English & Spanish subtitles',
                  },
                ]}
              />
            </div>
          </div>

          {/* Empty & Error states */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <EmptyState
              title="No short dramas found"
              description="We could not find any titles matching your search criteria. Try removing filters or searching by a Chinese character alias."
              action={
                <Button variant="secondary" size="sm">
                  Clear search filters
                </Button>
              }
            />

            <ErrorState
              title="Failed to fetch title data"
              description="The server could not retrieve release records for this ID. Please try again or report a broken catalog entry."
              retryAction={
                <Button variant="secondary" size="sm">
                  Retry request
                </Button>
              }
            />
          </div>

          {/* Skeletons & Pagination */}
          <div className="p-5 bg-[var(--surface)] border border-[var(--line)] rounded-[12px] space-y-5">
            <h3 className="text-[16px] font-semibold text-[var(--ink)]">
              Skeleton & Pagination
            </h3>

            <div className="space-y-2 max-w-md">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>

            <div className="pt-4 border-t border-[var(--line)]">
              <Pagination
                currentPage={currentPage}
                totalPages={8}
                onPageChange={(p) => setCurrentPage(p)}
              />
            </div>
          </div>
        </TabContent>
      </Tabs>
    </div>
  );
}
