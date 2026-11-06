import { cache } from 'react';
import {
  Series,
  Tag,
  Platform,
  Person,
  SearchResult,
  SearchFilters,
  User,
  Alias,
  Release,
  SearchResultItem,
  MatchedAliasInfo,
  UserReport,
  UserProfileData,
  UserListEntry,
  UserContribution,
  UserPreferences,
  Revision,
  PersonRole,
  SeriesProductionType,
} from './types';
import {
  mockSeriesList,
  mockTags,
  mockPlatforms,
  mockPeople,
  mockUsers,
  mockReports,
  mockUserListEntries,
  mockContributions,
  mockRevisions,
  mockRedirects,
} from './mock';
import { supabasePublic, isSupabaseConfigured, allowMockData } from './supabase-public';
import { parseTitleParam, parsePersonParam } from '@/src/lib/urls';
import { getLanguageName } from '@/src/lib/languages';

export { getLanguageName };

export function logDataError(context: string, error: unknown): void {
  console.error(context, error);
}

function mockDataUnavailable<T>(context: string, emptyResult: T): T {
  logDataError(context, new Error('Supabase is not configured and mock data is not allowed'));
  return emptyResult;
}

/**
 * Normalizes string for multilingual substring search
 */
function normalizeForSearch(str: string): string {
  return str.toLowerCase().trim();
}

/**
 * Extracts snippet with matched substring for highlight rendering
 */
function extractMatchSnippet(
  fullText: string,
  query: string
): { before: string; matched: string; after: string } | undefined {
  if (!fullText || !query) return undefined;

  const lowerText = fullText.toLowerCase();
  const lowerQuery = query.toLowerCase().trim();
  const index = lowerText.indexOf(lowerQuery);

  if (index === -1) return undefined;

  const before = fullText.slice(0, index);
  const matched = fullText.slice(index, index + lowerQuery.length);
  const after = fullText.slice(index + lowerQuery.length);

  return { before, matched, after };
}

/**
 * Validates if a string looks like an intended URL
 */
function isPotentialUrl(str: string): boolean {
  const s = str.trim().toLowerCase();
  return (
    s.startsWith('http://') ||
    s.startsWith('https://') ||
    s.startsWith('www.') ||
    s.includes('.com/') ||
    s.includes('.tv/') ||
    s.includes('youtu.be') ||
    s.includes('youtube.com') ||
    s.includes('reelshort') ||
    s.includes('dramabox') ||
    s.includes('shortmax') ||
    s.includes('kalostv') ||
    s.includes('kalos-tv') ||
    s.includes('goodshort') ||
    s.includes('netshort') ||
    s.includes('flextv') ||
    s.includes('kukufm') ||
    s.includes('pocketsaga') ||
    s.includes('winzogames') ||
    s.includes('tiktok.com')
  );
}

/**
 * Validates standard URL syntax
 */
function isValidUrl(str: string): boolean {
  try {
    const formatted = str.startsWith('http') ? str : `https://${str}`;
    new URL(formatted);
    return true;
  } catch (error) {
      logDataError('repository', error);
    return false;
  }
}

export interface RecentAliasEntry {
  alias: Alias;
  seriesId: number;
  seriesShortId: string;
  seriesSlug: string;
  seriesTitle: string;
  addedAt: string;
  relativeTime: string;
}

export interface BrowseLanguage {
  code: string;
  label: string;
  nativeLabel: string;
  count?: number;
}

export interface HomeFeedData {
  popularThisWeek: Series[];
  recentlyAddedAliases: RecentAliasEntry[];
  browseTags: Tag[];
  browsePlatforms: Platform[];
  browseLanguages: BrowseLanguage[];
}

/**
 * Calculates a clean relative time string
 */
function getRelativeTimeString(dateStr: string): string {
  try {
    const past = new Date(dateStr).getTime();
    const now = Date.now();
    const diffHours = Math.max(1, Math.round((now - past) / (1000 * 60 * 60)));

    if (diffHours < 24) {
      return `${diffHours}h ago`;
    }
    const diffDays = Math.round(diffHours / 24);
    if (diffDays === 1) return '1d ago';
    if (diffDays < 7) return `${diffDays}d ago`;
    const diffWeeks = Math.round(diffDays / 7);
    if (diffWeeks === 1) return '1w ago';
    if (diffWeeks < 5) return `${diffWeeks}w ago`;
    const diffMonths = Math.round(diffDays / 30);
    return `${diffMonths}mo ago`;
  } catch (error) {
      logDataError('repository', error);
    return 'recently';
  }
}

/**
 * Maps database series record to standard Series interface
 */
function mapSeriesRecord(row: any): Series {
  if (!row.short_id) throw new Error('short_id missing in select');

  const aliases: Alias[] = Array.isArray(row.aliases)
    ? row.aliases.map((a: any) => ({
        id: a.id,
        text: a.text,
        language: a.language,
        script: a.script,
        source: a.source_label || a.source_url || 'Community',
        sourceUrl: a.source_url || undefined,
        status: a.status || 'pending',
        addedBy: a.added_by || 'Editor',
        addedAt: a.added_at ? String(a.added_at).split('T')[0] : '2024-01-01',
      }))
    : [];

  const releases: Release[] = Array.isArray(row.releases)
    ? row.releases.map((r: any) => ({
        id: r.id,
        platform: r.platforms?.name || r.platform || r.platform_slug,
        platformSlug: r.platform_slug,
        region: r.region || 'Global',
        dubLanguage: r.dub_language,
        subtitleLanguages: r.subtitle_languages || [],
        episodeCount: r.episode_count,
        releasedYear: r.released_year,
        url: r.url,
        lastChecked: r.last_checked ? String(r.last_checked).split('T')[0] : '',
        linkStatus: r.link_status || 'active',
        isOfficial: Boolean(r.is_official),
        monetizationType: r.monetization_type || null,
        freeEpisodes: r.free_episodes ?? null,
        coinsPerEpisode: r.coins_per_episode ?? null,
        estimatedUnlockCostUsd: r.estimated_unlock_cost_usd != null ? Number(r.estimated_unlock_cost_usd) : null,
        directWatchUrl: r.direct_watch_url || null,
      }))
    : [];

  const tags: Tag[] = Array.isArray(row.series_tags)
    ? row.series_tags.map((st: any) => ({
        slug: st.tags?.slug || st.tag_slug,
        name: st.tags?.name || st.tag_slug,
      }))
    : [];

  const cast: PersonRole[] = Array.isArray(row.series_people)
    ? row.series_people.map((sp: any) => ({
        person: {
          id: Number(sp.people?.id || sp.person_id),
          shortId: (() => {
            if (!sp.people?.short_id) throw new Error('short_id missing in select');
            return sp.people.short_id;
          })(),
          slug: sp.people?.slug || '',
          name: sp.people?.name || '',
          nativeName: sp.people?.native_name,
          role: sp.role_type,
        },
        characterName: sp.character_name,
        roleType: sp.role_type,
      }))
    : [];

  return {
    id: Number(row.id),
    shortId: row.short_id,
    slug: row.slug,
    title: row.title,
    romanizedTitle: row.romanized_title || undefined,
    originalLanguage: row.original_language,
    originCountry: row.origin_country || undefined,
    year: row.year,
    episodeCount: row.episode_count,
    avgEpisodeMinutes: row.avg_episode_minutes || undefined,
    synopsis: row.synopsis || '',
    posterUrl: row.poster_url || undefined,
    updatedAt: row.updated_at ? String(row.updated_at).split('T')[0] : '2024-01-01',
    visibility: row.visibility || 'public',
    productionStatus: row.production_status || 'completed',
    productionType: row.production_type || 'live_action',
    verificationStatus: row.verification_status || 'unverified',
    studioName: row.studio_name || null,
    hasHumanCast: row.has_human_cast ?? true,
    ratingScore: Number(row.rating_score || 0),
    ratingCount: Number(row.rating_count || 0),
    popularity: Number(row.list_count || 0) * 10 + Number(row.rating_count || 0),
    tags,
    aliases,
    releases,
    cast,
  };
}

/**
 * Retrieves the comprehensive datasets required for the Home page
 */
