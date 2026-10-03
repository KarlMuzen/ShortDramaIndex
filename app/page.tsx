import { Metadata } from 'next';
import Link from 'next/link';
import { getHomePageFeed } from '@/src/data/repository';
import { siteConfig } from '@/src/config/site';
import { titlePath, tagPath, platformPath } from '@/src/lib/urls';
import { Poster } from '@/src/components/ui/poster';
import { EmptyState } from '@/src/components/ui/empty-state';
import { HeroSearch } from '@/src/components/home/hero-search';
import { Sparkles, Clock, Globe2, Tag as TagIcon, Tv } from 'lucide-react';

export const metadata: Metadata = {
  title: siteConfig.name,
  description: `${siteConfig.name} is the reference database for short vertical dramas, cataloging all names, aliases, and official where-to-watch sources.`,
  alternates: {
    canonical: siteConfig.baseUrl,
  },
  openGraph: {
    title: siteConfig.name,
    description: `${siteConfig.name} is the reference database for short vertical dramas, cataloging all names, aliases, and official where-to-watch sources.`,
    url: siteConfig.baseUrl,
    siteName: siteConfig.name,
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: siteConfig.name,
    description: `${siteConfig.name} is the reference database for short vertical dramas, cataloging all names, aliases, and official where-to-watch sources.`,
  },
};

