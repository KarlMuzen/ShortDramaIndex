import React from 'react';
import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import Link from 'next/link';
import { getTagBySlug, getSeriesByTag, getAllTags } from '@/src/data/repository';
import { siteConfig } from '@/src/config/site';
import { titlePath } from '@/src/lib/urls';
import { Breadcrumb } from '@/src/components/ui/breadcrumb';
import { Poster } from '@/src/components/ui/poster';
import { Pagination } from '@/src/components/ui/pagination';
import { SortSelect } from '@/src/components/ui/sort-select';
import { EmptyState } from '@/src/components/ui/empty-state';
import { Star } from 'lucide-react';

interface TagPageProps {
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
}: TagPageProps): Promise<Metadata> {
  const { slug } = await params;
  const sp = await searchParams;
  const page = parsePageParam(sp.page);

  if (page === null) {
    return { title: 'Tag not found', robots: { index: false } };
  }

  const data = await getTagBySlug(slug);
  if (!data) {
    return { title: 'Tag not found', robots: { index: false } };
  }

  const seriesResult = await getSeriesByTag(slug, page, 12);
  if (seriesResult.total > 0 && page > seriesResult.totalPages) {
    return { title: 'Tag not found', robots: { index: false } };
  }
  if (seriesResult.total === 0 && page > 1) {
    return { title: 'Tag not found', robots: { index: false } };
  }

  const titleString = `${data.tag.name} short dramas`;
  const fullDesc = data.description;
  const description = fullDesc.length > 155 ? `${fullDesc.slice(0, 152)}...` : fullDesc;
  const canonicalUrl = `${siteConfig.baseUrl}/tag/${slug}${page > 1 ? `?page=${page}` : ''}`;

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

export default async function TagPage({
  params,
  searchParams,
}: TagPageProps) {
  const { slug } = await params;
  const sp = await searchParams;
  const page = parsePageParam(sp.page);

  if (page === null) {
    notFound();
  }

  const sort = sp.sort || 'popularity';

  const tagData = await getTagBySlug(slug);
  if (!tagData) {
    notFound();
  }

  const { tag, description } = tagData;
  const seriesResult = await getSeriesByTag(slug, page, 12, sort);

  // If page is above totalPages (when total is above 0), or page > 1 when total is 0, 404
  if (seriesResult.total > 0 && page > seriesResult.totalPages) {
    notFound();
  }
  if (seriesResult.total === 0 && page > 1) {
    notFound();
  }
  const canonicalUrl = `${siteConfig.baseUrl}/tag/${slug}${page > 1 ? `?page=${page}` : ''}`;

  // BreadcrumbList Structured Data
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
        name: `${tag.name} short dramas`,
        item: canonicalUrl,
      },
    ],
  };

  return (
    <div className="space-y-6 pb-16 text-left max-w-5xl mx-auto">
      {/* Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <Breadcrumb
        items={[
          { label: 'Home', href: '/' },
          { label: 'Tags', href: '/search' },
          { label: tag.name, isCurrent: true },
        ]}
      />

      {/* Header Section (Uncarded, no icon tile) */}
      <header className="space-y-2 border-b border-[var(--line)] pb-4 text-left">
        <h1 className="text-[28px] font-semibold text-[var(--ink)] tracking-tight">
          {tag.name} short dramas
        </h1>
        {description && (
          <p className="text-[14px] text-[var(--muted)] leading-relaxed max-w-3xl">
            {description}
          </p>
        )}
      </header>

      {/* Results & Sort Controls */}
      <section className="space-y-4">
        {/* Count on its own line */}
        <div className="text-[13px] text-[var(--muted)]">
          <span className="tabular-nums font-semibold text-[var(--ink)]">{seriesResult.total}</span>{' '}
          {seriesResult.total === 1 ? 'short drama' : 'short dramas'}
        </div>

        {/* Sort selector below the count */}
        <div className="flex items-center justify-end pb-2">
          <SortSelect currentSort={sort} />
        </div>

        {seriesResult.items.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4">
            {seriesResult.items.map((series, idx) => (
              <Link
                key={series.id}
                href={titlePath(series)}
                className="group flex flex-col focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--crimson)] rounded-[12px] text-left"
              >
                <div className="mb-2">
                  <Poster
                    title={series.title}
                    src={series.posterUrl}
                    className="group-hover:border-[var(--line-strong)] transition-colors"
                    priority={idx === 0}
                  />
                </div>

                <div className="flex flex-col flex-1">
                  <h3 className="text-[14px] font-semibold text-[var(--ink)] leading-snug line-clamp-2 group-hover:text-[var(--crimson)] transition-colors">
                    {series.title}
                  </h3>
                  <div className="flex items-center gap-2 text-[12px] text-[var(--muted)] tabular-nums mt-1">
                    <span>{series.year}</span>
                    <span>{series.episodeCount} eps</span>
                    {series.ratingScore > 0 && (
                      <span className="inline-flex items-center gap-1 text-[var(--ink)] font-semibold">
                        <Star className="w-3 h-3 fill-[var(--crimson)] text-[var(--crimson)] shrink-0" />
                        {series.ratingScore.toFixed(1)}
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <EmptyState
            title={`No titles tagged with "${tag.name}"`}
            description="We haven't indexed any titles under this category yet."
          />
        )}

        {/* Pagination */}
        {seriesResult.totalPages > 1 && (
          <div className="pt-6">
            <Pagination
              currentPage={seriesResult.page}
              totalPages={seriesResult.totalPages}
              baseUrl={`/tag/${slug}?sort=${sort}`}
            />
          </div>
        )}
      </section>
    </div>
  );
}
