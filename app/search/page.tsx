import { Metadata } from 'next';
import {
  searchSeries,
  getAllPlatforms,
  getAllTags,
} from '@/src/data/repository';
import { SearchFilters as SearchFiltersType } from '@/src/data/types';
import { siteConfig } from '@/src/config/site';
import { SearchBarHeader } from '@/src/components/search/search-bar-header';
import { SearchFilters } from '@/src/components/search/search-filters';
import { SearchResultRow } from '@/src/components/search/search-result-row';
import { LinkLookupView } from '@/src/components/search/link-lookup-view';
import { SearchNoResults } from '@/src/components/search/search-no-results';
import { SearchPagination } from '@/src/components/search/search-pagination';

interface SearchPageProps {
  searchParams: Promise<{
    q?: string;
    platform?: string;
    lang?: string;
    tag?: string;
    year?: string;
    status?: string;
    episodes?: string;
    sort?: string;
    page?: string;
  }>;
}

export async function generateMetadata({
  searchParams,
}: SearchPageProps): Promise<Metadata> {
  const params = await searchParams;
  const q = params.q?.trim();

  const title = q
    ? `"${q}" - Search Results`
    : 'Browse & Search Short Dramas';

  const description = q
    ? `Search results and multilingual aliases for "${q}" across official short drama platforms.`
    : 'Search multilingual titles, Chinese duanju aliases, and official watch links on the short drama database.';

  return {
    title,
    description,
    robots: {
      index: false,
      follow: true,
    },
    alternates: {
      canonical: `${siteConfig.baseUrl}/search`,
    },
    openGraph: {
      title: `${title} | ${siteConfig.name}`,
      description,
    },
  };
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const params = await searchParams;
  const q = params.q?.trim() || '';
  const page = params.page ? parseInt(params.page, 10) : 1;
  const sort = params.sort || 'relevance';

  const filters: SearchFiltersType = {
    platform: params.platform,
    language: params.lang,
    tag: params.tag,
    year: params.year ? parseInt(params.year, 10) : undefined,
    status: params.status,
    episodeRange: params.episodes,
  };

  const [searchResult, platforms, tags] = await Promise.all([
    searchSeries({
      query: q,
      filters,
      sort,
      page,
      pageSize: 10,
    }),
    getAllPlatforms(),
    getAllTags(),
  ]);

  return (
    <div className="space-y-6 pb-12">
      {/* Top Search & Filter Bar */}
      <SearchBarHeader
        initialQuery={q}
        totalResults={searchResult.total}
        platforms={platforms}
        tags={tags}
      />

      {/* Main Content Grid: Desktop Left Rail + Results */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start pt-2">
        {/* Desktop Left Rail Filters */}
        <aside className="hidden lg:block lg:col-span-4 xl:col-span-3 p-4 bg-[var(--surface)] border border-[var(--line)] rounded-[12px]">
          <SearchFilters platforms={platforms} tags={tags} />
        </aside>

        {/* Results Area */}
        <div className="lg:col-span-8 xl:col-span-9 space-y-4">
          {/* Link Lookup Flow */}
          {searchResult.isUrlSearch && searchResult.urlLookupResult ? (
            <LinkLookupView lookupResult={searchResult.urlLookupResult} />
          ) : searchResult.items.length > 0 ? (
            /* Regular Results List */
            <div className="border-t border-[var(--line)]">
              {searchResult.items.map((item) => (
                <SearchResultRow key={item.series.id} item={item} />
              ))}

              {/* Pagination */}
              <div className="pt-6">
                <SearchPagination
                  currentPage={searchResult.page}
                  totalPages={searchResult.totalPages}
                />
              </div>
            </div>
          ) : (
            /* No Results State */
            <SearchNoResults query={q} />
          )}
        </div>
      </div>
    </div>
  );
}