export async function getHomePageFeed(): Promise<HomeFeedData> {

  if (!isSupabaseConfigured && !allowMockData) {
    return mockDataUnavailable('getHomePageFeed', {
      popularThisWeek: [], recentlyAddedAliases: [], browseTags: [], browsePlatforms: [], browseLanguages: [],
    });
  }
  if (isSupabaseConfigured) {
    try {
      // The six homepage queries are independent, so run them in parallel
      // instead of six sequential network round-trips.
      const [
        { data: popularData, error: popError },
        { data: aliasData, error: aliasError },
        { data: tagsData, error: tagsError },
        { data: platformsData, error: platError },
        { data: releaseSlugsData, error: homeRelError },
        { data: languageRows, error: langError },
      ] = await Promise.all([
        supabasePublic
          .from('series')
          .select('id, short_id, slug, title, year, episode_count, poster_url, rating_score, original_language, visibility, list_count, rating_count, production_type, verification_status, studio_name, has_human_cast')
          .eq('visibility', 'public')
          .order('list_count', { ascending: false })
          .limit(6),
        supabasePublic
          .from('aliases')
          .select('text, language, source_url, source_label, status, added_at, series:series_id(id, short_id, slug, title, visibility)')
          .order('added_at', { ascending: false })
          .limit(7),
        supabasePublic
          .from('tags')
          .select('slug, name')
          .limit(8),
        supabasePublic
          .from('platforms')
          .select('slug, name, url, is_official')
          .limit(50),
        // Slugs that actually have releases, for hiding empty platforms
        // from the homepage "Browse by platform" section. Fail-open: on a
        // query error, keep the full platform list.
        supabasePublic.from('releases').select('platform_slug').limit(1000),
        // Real per-language counts over public series. Fail-open: on a query
        // error, counts stay undefined and the language list still renders.
        supabasePublic
          .from('series')
          .select('original_language')
          .eq('visibility', 'public')
          .limit(1000),
      ]);

      const languageCounts: Record<string, number> = {};
      if (langError) {
        logDataError('getHomePageFeed: language counts', langError);
      } else {
        for (const row of languageRows || []) {
          const code = (row as any).original_language || 'en';
          languageCounts[code] = (languageCounts[code] || 0) + 1;
        }
      }
      if (homeRelError)
        logDataError('getHomePageFeed: releases query', homeRelError);

      if (popError) logDataError('getHomePageFeed: popular series query', popError);
      if (aliasError) logDataError('getHomePageFeed: aliases query', aliasError);
      if (tagsError) logDataError('getHomePageFeed: tags query', tagsError);
      if (platError) logDataError('getHomePageFeed: platforms query', platError);
      if (popError || aliasError || tagsError || platError) {
        return {
          popularThisWeek: [],
          recentlyAddedAliases: [],
          browseTags: [],
          browsePlatforms: [],
          browseLanguages: [],
        };
      }

      const popularThisWeek: Series[] = (popularData || []).map((p: any) => {
        if (!p.short_id) throw new Error('short_id missing in select');
        return {
          id: Number(p.id),
          shortId: p.short_id,
        slug: p.slug,
        title: p.title,
        posterUrl: p.poster_url || undefined,
        originalLanguage: p.original_language || 'en',
        year: p.year,
        episodeCount: p.episode_count,
        synopsis: '',
        updatedAt: '2024-01-01',
        visibility: p.visibility,
        productionType: p.production_type || 'live_action',
        verificationStatus: p.verification_status || 'unverified',
        studioName: p.studio_name || null,
        hasHumanCast: p.has_human_cast ?? true,
        ratingScore: Number(p.rating_score || 0),
        ratingCount: p.rating_count || 0,
        tags: [],
        aliases: [],
        releases: [],
          cast: [],
        };
      });

      const recentlyAddedAliases: RecentAliasEntry[] = (aliasData || [])
        .filter((a: any) => a.series && a.series.visibility === 'public')
        .map((a: any) => ({
          alias: {
            text: a.text,
            language: a.language,
            source: a.source_label || a.source_url || 'Community',
            sourceUrl: a.source_url || undefined,
            status: a.status || 'pending',
            addedBy: 'Contributor',
            addedAt: a.added_at ? String(a.added_at).split('T')[0] : '2024-01-01',
          },
          seriesId: Number(a.series.id),
          seriesShortId: (() => {
            if (!a.series.short_id) throw new Error('short_id missing in select');
            return a.series.short_id;
          })(),
          seriesSlug: a.series.slug,
          seriesTitle: a.series.title,
          addedAt: a.added_at ? String(a.added_at).split('T')[0] : '2024-01-01',
          relativeTime: getRelativeTimeString(a.added_at || '2024-01-01'),
        }));

      const allBrowseLanguages: BrowseLanguage[] = [
        { code: 'en', label: 'English', nativeLabel: 'English', count: languageCounts['en'] || undefined },
        { code: 'zh', label: 'Chinese', nativeLabel: '中文', count: languageCounts['zh'] || undefined },
        { code: 'ko', label: 'Korean', nativeLabel: '한국어', count: languageCounts['ko'] || undefined },
        { code: 'es', label: 'Spanish', nativeLabel: 'Español', count: languageCounts['es'] || undefined },
        { code: 'ja', label: 'Japanese', nativeLabel: '日本語', count: languageCounts['ja'] || undefined },
        { code: 'hi', label: 'Hindi', nativeLabel: 'हिन्दी', count: languageCounts['hi'] || undefined },
      ];

      // Only languages with indexed titles get a pill: a pill for a
      // language with no titles leads to an empty search. If the counts
      // query failed, every count is undefined, so keep the full list
      // (fail-open) instead of hiding the whole section.
      const hasKnownCounts = allBrowseLanguages.some(
        (lang) => typeof lang.count === 'number'
      );
      const browseLanguages = hasKnownCounts
        ? allBrowseLanguages.filter((lang) => (lang.count ?? 0) > 0)
        : allBrowseLanguages;

      const platformsWithReleases = homeRelError
        ? null
        : new Set((releaseSlugsData || []).map((r: any) => r.platform_slug));

      return {
        popularThisWeek,
        recentlyAddedAliases,
        browseTags: (tagsData || []) as Tag[],
        browsePlatforms: ((platformsData || []) as Platform[]).filter(
          (p) => !platformsWithReleases || platformsWithReleases.has(p.slug)
        ),
        browseLanguages,
      };
    } catch (error) {
      logDataError('repository', error);
      return {
        popularThisWeek: [],
        recentlyAddedAliases: [],
        browseTags: [],
        browsePlatforms: [],
        browseLanguages: [],
      };
    }
  }

  // Fallback to typed mock data only when NEXT_PUBLIC_SUPABASE_URL is unset
  const sortedPopular = [...mockSeriesList]
    .filter((s) => s.visibility === 'public')
    .sort((a, b) => (b.popularity || 0) - (a.popularity || 0))
    .slice(0, 6);

  const allAliases: RecentAliasEntry[] = [];
  for (const series of mockSeriesList) {
    if (series.visibility !== 'public') continue;
    for (const alias of series.aliases) {
      allAliases.push({
        alias,
        seriesId: series.id,
        seriesShortId: series.shortId,
        seriesSlug: series.slug,
        seriesTitle: series.title,
        addedAt: alias.addedAt,
        relativeTime: getRelativeTimeString(alias.addedAt),
      });
    }
  }

  allAliases.sort(
    (a, b) => new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime()
  );
  const recentAliases = allAliases.slice(0, 7);

  const languageCounts: Record<string, number> = {};
  for (const s of mockSeriesList) {
    if (s.visibility === 'public') {
      languageCounts[s.originalLanguage] = (languageCounts[s.originalLanguage] || 0) + 1;
    }
  }

  const allBrowseLanguages: BrowseLanguage[] = [
    { code: 'en', label: 'English', nativeLabel: 'English', count: languageCounts['en'] || undefined },
    { code: 'zh', label: 'Chinese', nativeLabel: '中文', count: languageCounts['zh'] || undefined },
    { code: 'ko', label: 'Korean', nativeLabel: '한국어', count: languageCounts['ko'] || undefined },
    { code: 'es', label: 'Spanish', nativeLabel: 'Español', count: languageCounts['es'] || undefined },
    { code: 'ja', label: 'Japanese', nativeLabel: '日本語', count: languageCounts['ja'] || undefined },
    { code: 'hi', label: 'Hindi', nativeLabel: 'हिन्दी', count: languageCounts['hi'] || undefined },
  ];

  // Same rule as the live branch: only languages with indexed titles get
  // a pill, so a pill never leads to an empty search.
  const browseLanguages = allBrowseLanguages.filter(
    (lang) => (lang.count ?? 0) > 0
  );

  return {
    popularThisWeek: sortedPopular,
    recentlyAddedAliases: recentAliases,
    browseTags: mockTags.slice(0, 8),
    browsePlatforms: mockPlatforms,
    browseLanguages,
  };
}

export interface MarketMonetizationSplit {
  total: number;
  knownTotal: number;
  coinPerEpisode: number;
  adSupported: number;
  coinPct: number;
  adPct: number;
}

export interface PlatformEpisodeAverage {
  slug: string;
  name: string;
  seriesCount: number;
  avgEpisodes: number;
  medianEpisodes: number;
  minEpisodes: number;
  maxEpisodes: number;
}

export interface TopTrope {
  slug: string;
  name: string;
  seriesCount: number;
  pctOfSeries: number;
}

export interface ProductionFormatRow {
  type: SeriesProductionType;
  label: string;
  seriesCount: number;
  pctOfSeries: number;
  avgEpisodes: number | null;
  avgRuntimeMinutes: number | null;
}

export interface MarketInsights {
  totalSeries: number;
  totalReleases: number;
  platformsWithReleases: number;
  tagsIndexed: number;
  monetization: {
    us: MarketMonetizationSplit;
    india: MarketMonetizationSplit;
    otherReleases: number;
  };
  platformEpisodeAverages: PlatformEpisodeAverage[];
  topTropes: TopTrope[];
  productionFormat: ProductionFormatRow[];
  humanCastSeries: number;
}

// Platform groupings for the US vs India monetization split. Grounded in
// the live catalog: the US set carries the English/US-origin titles and the
// India set carries the Hindi/India-origin titles (Kuku TV and ZO TV are
// Indian services; Pocket Saga's catalogued titles are Hindi/India-origin).
// Platforms outside either set are counted as otherReleases, not forced
// into a market.
const US_MARKET_PLATFORMS = ['reelshort', 'dramabox', 'shortmax', 'goodshort'];
const INDIA_MARKET_PLATFORMS = ['kuku-tv', 'zo-tv', 'pocket-saga'];
const INSIGHT_PLATFORM_ORDER = [
  'reelshort',
  'dramabox',
  'shortmax',
  'kuku-tv',
  'pocket-saga',
  'zo-tv',
];

function emptyMarketInsights(): MarketInsights {
  const emptySplit: MarketMonetizationSplit = {
    total: 0,
    knownTotal: 0,
    coinPerEpisode: 0,
    adSupported: 0,
    coinPct: 0,
    adPct: 0,
  };
  return {
    totalSeries: 0,
    totalReleases: 0,
    platformsWithReleases: 0,
    tagsIndexed: 0,
    monetization: {
      us: { ...emptySplit },
      india: { ...emptySplit },
      otherReleases: 0,
    },
    platformEpisodeAverages: [],
    topTropes: [],
    productionFormat: [],
    humanCastSeries: 0,
  };
}

function mean(values: number[]): number | null {
  if (values.length === 0) return null;
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}

function median(values: number[]): number | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? (sorted[mid - 1] + sorted[mid]) / 2
    : sorted[mid];
}

function round1(value: number): number {
  return Math.round(value * 10) / 10;
}

interface MarketInsightsInput {
  series: {
    episodeCount: number;
    avgEpisodeMinutes: number | null;
    productionType: SeriesProductionType;
    hasHumanCast: boolean;
  }[];
  releases: { platformSlug: string; monetizationType: string | null }[];
  platforms: { slug: string; name: string }[];
  seriesTags: { seriesId: number; tagSlug: string }[];
  tags: { slug: string; name: string }[];
  // Episode counts per platform, joined release -> series with one entry
  // per series per platform.
  platformEpisodes: Record<string, number[]>;
}

