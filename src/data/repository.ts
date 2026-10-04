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
  UserPreferences,
  Revision,
  PersonRole,
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
  MOCK_NOW,
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
    s.includes('lumentv') ||
    s.includes('reelway') ||
    s.includes('shortline')
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
    const now = MOCK_NOW.getTime();
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
      const { data: popularData, error: popError } = await supabasePublic
        .from('series')
        .select('id, short_id, slug, title, year, episode_count, visibility, list_count, rating_count')
        .eq('visibility', 'public')
        .order('list_count', { ascending: false })
        .limit(6);

      const { data: aliasData, error: aliasError } = await supabasePublic
        .from('aliases')
        .select('text, language, source_url, source_label, status, added_at, series:series_id(id, short_id, slug, title, visibility)')
        .order('added_at', { ascending: false })
        .limit(7);

      const { data: tagsData, error: tagsError } = await supabasePublic
        .from('tags')
        .select('slug, name')
        .limit(8);

      const { data: platformsData, error: platError } = await supabasePublic
        .from('platforms')
        .select('slug, name, url, is_official')
        .limit(10);

      if (popError) logDataError('repository', popError);
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
        originalLanguage: 'zh',
        year: p.year,
        episodeCount: p.episode_count,
        synopsis: '',
        updatedAt: '2024-01-01',
        visibility: p.visibility,
        ratingScore: 0,
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

      const browseLanguages: BrowseLanguage[] = [
        { code: 'zh', label: 'Chinese', nativeLabel: '中文' },
        { code: 'ko', label: 'Korean', nativeLabel: '한국어' },
        { code: 'en', label: 'English', nativeLabel: 'English' },
        { code: 'es', label: 'Spanish', nativeLabel: 'Español' },
        { code: 'ja', label: 'Japanese', nativeLabel: '日本語' },
      ];

      return {
        popularThisWeek,
        recentlyAddedAliases,
        browseTags: (tagsData || []) as Tag[],
        browsePlatforms: (platformsData || []) as Platform[],
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

  const browseLanguages: BrowseLanguage[] = [
    { code: 'zh', label: 'Chinese', nativeLabel: '中文', count: languageCounts['zh'] || 0 },
    { code: 'ko', label: 'Korean', nativeLabel: '한국어', count: languageCounts['ko'] || 0 },
    { code: 'en', label: 'English', nativeLabel: 'English', count: languageCounts['en'] || 0 },
    { code: 'es', label: 'Spanish', nativeLabel: 'Español', count: languageCounts['es'] || 0 },
    { code: 'ja', label: 'Japanese', nativeLabel: '日本語', count: languageCounts['ja'] || 0 },
  ];

  return {
    popularThisWeek: sortedPopular,
    recentlyAddedAliases: recentAliases,
    browseTags: mockTags.slice(0, 8),
    browsePlatforms: mockPlatforms,
    browseLanguages,
  };
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
export async function getSeriesById(idOrShortId: number | string): Promise<Series | null> {

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
          production_status, visibility, rating_score, rating_count, list_count, updated_at,
          aliases(id, text, language, script, source_url, source_label, status, added_by, added_at),
          releases(id, platform_slug, region, dub_language, subtitle_languages, episode_count, url, released_year, last_checked, link_status, is_official, platforms(name)),
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

/**
 * Gets related series based on shared tags
 */
export async function getRelatedSeries(
  id: number,
  limit: number = 4
): Promise<Series[]> {

  if (!isSupabaseConfigured && !allowMockData) return mockDataUnavailable('getRelatedSeries', []);
  const current = await getSeriesById(id);
  if (!current) return [];

  if (isSupabaseConfigured) {
    try {
      const tagSlugs = current.tags.map((t) => t.slug);
      if (tagSlugs.length === 0) return [];

      const { data, error } = await supabasePublic
        .from('series_tags')
        .select('series:series_id(id, short_id, slug, title, year, episode_count, poster_url, visibility, list_count, rating_score, rating_count, updated_at)')
        .in('tag_slug', tagSlugs)
        .neq('series_id', id)
        .limit(limit);

      if (error) logDataError('repository', error);
      if (error || !data) return [];
      return data
        .map((d: any) => d.series)
        .filter((s: any) => s && s.visibility === 'public')
        .map((s: any) => mapSeriesRecord(s));
    } catch (error) {
      logDataError('repository', error);
      return [];
    }
  }

  const currentTagSlugs = new Set(current.tags.map((t) => t.slug));
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
      const { data, error } = await supabasePublic
        .from('releases')
        .select(`
          id, platform_slug, region, dub_language, subtitle_languages, episode_count, url, released_year, last_checked, link_status, is_official, platforms(name),
          series:series_id(
            id, slug, title, romanized_title, original_language, origin_country,
            year, episode_count, avg_episode_minutes, synopsis, poster_url,
            production_status, visibility, rating_score, rating_count, list_count, updated_at,
            aliases(id, text, language, script, source_url, source_label, status, added_by, added_at),
            releases(id, platform_slug, region, dub_language, subtitle_languages, episode_count, url, released_year, last_checked, link_status, is_official, platforms(name)),
            series_tags(tag_slug, tags(slug, name)),
            series_people(role_type, character_name, people(id, slug, name, native_name))
          )
        `)
        .ilike('url', `%${cleanUrl}%`)
        .limit(1)
        .single();

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
        .select('series:series_id(id, short_id, slug, title, year, episode_count, poster_url, visibility, list_count, rating_score, rating_count, updated_at)')
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
        .select('series:series_id(id, short_id, slug, title, year, episode_count, poster_url, visibility, list_count, rating_score, rating_count, updated_at)')
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
 * Gets person metadata and filmography
 */
export async function getPerson(
  id: number
): Promise<{ person: Person; filmography: Series[] } | null> {

  if (!isSupabaseConfigured && !allowMockData) return mockDataUnavailable('getPerson', null);
  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabasePublic
        .from('people')
        .select(`
          id, slug, name, native_name,
          series_people(
            series:series_id(id, short_id, slug, title, year, episode_count, poster_url, visibility, list_count, rating_score, rating_count, updated_at)
          )
        `)
        .eq('id', id)
        .single();

      if (error) logDataError('repository', error);
      if (error || !data) return null;

      const person: Person = {
        id: Number(data.id),
        slug: data.slug,
        name: data.name,
        nativeName: data.native_name,
        role: 'actor',
      };

      const filmography = (data.series_people || [])
        .map((sp: any) => sp.series)
        .filter((s: any) => s && s.visibility === 'public')
        .map((s: any) => mapSeriesRecord(s));

      return { person: { ...person, dramaCount: filmography.length }, filmography };
    } catch (error) {
      logDataError('repository', error);
      return null;
    }
  }

  const person = mockPeople.find((p) => p.id === id);
  if (!person) return null;

  const filmography = mockSeriesList.filter(
    (s) => s.visibility === 'public' && s.cast.some((c) => c.person.id === id)
  );

  return { person: { ...person, dramaCount: filmography.length }, filmography };
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
          .select('id, short_id, slug, title, updated_at, visibility, synopsis')
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
          originalLanguage: 'zh',
          year: 2024,
          episodeCount: 80,
          synopsis: s.synopsis || '',
          updatedAt: s.updated_at ? String(s.updated_at).split('T')[0] : '2024-01-01',
          visibility: s.visibility,
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

      return data.map((p: any) => ({
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
        .select('id, handle, display_name, role, avatar_url, created_at')
        .eq('handle', clean)
        .single();

      if (error) logDataError('repository', error);
      if (error || !profile) return null;

      const user: User = {
        id: profile.id,
        handle: profile.handle,
        name: profile.display_name || profile.handle,
        role: (profile.role as any) || 'reader',
        joinedAt: profile.created_at ? String(profile.created_at).split('T')[0] : '2024-01-01',
      };

      return {
        user,
        titlesListedCount: 0,
        namesAddedCount: 0,
        reportsAcceptedCount: 0,
        listEntries: [],
        ratings: [],
        contributions: [],
        reports: [],
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
        .select('*')
        .eq('series_id', seriesId)
        .order('created_at', { ascending: false });

      if (error) logDataError('repository', error);
      if (error || !data || data.length === 0) {
        return [];
      }

      return data.map((r: any) => ({
        id: String(r.id),
        seriesId: Number(r.series_id),
        summary: r.summary || 'Metadata edit',
        diffs: Array.isArray(r.diffs) ? r.diffs : [],
        submittedBy: r.user_id || 'usr_unknown',
        submittedByName: r.user_name || 'Contributor',
        submittedByRole: r.user_role || 'editor',
        submittedAt: r.created_at ? String(r.created_at).split('T')[0] : '2024-01-01',
        reverted: Boolean(r.reverted),
      }));
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

/**
 * Gets all pending/open moderation reports for the mod queue
 */
export async function getAllModerationReports(): Promise<UserReport[]> {

  if (!isSupabaseConfigured && !allowMockData) return mockDataUnavailable('getAllModerationReports', []);
  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabasePublic
        .from('reports')
        .select('*')
        .eq('status', 'open')
        .order('created_at', { ascending: false });

      if (error) logDataError('repository', error);
      if (error || !data) return [];

      return data.map((r: any) => ({
        id: String(r.id),
        type: r.report_type || 'another_name',
        typeName: r.report_type_name || 'Report',
        seriesId: Number(r.series_id),
        seriesTitle: r.series_title || 'Drama',
        status: r.status || 'open',
        submittedBy: r.user_id || 'usr_anon',
        submittedAt: r.created_at ? String(r.created_at).split('T')[0] : '2024-01-01',
        moderatorNote: r.moderator_note,
        data: {
          name: r.proposed_value,
          url: r.source_url,
          note: r.notes,
        },
      }));
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
    try {
      let query = supabasePublic.from('redirects').select('to_id');
      if (isNumeric) {
        query = query.eq('from_id', Number(fromIdOrShortId));
      }

      const { data, error } = await query.single();
      if (error) logDataError('repository', error);
      if (error || !data) return null;
      return Number(data.to_id);
    } catch (error) {
      logDataError('repository', error);
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
  'lumen-tv':
    'Lumen TV is a dedicated streaming service focusing on romantic sagas, CEO melodramas, and urban fantasy series with multi-language subtitle tracks.',
  'reelway':
    'Reelway specializes in fast-paced episodic thrillers, revenge narratives, and second-chance family dramas designed specifically for mobile viewing.',
  'shortline':
    'Shortline hosts an expansive international catalog of short dramas with high-frequency episodic releases and localized dubs.',
  'youtube':
    'Official and publisher-licensed YouTube channel releases for short drama series, pilot episodes, and complete compilation playlists.',
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
export async function getPlatformBySlug(slug: string): Promise<{
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

/**
 * Gets paginated series available on a platform
 */
export async function getSeriesByPlatform(
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
        .select('series:series_id(id, short_id, slug, title, year, episode_count, poster_url, visibility, list_count, rating_score, rating_count, updated_at)', { count: 'exact' })
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

      const items = data
        .map((d: any) => d.series)
        .filter((s: any) => s && s.visibility === 'public')
        .map((s: any) => mapSeriesRecord(s));

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

/**
 * Gets tag details by slug
 */
export async function getTagBySlug(slug: string): Promise<{
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

/**
 * Gets paginated series for a specific genre tag
 */
export async function getSeriesByTag(
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
        .select('series:series_id(id, short_id, slug, title, year, episode_count, poster_url, visibility, list_count, rating_score, rating_count, updated_at)', { count: 'exact' })
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

      const items = data
        .map((d: any) => d.series)
        .filter((s: any) => s && s.visibility === 'public')
        .map((s: any) => mapSeriesRecord(s));

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
            series:series_id(id, short_id, slug, title, year, episode_count, poster_url, visibility, rating_score, rating_count, list_count)
          )
        `)
        .eq('short_id', shortId)
        .single();

      if (error) logDataError('repository', error);
      if (error || !data) {
        return null;
      }

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
