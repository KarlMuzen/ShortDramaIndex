import React from 'react';
import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import Link from 'next/link';
import { getTagBySlug, getSeriesByTag } from '@/src/data/repository';
import { siteConfig } from '@/src/config/site';
import { titlePath, tagPath } from '@/src/lib/urls';
import { Breadcrumb } from '@/src/components/ui/breadcrumb';
import { Poster } from '@/src/components/ui/poster';
import { Pagination } from '@/src/components/ui/pagination';
import { EmptyState } from '@/src/components/ui/empty-state';
import { Hash, Star } from 'lucide-react';

export const revalidate = 3600;

interface TagPageProps {
  params: Promise<{
    slug: string;
  }>;
  searchParams: Promise<{
    page?: string;
    sort?: string;
  }>;
}

export async function generateMetadata({
  params,
  searchParams,
}: TagPageProps): Promise<Metadata> {
  const { slug } = await params;
  const sp = await searchParams;
  const page = parseInt(sp.page || '1', 10);
  const data = await getTagBySlug(slug);

  if (!data) return { title: 'Tag Not Found' };

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
  const page = parseInt(sp.page || '1', 10);
  const sort = sp.sort || 'popularity';

  const tagData = await getTagBySlug(slug);
  if (!tagData) {
    notFound();
  }

  const { tag, description } = tagData;
  const seriesResult = await getSeriesByTag(slug, page, 12, sort);
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
    <div className="space-y-8 pb-16 text-left max-w-5xl mx-auto">
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

      {/* Header Section */}
      <header className="p-6 bg-[var(--surface)] border border-[var(--line)] rounded-[12px] space-y-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-[8px] bg-[var(--surface-subtle)] text-[var(--crimson)] border border-[var(--line)] flex items-center justify-center font-semibold">
            <Hash className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-[28px] font-semibold text-[var(--ink)] tracking-tight">
              {tag.name} short dramas
            </h1>
          </div>
        </div>

        <p className="text-[14px] text-[var(--muted)] leading-relaxed max-w-3xl">
          {description}
        </p>
      </header>

      {/* Results & Sort Bar */}
      <section className="space-y-4">
        <div className="flex items-baseline justify-between border-b border-[var(--line)] pb-2.5">
          <div>
            <h2 className="text-[18px] font-semibold text-[var(--ink)]">
              All titles tagged #{tag.slug}
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
                href={`/tag/${slug}?sort=popularity`}
                className={`px-2.5 py-1 rounded-[6px] transition-colors ${
                  sort === 'popularity'
                    ? 'bg-[var(--crimson)] text-white font-medium'
                    : 'text-[var(--muted)] hover:text-[var(--ink)]'
                }`}
              >
                Popular
              </Link>
              <Link
                href={`/tag/${slug}?sort=rating`}
                className={`px-2.5 py-1 rounded-[6px] transition-colors ${
                  sort === 'rating'
                    ? 'bg-[var(--crimson)] text-white font-medium'
                    : 'text-[var(--muted)] hover:text-[var(--ink)]'
                }`}
              >
                Rating
              </Link>
              <Link
                href={`/tag/${slug}?sort=newest`}
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

                  {/* Rating Badge */}
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