function computeMarketInsights(input: MarketInsightsInput): MarketInsights {
  const totalSeries = input.series.length;
  const pct = (count: number): number =>
    totalSeries === 0 ? 0 : round1((count / totalSeries) * 100);

  const splitFor = (platformSlugs: string[]): MarketMonetizationSplit => {
    const rows = input.releases.filter((r) =>
      platformSlugs.includes(r.platformSlug)
    );
    const coinPerEpisode = rows.filter(
      (r) => r.monetizationType === 'coin_per_episode'
    ).length;
    const adSupported = rows.filter(
      (r) =>
        r.monetizationType === 'ad_supported' ||
        r.monetizationType === 'free_with_ads'
    ).length;
    const knownTotal = rows.filter((r) => r.monetizationType != null).length;
    return {
      total: rows.length,
      knownTotal,
      coinPerEpisode,
      adSupported,
      coinPct: knownTotal === 0 ? 0 : round1((coinPerEpisode / knownTotal) * 100),
      adPct: knownTotal === 0 ? 0 : round1((adSupported / knownTotal) * 100),
    };
  };

  const platformBySlug = new Map(input.platforms.map((p) => [p.slug, p.name]));

  const platformEpisodeAverages: PlatformEpisodeAverage[] = [];
  for (const slug of INSIGHT_PLATFORM_ORDER) {
    const episodes = input.platformEpisodes[slug] || [];
    if (episodes.length === 0) continue;
    const avg = mean(episodes);
    const med = median(episodes);
    platformEpisodeAverages.push({
      slug,
      name: platformBySlug.get(slug) || slug,
      seriesCount: episodes.length,
      avgEpisodes: avg == null ? 0 : round1(avg),
      medianEpisodes: med == null ? 0 : round1(med),
      minEpisodes: Math.min(...episodes),
      maxEpisodes: Math.max(...episodes),
    });
  }

  const seriesByTag = new Map<string, Set<number>>();
  for (const row of input.seriesTags) {
    const set = seriesByTag.get(row.tagSlug) || new Set<number>();
    set.add(row.seriesId);
    seriesByTag.set(row.tagSlug, set);
  }
  const tagName = new Map(input.tags.map((t) => [t.slug, t.name]));
  const topTropes: TopTrope[] = [...seriesByTag.entries()]
    .map(([slug, seriesIds]) => ({
      slug,
      name: tagName.get(slug) || slug,
      seriesCount: seriesIds.size,
      pctOfSeries: pct(seriesIds.size),
    }))
    .sort((a, b) => b.seriesCount - a.seriesCount || a.name.localeCompare(b.name))
    .slice(0, 6);

  const formatLabels: { type: SeriesProductionType; label: string }[] = [
    { type: 'live_action', label: 'Live-action' },
    { type: 'ai_assisted', label: 'AI-assisted' },
    { type: 'animation', label: 'Animation' },
    { type: 'hybrid', label: 'Hybrid' },
  ];
  const productionFormat: ProductionFormatRow[] = formatLabels.map(({ type, label }) => {
    const rows = input.series.filter((s) => s.productionType === type);
    const avgEpisodes = mean(rows.map((s) => s.episodeCount));
    const runtimes = rows
      .map((s) => s.avgEpisodeMinutes)
      .filter((v): v is number => v != null);
    const avgRuntime = mean(runtimes);
    return {
      type,
      label,
      seriesCount: rows.length,
      pctOfSeries: pct(rows.length),
      avgEpisodes: avgEpisodes == null ? null : round1(avgEpisodes),
      avgRuntimeMinutes: avgRuntime == null ? null : round1(avgRuntime),
    };
  });

  const marketSlugs = [...US_MARKET_PLATFORMS, ...INDIA_MARKET_PLATFORMS];
  const otherReleases = input.releases.filter(
    (r) => !marketSlugs.includes(r.platformSlug)
  ).length;

  return {
    totalSeries,
    totalReleases: input.releases.length,
    platformsWithReleases: new Set(input.releases.map((r) => r.platformSlug)).size,
    tagsIndexed: seriesByTag.size,
    monetization: {
      us: splitFor(US_MARKET_PLATFORMS),
      india: splitFor(INDIA_MARKET_PLATFORMS),
      otherReleases,
    },
    platformEpisodeAverages,
    topTropes,
    productionFormat,
    humanCastSeries: input.series.filter((s) => s.hasHumanCast).length,
  };
}

/**
 * Market benchmarks computed from the live catalog: monetization split by
 * US vs Indian platforms, per-platform episode averages, top tropes, and
 * production format. No values are invented: a format or model with no
 * titles in the catalog is reported as zero, and percentages are computed
 * over the releases that actually record a monetization type.
 */
export async function getMarketInsights(): Promise<MarketInsights> {
  if (!isSupabaseConfigured && !allowMockData) {
    return mockDataUnavailable('getMarketInsights', emptyMarketInsights());
  }

  if (isSupabaseConfigured) {
    try {
      const [
        { data: seriesData, error: seriesError },
        { data: releaseData, error: releaseError },
        { data: platformData, error: platformError },
        { data: seriesTagData, error: seriesTagError },
        { data: tagData, error: tagError },
      ] = await Promise.all([
        supabasePublic
          .from('series')
          .select('id, episode_count, avg_episode_minutes, production_type, has_human_cast')
          .eq('visibility', 'public')
          .limit(1000),
        supabasePublic
          .from('releases')
          .select('series_id, platform_slug, monetization_type')
          .limit(1000),
        supabasePublic.from('platforms').select('slug, name').limit(50),
        supabasePublic
          .from('series_tags')
          .select('series_id, tag_slug')
          .limit(1000),
        supabasePublic.from('tags').select('slug, name').limit(100),
      ]);

      if (seriesError) logDataError('getMarketInsights: series query', seriesError);
      if (releaseError) logDataError('getMarketInsights: releases query', releaseError);
      if (platformError) logDataError('getMarketInsights: platforms query', platformError);
      if (seriesTagError) logDataError('getMarketInsights: series_tags query', seriesTagError);
      if (tagError) logDataError('getMarketInsights: tags query', tagError);
      if (seriesError || releaseError || platformError || seriesTagError || tagError) {
        return emptyMarketInsights();
      }

      const seriesById = new Map<number, { episodeCount: number }>(
        (seriesData || []).map((s: any) => [
          Number(s.id),
          { episodeCount: Number(s.episode_count || 0) },
        ])
      );
      // Per-platform episode lists, joined release -> series. A series
      // listed twice on one platform counts once.
      const platformEpisodes: Record<string, number[]> = {};
      const seenSeriesByPlatform = new Map<string, Set<number>>();
      for (const r of releaseData || []) {
        const series = seriesById.get(Number((r as any).series_id));
        if (!series) continue;
        const slug = (r as any).platform_slug as string;
        const seen = seenSeriesByPlatform.get(slug) || new Set<number>();
        if (seen.has(Number((r as any).series_id))) continue;
        seen.add(Number((r as any).series_id));
        seenSeriesByPlatform.set(slug, seen);
        (platformEpisodes[slug] = platformEpisodes[slug] || []).push(
          series.episodeCount
        );
      }

      return computeMarketInsights({
        series: (seriesData || []).map((s: any) => ({
          episodeCount: Number(s.episode_count || 0),
          avgEpisodeMinutes:
            s.avg_episode_minutes != null ? Number(s.avg_episode_minutes) : null,
          productionType: (s.production_type || 'live_action') as SeriesProductionType,
          hasHumanCast: s.has_human_cast ?? true,
        })),
        releases: (releaseData || []).map((r: any) => ({
          platformSlug: r.platform_slug as string,
          monetizationType: (r.monetization_type as string | null) || null,
        })),
        platforms: (platformData || []).map((p: any) => ({
          slug: p.slug as string,
          name: p.name as string,
        })),
        seriesTags: (seriesTagData || []).map((st: any) => ({
          seriesId: Number(st.series_id),
          tagSlug: st.tag_slug as string,
        })),
        tags: (tagData || []).map((t: any) => ({
          slug: t.slug as string,
          name: t.name as string,
        })),
        platformEpisodes,
      });
    } catch (error) {
      logDataError('getMarketInsights', error);
      return emptyMarketInsights();
    }
  }

  // Fallback to typed mock data only when NEXT_PUBLIC_SUPABASE_URL is unset.
  const platformEpisodes: Record<string, number[]> = {};
  for (const s of mockSeriesList) {
    if (s.visibility !== 'public') continue;
    for (const r of s.releases) {
      (platformEpisodes[r.platformSlug] = platformEpisodes[r.platformSlug] || []).push(
        s.episodeCount
      );
    }
  }
  return computeMarketInsights({
    series: mockSeriesList
      .filter((s) => s.visibility === 'public')
      .map((s) => ({
        episodeCount: s.episodeCount,
        avgEpisodeMinutes: s.avgEpisodeMinutes ?? null,
        productionType: s.productionType,
        hasHumanCast: s.hasHumanCast,
      })),
    releases: mockSeriesList
      .filter((s) => s.visibility === 'public')
      .flatMap((s) =>
        s.releases.map((r) => ({
          platformSlug: r.platformSlug,
          monetizationType: (r.monetizationType as string | null) || null,
        }))
      ),
    platforms: mockPlatforms.map((p) => ({ slug: p.slug, name: p.name })),
    seriesTags: mockSeriesList
      .filter((s) => s.visibility === 'public')
      .flatMap((s) => s.tags.map((t) => ({ seriesId: s.id, tagSlug: t.slug }))),
    tags: mockTags.map((t) => ({ slug: t.slug, name: t.name })),
    platformEpisodes,
  });
}

/**
 * Full-featured multilingual search supporting query matching across titles,
 * aliases, URL detection, and multi-facet filtering.
 */
