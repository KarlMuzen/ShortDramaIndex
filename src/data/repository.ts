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
  LinkLookupResult,
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
import { supabasePublic, isSupabaseConfigured } from './supabase-public';
import { getLanguageName } from '@/src/lib/languages';

export { getLanguageName };

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
  } catch {
    return false;
  }
}

export interface RecentAliasEntry {
  alias: Alias;
  seriesId: number;
  seriesSlug: string;
  seriesTitle: string;
  addedAt: string;
  relativeTime: string;
}

export interface BrowseLanguage {
  code: string;
  label: string;
  nativeLabel: string;
  count: number;
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
  } catch {
    return 'recently';
  }
}

/**
 * Maps database series record to standard Series interface
 */
function mapSeriesRecord(row: any): Series {
  const aliases: Alias[] = Array.isArray(row.aliases)
    ? row.aliases.map((a: any) => ({
        id: a.id,
        text: a.text,
        language: a.language,
        script: a.script,
        source: a.source_label || a.source_url || 'Community',
        status: a.status || 'verified',
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
        lastChecked: 'Today',
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
  if (isSupabaseConfigured) {
    try {
      const { data: popularData } = await supabasePublic
        .from('series')
        .select('id, slug, title, year, episode_count, visibility, list_count, rating_count')
        .eq('visibility', 'public')
        .order('list_count', { ascending: false })
        .limit(6);

      const { data: aliasData } = await supabasePublic
        .from('aliases')
        .select('text, language, source_url, source_label, added_at, series:series_id(id, slug, title, visibility)')
        .order('added_at', { ascending: false })
        .limit(7);

      const { data: tagsData } = await supabasePublic
        .from('tags')
        .select('slug, name')
        .limit(8);

      const { data: platformsData } = await supabasePublic
        .from('platforms')
        .select('slug, name, url, is_official')
        .limit(10);

      if (popularData && popularData.length > 0) {
        const popularThisWeek: Series[] = popularData.map((p) => ({
          id: Number(p.id),
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
        }));

        const recentlyAddedAliases: RecentAliasEntry[] = (aliasData || [])
          .filter((a: any) => a.series && a.series.visibility === 'public')
          .map((a: any) => ({
            alias: {
              text: a.text,
              language: a.language,
              source: a.source_label || a.source_url || 'Community',
              status: 'verified',
              addedBy: 'Contributor',
              addedAt: a.added_at ? String(a.added_at).split('T')[0] : '2024-01-01',
            },
            seriesId: Number(a.series.id),
            seriesSlug: a.series.slug,
            seriesTitle: a.series.title,
            addedAt: a.added_at ? String(a.added_at).split('T')[0] : '2024-01-01',
            relativeTime: getRelativeTimeString(a.added_at || '2024-01-01'),
          }));

        const browseLanguages: BrowseLanguage[] = [
          { code: 'zh', label: 'Chinese', nativeLabel: '中文', count: 12 },
          { code: 'ko', label: 'Korean', nativeLabel: '한국어', count: 4 },
          { code: 'en', label: 'English', nativeLabel: 'English', count: 3 },
          { code: 'es', label: 'Spanish', nativeLabel: 'Español', count: 2 },
          { code: 'ja', label: 'Japanese', nativeLabel: '日本語', count: 1 },
        ];

        return {
          popularThisWeek,
          recentlyAddedAliases,
          browseTags: (tagsData || mockTags) as Tag[],
          browsePlatforms: (platformsData || mockPlatforms) as Platform[],
          browseLanguages,
        };
      }
    } catch {
      // Graceful fallback to mock data
    }
  }

  // Fallback to typed mock data
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

    // Try finding candidate matches by platform or slug in URL
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

  // 1. Try Supabase search_series RPC function
  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabasePublic.rpc('search_series', {
        p_q: rawQ,
        p_filters: filters,
        p_sort: sort,
        p_page: safePage,
        p_page_size: clampedPageSize,
      });

      if (data && data.length > 0 && !error) {
        const total = Number(data[0].total_count || data.length);
        const items: SearchResultItem[] = data.map((row: any) => {
          const series: Series = {
            id: Number(row.id),
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
                    source: 'Verified',
                    status: 'verified',
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
                  source: 'Verified',
                  status: 'verified',
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
      }
    } catch {
      // Fallback to mock search
    }
  }

  // 2. Typed in-memory fallback search (ranking exact alias first, prefix, then partial)
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

      // Check exact / prefix / partial matches on title, romanized, and aliases
      const lowerTitle = normalizeForSearch(series.title);
      const lowerRom = series.romanizedTitle ? normalizeForSearch(series.romanizedTitle) : '';

      // Check aliases
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

    // Apply Filters
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

  // Sorting
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
        // Tier 1 (exact) -> Tier 2 (prefix) -> Tier 3 (partial) -> Popularity
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
 * Gets a single series by numeric ID
 */
export async function getSeriesById(id: number): Promise<Series | null> {
  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabasePublic
        .from('series')
        .select(`
          id, slug, title, romanized_title, original_language, origin_country,
          year, episode_count, avg_episode_minutes, synopsis, poster_url,
          production_status, visibility, rating_score, rating_count, list_count, updated_at,
          aliases(id, text, language, script, source_url, source_label, status, added_by, added_at),
          releases(id, platform_slug, region, dub_language, subtitle_languages, episode_count, url, released_year, last_checked, link_status, is_official, platforms(name)),
          series_tags(tag_slug, tags(slug, name)),
          series_people(role_type, character_name, people(id, slug, name, native_name))
        `)
        .eq('id', id)
        .single();

      if (data && !error) {
        if (data.visibility === 'removed') return null;
        return mapSeriesRecord(data);
      }
    } catch {
      // Fallback to mock
    }
  }

  const series = mockSeriesList.find((s) => s.id === id);
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
  const current = await getSeriesById(id);
  if (!current) return [];

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
  const cleanUrl = url.trim().toLowerCase();

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
  const person = mockPeople.find((p) => p.id === id);
  if (!person) return null;

  const filmography = mockSeriesList.filter(
    (s) => s.visibility === 'public' && s.cast.some((c) => c.person.id === id)
  );

  return { person: { ...person, dramaCount: filmography.length }, filmography };
}

/**
 * Resolves active session profile
 */
export async function getSession(): Promise<User | null> {
  return mockUsers[0];
}

/**
 * Gets all series for catalog indexing and sitemaps (selecting only id, slug, updated_at, visibility, synopsis)
 */
export async function getAllSeries(): Promise<Series[]> {
  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabasePublic
        .from('series')
        .select('id, slug, title, updated_at, visibility, synopsis')
        .eq('visibility', 'public');

      if (data && data.length > 0 && !error) {
        return data.map((s) => ({
          id: Number(s.id),
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
        }));
      }
    } catch {
      // Fallback
    }
  }

  return mockSeriesList.filter((s) => s.visibility === 'public');
}

/**
 * Gets all people for indexable credits and sitemaps (selecting only id, slug, name)
 */
export async function getAllPeople(): Promise<Person[]> {
  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabasePublic
        .from('people')
        .select('id, slug, name, native_name');

      if (data && data.length > 0 && !error) {
        return data.map((p) => ({
          id: Number(p.id),
          slug: p.slug,
          name: p.name,
          nativeName: p.native_name,
          role: 'actor',
        }));
      }
    } catch {
      // Fallback
    }
  }

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
  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabasePublic
        .from('platforms')
        .select('slug, name, url, is_official, icon');

      if (data && data.length > 0 && !error) {
        return data.map((p) => ({
          slug: p.slug,
          name: p.name,
          url: p.url,
          official: p.is_official,
          icon: p.icon,
        }));
      }
    } catch {
      // Fallback
    }
  }
  return mockPlatforms;
}

