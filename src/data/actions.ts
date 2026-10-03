'use server';

import { cookies } from 'next/headers';
import {
  mockUsers,
  mockReports,
  mockUserListEntries,
  mockSeriesList,
  mockRevisions,
  mockRedirects,
} from './mock';
import {
  User,
  ReportType,
  UserReport,
  ListStatus,
  UserPreferences,
  Series,
  Alias,
  Release,
  Tag,
  Revision,
  TitleRedirect,
} from './types';
import { lookupLink } from './repository';

export async function setMockUserAction(userId: string): Promise<User | null> {
  const cookieStore = await cookies();
  const user = mockUsers.find((u) => u.id === userId);
  if (user) {
    cookieStore.set('sdi_mock_user', user.id, {
      path: '/',
      maxAge: 60 * 60 * 24 * 30, // 30 days
      sameSite: 'lax',
    });
    return user;
  }
  return null;
}

export async function clearMockUserAction(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete('sdi_mock_user');
}

export async function lookupLinkAction(url: string): Promise<{
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
}> {
  if (!url || !url.trim()) {
    return { found: false };
  }

  const result = await lookupLink(url);
  if (!result) {
    return { found: false };
  }

  return {
    found: true,
    series: {
      id: result.series.id,
      slug: result.series.slug,
      title: result.series.title,
      year: result.series.year,
      episodeCount: result.series.episodeCount,
    },
    release: {
      platform: result.release.platform,
      url: result.release.url,
      isOfficial: result.release.isOfficial,
    },
  };
}

export interface SubmitReportInput {
  seriesId: number;
  seriesTitle: string;
  type: ReportType;
  data: {
    name?: string;
    language?: string;
    url?: string;
    note?: string;
    targetAlias?: string;
    reason?: string;
    otherSeriesId?: number;
    otherSeriesTitle?: string;
    field?: string;
    proposedValue?: string;
    releaseId?: string;
    releasePlatform?: string;
    replacementUrl?: string;
  };
}

export interface SubmitReportResult {
  success: boolean;
  reportId?: string;
  errors?: Record<string, string>;
  message?: string;
}

const typeDisplayNames: Record<ReportType, string> = {
  another_name: 'Another name for this drama',
  wrong_name: 'This name is wrong',
  same_drama: 'Same drama as another title',
  not_same_drama: 'Not the same drama',
  wrong_details: 'Wrong details',
  broken_link: 'Link is broken or wrong',
};

export async function submitReport(input: SubmitReportInput): Promise<SubmitReportResult> {
  const errors: Record<string, string> = {};

  if (input.type === 'another_name') {
    if (!input.data.name || !input.data.name.trim()) {
      errors.name = 'Please enter the title or alias name.';
    }
  } else if (input.type === 'wrong_name') {
    if (!input.data.targetAlias || !input.data.targetAlias.trim()) {
      errors.targetAlias = 'Please select which name is incorrect.';
    }
    if (!input.data.reason || !input.data.reason.trim()) {
      errors.reason = 'Please select a reason.';
    }
  } else if (input.type === 'same_drama' || input.type === 'not_same_drama') {
    if (!input.data.otherSeriesTitle || !input.data.otherSeriesTitle.trim()) {
      errors.otherSeriesTitle = 'Please select or search the other drama title.';
    }
  } else if (input.type === 'wrong_details') {
    if (!input.data.field || !input.data.field.trim()) {
      errors.field = 'Please select which detail is incorrect.';
    }
    if (!input.data.proposedValue || !input.data.proposedValue.trim()) {
      errors.proposedValue = 'Please enter the corrected value.';
    }
  } else if (input.type === 'broken_link') {
    if (!input.data.releasePlatform || !input.data.releasePlatform.trim()) {
      errors.releasePlatform = 'Please select the affected platform.';
    }
  }

  if (Object.keys(errors).length > 0) {
    return {
      success: false,
      errors,
    };
  }

  const cookieStore = await cookies();
  const currentUserId = cookieStore.get('sdi_mock_user')?.value || mockUsers[0].id;
  const newId = `rep_${Date.now()}`;

  const newReport: UserReport = {
    id: newId,
    seriesId: input.seriesId,
    seriesTitle: input.seriesTitle,
    type: input.type,
    typeName: typeDisplayNames[input.type] || input.type,
    status: 'open',
    submittedBy: currentUserId,
    submittedAt: new Date().toISOString().split('T')[0],
    data: input.data,
  };

  mockReports.unshift(newReport);

  return {
    success: true,
    reportId: newId,
    message: 'Report sent',
  };
}

