import {
  Series,
  Tag,
  Platform,
  Person,
  HomeData,
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
  TitleRedirect,
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
import { getLanguageName } from '@/src/lib/languages';
import { cookies } from 'next/headers';

/**
 * Normalizes string for multilingual substring search
 */
function normalizeForSearch(str: string): string {
  return str.toLowerCase().trim();
}

export { getLanguageName };

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
 * Retrieves the comprehensive datasets required for the Home page
 */
export async function getHomePageFeed(): Promise<HomeFeedData> {
  await new Promise((r) => setTimeout(r, 10));

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
 * aliases (including Chinese/CJK substring matching), URL detection, and multi-facet filtering.
 */
export async function searchSeries(params: {
  query?: string;
  filters?: SearchFilters;
  sort?: 'relevance' | 'popularity' | 'newest' | 'rating' | 'title' | string;
  page?: number;
  pageSize?: number;
}): Promise<SearchResult> {
  await new Promise((r) => setTimeout(r, 10));

  const {
    query = '',
    filters = {},
    sort = 'relevance',
    page = 1,
    pageSize = 10,
  } = params;

  const rawQ = query.trim();
  const q = normalizeForSearch(rawQ);

  // Check if query is a URL
  if (q && isPotentialUrl(q)) {
    if (!isValidUrl(rawQ)) {
      return {
        items: [],
        total: 0,
        page: 1,
        pageSize,
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
        pageSize,
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
        pageSize,
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
      pageSize,
      totalPages: 0,
      isUrlSearch: true,
      urlLookupResult: {
        type: 'not_found',
        url: rawQ,
      },
    };
  }

  // Text search
  const resultItems: SearchResultItem[] = [];

  for (const series of mockSeriesList) {
    if (series.visibility !== 'public') continue;

    let isMatch = true;
    let matchedField: SearchResultItem['matchedField'] = undefined;
    let matchedAliasInfo: MatchedAliasInfo | undefined = undefined;

    if (q) {
      isMatch = false;

      // 1. Match canonical title
      if (normalizeForSearch(series.title).includes(q)) {
        isMatch = true;
        matchedField = 'title';
      }

      // 2. Match romanized title
      if (!isMatch && series.romanizedTitle && normalizeForSearch(series.romanizedTitle).includes(q)) {
        isMatch = true;
        matchedField = 'romanized';
      }

      // 3. Match aliases in any language (including Chinese characters)
      const matchingAlias = series.aliases.find((alias) =>
        normalizeForSearch(alias.text).includes(q)
      );

      if (matchingAlias) {
        isMatch = true;
        // If it matches an alias, highlight it if distinct from title
        const snippet = extractMatchSnippet(matchingAlias.text, rawQ);
        matchedAliasInfo = {
          alias: matchingAlias,
          matchSnippet: snippet,
          languageName: getLanguageName(matchingAlias.language),
        };
        if (!matchedField) {
          matchedField = 'alias';
        }
      }

      // 4. Match tags
      if (!isMatch) {
        const matchingTag = series.tags.some(
          (t) =>
            normalizeForSearch(t.name).includes(q) ||
            normalizeForSearch(t.slug).includes(q)
        );
        if (matchingTag) {
          isMatch = true;
          matchedField = 'tag';
        }
      }

      // 5. Match synopsis
      if (!isMatch && normalizeForSearch(series.synopsis).includes(q)) {
        isMatch = true;
        matchedField = 'synopsis';
      }

      // 6. Match cast
      if (!isMatch) {
        const matchingCast = series.cast.some(
          (c) =>
            normalizeForSearch(c.person.name).includes(q) ||
            (c.person.nativeName &&
              normalizeForSearch(c.person.nativeName).includes(q))
        );
        if (matchingCast) {
          isMatch = true;
          matchedField = 'cast';
        }
      }
    }

    if (!isMatch) continue;

    // Apply Filters
    // Platform filter
    if (
      filters.platform &&
      !series.releases.some((r) => r.platformSlug === filters.platform)
    ) {
      continue;
    }

    // Language filter
    if (
      filters.language &&
      series.originalLanguage !== filters.language &&
      !series.aliases.some((a) => a.language === filters.language)
    ) {
      continue;
    }

    // Tag filter
    if (filters.tag && !series.tags.some((t) => t.slug === filters.tag)) {
      continue;
    }

    // Year filter
    if (filters.year && series.year !== Number(filters.year)) {
      continue;
    }

    // Status filter (ongoing / completed)
    if (filters.status) {
      const dramaStatus = series.productionStatus || 'completed';
      if (dramaStatus !== filters.status) {
        continue;
      }
    }

    // Episode count range filter
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

    resultItems.push({
      series,
      matchedAlias: matchedAliasInfo,
      matchedField: matchedField || 'title',
    });
  }

  // Sorting
  resultItems.sort((a, b) => {
    switch (sort) {
      case 'popularity':
        return (b.series.popularity || 0) - (a.series.popularity || 0);
      case 'newest':
        return (
          new Date(b.series.updatedAt).getTime() -
          new Date(a.series.updatedAt).getTime()
        );
      case 'rating':
        return b.series.ratingScore - a.series.ratingScore;
      case 'title':
        return a.series.title.localeCompare(b.series.title);
      case 'relevance':
      default:
        // Prioritize exact/prefix matches on title/alias, then popularity
        if (q) {
          const aTitleExact = normalizeForSearch(a.series.title).startsWith(q);
          const bTitleExact = normalizeForSearch(b.series.title).startsWith(q);
          if (aTitleExact && !bTitleExact) return -1;
          if (!aTitleExact && bTitleExact) return 1;
        }
        return (b.series.popularity || 0) - (a.series.popularity || 0);
    }
  });

  const total = resultItems.length;
  const startIndex = (page - 1) * pageSize;
  const paginated = resultItems.slice(startIndex, startIndex + pageSize);

  return {
    items: paginated,
    total,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
    isUrlSearch: false,
  };
}

/**
 * Gets a single series by numeric ID
 */
export async function getSeriesById(id: number): Promise<Series | null> {
  await new Promise((r) => setTimeout(r, 10));
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
  await new Promise((r) => setTimeout(r, 10));
  const current = mockSeriesList.find((s) => s.id === id);
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
  await new Promise((r) => setTimeout(r, 10));
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
  await new Promise((r) => setTimeout(r, 10));
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
  await new Promise((r) => setTimeout(r, 10));
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
  await new Promise((r) => setTimeout(r, 10));
  const person = mockPeople.find((p) => p.id === id);
  if (!person) return null;

  const filmography = mockSeriesList.filter(
    (s) => s.visibility === 'public' && s.cast.some((c) => c.person.id === id)
  );

  return { person: { ...person, dramaCount: filmography.length }, filmography };
}

/**
 * Server-side session resolver reading mock session cookie
 */
export async function getSession(): Promise<User | null> {
  try {
    const cookieStore = await cookies();
    const userId = cookieStore.get('sdi_mock_user')?.value;
    if (!userId) {
      return mockUsers[0];
    }
    const user = mockUsers.find((u) => u.id === userId);
    return user || mockUsers[0];
  } catch {
    return mockUsers[0];
  }
}

/**
 * Gets all series for catalog indexing and sitemaps
 */
export async function getAllSeries(): Promise<Series[]> {
  return mockSeriesList.filter((s) => s.visibility === 'public');
}

/**
 * Gets all people for indexable credits and sitemaps
 */
export async function getAllPeople(): Promise<Person[]> {
  return mockPeople;
}

/**
 * Gets all available platforms for search filter options
 */
export async function getAllPlatforms(): Promise<Platform[]> {
  return mockPlatforms;
}

/**
 * Gets all available tags for search filter options
 */
export async function getAllTags(): Promise<Tag[]> {
  return mockTags;
}

/**
 * Gets all reports submitted by the current user
 */
export async function getUserReports(): Promise<UserReport[]> {
  await new Promise((r) => setTimeout(r, 10));
  try {
    const cookieStore = await cookies();
    const userId = cookieStore.get('sdi_mock_user')?.value || mockUsers[0].id;
    return mockReports.filter((r) => r.submittedBy === userId || !r.submittedBy);
  } catch {
    return mockReports;
  }
}

/**
 * Retrieves a user's public profile data, list entries, ratings, contributions, and reports
 */
export async function getUserProfileData(
  handleOrName: string
): Promise<UserProfileData | null> {
  await new Promise((r) => setTimeout(r, 10));

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
 * Gets user preferences from cookie or defaults
 */
export async function getUserPreferences(): Promise<UserPreferences> {
  try {
    const cookieStore = await cookies();
    const titleLanguage = (cookieStore.get('sdi_title_lang')?.value as any) || 'english';
    const defaultRegion = cookieStore.get('sdi_default_region')?.value || 'any';
    const theme = (cookieStore.get('sdi_theme')?.value as any) || 'system';

    return {
      titleLanguage,
      defaultRegion,
      theme,
    };
  } catch {
    return {
      titleLanguage: 'english',
      defaultRegion: 'any',
      theme: 'system',
    };
  }
}

/**
 * Gets revision history for a series
 */
export async function getSeriesRevisions(seriesId: number): Promise<Revision[]> {
  await new Promise((r) => setTimeout(r, 10));
  const revs = mockRevisions.filter((r) => r.seriesId === seriesId);
  if (revs.length === 0) {
    // Generate default baseline revision
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
  await new Promise((r) => setTimeout(r, 10));
  return mockReports;
}

/**
 * Checks if a title ID has been merged/redirected
 */
export async function checkRedirect(fromId: number): Promise<number | null> {
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
  await new Promise((r) => setTimeout(r, 10));

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
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const start = (page - 1) * pageSize;
  const items = (page >= 1 && page <= totalPages) ? matched.slice(start, start + pageSize) : [];

  return {
    items,
    total,
    page,
    pageSize,
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
  await new Promise((r) => setTimeout(r, 10));

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
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const start = (page - 1) * pageSize;
  const items = (page >= 1 && page <= totalPages) ? matched.slice(start, start + pageSize) : [];

  return {
    items,
    total,
    page,
    pageSize,
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
  await new Promise((r) => setTimeout(r, 10));

  const clean = idOrSlug.toLowerCase().trim();
  const idMatch = clean.match(/^(\d+)/);
  const personId = idMatch ? parseInt(idMatch[1], 10) : null;

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