export async function searchSeries(params: {
  query?: string;
  filters?: SearchFilters;
  sort?: 'relevance' | 'popularity' | 'newest' | 'rating' | 'title' | string;
  page?: number;
  pageSize?: number;
}): Promise<SearchResult> {

  const {
    query = '',
    filters = {},
    sort = 'relevance',
    page = 1,
    pageSize = 10,
  } = params;

  const clampedPageSize = Math.max(1, Math.min(24, pageSize));
  const safePage = Math.max(1, page);
  const rawQ = query.trim();

  // Reject queries over 100 characters
  if (rawQ.length > 100) {
    return {
      items: [],
      total: 0,
      page: safePage,
      pageSize: clampedPageSize,
      totalPages: 0,
      isUrlSearch: false,
    };
  }

  const q = normalizeForSearch(rawQ);

  if (!isSupabaseConfigured && !allowMockData) {
    return mockDataUnavailable('searchSeries', {
      items: [], total: 0, page: safePage, pageSize: clampedPageSize, totalPages: 0, isUrlSearch: false,
    });
  }

  // Check if query is a URL
  if (q && isPotentialUrl(q)) {
    if (!isValidUrl(rawQ)) {
      return {
        items: [],
        total: 0,
        page: 1,
        pageSize: clampedPageSize,
        totalPages: 0,
        isUrlSearch: true,
        urlLookupResult: {
          type: 'invalid_url',
          url: rawQ,
          errorMessage: 'Invalid URL format. Please provide a complete link starting with https:// or http://',
        },
      };
    }

    const match = await lookupLink(rawQ);
    if (match) {
      return {
        items: [
          {
            series: match.series,
            matchedField: 'title',
          },
        ],
        total: 1,
        page: 1,
        pageSize: clampedPageSize,
        totalPages: 1,
        isUrlSearch: true,
        urlLookupResult: {
          type: 'exact',
          url: rawQ,
          exactMatch: match,
        },
      };
    }

    if (isSupabaseConfigured) {
      return {
        items: [],
        total: 0,
        page: 1,
        pageSize: clampedPageSize,
        totalPages: 0,
        isUrlSearch: true,
        urlLookupResult: {
          type: 'not_found',
          url: rawQ,
        },
      };
    }

    // Try finding candidate matches by platform or slug in URL for mock data
    const possible = mockSeriesList.filter((s) => {
      const slugMatch = rawQ.toLowerCase().includes(s.slug.replace(/-/g, ''));
      const titleMatch = s.title.split(' ').some((w) => w.length > 3 && rawQ.toLowerCase().includes(w.toLowerCase()));
      return slugMatch || titleMatch;
    });

    if (possible.length > 0) {
      return {
        items: possible.map((series) => ({ series })),
        total: possible.length,
        page: 1,
        pageSize: clampedPageSize,
        totalPages: 1,
        isUrlSearch: true,
        urlLookupResult: {
          type: 'candidates',
          url: rawQ,
          possibleMatches: possible,
        },
      };
    }

    return {
      items: [],
      total: 0,
      page: 1,
      pageSize: clampedPageSize,
      totalPages: 0,
      isUrlSearch: true,
      urlLookupResult: {
        type: 'not_found',
        url: rawQ,
      },
    };
  }

  // 1. When Supabase is configured: execute database search, return empty state on error/empty
  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabasePublic.rpc('search_series', {
        p_q: rawQ,
        p_filters: filters,
        p_sort: sort,
        p_page: safePage,
        p_page_size: clampedPageSize,
      });

      if (error) logDataError('repository', error);
      if (error || !data || data.length === 0) {
        return {
          items: [],
          total: 0,
          page: safePage,
          pageSize: clampedPageSize,
          totalPages: 0,
          isUrlSearch: false,
        };
      }

      const total = Number(data[0].total_count || data.length);
      const items: SearchResultItem[] = data.map((row: any) => {
        const series: Series = {
          id: Number(row.id),
          shortId: (() => {
            if (!row.short_id) throw new Error('short_id missing in select');
            return row.short_id;
          })(),
          slug: row.slug,
          title: row.title,
          romanizedTitle: row.romanized_title || undefined,
          originalLanguage: row.original_language,
          year: row.year,
          episodeCount: row.episode_count,
          posterUrl: row.poster_url || undefined,
          synopsis: row.synopsis || '',
          updatedAt: '2024-01-01',
          visibility: 'public',
          productionType: row.production_type || 'live_action',
          verificationStatus: row.verification_status || 'unverified',
          studioName: row.studio_name || null,
          hasHumanCast: row.has_human_cast ?? true,
          ratingScore: Number(row.rating_score || 0),
          ratingCount: Number(row.rating_count || 0),
          popularity: Number(row.list_count || 0) * 10 + Number(row.rating_count || 0),
          tags: [],
          aliases: row.matched_alias_text
            ? [
                {
                  text: row.matched_alias_text,
                  language: row.matched_alias_language || 'zh',
                  source: row.matched_alias_source_url || 'Community',
                  sourceUrl: row.matched_alias_source_url || undefined,
                  status: row.matched_alias_status || 'pending',
                  addedBy: 'Editor',
                  addedAt: '2024-01-01',
                },
              ]
            : [],
          releases: [],
          releaseCount:
            row.release_count != null ? Number(row.release_count) : undefined,
          cast: [],
        };

        const matchedAliasInfo: MatchedAliasInfo | undefined = row.matched_alias_text
          ? {
              alias: {
                text: row.matched_alias_text,
                language: row.matched_alias_language || 'zh',
                source: row.matched_alias_source_url || 'Community',
                sourceUrl: row.matched_alias_source_url || undefined,
                status: row.matched_alias_status || 'pending',
                addedBy: 'Editor',
                addedAt: '2024-01-01',
              },
              matchSnippet: extractMatchSnippet(row.matched_alias_text, rawQ),
              languageName: getLanguageName(row.matched_alias_language || 'zh'),
            }
          : undefined;

        return {
          series,
          matchedField: (row.matched_field as any) || 'title',
          matchedAlias: matchedAliasInfo,
        };
      });

      return {
        items,
        total,
        page: safePage,
        pageSize: clampedPageSize,
        totalPages: Math.max(1, Math.ceil(total / clampedPageSize)),
        isUrlSearch: false,
      };
    } catch (error) {
      logDataError('repository', error);
      return {
        items: [],
        total: 0,
        page: safePage,
        pageSize: clampedPageSize,
        totalPages: 0,
        isUrlSearch: false,
      };
    }
  }

  // 2. Mock mode only when Supabase is unset
  interface RankedItem {
    item: SearchResultItem;
    tier: number;
    exactMatch: boolean;
  }

  const rankedItems: RankedItem[] = [];

  for (const series of mockSeriesList) {
    if (series.visibility !== 'public') continue;

    let isMatch = true;
    let matchedField: SearchResultItem['matchedField'] = undefined;
    let matchedAliasInfo: MatchedAliasInfo | undefined = undefined;
    let tier = 4;
    let exactMatch = false;

    if (q) {
      isMatch = false;

      const lowerTitle = normalizeForSearch(series.title);
      const lowerRom = series.romanizedTitle ? normalizeForSearch(series.romanizedTitle) : '';

      const bestAlias = series.aliases.find((alias) =>
        normalizeForSearch(alias.text).includes(q)
      );

      if (bestAlias) {
        isMatch = true;
        matchedField = 'alias';
        const lowerAlias = normalizeForSearch(bestAlias.text);
        if (lowerAlias === q) {
          tier = 1;
          exactMatch = true;
        } else if (lowerAlias.startsWith(q)) {
          tier = 2;
        } else {
          tier = 3;
        }
        matchedAliasInfo = {
          alias: bestAlias,
          matchSnippet: extractMatchSnippet(bestAlias.text, rawQ),
          languageName: getLanguageName(bestAlias.language),
        };
      } else if (lowerTitle === q) {
        isMatch = true;
        matchedField = 'title';
        tier = 1;
        exactMatch = true;
      } else if (lowerRom && lowerRom === q) {
        isMatch = true;
        matchedField = 'romanized';
        tier = 1;
        exactMatch = true;
      } else if (lowerTitle.startsWith(q)) {
        isMatch = true;
        matchedField = 'title';
        tier = 2;
      } else if (lowerRom && lowerRom.startsWith(q)) {
        isMatch = true;
        matchedField = 'romanized';
        tier = 2;
      } else if (lowerTitle.includes(q)) {
        isMatch = true;
        matchedField = 'title';
        tier = 3;
      } else if (lowerRom && lowerRom.includes(q)) {
        isMatch = true;
        matchedField = 'romanized';
        tier = 3;
      }
    }

    if (!isMatch) continue;

    if (
      filters.platform &&
      !series.releases.some((r) => r.platformSlug === filters.platform)
    ) {
      continue;
    }

    if (
      filters.language &&
      series.originalLanguage !== filters.language &&
      !series.aliases.some((a) => a.language === filters.language)
    ) {
      continue;
    }

    if (filters.tag && !series.tags.some((t) => t.slug === filters.tag)) {
      continue;
    }

    if (filters.year && series.year !== Number(filters.year)) {
      continue;
    }

    if (filters.status) {
      const dramaStatus = series.productionStatus || 'completed';
      if (dramaStatus !== filters.status) {
        continue;
      }
    }

    if (filters.episodeRange) {
      if (filters.episodeRange === '<50' && series.episodeCount >= 50) {
        continue;
      }
      if (
        filters.episodeRange === '50-80' &&
        (series.episodeCount < 50 || series.episodeCount > 80)
      ) {
        continue;
      }
      if (filters.episodeRange === '80+' && series.episodeCount < 80) {
        continue;
      }
    }

    rankedItems.push({
      item: {
        series,
        matchedAlias: matchedAliasInfo,
        matchedField: matchedField || 'title',
      },
      tier,
      exactMatch,
    });
  }

  rankedItems.sort((a, b) => {
    switch (sort) {
      case 'popularity':
        return (b.item.series.popularity || 0) - (a.item.series.popularity || 0);
      case 'newest':
        return (
          new Date(b.item.series.updatedAt).getTime() -
          new Date(a.item.series.updatedAt).getTime()
        );
      case 'rating':
        return b.item.series.ratingScore - a.item.series.ratingScore;
      case 'title':
        return a.item.series.title.localeCompare(b.item.series.title);
      case 'relevance':
      default:
        if (a.tier !== b.tier) return a.tier - b.tier;
        return (b.item.series.popularity || 0) - (a.item.series.popularity || 0);
    }
  });

  const total = rankedItems.length;
  const startIndex = (safePage - 1) * clampedPageSize;
  const paginated = rankedItems.slice(startIndex, startIndex + clampedPageSize).map((r) => r.item);

  return {
    items: paginated,
    total,
    page: safePage,
    pageSize: clampedPageSize,
    totalPages: Math.max(1, Math.ceil(total / clampedPageSize)),
    isUrlSearch: false,
  };
}

/**
 * Gets a single series by numeric ID or 5-char shortId
 */
async function getSeriesByIdUncached(idOrShortId: number | string): Promise<Series | null> {

  const isNumeric = typeof idOrShortId === 'number' || /^\d+$/.test(String(idOrShortId));
  const shortId = typeof idOrShortId === 'string' ? parseTitleParam(idOrShortId) || idOrShortId : null;

  if (!isSupabaseConfigured && !allowMockData) return mockDataUnavailable('getSeriesById', null);

  if (isSupabaseConfigured) {
    try {
      let query = supabasePublic
        .from('series')
        .select(`
          id, short_id, slug, title, romanized_title, original_language, origin_country,
          year, episode_count, avg_episode_minutes, synopsis, poster_url,
          production_status, production_type, verification_status, studio_name, has_human_cast, visibility, rating_score, rating_count, list_count, updated_at,
          aliases(id, text, language, script, source_url, source_label, status, added_by, added_at),
          releases(id, platform_slug, region, dub_language, subtitle_languages, episode_count, url, released_year, last_checked, link_status, is_official, monetization_type, free_episodes, coins_per_episode, estimated_unlock_cost_usd, direct_watch_url, platforms(name)),
          series_tags(tag_slug, tags(slug, name)),
          series_people(role_type, character_name, people(id, short_id, slug, name, native_name))
        `);

      if (shortId && !isNumeric) {
        query = query.eq('short_id', shortId);
      } else {
        query = query.eq('id', Number(idOrShortId));
      }

      const { data, error } = await query.single();

      if (error) logDataError('repository', error);
      if (error || !data || data.visibility === 'removed') {
        return null;
      }
      return mapSeriesRecord(data);
    } catch (error) {
      logDataError('repository', error);
      return null;
    }
  }

  const lookupStr = String(idOrShortId).toLowerCase();
  const series = mockSeriesList.find(
    (s) =>
      s.shortId.toLowerCase() === lookupStr ||
      (shortId && s.shortId.toLowerCase() === shortId.toLowerCase()) ||
      (isNumeric && s.id === Number(idOrShortId))
  );
  if (!series || series.visibility === 'removed') return null;
  return series;
}

