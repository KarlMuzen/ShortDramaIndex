import React from 'react';
import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import Link from 'next/link';
import { getPlatformBySlug, getSeriesByPlatform, getAllPlatforms } from '@/src/data/repository';
import { siteConfig } from '@/src/config/site';
import { titlePath } from '@/src/lib/urls';
import { Breadcrumb } from '@/src/components/ui/breadcrumb';
import { Poster } from '@/src/components/ui/poster';
import { Pagination } from '@/src/components/ui/pagination';
import { EmptyState } from '@/src/components/ui/empty-state';
import { Tv, Star, ExternalLink } from 'lucide-react';

export const dynamicParams = true;
export const revalidate = 3600;

export async function generateStaticParams() {
  const platforms = await getAllPlatforms();
  return platforms.map((platform) => ({
    slug: platform.slug,
  }));
}

interface PlatformPageProps {
  params: Promise<{
    slug: string;
  }>;
  searchParams: Promise<{
    page?: string;
    sort?: string;
  }>;
}

function parsePageParam(pageParam?: string): number | null {
  if (pageParam === undefined) return 1;
  if (!/^\d+$/.test(pageParam)) return null;
  const num = parseInt(pageParam, 10);
  if (num < 1) return null;
  return num;
}

export async function generateMetadata({
  params,
  searchParams,
}: PlatformPageProps): Promise<Metadata> {
  const { slug } = await params;
  const sp = await searchParams;
  const page = parsePageParam(sp.page);

  if (page === null) {
    return { title: 'Platform not found', robots: { index: false } };
  }

  const data = await getPlatformBySlug(slug);
  if (!data) {
    return { title: 'Platform not found', robots: { index: false } };
  }

  const seriesResult = await getSeriesByPlatform(slug, page, 12);
  if (seriesResult.total > 0 && page > seriesResult.totalPages) {
    return { title: 'Platform not found', robots: { index: false } };
  }
  if (seriesResult.total === 0 && page > 1) {
    return { title: 'Platform not found', robots: { index: false } };
  }

  const titleString = `Short dramas on ${data.platform.name}`;
  const fullDesc = data.description;
  const description = fullDesc.length > 155 ? `${fullDesc.slice(0, 152)}...` : fullDesc;
  const canonicalUrl = `${siteConfig.baseUrl}/platform/${slug}${page > 1 ? `?page=${page}` : ''}`;

  return {
    title: titleString,
    description,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title: titleString,
      description,
      url: canonicalUrl,
      type: 'website',
      siteName: siteConfig.name,
    },
    twitter: {
      card: 'summary',
      title: titleString,
      description,
    },
  };
}