export default async function HomePage() {
  const {
    popularThisWeek,
    recentlyAddedAliases,
    browseTags,
    browsePlatforms,
    browseLanguages,
  } = await getHomePageFeed();

  // Structured Data (JSON-LD) for WebSite and Organization
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebSite',
        '@id': `${siteConfig.baseUrl}/#website`,
        url: siteConfig.baseUrl,
        name: siteConfig.name,
        description: siteConfig.description,
        potentialAction: {
          '@type': 'SearchAction',
          target: {
            '@type': 'EntryPoint',
            urlTemplate: `${siteConfig.baseUrl}/search?q={search_term_string}`,
          },
          'query-input': 'required name=search_term_string',
        },
        inLanguage: 'en',
      },
      {
        '@type': 'Organization',
        '@id': `${siteConfig.baseUrl}/#organization`,
        name: siteConfig.name,
        url: siteConfig.baseUrl,
        logo: `${siteConfig.baseUrl}/favicon.ico`,
        description: siteConfig.description,
      },
    ],
  };

  return (
    <div className="space-y-10 pb-8">
      {/* Schema.org Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Hero Section */}
      <HeroSearch />

      {/* Section 1: Popular this week */}
      <section aria-labelledby="popular-heading" className="space-y-4 text-left">
        <div className="flex items-baseline justify-between border-b border-[var(--line)] pb-2">
          <h2
            id="popular-heading"
            className="text-[17px] sm:text-[18px] font-semibold text-[var(--ink)]"
          >
            Popular this week
          </h2>
          <Link
            href="/search?sort=popularity"
            className="text-[13px] text-[var(--muted)] hover:text-[var(--crimson)] transition-colors"
          >
            View all
          </Link>
        </div>

        {popularThisWeek.length > 0 ? (
          <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
            {popularThisWeek.map((series, idx) => (
              <Link
                key={series.id}
                href={titlePath(series)}
                className="group flex flex-col focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--crimson)] rounded-[12px]"
              >
                <div className="mb-2">
                  <Poster
                    title={series.title}
                    year={series.year}
                    episodeCount={series.episodeCount}
                    className="group-hover:border-[var(--line-strong)]"
                    priority={idx === 0}
                  />
                </div>

                <div className="flex flex-col flex-1">
                  <h3 className="text-[13px] font-semibold text-[var(--ink)] leading-snug line-clamp-2 group-hover:text-[var(--crimson)] transition-colors">
                    {series.title}
                  </h3>
                  <span className="text-[12px] text-[var(--muted)] tabular-nums mt-0.5">
                    {series.episodeCount} eps
                  </span>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <EmptyState
            title="No popular short dramas yet"
            description="Titles added to lists and receiving search queries will appear here."
          />
        )}
      </section>

      {/* Section 2: Recently added names */}
      <section aria-labelledby="aliases-heading" className="space-y-4 text-left">
        <div className="flex items-baseline justify-between border-b border-[var(--line)] pb-2">
          <h2
            id="aliases-heading"
            className="text-[17px] sm:text-[18px] font-semibold text-[var(--ink)]"
          >
            Recently added names
          </h2>
          <span className="text-[12px] text-[var(--muted)]">Community contributions</span>
        </div>

        {recentlyAddedAliases.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {recentlyAddedAliases.map((item, idx) => (
              <div
                key={idx}
                className="p-3.5 bg-[var(--surface)] border border-[var(--line)] rounded-[8px] hover:border-[var(--line-strong)] transition-colors flex flex-col justify-between space-y-2"
              >
                <div className="space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <span
                      lang={item.alias.language}
                      className="font-medium text-[14px] text-[var(--ink)] line-clamp-1"
                    >
                      {item.alias.text}
                    </span>
                    <span className="text-[11px] font-mono uppercase px-1.5 py-0.5 bg-[var(--surface-subtle)] border border-[var(--line)] rounded text-[var(--muted)] shrink-0">
                      {item.alias.language}
                    </span>
                  </div>

                  <p className="text-[12px] text-[var(--muted)] line-clamp-1">
                    Added to:{' '}
                    <Link
                      href={`/title/${item.seriesId}-${item.seriesSlug}`}
                      className="text-[var(--ink)] font-medium hover:text-[var(--crimson)] hover:underline"
                    >
                      {item.seriesTitle}
                    </Link>
                  </p>
                </div>

                <div className="flex items-center justify-between text-[11px] text-[var(--muted)] pt-1 border-t border-[var(--line)]">
                  <span>Source: {item.alias.source || 'Community'}</span>
                  {item.alias.addedAt && (
                    <span className="tabular-nums">{item.alias.addedAt}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState
            title="No recent aliases added"
            description="Contributions from community members will appear here."
          />
        )}
      </section>

      {/* Section 3: Browse by Tag & Platform */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-left">
        {/* Browse by Tag */}
        <section aria-labelledby="tags-heading" className="space-y-3">
          <div className="flex items-center gap-2 border-b border-[var(--line)] pb-2">
            <TagIcon className="w-4 h-4 text-[var(--muted)]" />
            <h2 id="tags-heading" className="text-[16px] font-semibold text-[var(--ink)]">
              Browse by trope or tag
            </h2>
          </div>

          <div className="flex flex-wrap gap-2 pt-1">
            {browseTags.map((tag) => (
              <Link
                key={tag.slug}
                href={tagPath(tag.slug)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[var(--surface)] border border-[var(--line)] rounded-[8px] text-[13px] text-[var(--ink)] hover:border-[var(--crimson)] hover:text-[var(--crimson)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--crimson)]"
              >
                <span>{tag.name}</span>
                {tag.count && (
                  <span className="text-[11px] text-[var(--muted)] tabular-nums">
                    {tag.count}
                  </span>
                )}
              </Link>
            ))}
          </div>
        </section>

        {/* Browse by Platform */}
        <section aria-labelledby="platforms-heading" className="space-y-3">
          <div className="flex items-center gap-2 border-b border-[var(--line)] pb-2">
            <Tv className="w-4 h-4 text-[var(--muted)]" />
            <h2 id="platforms-heading" className="text-[16px] font-semibold text-[var(--ink)]">
              Browse by platform
            </h2>
          </div>

          <div className="flex flex-wrap gap-2 pt-1">
            {browsePlatforms.map((plat) => (
              <Link
                key={plat.slug}
                href={platformPath(plat.slug)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[var(--surface)] border border-[var(--line)] rounded-[8px] text-[13px] text-[var(--ink)] hover:border-[var(--crimson)] hover:text-[var(--crimson)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--crimson)]"
              >
                <span>{plat.name}</span>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