export async function updateListEntryAction(params: {
  seriesId: number;
  status?: ListStatus;
  episodesWatched?: number;
  score?: number;
}): Promise<{ success: boolean; entry?: typeof mockUserListEntries[0] }> {
  const cookieStore = await cookies();
  const userId = cookieStore.get('sdi_mock_user')?.value || mockUsers[0].id;

  let existing = mockUserListEntries.find(
    (e) => e.userId === userId && e.seriesId === params.seriesId
  );

  if (existing) {
    if (params.status) existing.status = params.status;
    if (typeof params.episodesWatched === 'number') {
      existing.episodesWatched = Math.max(0, params.episodesWatched);
    }
    if (typeof params.score === 'number') {
      existing.score = params.score;
    }
    existing.updatedAt = new Date().toISOString().split('T')[0];
    return { success: true, entry: existing };
  } else {
    const newEntry = {
      userId,
      seriesId: params.seriesId,
      status: params.status || 'watching',
      episodesWatched: params.episodesWatched || 0,
      score: params.score,
      updatedAt: new Date().toISOString().split('T')[0],
    };
    mockUserListEntries.push(newEntry);
    return { success: true, entry: newEntry };
  }
}

export async function updateUserPreferencesAction(
  prefs: Partial<UserPreferences>
): Promise<{ success: boolean }> {
  const cookieStore = await cookies();
  if (prefs.titleLanguage) {
    cookieStore.set('sdi_title_lang', prefs.titleLanguage, {
      path: '/',
      maxAge: 60 * 60 * 24 * 365,
    });
  }
  if (prefs.defaultRegion) {
    cookieStore.set('sdi_default_region', prefs.defaultRegion, {
      path: '/',
      maxAge: 60 * 60 * 24 * 365,
    });
  }
  if (prefs.theme) {
    cookieStore.set('sdi_theme', prefs.theme, {
      path: '/',
      maxAge: 60 * 60 * 24 * 365,
    });
  }
  return { success: true };
}

export async function deleteAccountAction(): Promise<{ success: boolean }> {
  const cookieStore = await cookies();
  const userId = cookieStore.get('sdi_mock_user')?.value || mockUsers[0].id;

  const entriesIndex = mockUserListEntries.findIndex((e) => e.userId === userId);
  if (entriesIndex !== -1) mockUserListEntries.splice(entriesIndex, 1);

  cookieStore.delete('sdi_mock_user');
  return { success: true };
}

export interface SaveSeriesEditsInput {
  seriesId: number;
  summary: string;
  details: {
    title: string;
    romanizedTitle?: string;
    originalLanguage: string;
    year: number;
    episodeCount: number;
    synopsis: string;
    productionStatus?: 'completed' | 'ongoing';
  };
  aliases: Alias[];
  releases: Release[];
  tags: Tag[];
}

export async function saveSeriesEditsAction(
  input: SaveSeriesEditsInput
): Promise<{ success: boolean; errors?: Record<string, string>; revisionId?: string }> {
  if (!input.summary || !input.summary.trim()) {
    return {
      success: false,
      errors: { summary: 'A summary of changes is required before saving.' },
    };
  }

  const series = mockSeriesList.find((s) => s.id === input.seriesId);
  if (!series) {
    return { success: false, errors: { general: 'Series not found.' } };
  }

  const cookieStore = await cookies();
  const userId = cookieStore.get('sdi_mock_user')?.value || mockUsers[1].id;
  const user = mockUsers.find((u) => u.id === userId) || mockUsers[1];

  // Capture diffs
  const diffs = [];
  if (series.title !== input.details.title) {
    diffs.push({
      field: 'title',
      label: 'Title',
      oldValue: series.title,
      newValue: input.details.title,
    });
  }
  if (series.episodeCount !== input.details.episodeCount) {
    diffs.push({
      field: 'episodeCount',
      label: 'Episode count',
      oldValue: String(series.episodeCount),
      newValue: String(input.details.episodeCount),
    });
  }
  if (series.aliases.length !== input.aliases.length) {
    diffs.push({
      field: 'aliases',
      label: 'Aliases count',
      oldValue: `${series.aliases.length} aliases`,
      newValue: `${input.aliases.length} aliases`,
    });
  }

  // Apply edits
  series.title = input.details.title;
  series.romanizedTitle = input.details.romanizedTitle;
  series.originalLanguage = input.details.originalLanguage;
  series.year = input.details.year;
  series.episodeCount = input.details.episodeCount;
  series.synopsis = input.details.synopsis;
  series.productionStatus = input.details.productionStatus;
  series.aliases = input.aliases;
  series.releases = input.releases;
  series.tags = input.tags;
  series.updatedAt = new Date().toISOString().split('T')[0];

  const revisionId = `rev_${series.id}_${Date.now()}`;
  const newRev: Revision = {
    id: revisionId,
    seriesId: series.id,
    summary: input.summary.trim(),
    diffs: diffs.length > 0 ? diffs : [
      {
        field: 'metadata',
        label: 'Metadata',
        oldValue: 'Previous revision',
        newValue: 'Updated metadata',
      },
    ],
    submittedBy: user.id,
    submittedByName: user.name,
    submittedByRole: user.role,
    submittedAt: new Date().toISOString().split('T')[0],
  };

  mockRevisions.unshift(newRev);

  return { success: true, revisionId };
}