// Cached per request: generateMetadata and the page component share
// one database fetch instead of running every query twice.
export const getSeriesById = cache(getSeriesByIdUncached);

/**
 * Gets related series based on shared tags
 */
export async function getRelatedSeries(
  id: number,
  limit: number = 4,
  existingTags?: Tag[]
): Promise<Series[]> {

  if (!isSupabaseConfigured && !allowMockData) return mockDataUnavailable('getRelatedSeries', []);
  // Callers that already fetched the series (e.g. the title page) pass its
  // tags so this function does not call getSeriesById(id) a second time.
  const tagSlugs = existingTags
    ? existingTags.map((t) => t.slug)
    : (await getSeriesById(id))?.tags.map((t) => t.slug) ?? [];
  if (tagSlugs.length === 0) return [];

  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabasePublic
        .from('series_tags')
        .select('series:series_id(id, short_id, slug, title, year, episode_count, poster_url, visibility, list_count, rating_score, rating_count, updated_at, production_type, verification_status, studio_name, has_human_cast)')
        .in('tag_slug', tagSlugs)
        .neq('series_id', id)
        .limit(limit);

      if (error) logDataError('repository', error);
      if (error || !data) return [];
      // One row per shared tag: a drama sharing 2 tags with the current
      // drama would otherwise be returned (and rendered) twice.
      const seenIds = new Set<number>();
      const unique = data
        .map((d: any) => d.series)
        .filter((s: any) => s && s.visibility === 'public')
        .filter((s: any) => {
          if (seenIds.has(s.id)) return false;
          seenIds.add(s.id);
          return true;
        });
      return unique.map((s: any) => mapSeriesRecord(s));
    } catch (error) {
      logDataError('repository', error);
      return [];
    }
  }

  const currentTagSlugs = new Set(tagSlugs);
  const others = mockSeriesList.filter(
    (s) => s.id !== id && s.visibility === 'public'
  );
  others.sort((a, b) => {
    const aMatch = a.tags.filter((t) => currentTagSlugs.has(t.slug)).length;
    const bMatch = b.tags.filter((t) => currentTagSlugs.has(t.slug)).length;
    return bMatch - aMatch;
  });

  return others.slice(0, limit);
}

/**
 * Looks up if an external URL or watch link is already registered
 */
export async function lookupLink(
  url: string
): Promise<{ series: Series; release: Release } | null> {

  if (!isSupabaseConfigured && !allowMockData) return mockDataUnavailable('lookupLink', null);
  const cleanUrl = url.trim().toLowerCase();

  if (isSupabaseConfigured) {
    try {
      const selectClause = `
          id, platform_slug, region, dub_language, subtitle_languages, episode_count, url, released_year, last_checked, link_status, is_official, monetization_type, free_episodes, coins_per_episode, estimated_unlock_cost_usd, direct_watch_url, platforms(name),
          series:series_id(
            id, short_id, slug, title, romanized_title, original_language, origin_country,
            year, episode_count, avg_episode_minutes, synopsis, poster_url,
            production_status, production_type, verification_status, studio_name, has_human_cast, visibility, rating_score, rating_count, list_count, updated_at,
            aliases(id, text, language, script, source_url, source_label, status, added_by, added_at),
            releases(id, platform_slug, region, dub_language, subtitle_languages, episode_count, url, released_year, last_checked, link_status, is_official, monetization_type, free_episodes, coins_per_episode, estimated_unlock_cost_usd, direct_watch_url, platforms(name)),
            series_tags(tag_slug, tags(slug, name)),
            series_people(role_type, character_name, people(id, short_id, slug, name, native_name))
          )
        `;
      // Match against BOTH url and direct_watch_url: a pasted link may be
      // either column. Two queries avoid PostgREST .or() parsing issues
      // with commas inside pasted URLs.
      const runLookup = (column: 'url' | 'direct_watch_url') =>
        supabasePublic
          .from('releases')
          .select(selectClause)
          .ilike(column, `%${cleanUrl}%`)
          .limit(1)
          .single();
      let { data, error } = await runLookup('url');
      if (error || !data) {
        ({ data, error } = await runLookup('direct_watch_url'));
      }

      const rawSeries: any = (data as any)?.series;
      const seriesObj = Array.isArray(rawSeries) ? rawSeries[0] : rawSeries;
      if (error) logDataError('repository', error);
      if (error || !data || !seriesObj || seriesObj.visibility === 'removed') {
        return null;
      }

      const series = mapSeriesRecord(seriesObj);
      const releaseData = data as any;
      const release: Release = {
        id: releaseData.id,
        platform: releaseData.platforms?.name || releaseData.platform_slug,
        platformSlug: releaseData.platform_slug,
        region: releaseData.region || 'Global',
        dubLanguage: releaseData.dub_language,
        subtitleLanguages: releaseData.subtitle_languages || [],
        episodeCount: releaseData.episode_count,
        releasedYear: releaseData.released_year,
        url: releaseData.url,
        lastChecked: releaseData.last_checked ? String(releaseData.last_checked).split('T')[0] : '',
        linkStatus: releaseData.link_status || 'active',
        isOfficial: Boolean(releaseData.is_official),
        monetizationType: releaseData.monetization_type || null,
        freeEpisodes: releaseData.free_episodes ?? null,
        coinsPerEpisode: releaseData.coins_per_episode ?? null,
        estimatedUnlockCostUsd: releaseData.estimated_unlock_cost_usd != null ? Number(releaseData.estimated_unlock_cost_usd) : null,
        directWatchUrl: releaseData.direct_watch_url || null,
      };

      return { series, release };
    } catch (error) {
      logDataError('repository', error);
      return null;
    }
  }

  for (const series of mockSeriesList) {
    if (series.visibility === 'removed') continue;
    for (const release of series.releases) {
      const relUrl = release.url.toLowerCase();
      if (
        relUrl === cleanUrl ||
        cleanUrl.includes(relUrl) ||
        relUrl.includes(cleanUrl)
      ) {
        return { series, release };
      }
    }
  }
  return null;
}

/**
 * Gets tag metadata and associated series count
 */
export async function getTag(
  slug: string
): Promise<{ tag: Tag; series: Series[] } | null> {

  if (!isSupabaseConfigured && !allowMockData) return mockDataUnavailable('getTag', null);
  if (isSupabaseConfigured) {
    try {
      const { data: tagData, error: tagError } = await supabasePublic
        .from('tags')
        .select('slug, name')
        .eq('slug', slug)
        .single();

      if (tagError) logDataError('repository', tagError);
      if (tagError || !tagData) return null;

      const { data: seriesData } = await supabasePublic
        .from('series_tags')
        .select('series:series_id(id, short_id, slug, title, year, episode_count, poster_url, visibility, list_count, rating_score, rating_count, updated_at, production_type, verification_status, studio_name, has_human_cast)')
        .eq('tag_slug', slug);

      const series = (seriesData || [])
        .map((d: any) => d.series)
        .filter((s: any) => s && s.visibility === 'public')
        .map((s: any) => mapSeriesRecord(s));

      return {
        tag: { slug: tagData.slug, name: tagData.name, count: series.length },
        series,
      };
    } catch (error) {
      logDataError('repository', error);
      return null;
    }
  }

  const tag = mockTags.find((t) => t.slug === slug);
  if (!tag) return null;

  const series = mockSeriesList.filter(
    (s) => s.visibility === 'public' && s.tags.some((t) => t.slug === slug)
  );
  return { tag: { ...tag, count: series.length }, series };
}

/**
 * Gets platform metadata and associated releases
 */
export async function getPlatform(
  slug: string
): Promise<{ platform: Platform; series: Series[] } | null> {

  if (!isSupabaseConfigured && !allowMockData) return mockDataUnavailable('getPlatform', null);
  if (isSupabaseConfigured) {
    try {
      const { data: platData, error: platError } = await supabasePublic
        .from('platforms')
        .select('slug, name, url, is_official, icon')
        .eq('slug', slug)
        .single();

      if (platError) logDataError('repository', platError);
      if (platError || !platData) return null;

      const { data: releaseData } = await supabasePublic
        .from('releases')
        .select('series:series_id(id, short_id, slug, title, year, episode_count, poster_url, visibility, list_count, rating_score, rating_count, updated_at, production_type, verification_status, studio_name, has_human_cast)')
        .eq('platform_slug', slug);

      const series = (releaseData || [])
        .map((d: any) => d.series)
        .filter((s: any) => s && s.visibility === 'public')
        .map((s: any) => mapSeriesRecord(s));

      return {
        platform: {
          slug: platData.slug,
          name: platData.name,
          url: platData.url,
          official: platData.is_official,
          icon: platData.icon,
        },
        series,
      };
    } catch (error) {
      logDataError('repository', error);
      return null;
    }
  }

  const platform = mockPlatforms.find((p) => p.slug === slug);
  if (!platform) return null;

  const series = mockSeriesList.filter(
    (s) => s.visibility === 'public' && s.releases.some((r) => r.platformSlug === slug)
  );
  return { platform, series };
}

/**
 * Resolves active session profile - in mock mode the session is always signed out (returns null)
 */
export async function getSession(): Promise<User | null> {
  return null;
}

/**
 * Gets all series for catalog indexing and sitemaps (selecting only id, slug, updated_at, visibility, synopsis)
 */
export async function getAllSeries(): Promise<Series[]> {
  if (isSupabaseConfigured) {
    try {
      const rows: any[] = [];
      const batchSize = 1000;
      const maxRows = 50000;

      for (let from = 0; from < maxRows; from += batchSize) {
        const to = Math.min(from + batchSize - 1, maxRows - 1);
        const { data, error } = await supabasePublic
          .from('series')
          .select('id, short_id, slug, title, updated_at, visibility, synopsis, production_type, verification_status, studio_name, has_human_cast, original_language, year, episode_count')
          .eq('visibility', 'public')
          .range(from, to);

        if (error) {
          logDataError('getAllSeries: series query', error);
          return [];
        }
        if (!data) return [];

        rows.push(...data);
        if (data.length < batchSize) break;
      }

      return rows.map((s: any) => {
        if (!s.short_id) throw new Error('short_id missing in select');
        return {
          id: Number(s.id),
          shortId: s.short_id,
          slug: s.slug,
          title: s.title,
          originalLanguage: s.original_language || 'en',
          year: s.year,
          episodeCount: s.episode_count,
          synopsis: s.synopsis || '',
          updatedAt: s.updated_at ? String(s.updated_at).split('T')[0] : '2024-01-01',
          visibility: s.visibility,
          productionType: s.production_type || 'live_action',
          verificationStatus: s.verification_status || 'unverified',
          studioName: s.studio_name || null,
          hasHumanCast: s.has_human_cast ?? true,
          ratingScore: 0,
          ratingCount: 0,
          tags: [],
          aliases: [],
          releases: [],
          cast: [],
        };
      });
    } catch (error) {
      logDataError('getAllSeries', error);
      return [];
    }
  }

  if (!allowMockData) return mockDataUnavailable('getAllSeries', []);
  return mockSeriesList.filter((s) => s.visibility === 'public');
}

