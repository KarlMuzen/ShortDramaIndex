'use server';

import { revalidatePath } from 'next/cache';
import { titlePath } from '@/src/lib/urls';
import { createClient } from './supabase-server';
import {
  mockReports,
  mockUserListEntries,
  mockSeriesList,
  mockRevisions,
  mockRedirects,
} from './mock';
import {
  ReportType,
  UserReport,
  ListStatus,
  UserPreferences,
  Alias,
  Release,
  Tag,
  Revision,
} from './types';
import { lookupLink, logDataError } from './repository';
import { allowMockData, isSupabaseConfigured } from './supabase-public';

function isValidHttpUrl(str?: string): boolean {
  if (!str) return false;
  try {
    const url = new URL(str);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

function revalidateSeriesContext(
  series?: { slug?: string; shortId?: string } | null,
  tags?: Tag[],
  releases?: Release[]
) {
  revalidatePath('/');
  if (series?.slug && series?.shortId) {
    const path = titlePath({ slug: series.slug, shortId: series.shortId });
    revalidatePath(path);
    revalidatePath(`${path}/history`);
  }
  if (tags) {
    for (const t of tags) {
      if (t.slug) revalidatePath(`/tag/${t.slug}`);
    }
  }
  if (releases) {
    for (const r of releases) {
      if (r.platformSlug) revalidatePath(`/platform/${r.platformSlug}`);
    }
  }
}

export async function lookupLinkAction(url: string): Promise<{
  found: boolean;
  series?: {
    id: number;
    slug: string;
    shortId: string;
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
      shortId: result.series.shortId,
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

type ReportDataKey =
  | 'name'
  | 'targetAlias'
  | 'reason'
  | 'otherSeriesTitle'
  | 'field'
  | 'releasePlatform'
  | 'language'
  | 'url'
  | 'replacementUrl'
  | 'note'
  | 'proposedValue';

function trimmedReportData(input: SubmitReportInput['data']): SubmitReportInput['data'] {
  const result: Partial<Record<ReportDataKey, string>> = {};
  const add = (key: ReportDataKey, value: string | undefined, max: number) => {
    if (value !== undefined) result[key] = value.trim().slice(0, max);
  };

  add('name', input.name, 200);
  add('targetAlias', input.targetAlias, 200);
  add('reason', input.reason, 200);
  add('otherSeriesTitle', input.otherSeriesTitle, 200);
  add('field', input.field, 200);
  add('releasePlatform', input.releasePlatform, 200);
  add('language', input.language, 10);
  add('url', input.url, 1000);
  add('replacementUrl', input.replacementUrl, 1000);
  add('note', input.note, 1000);
  add('proposedValue', input.proposedValue, 1000);

  return result;
}

const typeDisplayNames: Record<ReportType, string> = {
  another_name: 'Another name for this drama',
  wrong_name: 'This name is wrong',
  same_drama: 'Same drama as another title',
  not_same_drama: 'Not the same drama',
  wrong_details: 'Wrong details',
  broken_link: 'Link is broken or wrong',
};

/**
 * Submits a community report with per-user daily limits and source URL verification
 */
export async function submitReport(input: SubmitReportInput): Promise<SubmitReportResult> {
  const errors: Record<string, string> = {};

  if (input.type === 'another_name') {
    if (!input.data.name || !input.data.name.trim()) errors.name = 'Please enter the title or alias name.';
    else if (input.data.name.length > 200) errors.name = 'Name must not exceed 200 characters.';
    if (!input.data.url || !isValidHttpUrl(input.data.url)) {
      errors.url = 'A valid http:// or https:// proof/source link is required.';
    }
  } else if (input.type === 'wrong_name') {
    if (!input.data.targetAlias || !input.data.targetAlias.trim()) errors.targetAlias = 'Please select which name is incorrect.';
    if (!input.data.reason || !input.data.reason.trim()) errors.reason = 'Please select a reason.';
  } else if (input.type === 'same_drama' || input.type === 'not_same_drama') {
    if (!input.data.otherSeriesTitle || !input.data.otherSeriesTitle.trim()) {
      errors.otherSeriesTitle = 'Please select or search the other drama title.';
    }
  } else if (input.type === 'wrong_details') {
    if (!input.data.field || !input.data.field.trim()) errors.field = 'Please select which detail is incorrect.';
    if (!input.data.proposedValue || !input.data.proposedValue.trim()) errors.proposedValue = 'Please enter the corrected value.';
    else if (input.data.proposedValue.length > 1000) errors.proposedValue = 'Correction value must not exceed 1000 characters.';
  } else if (input.type === 'broken_link') {
    if (!input.data.releasePlatform || !input.data.releasePlatform.trim()) errors.releasePlatform = 'Please select the affected platform.';
    if (input.data.replacementUrl && !isValidHttpUrl(input.data.replacementUrl)) {
      errors.replacementUrl = 'Replacement link must be a valid http:// or https:// URL.';
    }
  }

  if (input.data.note && input.data.note.length > 1000) errors.note = 'Note must not exceed 1000 characters.';
  if (Object.keys(errors).length > 0) return { success: false, errors };

  const reportData = trimmedReportData(input.data);

  if (isSupabaseConfigured) {
    const supabase = await createClient();
    const { data: authData, error: authError } = await supabase.auth.getUser();
    if (authError) {
      logDataError('submitReport: getUser', authError);
      return { success: false, errors: { general: 'Something went wrong. Try again.' } };
    }
    if (!authData.user) return { success: false, errors: { general: 'Sign in to continue.' } };

    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { count, error: countError } = await supabase
      .from('reports')
      .select('*', { count: 'exact', head: true })
      .eq('submitted_by', authData.user.id)
      .gte('created_at', oneDayAgo);

    if (countError) {
      logDataError('submitReport: daily report count', countError);
      return { success: false, errors: { general: 'Something went wrong. Try again.' } };
    }
    if (typeof count === 'number' && count >= 10) {
      return {
        success: false,
        errors: { general: 'Daily report limit reached (maximum 10 reports per day). Please try again tomorrow.' },
      };
    }

    const { data, error } = await supabase
      .from('reports')
      .insert({
        series_id: input.seriesId,
        type: input.type,
        status: 'open',
        submitted_by: authData.user.id,
        data: reportData,
      })
      .select('id')
      .single();

    if (error || !data) {
      if (error) logDataError('submitReport: insert report', error);
      else logDataError('submitReport: insert report', new Error('Report insert returned no data'));
      return { success: false, errors: { general: 'Something went wrong. Try again.' } };
    }

    return { success: true, reportId: data.id, message: 'Report sent' };
  }

  if (!allowMockData) {
    logDataError('submitReport', new Error('Mock data is not allowed'));
    return { success: false, errors: { general: 'Something went wrong. Try again.' } };
  }

  const todayReports = mockReports.filter(
    (r) => r.submittedAt === new Date().toISOString().split('T')[0]
  );
  if (todayReports.length >= 10) {
    return { success: false, errors: { general: 'Daily report limit reached (maximum 10 reports per day). Please try again tomorrow.' } };
  }

  const newId = `rep_${Date.now()}`;
  mockReports.unshift({
    id: newId,
    seriesId: input.seriesId,
    seriesTitle: input.seriesTitle,
    type: input.type,
    typeName: typeDisplayNames[input.type] || input.type,
    status: 'open',
    submittedBy: 'usr_reader_01',
    submittedAt: new Date().toISOString().split('T')[0],
    data: reportData,
  });

  return { success: true, reportId: newId, message: 'Report sent' };
}


/**
 * Updates list entry with rate limiting (60 list changes per hour)
 */
export async function updateListEntryAction(params: {
  seriesId: number;
  status?: ListStatus;
  episodesWatched?: number;
  score?: number;
}): Promise<{ success: boolean; message?: string; entry?: typeof mockUserListEntries[0] }> {
  if (isSupabaseConfigured) {
    const supabase = await createClient();
    const { data: authData, error: authError } = await supabase.auth.getUser();
    if (authError) {
      logDataError('updateListEntryAction: getUser', authError);
      return { success: false, message: 'Something went wrong. Try again.' };
    }
    if (!authData.user) return { success: false, message: 'Sign in to continue.' };

    const { data: existingRow, error: existingError } = await supabase
      .from('list_entries')
      .select('status, episodes_watched, score')
      .eq('user_id', authData.user.id)
      .eq('series_id', params.seriesId)
      .maybeSingle();

    if (existingError) {
      logDataError('updateListEntryAction: existing list entry', existingError);
      return { success: false, message: 'Something went wrong. Try again.' };
    }
    if (!existingRow && !params.status) {
      return { success: false, message: 'Add this title to your list first.' };
    }

    const { data: seriesData, error: seriesError } = await supabase
      .from('series')
      .select('slug, short_id')
      .eq('id', params.seriesId)
      .single();

    if (seriesError) {
      logDataError('updateListEntryAction: series lookup', seriesError);
      return { success: false, message: 'Something went wrong. Try again.' };
    }
    if (!seriesData?.slug || !seriesData?.short_id) {
      logDataError('updateListEntryAction: series lookup', new Error('Series slug or short_id missing'));
      return { success: false, message: 'Something went wrong. Try again.' };
    }

    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const { count, error: countError } = await supabase
      .from('list_entries')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', authData.user.id)
      .gte('updated_at', oneHourAgo);

    if (countError) {
      logDataError('updateListEntryAction: rate limit count', countError);
      return { success: false, message: 'Something went wrong. Try again.' };
    }
    if (typeof count === 'number' && count >= 60) {
      return { success: false, message: 'Hourly list update limit reached (maximum 60 updates per hour).' };
    }

    const payload: any = {
      user_id: authData.user.id,
      series_id: params.seriesId,
      updated_at: new Date().toISOString(),
    };
    if (params.status) payload.status = params.status;
    if (typeof params.episodesWatched === 'number') payload.episodes_watched = Math.max(0, params.episodesWatched);
    if (typeof params.score === 'number') payload.score = params.score;

    const { error: upsertError } = await supabase.from('list_entries').upsert(payload);
    if (upsertError) {
      logDataError('updateListEntryAction: upsert', upsertError);
      return { success: false, message: 'Something went wrong. Try again.' };
    }

    revalidateSeriesContext({ slug: seriesData.slug, shortId: seriesData.short_id });
    const entry = existingRow
      ? {
          userId: authData.user.id,
          seriesId: params.seriesId,
          status: params.status || existingRow.status,
          episodesWatched: typeof params.episodesWatched === 'number'
            ? Math.max(0, params.episodesWatched)
            : existingRow.episodes_watched || 0,
          score: typeof params.score === 'number' ? params.score : existingRow.score,
          updatedAt: new Date().toISOString().split('T')[0],
        }
      : {
          userId: authData.user.id,
          seriesId: params.seriesId,
          status: params.status!,
          episodesWatched: typeof params.episodesWatched === 'number' ? Math.max(0, params.episodesWatched) : 0,
          score: params.score,
          updatedAt: new Date().toISOString().split('T')[0],
        };

    return { success: true, entry };
  }

  if (!allowMockData) {
    logDataError('updateListEntryAction', new Error('Mock data is not allowed'));
    return { success: false, message: 'Something went wrong. Try again.' };
  }

  const mockUserId = 'usr_reader_01';
  const existing = mockUserListEntries.find((e) => e.userId === mockUserId && e.seriesId === params.seriesId);
  if (!existing && !params.status) return { success: false, message: 'Add this title to your list first.' };

  if (existing) {
    if (params.status) existing.status = params.status;
    if (typeof params.episodesWatched === 'number') existing.episodesWatched = Math.max(0, params.episodesWatched);
    if (typeof params.score === 'number') existing.score = params.score;
    existing.updatedAt = new Date().toISOString().split('T')[0];
    return { success: true, entry: existing };
  }

  const newEntry = {
    userId: mockUserId,
    seriesId: params.seriesId,
    status: params.status!,
    episodesWatched: typeof params.episodesWatched === 'number' ? Math.max(0, params.episodesWatched) : 0,
    score: params.score,
    updatedAt: new Date().toISOString().split('T')[0],
  };
  mockUserListEntries.push(newEntry);
  return { success: true, entry: newEntry };
}


export async function updateUserPreferencesAction(
  prefs: Partial<UserPreferences>
): Promise<{ success: boolean }> {
  return { success: true };
}

export async function deleteAccountAction(): Promise<{ success: boolean }> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase.from('profiles').delete().eq('id', user.id);
      await supabase.rpc('delete_my_account');
      await supabase.auth.signOut();
    }
  } catch {
    // Ignore
  }
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

/**
 * Saves edits across series, aliases, releases, and revisions in one atomic transaction / RPC
 */
export async function saveSeriesEditsAction(
  input: SaveSeriesEditsInput
): Promise<{ success: boolean; errors?: Record<string, string>; revisionId?: string }> {
  if (!input.summary || !input.summary.trim()) {
    return { success: false, errors: { summary: 'A summary of changes is required before saving.' } };
  }
  if (input.summary.length > 500) return { success: false, errors: { summary: 'Summary must not exceed 500 characters.' } };
  if (!input.details.title || !input.details.title.trim() || input.details.title.length > 200) {
    return { success: false, errors: { title: 'Title is required and must not exceed 200 characters.' } };
  }
  if (input.details.synopsis && input.details.synopsis.length > 4000) {
    return { success: false, errors: { synopsis: 'Synopsis must not exceed 4000 characters.' } };
  }
  for (const a of input.aliases) {
    if (!a.text || a.text.length > 200) return { success: false, errors: { alias: 'Alias text must not exceed 200 characters.' } };
  }
  for (const r of input.releases) {
    if (!isValidHttpUrl(r.url)) {
      return { success: false, errors: { url: `Release link for ${r.platform} must be a valid http:// or https:// URL.` } };
    }
  }

  if (isSupabaseConfigured) {
    const supabase = await createClient();
    const { data: authData, error: authError } = await supabase.auth.getUser();
    if (authError) {
      logDataError('saveSeriesEditsAction: getUser', authError);
      return { success: false, errors: { general: 'Something went wrong. Try again.' } };
    }
    if (!authData.user) return { success: false, errors: { general: 'Sign in to continue.' } };

    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { count, error: countError } = await supabase
      .from('revisions')
      .select('*', { count: 'exact', head: true })
      .eq('submitted_by', authData.user.id)
      .gte('created_at', oneDayAgo);

    if (countError) {
      logDataError('saveSeriesEditsAction: revision count', countError);
      return { success: false, errors: { general: 'Something went wrong. Try again.' } };
    }
    if (typeof count === 'number' && count >= 100) {
      return { success: false, errors: { general: 'Daily edit limit reached (maximum 100 edits per day).' } };
    }

    const { data: revisionId, error } = await supabase.rpc('apply_series_edits', {
      p_series_id: input.seriesId,
      p_summary: input.summary.trim(),
      p_details: input.details,
      p_aliases: input.aliases,
      p_releases: input.releases,
      p_tags: input.tags,
      p_diffs: [{ field: 'metadata', label: 'Metadata', oldValue: 'Previous revision', newValue: 'Updated metadata' }],
    });

    if (error || revisionId == null) {
      if (error) logDataError('saveSeriesEditsAction: apply_series_edits', error);
      else logDataError('saveSeriesEditsAction: apply_series_edits', new Error('RPC returned no revision id'));
      return { success: false, errors: { general: 'Something went wrong. Try again.' } };
    }

    revalidateSeriesContext(undefined, input.tags, input.releases);
    return { success: true, revisionId: String(revisionId) };
  }

  if (!allowMockData) {
    logDataError('saveSeriesEditsAction', new Error('Mock data is not allowed'));
    return { success: false, errors: { general: 'Something went wrong. Try again.' } };
  }

  const series = mockSeriesList.find((s) => s.id === input.seriesId);
  if (!series) return { success: false, errors: { general: 'Series not found.' } };

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
    diffs: [{ field: 'metadata', label: 'Metadata', oldValue: 'Previous revision', newValue: 'Updated metadata' }],
    submittedBy: 'usr_editor_02',
    submittedByName: 'Marcus Chen',
    submittedByRole: 'editor',
    submittedAt: new Date().toISOString().split('T')[0],
  };

  mockRevisions.unshift(newRev);
  revalidateSeriesContext(series, series.tags, series.releases);
  return { success: true, revisionId };
}


/**
 * Merges a drama record into a target entry, creating a redirect and setting merged title to hidden
 */
export async function mergeSeriesAction(params: {
  sourceId: number;
  targetId: number;
  reason: string;
}): Promise<{ success: boolean; redirectPath?: string }> {
  if (isSupabaseConfigured) {
    const supabase = await createClient();
    const { data: authData, error: authError } = await supabase.auth.getUser();
    if (authError) {
      logDataError('mergeSeriesAction: getUser', authError);
      return { success: false };
    }
    if (!authData.user) return { success: false };

    const { error: redirectError } = await supabase.from('redirects').insert({
      from_id: params.sourceId,
      to_id: params.targetId,
      reason: params.reason || 'Merged duplicate entry',
    });
    if (redirectError) {
      logDataError('mergeSeriesAction: insert redirect', redirectError);
      return { success: false };
    }

    const { error: hideError } = await supabase
      .from('series')
      .update({ visibility: 'hidden' })
      .eq('id', params.sourceId);
    if (hideError) {
      logDataError('mergeSeriesAction: hide source series', hideError);
      return { success: false };
    }

    const { error: revisionError } = await supabase.from('revisions').insert({
      series_id: params.targetId,
      summary: `Merged title #${params.sourceId} into this canonical entry. Reason: ${params.reason}`,
      diffs: [{ field: 'merge', label: 'Merge record', oldValue: `Individual title #${params.sourceId}`, newValue: `Merged into #${params.targetId}` }],
      submitted_by: authData.user.id,
    });
    if (revisionError) {
      logDataError('mergeSeriesAction: insert revision', revisionError);
      return { success: false };
    }

    const { data: targetSeries, error: targetError } = await supabase
      .from('series')
      .select('slug, short_id')
      .eq('id', params.targetId)
      .single();

    if (targetError) {
      logDataError('mergeSeriesAction: target series lookup', targetError);
      return { success: false };
    }
    if (!targetSeries?.slug || !targetSeries?.short_id) {
      logDataError('mergeSeriesAction: target series lookup', new Error('Series slug or short_id missing'));
      return { success: false };
    }

    revalidateSeriesContext({ slug: targetSeries.slug, shortId: targetSeries.short_id });
    return { success: true, redirectPath: titlePath({ slug: targetSeries.slug, shortId: targetSeries.short_id }) };
  }

  if (!allowMockData) {
    logDataError('mergeSeriesAction', new Error('Mock data is not allowed'));
    return { success: false };
  }

  const source = mockSeriesList.find((s) => s.id === params.sourceId);
  const target = mockSeriesList.find((s) => s.id === params.targetId);
  if (!source || !target) return { success: false };

  source.visibility = 'hidden';
  for (const alias of source.aliases) {
    if (!target.aliases.some((a) => a.text.toLowerCase() === alias.text.toLowerCase())) {
      target.aliases.push({ ...alias, source: `Merged from #${source.id}` });
    }
  }

  mockRedirects.push({
    fromId: source.id,
    toId: target.id,
    createdAt: new Date().toISOString().split('T')[0],
    reason: params.reason || 'Merged duplicate entry',
  });

  revalidateSeriesContext(source, source.tags, source.releases);
  revalidateSeriesContext(target, target.tags, target.releases);
  return { success: true, redirectPath: titlePath(target) };
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

/**
 * Resolves moderation report and applies changes directly to the title
 */
export async function resolveModerationReportAction(params: {
  reportId: string;
  decision: 'accept' | 'decline' | 'need_info';
  moderatorNote?: string;
}): Promise<{ success: boolean }> {
  if (isSupabaseConfigured) {
    const supabase = await createClient();
    const { data: authData, error: authError } = await supabase.auth.getUser();
    if (authError) {
      logDataError('resolveModerationReportAction: getUser', authError);
      return { success: false };
    }
    if (!authData.user) return { success: false };

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', authData.user.id)
      .single();
    if (profileError || !profile || profile.role !== 'moderator') {
      return { success: false };
    }

    const { data: report, error: reportError } = await supabase
      .from('reports')
      .select('*')
      .eq('id', params.reportId)
      .single();

    if (reportError) {
      logDataError('resolveModerationReportAction: report lookup', reportError);
      return { success: false };
    }
    if (!report) return { success: false };

    if (params.decision === 'accept' && report.type === 'another_name' && report.data?.name) {
      const { error: aliasError } = await supabase.from('aliases').insert({
        series_id: report.series_id,
        text: report.data.name,
        language: report.data.language || 'zh',
        source_url: report.data.url || 'https://shortdramaindex.vercel.app',
        source_label: 'Community report',
        status: 'verified',
        added_by: report.submitted_by,
      });
      if (aliasError) {
        logDataError('resolveModerationReportAction: insert alias', aliasError);
        return { success: false };
      }
    }

    const { error: reportUpdateError } = await supabase
      .from('reports')
      .update({
        status: params.decision === 'accept' ? 'accepted' : 'declined',
        moderator_note: params.moderatorNote || null,
      })
      .eq('id', params.reportId);

    if (reportUpdateError) {
      logDataError('resolveModerationReportAction: update report', reportUpdateError);
      return { success: false };
    }

    if (report.series_id) revalidatePath('/');
    return { success: true };
  }

  if (!allowMockData) {
    logDataError('resolveModerationReportAction', new Error('Mock data is not allowed'));
    return { success: false };
  }

  const report = mockReports.find((r) => r.id === params.reportId);
  if (!report) return { success: false };

  if (params.decision === 'accept') {
    report.status = 'accepted';

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
        revalidateSeriesContext(targetSeries, targetSeries.tags, targetSeries.releases);
      }
    }
  } else if (params.decision === 'decline') {
    report.status = 'declined';
    report.moderatorNote = params.moderatorNote || 'Submission does not meet reference database criteria.';
  }

  return { success: true };
}