/**
 * Gets all available tags for search filter options
 */
export async function getAllTags(): Promise<Tag[]> {
  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabasePublic
        .from('tags')
        .select('slug, name');

      if (data && data.length > 0 && !error) {
        return data.map((t) => ({
          slug: t.slug,
          name: t.name,
        }));
      }
    } catch {
      // Fallback
    }
  }
  return mockTags;
}

/**
 * Gets all reports submitted by the current user
 */
export async function getUserReports(): Promise<UserReport[]> {
  return mockReports;
}

/**
 * Retrieves a user's public profile data, list entries, ratings, contributions, and reports
 */
export async function getUserProfileData(
  handleOrName: string
): Promise<UserProfileData | null> {
  const clean = handleOrName.toLowerCase().replace(/^@/, '');
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
  return mockReports;
}

/**
 * Checks if a title ID has been merged/redirected
 */
export async function checkRedirect(fromId: number): Promise<number | null> {
  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabasePublic
        .from('redirects')
        .select('to_id')
        .eq('from_id', fromId)
        .single();

      if (data && !error) {
        return Number(data.to_id);
      }
    } catch {
      // Fallback
    }
  }

  const match = mockRedirects.find((r) => r.fromId === fromId);
  return match ? match.toId : null;
}

const PLATFORM_DESCRIPTIONS: Record<string, string> = {
  'lumen-tv':
    'Lumen TV is a dedicated micro-drama streaming service focusing on vertical romantic sagas, CEO melodramas, and urban fantasy series with multi-language subtitle tracks.',
  'reelway':
    'Reelway specializes in fast-paced episodic thrillers, revenge narratives, and second-chance family dramas designed specifically for mobile viewing.',
  'shortline':
    'Shortline hosts an expansive international catalog of mini vertical dramas with high-frequency episodic releases and localized dubs.',
  'youtube':
    'Official and publisher-licensed YouTube channel releases for short vertical drama web series, pilot episodes, and complete compilation playlists.',
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
  const platform = mockPlatforms.find(
    (p) => p.slug.toLowerCase() === slug.toLowerCase()
  );
  if (!platform) return null;

  return {
    platform,
    description:
      PLATFORM_DESCRIPTIONS[platform.slug] ||
      `${platform.name} is a streaming destination featuring short vertical drama releases and localized video series.`,
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
  const clampedPageSize = Math.max(1, Math.min(24, pageSize));
  const safePage = Math.max(1, page);

  if (isSupabaseConfigured) {
    try {
      const from = (safePage - 1) * clampedPageSize;
      const to = from + clampedPageSize - 1;

      const { data, count, error } = await supabasePublic
        .from('releases')
        .select('series:series_id(id, slug, title, year, episode_count, poster_url, visibility, list_count, rating_score, rating_count, updated_at)', { count: 'exact' })
        .eq('platform_slug', platformSlug)
        .range(from, to);

      if (data && !error && count !== null) {
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
      }
    } catch {
      // Fallback
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
  const tag = mockTags.find((t) => t.slug.toLowerCase() === slug.toLowerCase());
  if (!tag) return null;

  return {
    tag,
    description:
      TAG_DESCRIPTIONS[tag.slug] ||
      `Short vertical dramas featuring ${tag.name.toLowerCase()} tropes, themes, and storyline developments.`,
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
  const clampedPageSize = Math.max(1, Math.min(24, pageSize));
  const safePage = Math.max(1, page);

  if (isSupabaseConfigured) {
    try {
      const from = (safePage - 1) * clampedPageSize;
      const to = from + clampedPageSize - 1;

      const { data, count, error } = await supabasePublic
        .from('series_tags')
        .select('series:series_id(id, slug, title, year, episode_count, poster_url, visibility, list_count, rating_score, rating_count, updated_at)', { count: 'exact' })
        .eq('tag_slug', tagSlug)
        .range(from, to);

      if (data && !error && count !== null) {
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
      }
    } catch {
      // Fallback
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
  const clean = idOrSlug.toLowerCase().trim();
  const idMatch = clean.match(/^(\d+)/);
  const personId = idMatch ? parseInt(idMatch[1], 10) : null;

  if (isSupabaseConfigured) {
    try {
      let query = supabasePublic.from('people').select(`
        id, slug, name, native_name,
        series_people(
          character_name, role_type,
          series:series_id(id, slug, title, year, episode_count, poster_url, visibility, rating_score, rating_count, list_count)
        )
      `);

      if (personId !== null) {
        query = query.eq('id', personId);
      } else {
        query = query.eq('slug', clean);
      }

      const { data, error } = await query.single();

      if (data && !error) {
        const person: Person = {
          id: Number(data.id),
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
      }
    } catch {
      // Fallback
    }
  }

  const person = mockPeople.find(
    (p) =>
      (personId !== null && p.id === personId) ||
      p.slug.toLowerCase() === clean ||
      p.name.toLowerCase().replace(/\s+/g, '-') === clean
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