export async function mergeSeriesAction(params: {
  sourceId: number;
  targetId: number;
  reason: string;
}): Promise<{ success: boolean; redirectPath?: string }> {
  const source = mockSeriesList.find((s) => s.id === params.sourceId);
  const target = mockSeriesList.find((s) => s.id === params.targetId);

  if (!source || !target) {
    return { success: false };
  }

  const cookieStore = await cookies();
  const userId = cookieStore.get('sdi_mock_user')?.value || mockUsers[2].id;
  const user = mockUsers.find((u) => u.id === userId) || mockUsers[2];

  // Merge aliases from source into target if not already present
  for (const alias of source.aliases) {
    if (!target.aliases.some((a) => a.text.toLowerCase() === alias.text.toLowerCase())) {
      target.aliases.push({ ...alias, source: `Merged from #${source.id}` });
    }
  }

  // Create redirect
  mockRedirects.push({
    fromId: source.id,
    toId: target.id,
    createdAt: new Date().toISOString().split('T')[0],
    reason: params.reason || 'Merged duplicate entry',
  });

  // Log revision
  mockRevisions.unshift({
    id: `rev_${target.id}_merge_${Date.now()}`,
    seriesId: target.id,
    summary: `Merged title #${source.id} (${source.title}) into this canonical entry. Reason: ${params.reason}`,
    diffs: [
      {
        field: 'merge',
        label: 'Merge record',
        oldValue: `Individual title #${source.id}`,
        newValue: `Merged into #${target.id}`,
      },
    ],
    submittedBy: user.id,
    submittedByName: user.name,
    submittedByRole: user.role,
    submittedAt: new Date().toISOString().split('T')[0],
  });

  return {
    success: true,
    redirectPath: `/title/${target.id}-${target.slug}`,
  };
}

export async function revertRevisionAction(
  revisionId: string
): Promise<{ success: boolean }> {
  const rev = mockRevisions.find((r) => r.id === revisionId);
  if (rev) {
    rev.reverted = true;
    return { success: true };
  }
  return { success: false };
}

export async function resolveModerationReportAction(params: {
  reportId: string;
  decision: 'accept' | 'decline' | 'need_info';
  moderatorNote?: string;
}): Promise<{ success: boolean }> {
  const report = mockReports.find((r) => r.id === params.reportId);
  if (!report) return { success: false };

  if (params.decision === 'accept') {
    report.status = 'accepted';

    // If report added another name, update the drama aliases directly!
    if (report.type === 'another_name' && report.data.name) {
      const targetSeries = mockSeriesList.find((s) => s.id === report.seriesId);
      if (targetSeries) {
        targetSeries.aliases.push({
          text: report.data.name,
          language: report.data.language || 'zh',
          source: report.data.url || 'Community report',
          status: 'verified',
          addedBy: report.submittedBy,
          addedAt: new Date().toISOString().split('T')[0],
        });
      }
    }
  } else if (params.decision === 'decline') {
    report.status = 'declined';
    report.moderatorNote = params.moderatorNote || 'Submission does not meet reference database criteria.';
  }

  return { success: true };
}