export async function getAllPeople(): Promise<Person[]> {
  if (isSupabaseConfigured) {
    try {
      const rows: any[] = [];
      const batchSize = 1000;
      const maxRows = 50000;

      for (let from = 0; from < maxRows; from += batchSize) {
        const to = Math.min(from + batchSize - 1, maxRows - 1);
        const { data, error } = await supabasePublic
          .from('people')
          .select('id, short_id, slug, name, native_name')
          .range(from, to);

        if (error) {
          logDataError('getAllPeople: people query', error);
          return [];
        }
        if (!data) return [];

        rows.push(...data);
        if (data.length < batchSize) break;
      }

      return rows.map((p: any) => {
        if (!p.short_id) throw new Error('short_id missing in select');
        return {
          id: Number(p.id),
          shortId: p.short_id,
          slug: p.slug,
          name: p.name,
          nativeName: p.native_name,
          role: 'actor',
        };
      });
    } catch (error) {
      logDataError('getAllPeople', error);
      return [];
    }
  }

  if (!allowMockData) return mockDataUnavailable('getAllPeople', []);
  return mockPeople.filter((p) =>
    mockSeriesList.some(
      (s) => s.visibility === 'public' && s.cast.some((c) => c.person.id === p.id)
    )
  );
}


/**
 * Gets all available platforms for search filter options
 */
export async function getAllPlatforms(): Promise<Platform[]> {

  if (!isSupabaseConfigured && !allowMockData) return mockDataUnavailable('getAllPlatforms', []);
  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabasePublic
        .from('platforms')
        .select('slug, name, url, is_official, icon');

      if (error) logDataError('repository', error);
      if (error || !data) return [];

      // Hide platforms with no releases from public filters/navigation
      // (and from the sitemap, which also uses this list). On a releases
      // query failure, fall back to the full list rather than hiding all.
      const { data: releaseRows, error: relError } = await supabasePublic
        .from('releases')
        .select('platform_slug')
        .limit(1000);
      if (relError) {
        logDataError('repository', relError);
      }
      const platformsWithReleases = relError
        ? null
        : new Set((releaseRows || []).map((r: any) => r.platform_slug));

      return data
        .filter(
          (p: any) => !platformsWithReleases || platformsWithReleases.has(p.slug)
        )
        .map((p: any) => ({
          slug: p.slug,
          name: p.name,
          url: p.url,
          official: p.is_official,
          icon: p.icon,
        }));
    } catch (error) {
      logDataError('repository', error);
      return [];
    }
  }
  return mockPlatforms;
}

/**
 * Gets all available tags for search filter options
 */
export async function getAllTags(): Promise<Tag[]> {

  if (!isSupabaseConfigured && !allowMockData) return mockDataUnavailable('getAllTags', []);
  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabasePublic
        .from('tags')
        .select('slug, name');

      if (error) logDataError('repository', error);
      if (error || !data) return [];

      return data.map((t: any) => ({
        slug: t.slug,
        name: t.name,
      }));
    } catch (error) {
      logDataError('repository', error);
      return [];
    }
  }
  return mockTags;
}

// Native labels for the languages the catalog actually carries; unknown
// codes fall back to their English name.
const LANGUAGE_NATIVE_LABELS: Record<string, string> = {
  en: 'English',
  zh: '中文',
  ko: '한국어',
  es: 'Español',
  ja: '日本語',
  hi: 'हिन्दी',
};

function toBrowseLanguages(counts: Record<string, number>): BrowseLanguage[] {
  return Object.entries(counts)
    .filter(([, count]) => count > 0)
    .sort((a, b) => b[1] - a[1])
    .map(([code, count]) => ({
      code,
      label: getLanguageName(code),
      nativeLabel: LANGUAGE_NATIVE_LABELS[code] ?? getLanguageName(code),
      count,
    }));
}

/**
 * Languages present in the public catalog, with title counts. The search
 * filters derive their language options from this, so users are never
 * offered a language with no titles to show.
 */
export async function getCatalogLanguages(): Promise<BrowseLanguage[]> {
  if (!isSupabaseConfigured && !allowMockData) return mockDataUnavailable('getCatalogLanguages', []);
  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabasePublic
        .from('series')
        .select('original_language')
        .eq('visibility', 'public')
        .limit(1000);

      if (error) logDataError('repository', error);
      if (error || !data) return [];

      const counts: Record<string, number> = {};
      for (const row of data as any[]) {
        const code = row.original_language || 'en';
        counts[code] = (counts[code] || 0) + 1;
      }
      return toBrowseLanguages(counts);
    } catch (error) {
      logDataError('repository', error);
      return [];
    }
  }

  const counts: Record<string, number> = {};
  for (const s of mockSeriesList) {
    if (s.visibility === 'public') {
      counts[s.originalLanguage] = (counts[s.originalLanguage] || 0) + 1;
    }
  }
  return toBrowseLanguages(counts);
}

/**
 * Gets all reports submitted by the current user
 */
export async function getUserReports(): Promise<UserReport[]> {

  if (!isSupabaseConfigured && !allowMockData) return mockDataUnavailable('getUserReports', []);
  if (isSupabaseConfigured) {
    return [];
  }
  return mockReports;
}

/**
 * Retrieves a user's public profile data, list entries, ratings, contributions, and reports
 */
export async function getUserProfileData(
  handleOrName: string
): Promise<UserProfileData | null> {
  const clean = handleOrName.toLowerCase().replace(/^@/, '');

  if (isSupabaseConfigured) {
    try {
      const { data: profile, error } = await supabasePublic
        .from('profiles')
        .select('id, handle, display_name, role, avatar_url, joined_at')
        .eq('handle', clean)
        .single();

      if (error) logDataError('repository', error);
      if (error || !profile) return null;

      const user: User = {
        id: profile.id,
        handle: profile.handle,
        name: profile.display_name || profile.handle,
        role: (profile.role as any) || 'reader',
        joinedAt: profile.joined_at ? String(profile.joined_at).split('T')[0] : '2024-01-01',
      };

      const { data: entryRows, error: entryError } = await supabasePublic
        .from('list_entries')
        .select('status, score, episodes_watched, updated_at, series:series_id(id, short_id, slug, title, year, episode_count, poster_url, original_language, visibility, production_type, verification_status, studio_name, has_human_cast, rating_score, rating_count)')
        .eq('user_id', profile.id)
        .order('updated_at', { ascending: false });
      if (entryError) logDataError('getUserProfileData: list_entries', entryError);

      const listEntries = (entryRows || [])
        .map((e: any) => {
          const raw = e.series;
          const row = Array.isArray(raw) ? raw[0] : raw;
          if (!row) return null;
          const series: Series = {
            id: Number(row.id),
            shortId: row.short_id,
            slug: row.slug,
            title: row.title,
            posterUrl: row.poster_url || undefined,
            originalLanguage: row.original_language || 'en',
            year: row.year,
            episodeCount: row.episode_count,
            synopsis: '',
            updatedAt: '2024-01-01',
            visibility: row.visibility,
            productionType: row.production_type || 'live_action',
            verificationStatus: row.verification_status || 'unverified',
            studioName: row.studio_name || null,
            hasHumanCast: row.has_human_cast ?? true,
            ratingScore: Number(row.rating_score || 0),
            ratingCount: row.rating_count || 0,
            tags: [],
            aliases: [],
            releases: [],
            cast: [],
          };
          return {
            userId: profile.id,
            seriesId: Number(row.id),
            status: e.status,
            score: e.score ?? undefined,
            episodesWatched: e.episodes_watched ?? 0,
            updatedAt: e.updated_at ? String(e.updated_at).split('T')[0] : '2024-01-01',
            series,
          };
        })
        .filter(Boolean) as (UserListEntry & { series: Series })[];

      const { data: aliasRows, error: aliasError } = await supabasePublic
        .from('aliases')
        .select('id, text, language, status, added_at, series:series_id(id, short_id, slug, title)')
        .eq('added_by', profile.id)
        .order('added_at', { ascending: false });
      if (aliasError) logDataError('getUserProfileData: aliases', aliasError);

      const contributions: UserContribution[] = (aliasRows || [])
        .map((a: any) => {
          const raw = a.series;
          const row = Array.isArray(raw) ? raw[0] : raw;
          if (!row) return null;
          return {
            id: String(a.id),
            userId: profile.id,
            seriesId: Number(row.id),
            seriesShortId: row.short_id,
            seriesSlug: row.slug,
            seriesTitle: row.title,
            type: 'alias' as const,
            description: a.text,
            date: a.added_at ? String(a.added_at).split('T')[0] : '2024-01-01',
            status: a.status || 'pending',
          };
        })
        .filter(Boolean) as UserContribution[];

      const { data: reportRows, error: reportError } = await supabasePublic
        .from('reports')
        .select('*, series:series_id(title, slug, short_id)')
        .eq('submitted_by', profile.id)
        .order('created_at', { ascending: false });
      if (reportError) logDataError('getUserProfileData: reports', reportError);
      const reports: UserReport[] = (reportRows || []).map(mapReportRecord);

      return {
        user,
        titlesListedCount: listEntries.length,
        namesAddedCount: contributions.length,
        reportsAcceptedCount: reports.filter((r) => r.status === 'accepted').length,
        listEntries,
        ratings: listEntries.filter((e) => typeof e.score === 'number'),
        contributions,
        reports,
      };
    } catch (error) {
      logDataError('repository', error);
      return null;
    }
  }

  if (!allowMockData) return mockDataUnavailable('getUserProfileData', null);

  const user = mockUsers.find(
    (u) =>
      u.handle.toLowerCase() === clean ||
      u.name.toLowerCase().replace(/\s+/g, '-') === clean ||
      u.name.toLowerCase() === clean
  );

  if (!user) return null;

  const userEntries = mockUserListEntries.filter((e) => e.userId === user.id);
  const enrichedEntries = userEntries
    .map((e) => {
      const series = mockSeriesList.find((s) => s.id === e.seriesId);
      if (!series) return null;
      return { ...e, series };
    })
    .filter(Boolean) as (typeof mockUserListEntries[0] & { series: (typeof mockSeriesList)[0] })[];

  const ratings = enrichedEntries.filter((e) => typeof e.score === 'number');
  const userContributions = mockContributions.filter((c) => c.userId === user.id);
  const userReportsList = mockReports.filter((r) => r.submittedBy === user.id);

  const reportsAcceptedCount = userReportsList.filter((r) => r.status === 'accepted').length;

  return {
    user,
    titlesListedCount: enrichedEntries.length,
    namesAddedCount: userContributions.filter((c) => c.type === 'alias').length,
    reportsAcceptedCount,
    listEntries: enrichedEntries,
    ratings,
    contributions: userContributions,
    reports: userReportsList,
  };
}

