import { Metadata } from 'next';
import Link from 'next/link';
import { getHomePageFeed } from '@/src/data/repository';
import { getLanguageName } from '@/src/lib/languages';
import { siteConfig } from '@/src/config/site';
import { titlePath, tagPath, platformPath } from '@/src/lib/urls';
import { Poster } from '@/src/components/ui/poster';
import { EmptyState } from '@/src/components/ui/empty-state';
import { HeroSearch } from '@/src/components/home/hero-search';
import { Star } from 'lucide-react';

export const revalidate = 300;

export const metadata: Metadata = {
  title: siteConfig.name,
  description: `${siteConfig.name} is the reference database for short dramas, cataloging all names, aliases, and official where-to-watch sources.`,
  alternates: {
    canonical: siteConfig.baseUrl,
  },
  openGraph: {
    title: siteConfig.name,
    description: `${siteConfig.name} is the reference database for short dramas, cataloging all names, aliases, and official where-to-watch sources.`,
    url: siteConfig.baseUrl,
    siteName: siteConfig.name,
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: siteConfig.name,
    description: `${siteConfig.name} is the reference database for short dramas, cataloging all names, aliases, and official where-to-watch sources.`,
  },
};

function formatAbsoluteDate(dateStr: string): string {
  try {
    const parts = dateStr.split('T')[0].split('-');
    if (parts.length < 3) return dateStr;
    const year = parseInt(parts[0], 10);
    const monthIndex = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);
    const months = [
      'Jan',
      'Feb',
      'Mar',
      'Apr',
      'May',
      'Jun',
      'Jul',
      'Aug',
      'Sep',
      'Oct',
      'Nov',
      'Dec',
    ];
    const month = months[monthIndex];
    if (!month || isNaN(day) || isNaN(year)) return dateStr;
    return `${day} ${month} ${year}`;
  } catch {
    return dateStr;
  }
}

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
    <div className="space-y-10 pb-8 text-left">
      {/* Schema.org Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }}
      />

      {/* Hero Section */}
      <HeroSearch />

      {/* Section 1: Popular */}
      <section aria-labelledby="popular-heading" className="space-y-4">
        <div className="flex items-baseline justify-between border-b border-[var(--line)] pb-2">
          <h2
            id="popular-heading"
            className="text-[17px] sm:text-[18px] font-semibold text-[var(--ink)]"
          >
            Popular
          </h2>
          <Link
            href="/search?sort=popularity"
            className="text-[13px] text-[var(--muted)] hover:text-[var(--crimson)] transition-colors"
          >
            View all
          </Link>
        </div>

        {popularThisWeek.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4">
            {popularThisWeek.map((series, idx) => (
              <Link
                key={series.id}
                href={titlePath(series)}
                className="group flex flex-col focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--crimson)] rounded-[12px]"
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
                  <h3 className="text-[14px] font-semibold text-[var(--ink)] leading-snug line-clamp-2 break-words group-hover:text-[var(--crimson)] transition-colors">
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
            title="No popular short dramas yet"
            description="Titles added to lists and receiving search queries will appear here."
          />
        )}
      </section>

      {/* Section 2: Recently added names */}
      <section aria-labelledby="aliases-heading" className="space-y-4">
        <div className="flex items-baseline justify-between border-b border-[var(--line)] pb-2">
          <h2
            id="aliases-heading"
            className="text-[17px] sm:text-[18px] font-semibold text-[var(--ink)]"
          >
            Recently added names
          </h2>
          <span className="text-[12px] text-[var(--muted)]">Verified alternate titles</span>
        </div>

        {recentlyAddedAliases.length > 0 ? (
          <div className="divide-y divide-[var(--line)] border-b border-[var(--line)] text-[13px]">
            {recentlyAddedAliases.map((item, idx) => {
              const langName = getLanguageName(item.alias.language);
              return (
                <div
                  key={idx}
                  className="py-2.5 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1"
                >
                  <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5 min-w-0">
                    <span
                      lang={item.alias.language}
                      className="font-medium text-[var(--ink)]"
                    >
                      {item.alias.text}
                    </span>
                    <span className="text-[12px] text-[var(--muted)]">
                      {langName} [{item.alias.language}]
                    </span>
                    <span className="text-[var(--muted)]">
                      on{' '}
                      <Link
                        href={titlePath({ slug: item.seriesSlug, shortId: item.seriesShortId })}
                        className="text-[var(--ink)] font-medium hover:text-[var(--crimson)] hover:underline"
                      >
                        {item.seriesTitle}
                      </Link>
                    </span>
                  </div>

                  {item.addedAt && (
                    <span className="text-[12px] text-[var(--muted)] tabular-nums shrink-0">
                      {formatAbsoluteDate(item.addedAt)}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <EmptyState
            title="No recent aliases added"
            description="Contributions from community members will appear here."
          />
        )}
      </section>

      {/* Section 3: Browse by Tag, Platform & Language */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Browse by Tag */}
        <section aria-labelledby="tags-heading" className="space-y-3">
          <div className="border-b border-[var(--line)] pb-2">
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
                {typeof tag.count === 'number' && (
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
          <div className="border-b border-[var(--line)] pb-2">
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

        {/* Browse by Language */}
        <section aria-labelledby="languages-heading" className="space-y-3">
          <div className="border-b border-[var(--line)] pb-2">
            <h2 id="languages-heading" className="text-[16px] font-semibold text-[var(--ink)]">
              Browse by original language
            </h2>
          </div>

          <div className="flex flex-wrap gap-2 pt-1">
            {browseLanguages.map((lang) => (
              <Link
                key={lang.code}
                href={`/search?lang=${lang.code}`}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[var(--surface)] border border-[var(--line)] rounded-[8px] text-[13px] text-[var(--ink)] hover:border-[var(--crimson)] hover:text-[var(--crimson)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--crimson)]"
              >
                <span>{lang.label}</span>
                {lang.nativeLabel && lang.nativeLabel !== lang.label && (
                  <span className="text-[11px] text-[var(--muted)]">
                    ({lang.nativeLabel})
                  </span>
                )}
                {typeof lang.count === 'number' && (
                  <span className="text-[11px] text-[var(--muted)] tabular-nums">
                    {lang.count}
                  </span>
                )}
              </Link>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
