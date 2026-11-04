export type VisibilityStatus = 'public' | 'hidden' | 'removed';
export type VerificationStatus = 'verified' | 'pending' | 'disputed';
export type LinkStatus = 'active' | 'broken' | 'unverified' | 'disputed';
export type UserRole = 'reader' | 'editor' | 'moderator';
export type ListStatus = 'watching' | 'plan_to_watch' | 'completed' | 'dropped' | 'on_hold';
export type PersonRoleType = 'actor' | 'director' | 'writer' | 'producer';
export type ProductionStatus = 'completed' | 'ongoing';
export type SeriesProductionType = 'live_action' | 'hybrid' | 'animation' | 'ai_assisted';
export type SeriesVerificationStatus =
  | 'verified_commercial'
  | 'editorial_approved'
  | 'community_submitted'
  | 'unverified';
export type MonetizationType =
  | 'coin_per_episode'
  | 'subscription'
  | 'ad_supported'
  | 'free_with_ads'
  | 'hybrid';

export type ReportType =
  | 'another_name'
  | 'wrong_name'
  | 'same_drama'
  | 'not_same_drama'
  | 'wrong_details'
  | 'broken_link';

export type ReportStatus = 'open' | 'accepted' | 'declined';

export interface Alias {
  id?: string;
  text: string;
  language: string; // ISO code: 'zh', 'en', 'ko', 'ja', 'es', etc.
  script?: string; // 'Hans', 'Hant', 'Latn', 'Hang', etc.
  source: string; // e.g. 'Official Uploader', 'ReelShort app', 'Fan Translation'
  sourceUrl?: string; // e.g. 'https://example.com/source'
  status: VerificationStatus;
  addedBy: string;
  addedAt: string;
  notes?: string;
}

export interface Platform {
  slug: string;
  name: string;
  url: string;
  icon?: string;
  official?: boolean;
}

export interface Release {
  id?: string;
  platform: string;
  platformSlug: string;
  region: string; // 'Global', 'US', 'CN', 'SEA', etc.
  dubLanguage?: string;
  subtitleLanguages?: string[];
  episodeCount?: number;
  releasedYear?: number;
  url: string;
  lastChecked: string;
  linkStatus: LinkStatus;
  isOfficial: boolean;
  monetizationType: MonetizationType | null;
  freeEpisodes: number | null;
  coinsPerEpisode: number | null;
  estimatedUnlockCostUsd: number | null;
  directWatchUrl: string | null;
  notes?: string;
}

export interface Tag {
  slug: string;
  name: string;
  count?: number;
}

export interface Person {
  id: number;
  shortId: string;
  slug: string;
  name: string;
  nativeName?: string;
  role: PersonRoleType;
  avatarUrl?: string;
  dramaCount?: number;
}

export interface PersonRole {
  person: Person;
  characterName?: string;
  roleType: PersonRoleType;
}

export interface Series {
  id: number;
  shortId: string;
  slug: string;
  title: string;
  romanizedTitle?: string;
  originalLanguage: string;
  originCountry?: string; // ISO 3166-1 alpha-2, e.g. "CN", "KR", "US"
  year: number;
  episodeCount: number;
  avgEpisodeMinutes?: number;
  synopsis: string;
  posterUrl?: string;
  updatedAt: string;
  visibility: VisibilityStatus;
  productionStatus?: ProductionStatus;
  productionType: SeriesProductionType;
  verificationStatus: SeriesVerificationStatus;
  studioName: string | null;
  hasHumanCast: boolean;
  ratingScore: number;
  ratingCount: number;
  rank?: number;
  popularity?: number;
  tags: Tag[];
  aliases: Alias[];
  releases: Release[];
  // Search listings do not load full releases; the RPC supplies this count
  // instead (see migration 00009). Undefined until that migration runs.
  releaseCount?: number;
  cast: PersonRole[];
}

export interface UserListEntry {
  userId: string;
  seriesId: number;
  status: ListStatus;
  score?: number;
  episodesWatched?: number;
  updatedAt: string;
}

export interface UserContribution {
  id: string;
  userId: string;
  seriesId: number;
  seriesShortId: string;
  seriesSlug: string;
  seriesTitle: string;
  type: 'alias' | 'release' | 'metadata';
  description: string;
  date: string;
  status: VerificationStatus;
}

export interface UserReport {
  id: string;
  seriesId: number;
  seriesTitle: string;
  type: ReportType;
  typeName: string;
  status: ReportStatus;
  submittedBy: string;
  submittedAt: string;
  moderatorNote?: string;
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

export interface UserProfileData {
  user: User;
  titlesListedCount: number;
  namesAddedCount: number;
  reportsAcceptedCount: number;
  listEntries: (UserListEntry & { series: Series })[];
  ratings: (UserListEntry & { series: Series })[];
  contributions: UserContribution[];
  reports: UserReport[];
}

export interface Report {
  id: string;
  targetType: 'series' | 'alias' | 'release' | 'person';
  targetId: string | number;
  reason: string;
  details?: string;
  status: 'pending' | 'reviewed' | 'resolved' | 'dismissed';
  submittedBy: string;
  submittedAt: string;
}

export interface RevisionDiff {
  field: string;
  label: string;
  oldValue: string;
  newValue: string;
}

export interface Revision {
  id: string;
  seriesId: number;
  summary: string;
  diffs: RevisionDiff[];
  submittedBy: string;
  submittedByName: string;
  submittedByRole: UserRole;
  submittedAt: string;
  reverted?: boolean;
}

export interface TitleRedirect {
  fromId: number;
  toId: number;
  createdAt: string;
  reason?: string;
}

export interface User {
  id: string;
  name: string;
  handle: string;
  avatar?: string;
  role: UserRole;
  joinedAt?: string;
}

export interface UserPreferences {
  titleLanguage: 'english' | 'original' | 'romanized';
  defaultRegion: string;
  theme: 'system' | 'light' | 'dark';
}

export interface SearchFilters {
  query?: string;
  language?: string;
  status?: string;
  tag?: string;
  platform?: string;
  year?: number;
  episodeRange?: '<50' | '50-80' | '80+' | string;
  sort?: 'relevance' | 'popularity' | 'newest' | 'rating' | 'title' | string;
}

export interface MatchedAliasInfo {
  alias: Alias;
  matchSnippet?: {
    before: string;
    matched: string;
    after: string;
  };
  languageName: string;
}

export interface SearchResultItem {
  series: Series;
  matchedAlias?: MatchedAliasInfo;
  matchedField?: 'title' | 'alias' | 'romanized' | 'synopsis' | 'tag' | 'cast';
}

export interface SearchResult {
  items: SearchResultItem[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  isUrlSearch?: boolean;
  urlLookupResult?: LinkLookupResult;
}

export interface LinkLookupResult {
  type: 'exact' | 'candidates' | 'not_found' | 'invalid_url';
  exactMatch?: {
    series: Series;
    release: Release;
  };
  possibleMatches?: Series[];
  url: string;
  errorMessage?: string;
}

export interface HomeData {
  featured: Series[];
  recentlyUpdated: Series[];
  popularSeries: Series[];
  topRated: Series[];
  totalSeriesCount: number;
  totalAliasesCount: number;
  totalReleasesCount: number;
}