/**
 * Gets user preferences from defaults
 */
export async function getUserPreferences(): Promise<UserPreferences> {
  return {
    titleLanguage: 'english',
    defaultRegion: 'any',
    theme: 'system',
  };
}

/**
 * Gets revision history for a series
 */
export async function getSeriesRevisions(seriesId: number): Promise<Revision[]> {

  if (!isSupabaseConfigured && !allowMockData) return mockDataUnavailable('getSeriesRevisions', []);
  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabasePublic
        .from('revisions')
        .select('id, series_id, summary, diffs, submitted_by, created_at, reverted, profiles:submitted_by(handle, display_name, role)')
        .eq('series_id', seriesId)
        .order('created_at', { ascending: false });

      if (error) logDataError('repository', error);
      if (error || !data || data.length === 0) {
        return [];
      }

      return data.map((r: any) => {
        const rawProfile = r.profiles;
        const profile = Array.isArray(rawProfile) ? rawProfile[0] : rawProfile;
        return {
          id: String(r.id),
          seriesId: Number(r.series_id),
          summary: r.summary || 'Metadata edit',
          diffs: Array.isArray(r.diffs) ? r.diffs : [],
          submittedBy: r.submitted_by || 'usr_unknown',
          submittedByName: profile?.display_name || profile?.handle || 'Contributor',
          submittedByRole: profile?.role || 'editor',
          submittedAt: r.created_at ? String(r.created_at).split('T')[0] : '2024-01-01',
          reverted: Boolean(r.reverted),
        };
      });
    } catch (error) {
      logDataError('repository', error);
      return [];
    }
  }

  const revs = mockRevisions.filter((r) => r.seriesId === seriesId);
  if (revs.length === 0) {
    return [
      {
        id: `rev_${seriesId}_base`,
        seriesId,
        summary: 'Initial short drama database catalog entry created',
        diffs: [
          {
            field: 'status',
            label: 'Status',
            oldValue: '(empty)',
            newValue: 'Published',
          },
        ],
        submittedBy: 'usr_mod_03',
        submittedByName: 'Sarah Sterling',
        submittedByRole: 'moderator',
        submittedAt: '2024-01-10',
      },
    ];
  }
  return revs;
}

const REPORT_TYPE_NAMES: Record<string, string> = {
  another_name: 'Another name',
  wrong_name: 'Wrong name',
  same_drama: 'Same drama',
  not_same_drama: 'Not same drama',
  wrong_details: 'Wrong details',
  broken_link: 'Broken link',
  other: 'Other',
};

/**
 * Maps a public.reports row to the app's UserReport shape using the real
 * columns (type, submitted_by, data jsonb) — not legacy column names.
 */
function mapReportRecord(r: any): UserReport {
  const rawSeries = r.series;
  const seriesRow = Array.isArray(rawSeries) ? rawSeries[0] : rawSeries;
  return {
    id: String(r.id),
    type: (r.type as UserReport['type']) || 'wrong_details',
    typeName: REPORT_TYPE_NAMES[r.type] || 'Report',
    seriesId: Number(r.series_id),
    seriesTitle: seriesRow?.title || r.data?.title || r.data?.name || 'Drama',
    seriesSlug: seriesRow?.slug || undefined,
    seriesShortId: seriesRow?.short_id || undefined,
    status: r.status || 'open',
    submittedBy: r.submitted_by || 'usr_anon',
    submittedAt: r.created_at ? String(r.created_at).split('T')[0] : '2024-01-01',
    moderatorNote: r.moderator_note,
    data: {
      title: r.data?.title,
      name: r.data?.name,
      url: r.data?.url,
      note: r.data?.note,
    },
  };
}

/**
 * Gets all pending/open moderation reports for the mod queue
 */
export async function getAllModerationReports(): Promise<UserReport[]> {

  if (!isSupabaseConfigured && !allowMockData) return mockDataUnavailable('getAllModerationReports', []);
  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabasePublic
        .from('reports')
        .select('*, series:series_id(title, slug, short_id)')
        .eq('status', 'open')
        .order('created_at', { ascending: false });

      if (error) logDataError('repository', error);
      if (error || !data) return [];

      return data.map(mapReportRecord);
    } catch (error) {
      logDataError('repository', error);
      return [];
    }
  }

  return mockReports;
}

/**
 * Checks if a title ID or shortId has been merged/redirected
 */
export async function checkRedirect(fromIdOrShortId: number | string): Promise<number | string | null> {
  if (!isSupabaseConfigured && !allowMockData) return mockDataUnavailable('checkRedirect', null);

  const isNumeric = typeof fromIdOrShortId === 'number' || /^\d+$/.test(String(fromIdOrShortId));

  if (isSupabaseConfigured) {
    if (isNumeric) {
      try {
        const { data, error } = await supabasePublic
          .from('redirects')
          .select('to_id')
          .eq('from_id', Number(fromIdOrShortId))
          .single();

        if (error) {
          logDataError('checkRedirect: numeric redirect query', error);
          return null;
        }
        if (!data) return null;
        return Number(data.to_id);
      } catch (error) {
        logDataError('checkRedirect: numeric redirect query', error);
        return null;
      }
    }

    try {
      const { data, error } = await supabasePublic.rpc('resolve_title_redirect', {
        p_short_id: String(fromIdOrShortId),
      });

      if (error) {
        logDataError('checkRedirect: resolve_title_redirect RPC', error);
        return null;
      }
      if (data == null) return null;

      const value = Array.isArray(data) ? data[0] : data;
      const toId =
        typeof value === 'object' && value !== null
          ? (value.to_id ?? value.resolve_title_redirect)
          : value;

      return toId == null ? null : Number(toId);
    } catch (error) {
      logDataError('checkRedirect: resolve_title_redirect RPC', error);
      return null;
    }
  }

  const lookupStr = String(fromIdOrShortId).toLowerCase();
  const sourceSeries = mockSeriesList.find(
    (s) => s.shortId.toLowerCase() === lookupStr || (isNumeric && s.id === Number(fromIdOrShortId))
  );

  const fromId = sourceSeries ? sourceSeries.id : (isNumeric ? Number(fromIdOrShortId) : null);
  if (!fromId) return null;

  const match = mockRedirects.find((r) => r.fromId === fromId);
  return match ? match.toId : null;
}

const PLATFORM_DESCRIPTIONS: Record<string, string> = {
  'reelshort':
    'ReelShort is a leading short drama streaming service focusing on romantic sagas, CEO melodramas, and urban fantasy series with multi-language subtitle tracks.',
  'dramabox':
    'DramaBox specializes in fast-paced episodic thrillers, revenge narratives, and second-chance family dramas designed specifically for mobile viewing.',
  'shortmax':
    'ShortMax hosts an expansive international catalog of short dramas with high-frequency episodic releases and localized dubs.',
  'kalos-tv':
    'Kalos TV is a short drama streaming service featuring romantic sagas, CEO melodramas, and international releases with localized subtitles.',
  'goodshort':
    'GoodShort is a short drama streaming service featuring romantic sagas, revenge narratives, and mobile-first episodic series.',
  'netshort':
    'NetShort is a short drama streaming service featuring international short dramas with localized subtitles and dubs.',
  'flextv':
    'FlexTV is a short drama streaming service featuring romantic sagas, urban fantasy, and high-frequency episodic releases.',
  'youtube':
    'Official and publisher-licensed YouTube channel releases for short drama series, pilot episodes, and complete compilation playlists.',
  'kuku-tv':
    'Kuku TV is the Hindi vertical-drama arm of Kuku FM, publishing Hindi-language short dramas and micro-series on YouTube, including full-episode compilations.',
  'pocket-saga':
    'Pocket Saga is Pocket FM\'s vertical-drama brand, publishing English short dramas as YouTube playlist series with short episodes and big drama.',
  'zo-tv':
    'ZO TV by WinZO publishes Hindi single-episode short dramas on YouTube, covering romance, revenge, and family stories.',
};

const TAG_DESCRIPTIONS: Record<string, string> = {
  'ceo-romance':
    'High-stakes boardroom power dynamics, hidden billionaire identities, and unexpected contractual commitments between corporate tycoons and everyday protagonists.',
  'hidden-identity':
    'Undercover millionaires, concealed heirs, and unrevealed masters masking their true prestige until dramatic climactic revelations.',
  'contract-marriage':
    'Marriages of convenience arranged for business alliances or family obligations that evolve into genuine devotion amid hostile adversaries.',
  'revenge':
    'Protagonists returning from disgrace, betrayal, or apparent defeat to methodically systematically reclaim their honor and rightful standing.',
  'second-chance':
    'Time leaps, rebirth after tragedy, or reconciliation allowing protagonists to correct past regrets and outmaneuver past enemies.',
  'urban-fantasy':
    'Supernatural martial arts, ancient lineages, secret healing arts, and mystical techniques hidden beneath modern skyscraper cities.',
  'family-drama':
    'Inheritance battles, estranged matriarchs, illegitimate siblings, and generational feuds across influential dynasties.',
  'medical-miracle':
    'Unassuming traditional physicians and miracle doctors performing miraculous healings while confronting corrupt rivals.',
};

/**
 * Gets platform details by slug
 */
async function getPlatformBySlugUncached(slug: string): Promise<{
  platform: Platform;
  description: string;
} | null> {

  if (!isSupabaseConfigured && !allowMockData) return mockDataUnavailable('getPlatformBySlug', null);
  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabasePublic
        .from('platforms')
        .select('slug, name, url, is_official, icon')
        .eq('slug', slug)
        .single();

      if (error) logDataError('repository', error);
      if (error || !data) return null;

      const platform: Platform = {
        slug: data.slug,
        name: data.name,
        url: data.url,
        official: data.is_official,
        icon: data.icon,
      };

      return {
        platform,
        description:
          PLATFORM_DESCRIPTIONS[platform.slug] ||
          `${platform.name} is a streaming destination featuring short drama releases and localized video series.`,
      };
    } catch (error) {
      logDataError('repository', error);
      return null;
    }
  }

  const platform = mockPlatforms.find(
    (p) => p.slug.toLowerCase() === slug.toLowerCase()
  );
  if (!platform) return null;

  return {
    platform,
    description:
      PLATFORM_DESCRIPTIONS[platform.slug] ||
      `${platform.name} is a streaming destination featuring short drama releases and localized video series.`,
  };
}