export default async function PlatformPage({
  params,
  searchParams,
}: PlatformPageProps) {
  const { slug } = await params;
  const sp = await searchParams;
  const page = parsePageParam(sp.page);

  if (page === null) {
    notFound();
  }

  const sort = sp.sort || 'popularity';

  const platformData = await getPlatformBySlug(slug);
  if (!platformData) {
    notFound();
  }

  const { platform, description } = platformData;
  const seriesResult = await getSeriesByPlatform(slug, page, 12, sort);

  // If page is above totalPages (when total is above 0), or page > 1 when total is 0, 404
  if (seriesResult.total > 0 && page > seriesResult.totalPages) {
    notFound();
  }
  if (seriesResult.total === 0 && page > 1) {
    notFound();
  }
  const canonicalUrl = `${siteConfig.baseUrl}/platform/${slug}${page > 1 ? `?page=${page}` : ''}`;

  // BreadcrumbList JSON-LD
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: siteConfig.baseUrl,
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: `Short dramas on ${platform.name}`,
        item: canonicalUrl,
      },
    ],
  };

  return (
    <div className="space-y-8 pb-16 text-left max-w-5xl mx-auto">
      {/* Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <Breadcrumb
        items={[
          { label: 'Home', href: '/' },
          { label: 'Platforms', href: '/search' },
          { label: platform.name, isCurrent: true },
        ]}
      />

      {/* Header Section */}
      <header className="p-6 bg-[var(--surface)] border border-[var(--line)] rounded-[12px] space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-[10px] bg-[var(--surface-subtle)] border border-[var(--line)] flex items-center justify-center text-[var(--crimson)] shrink-0">
              <Tv className="w-6 h-6" />
            </div>
            <div>
              <div className="inline-flex items-center gap-2 text-[12px] text-[var(--muted)]">
                <span>Distribution platform</span>
                {platform.official && (
                  <span className="text-[var(--status-verified)] font-semibold">
                    (Verified official)
                  </span>
                )}
              </div>
              <h1 className="text-[28px] font-semibold text-[var(--ink)] tracking-tight">
                Short dramas on {platform.name}
              </h1>
            </div>
          </div>

          <a
            href={platform.url}
            target="_blank"
            rel="noreferrer noopener"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-[13px] font-medium bg-[var(--surface)] text-[var(--ink)] border border-[var(--line)] hover:bg-[var(--surface-hover)] rounded-[8px] transition-colors self-start sm:self-center"
          >
            <span>Visit platform website</span>
            <ExternalLink className="w-3.5 h-3.5 text-[var(--muted)]" />
          </a>
        </div>

        <p className="text-[14px] text-[var(--muted)] leading-relaxed max-w-3xl">
          {description}
        </p>

        <div className="pt-2 border-t border-[var(--line)] text-[12px] text-[var(--muted)]">
          {siteConfig.name} indexes factual release metadata and direct links to official {platform.name} series pages.
        </div>
      </header>

      {/* Filter / Sort & Title List */}
      <section className="space-y-4">
        <div className="flex items-baseline justify-between border-b border-[var(--line)] pb-2.5">
          <div>
            <h2 className="text-[18px] font-semibold text-[var(--ink)]">
              All releases on {platform.name}
            </h2>
            <p className="text-[13px] text-[var(--muted)] mt-0.5">
              Showing {seriesResult.total} indexed titles
            </p>
          </div>

          {/* Sort Controls */}
          <div className="flex items-center gap-2">
            <span className="text-[12px] text-[var(--muted)]">Sort:</span>
            <div className="flex items-center gap-1 text-[13px]">
              <Link
                href={`/platform/${slug}?sort=popularity`}
                className={`px-2.5 py-1 rounded-[6px] transition-colors ${
                  sort === 'popularity'
                    ? 'bg-[var(--crimson)] text-white font-medium'
                    : 'text-[var(--muted)] hover:text-[var(--ink)]'
                }`}
              >
                Popular
              </Link>
              <Link
                href={`/platform/${slug}?sort=rating`}
                className={`px-2.5 py-1 rounded-[6px] transition-colors ${
                  sort === 'rating'
                    ? 'bg-[var(--crimson)] text-white font-medium'
                    : 'text-[var(--muted)] hover:text-[var(--ink)]'
                }`}
              >
                Rating
              </Link>
              <Link
                href={`/platform/${slug}?sort=newest`}
                className={`px-2.5 py-1 rounded-[6px] transition-colors ${
                  sort === 'newest'
                    ? 'bg-[var(--crimson)] text-white font-medium'
                    : 'text-[var(--muted)] hover:text-[var(--ink)]'
                }`}
              >
                Newest
              </Link>
            </div>
          </div>
        </div>

        {seriesResult.items.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
            {seriesResult.items.map((series, idx) => (
              <div
                key={series.id}
                className="group flex flex-col space-y-2 text-left"
              >
                <Link
                  href={titlePath(series)}
                  className="block aspect-[9/16] rounded-[8px] overflow-hidden relative border border-[var(--line)] group-hover:border-[var(--line-strong)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--crimson)]"
                >
                  <Poster
                    title={series.title}
                    year={series.year}
                    episodeCount={series.episodeCount}
                    className="w-full h-full object-cover"
                    priority={idx === 0}
                  />

                  {/* Rating Tag */}
                  {series.ratingScore > 0 && (
                    <div className="absolute bottom-1.5 left-1.5 bg-[var(--ink)] text-[var(--paper)] text-[12px] font-semibold px-1.5 py-0.5 rounded-[4px] flex items-center gap-1 tabular-nums">
                      <Star className="w-3 h-3 fill-[var(--crimson)] text-[var(--crimson)]" />
                      <span>{series.ratingScore.toFixed(1)}</span>
                    </div>
                  )}
                </Link>

                <div className="space-y-0.5">
                  <Link
                    href={titlePath(series)}
                    className="font-semibold text-[14px] text-[var(--ink)] group-hover:text-[var(--crimson)] line-clamp-2 leading-snug transition-colors"
                  >
                    {series.title}
                  </Link>

                  <div className="flex items-center gap-2 text-[12px] text-[var(--muted)] tabular-nums">
                    <span>{series.year}</span>
                    <span>{series.episodeCount} eps</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState
            title={`No titles indexed on ${platform.name}`}
            description="We haven't indexed any active releases for this platform yet."
          />
        )}

        {/* Pagination */}
        {seriesResult.totalPages > 1 && (
          <div className="pt-6">
            <Pagination
              currentPage={seriesResult.page}
              totalPages={seriesResult.totalPages}
              baseUrl={`/platform/${slug}?sort=${sort}`}
            />
          </div>
        )}
      </section>
    </div>
  );
}