// Cached per request: generateMetadata and the page component share
// one database fetch instead of running every query twice.
export const getPlatformBySlug = cache(getPlatformBySlugUncached);

/**
 * Gets paginated series available on a platform
 */
/**
 * Applies the listing sort parameter to already-fetched items, using the
 * same comparators as the mock fallback: popularity (list activity),
 * newest (year), rating (ratingScore), title (alphabetical).
 */
function applySeriesSort(items: Series[], sort: string): Series[] {
  const sorted = [...items];
  if (sort === 'newest') {
    sorted.sort((a, b) => b.year - a.year);
  } else if (sort === 'rating') {
    sorted.sort((a, b) => b.ratingScore - a.ratingScore);
  } else if (sort === 'title') {
    sorted.sort((a, b) => a.title.localeCompare(b.title));
  } else {
    sorted.sort((a, b) => (b.popularity || 0) - (a.popularity || 0));
  }
  return sorted;
}

async function getSeriesByPlatformUncached(
  platformSlug: string,
  page = 1,
  pageSize = 12,
  sort = 'popularity'
): Promise<{
  items: Series[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}> {

  if (!isSupabaseConfigured && !allowMockData) return mockDataUnavailable('getSeriesByPlatform', {
    items: [], total: 0, page: Math.max(1, page), pageSize: Math.max(1, Math.min(24, pageSize)), totalPages: 0,
  });
  const clampedPageSize = Math.max(1, Math.min(24, pageSize));
  const safePage = Math.max(1, page);

  if (isSupabaseConfigured) {
    try {
      const from = (safePage - 1) * clampedPageSize;
      const to = from + clampedPageSize - 1;

      const { data, count, error } = await supabasePublic
        .from('releases')
        .select('series:series_id(id, short_id, slug, title, year, episode_count, poster_url, visibility, list_count, rating_score, rating_count, updated_at, production_type, verification_status, studio_name, has_human_cast)', { count: 'exact' })
        .eq('platform_slug', platformSlug)
        .range(from, to);

      if (error) logDataError('repository', error);
      if (error || !data || count === null) {
        return {
          items: [],
          total: 0,
          page: safePage,
          pageSize: clampedPageSize,
          totalPages: 0,
        };
      }

      const items = applySeriesSort(
        data
          .map((d: any) => d.series)
          .filter((s: any) => s && s.visibility === 'public')
          .map((s: any) => mapSeriesRecord(s)),
        sort
      );

      return {
        items,
        total: count,
        page: safePage,
        pageSize: clampedPageSize,
        totalPages: Math.max(1, Math.ceil(count / clampedPageSize)),
      };
    } catch (error) {
      logDataError('repository', error);
      return {
        items: [],
        total: 0,
        page: safePage,
        pageSize: clampedPageSize,
        totalPages: 0,
      };
    }
  }

  let matched = mockSeriesList.filter(
    (s) =>
      s.visibility === 'public' &&
      s.releases.some((r) => r.platformSlug.toLowerCase() === platformSlug.toLowerCase())
  );

  if (sort === 'newest') {
    matched.sort((a, b) => b.year - a.year);
  } else if (sort === 'rating') {
    matched.sort((a, b) => b.ratingScore - a.ratingScore);
  } else if (sort === 'title') {
    matched.sort((a, b) => a.title.localeCompare(b.title));
  } else {
    matched.sort((a, b) => (b.popularity || 0) - (a.popularity || 0));
  }

  const total = matched.length;
  const totalPages = Math.max(1, Math.ceil(total / clampedPageSize));
  const start = (safePage - 1) * clampedPageSize;
  const items = (safePage >= 1 && safePage <= totalPages) ? matched.slice(start, start + clampedPageSize) : [];

  return {
    items,
    total,
    page: safePage,
    pageSize: clampedPageSize,
    totalPages,
  };
}

// Cached per request: generateMetadata and the page component share
// one database fetch instead of running every query twice.
export const getSeriesByPlatform = cache(getSeriesByPlatformUncached);

/**
 * Gets tag details by slug
 */
async function getTagBySlugUncached(slug: string): Promise<{
  tag: Tag;
  description: string;
} | null> {

  if (!isSupabaseConfigured && !allowMockData) return mockDataUnavailable('getTagBySlug', null);
  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabasePublic
        .from('tags')
        .select('slug, name')
        .eq('slug', slug)
        .single();

      if (error) logDataError('repository', error);
      if (error || !data) return null;

      const tag: Tag = {
        slug: data.slug,
        name: data.name,
      };

      return {
        tag,
        description:
          TAG_DESCRIPTIONS[tag.slug] ||
          `Short dramas featuring ${tag.name.toLowerCase()} tropes, themes, and storyline developments.`,
      };
    } catch (error) {
      logDataError('repository', error);
      return null;
    }
  }

  const tag = mockTags.find((t) => t.slug.toLowerCase() === slug.toLowerCase());
  if (!tag) return null;

  return {
    tag,
    description:
      TAG_DESCRIPTIONS[tag.slug] ||
      `Short dramas featuring ${tag.name.toLowerCase()} tropes, themes, and storyline developments.`,
  };
}

// Cached per request: generateMetadata and the page component share
// one database fetch instead of running every query twice.
export const getTagBySlug = cache(getTagBySlugUncached);

/**
 * Gets paginated series for a specific genre tag
 */
async function getSeriesByTagUncached(
  tagSlug: string,
  page = 1,
  pageSize = 12,
  sort = 'popularity'
): Promise<{
  items: Series[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}> {

  if (!isSupabaseConfigured && !allowMockData) return mockDataUnavailable('getSeriesByTag', {
    items: [], total: 0, page: Math.max(1, page), pageSize: Math.max(1, Math.min(24, pageSize)), totalPages: 0,
  });
  const clampedPageSize = Math.max(1, Math.min(24, pageSize));
  const safePage = Math.max(1, page);

  if (isSupabaseConfigured) {
    try {
      const from = (safePage - 1) * clampedPageSize;
      const to = from + clampedPageSize - 1;

      const { data, count, error } = await supabasePublic
        .from('series_tags')
        .select('series:series_id(id, short_id, slug, title, year, episode_count, poster_url, visibility, list_count, rating_score, rating_count, updated_at, production_type, verification_status, studio_name, has_human_cast)', { count: 'exact' })
        .eq('tag_slug', tagSlug)
        .range(from, to);

      if (error) logDataError('repository', error);
      if (error || !data || count === null) {
        return {
          items: [],
          total: 0,
          page: safePage,
          pageSize: clampedPageSize,
          totalPages: 0,
        };
      }

      const items = applySeriesSort(
        data
          .map((d: any) => d.series)
          .filter((s: any) => s && s.visibility === 'public')
          .map((s: any) => mapSeriesRecord(s)),
        sort
      );

      return {
        items,
        total: count,
        page: safePage,
        pageSize: clampedPageSize,
        totalPages: Math.max(1, Math.ceil(count / clampedPageSize)),
      };
    } catch (error) {
      logDataError('repository', error);
      return {
        items: [],
        total: 0,
        page: safePage,
        pageSize: clampedPageSize,
        totalPages: 0,
      };
    }
  }

  let matched = mockSeriesList.filter(
    (s) =>
      s.visibility === 'public' &&
      s.tags.some((t) => t.slug.toLowerCase() === tagSlug.toLowerCase())
  );

  if (sort === 'newest') {
    matched.sort((a, b) => b.year - a.year);
  } else if (sort === 'rating') {
    matched.sort((a, b) => b.ratingScore - a.ratingScore);
  } else if (sort === 'title') {
    matched.sort((a, b) => a.title.localeCompare(b.title));
  } else {
    matched.sort((a, b) => (b.popularity || 0) - (a.popularity || 0));
  }

  const total = matched.length;
  const totalPages = Math.max(1, Math.ceil(total / clampedPageSize));
  const start = (safePage - 1) * clampedPageSize;
  const items = (safePage >= 1 && safePage <= totalPages) ? matched.slice(start, start + clampedPageSize) : [];

  return {
    items,
    total,
    page: safePage,
    pageSize: clampedPageSize,
    totalPages,
  };
}

// Cached per request: generateMetadata and the page component share
// one database fetch instead of running every query twice.
export const getSeriesByTag = cache(getSeriesByTagUncached);

export interface PersonCredit {
  series: Series;
  characterName?: string;
  roleType: string;
}

/**
 * Gets person and their drama credits
 */
export async function getPersonByIdOrSlug(
  idOrSlug: string
): Promise<{
  person: Person;
  credits: PersonCredit[];
} | null> {

  if (!isSupabaseConfigured && !allowMockData) return mockDataUnavailable('getPersonByIdOrSlug', null);
  const shortId = parsePersonParam(idOrSlug);
  if (!shortId) return null;

  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabasePublic
        .from('people')
        .select(`
          id, short_id, slug, name, native_name,
          series_people(
            character_name, role_type,
            series:series_id(id, short_id, slug, title, year, episode_count, poster_url, visibility, rating_score, rating_count, list_count, production_type, verification_status, studio_name, has_human_cast)
          )
        `)
        .eq('short_id', shortId)
        .single();

      if (error) logDataError('repository', error);
      if (error || !data) {
        return null;
      }
      if (!data.short_id) throw new Error('short_id missing in select');

      const person: Person = {
        id: Number(data.id),
        shortId: data.short_id,
        slug: data.slug,
        name: data.name,
        nativeName: data.native_name,
        role: 'actor',
      };

      const credits: PersonCredit[] = (data.series_people || [])
        .filter((sp: any) => sp.series && sp.series.visibility === 'public')
        .map((sp: any) => ({
          series: mapSeriesRecord(sp.series),
          characterName: sp.character_name,
          roleType: sp.role_type,
        }));

      return { person, credits };
    } catch (error) {
      logDataError('repository', error);
      return null;
    }
  }

  const person = mockPeople.find(
    (p) => p.shortId.toLowerCase() === shortId.toLowerCase()
  );

  if (!person) return null;

  const credits: PersonCredit[] = [];

  for (const s of mockSeriesList) {
    if (s.visibility !== 'public') continue;
    const roleMatch = s.cast.find((c) => c.person.id === person.id);
    if (roleMatch) {
      credits.push({
        series: s,
        characterName: roleMatch.characterName,
        roleType: roleMatch.roleType,
      });
    }
  }

  return {
    person,
    credits,
  };
}
