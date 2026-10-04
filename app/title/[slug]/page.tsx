import React from 'react';
import { notFound, permanentRedirect } from 'next/navigation';
import { Metadata } from 'next';
import Link from 'next/link';
import {
  getSeriesById,
  getRelatedSeries,
  checkRedirect,
  getAllSeries,
} from '@/src/data/repository';
import { getLanguageName } from '@/src/lib/languages';
import { getCountryName } from '@/src/lib/countries';
import { parseTitleParam, titlePath, personPath, tagPath } from '@/src/lib/urls';
import { siteConfig } from '@/src/config/site';
import { Breadcrumb } from '@/src/components/ui/breadcrumb';
import { Poster } from '@/src/components/ui/poster';
import { Tag } from '@/src/components/ui/tag';
import { TitleActions } from '@/src/components/title/title-actions';
import { SynopsisExpand } from '@/src/components/title/synopsis-expand';
import { AliasLedger } from '@/src/components/title/alias-ledger';
import { WhereToWatch } from '@/src/components/title/where-to-watch';
import { TitleNav } from '@/src/components/title/title-nav';
import { CommunityStats } from '@/src/components/title/community-stats';
import { TitleFooterHistory } from '@/src/components/title/title-footer-history';

export const dynamicParams = true;
export const revalidate = 3600;

export async function generateStaticParams() {
  const seriesList = await getAllSeries();
  return seriesList.map((series) => ({
    slug: `${series.id}-${series.slug}`,
  }));
}

interface TitlePageProps {
  params: Promise<{
    slug: string;
  }>;
}

export async function generateMetadata({
  params,
}: TitlePageProps): Promise<Metadata> {
  const { slug } = await params;
  const id = parseTitleParam(slug);
  if (!id) {
    return {
      title: 'Drama not found',
      robots: { index: false },
    };
  }

  // Check redirect
  const redirectTargetId = await checkRedirect(id);
  if (redirectTargetId) {
    const target = await getSeriesById(redirectTargetId);
    if (target) {
      return {
        title: `${target.title} (${target.year}): names and where to watch`,
        alternates: {
          canonical: `${siteConfig.baseUrl}${titlePath(target)}`,
        },
      };
    }
  }

  const series = await getSeriesById(id);
  if (!series) {
    return {
      title: 'Drama not found',
      robots: { index: false },
    };
  }

  // Description formula: "{canonical title}, {episode count} episodes. Also known as {up to 3 aliases, one per language}. Where to watch: {up to 3 platforms}."
  const seenLangs = new Set<string>();
  const uniqueLangAliases: string[] = [];
  for (const a of series.aliases) {
    if (!seenLangs.has(a.language)) {
      seenLangs.add(a.language);
      uniqueLangAliases.push(a.text);
      if (uniqueLangAliases.length === 3) break;
    }
  }
  const aliasesString = uniqueLangAliases.join(', ') || 'unlisted';
  const platforms =
    Array.from(new Set(series.releases.map((r) => r.platform)))
      .slice(0, 3)
      .join(', ') || 'official platforms';

  const fullDesc = `${series.title}, ${series.episodeCount} episodes. Also known as ${aliasesString}. Where to watch: ${platforms}.`;
  const description = fullDesc.length > 155 ? `${fullDesc.slice(0, 152)}...` : fullDesc;

  const canonicalUrl = `${siteConfig.baseUrl}${titlePath(series)}`;
  const titleString = `${series.title} (${series.year}): names and where to watch`;

  const isNoIndex = (!series.synopsis && series.releases.length === 0) || series.visibility === 'hidden';

  return {
    title: titleString,
    description,
    alternates: {
      canonical: canonicalUrl,
    },
    robots: isNoIndex
      ? { index: false, follow: true }
      : { index: true, follow: true },
    openGraph: {
      title: titleString,
      description,
      url: canonicalUrl,
      type: 'video.tv_show',
      siteName: siteConfig.name,
    },
    twitter: {
      card: 'summary',
      title: titleString,
      description,
    },
  };
}

export default async function TitlePage({ params }: TitlePageProps) {
  const { slug } = await params;
  const id = parseTitleParam(slug);

  if (!id) {
    notFound();
  }

  // Check if title has been merged into another canonical entry
  const redirectTargetId = await checkRedirect(id);
  if (redirectTargetId) {
    const target = await getSeriesById(redirectTargetId);
    if (target) {
      permanentRedirect(titlePath(target));
    }
  }

  const series = await getSeriesById(id);
  if (!series) {
    notFound();
  }

  // Canonical slug validation: permanent redirect if slug is missing or outdated
  const expectedParam = `${series.id}-${series.slug}`;
  if (slug !== expectedParam) {
    permanentRedirect(titlePath(series));
  }

  const relatedSeries = await getRelatedSeries(series.id, 6);
  const firstTag = series.tags[0];
  const primaryOriginalAlias = series.aliases.find(
    (a) => a.language === series.originalLanguage
  );
  const originalLangName = getLanguageName(series.originalLanguage);
  const originCountryName = series.originCountry
    ? getCountryName(series.originCountry)
    : undefined;

  // Check if releases have differing episode counts
  const distinctEpisodeCounts = Array.from(
    new Set(series.releases.map((r) => r.episodeCount).filter(Boolean))
  );
  const hasDifferingEpisodeCounts = distinctEpisodeCounts.length > 1;

  // Cast and crew separation
  const castMembers = series.cast?.filter((c) => c.roleType === 'actor') || [];
  const crewMembers = series.cast?.filter((c) => c.roleType !== 'actor') || [];

  // Structured Data (JSON-LD)
  const allAliasTexts = series.aliases.map((a) => a.text);
  const canonicalUrl = `${siteConfig.baseUrl}${titlePath(series)}`;

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'TVSeries',
        '@id': `${canonicalUrl}/#series`,
        url: canonicalUrl,
        name: series.title,
        alternateName: allAliasTexts,
        numberOfEpisodes: series.episodeCount,
        inLanguage: series.originalLanguage,
        ...(originCountryName
          ? {
              countryOfOrigin: {
                '@type': 'Country',
                name: originCountryName,
              },
            }
          : {}),
        genre: series.tags.map((t) => t.name),
        datePublished: String(series.year),
        description: series.synopsis,
        actor: series.cast.map((c) => ({
          '@type': 'Person',
          name: c.person.name,
          url: `${siteConfig.baseUrl}${personPath(c.person)}`,
        })),
        ...(series.ratingCount >= 10
          ? {
              aggregateRating: {
                '@type': 'AggregateRating',
                ratingValue: series.ratingScore,
                ratingCount: series.ratingCount,
                bestRating: 10,
                worstRating: 1,
              },
            }
          : {}),
      },
      {
        '@type': 'BreadcrumbList',
        '@id': `${canonicalUrl}/#breadcrumb`,
        itemListElement: [
          {
            '@type': 'ListItem',
            position: 1,
            name: 'Home',
            item: siteConfig.baseUrl,
          },
          ...(firstTag
            ? [
                {
                  '@type': 'ListItem',
                  position: 2,
                  name: `${firstTag.name} Short Dramas`,
                  item: `${siteConfig.baseUrl}${tagPath(firstTag.slug)}`,
                },
                {
                  '@type': 'ListItem',
                  position: 3,
                  name: series.title,
                  item: canonicalUrl,
                },
              ]
            : [
                {
                  '@type': 'ListItem',
                  position: 2,
                  name: series.title,
                  item: canonicalUrl,
                },
              ]),
        ],
      },
    ],
  };

  return (
    <div className="space-y-6 pb-16 text-left">
      {/* Structured Data Script */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Breadcrumb Navigation */}
      <Breadcrumb
        items={[
          { label: 'Home', href: '/' },
          ...(firstTag
            ? [{ label: `${firstTag.name}`, href: tagPath(firstTag.slug) }]
            : []),
          { label: series.title, isCurrent: true },
        ]}
      />

      {/* Mobile Title & Poster Block (single column with small Poster beside title block) */}
      <div className="lg:hidden space-y-4">
        <div className="flex gap-4 items-start">
          <div className="w-24 sm:w-28 shrink-0">
            <Poster
              title={series.title}
              year={series.year}
              episodeCount={series.episodeCount}
              priority={true}
              className="w-full"
            />
          </div>
          <div className="flex-1 min-w-0 space-y-1.5">
            <h1 className="text-[22px] sm:text-[26px] font-semibold text-[var(--ink)] tracking-tight leading-tight">
              {series.title}
            </h1>
            {primaryOriginalAlias && (
              <p className="text-[13px] text-[var(--ink)]">
                <span className="text-[var(--muted)] text-[11px] mr-1.5">{originalLangName}:</span>
                <span lang={series.originalLanguage}>{primaryOriginalAlias.text}</span>
              </p>
            )}
            {series.romanizedTitle && (
              <p className="text-[11px] text-[var(--muted)]">
                <span className="mr-1.5">Romanized:</span>
                <span>{series.romanizedTitle}</span>
              </p>
            )}
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] text-[var(--muted)] pt-1 border-t border-[var(--line)]">
              <span className="tabular-nums font-semibold text-[var(--ink)]">{series.year}</span>
              {originCountryName && <span>{originCountryName}</span>}
              <span className="tabular-nums">{series.episodeCount} episodes</span>
              {series.avgEpisodeMinutes ? (
                <span className="tabular-nums">{series.avgEpisodeMinutes} min per episode</span>
              ) : null}
              {series.productionStatus && (
                <span className="capitalize">{series.productionStatus}</span>
              )}
            </div>
          </div>
        </div>

        {/* Mobile Actions */}
        <TitleActions series={series} />

        {/* Mobile Synopsis */}
        <div className="pt-2 border-t border-[var(--line)]">
          <SynopsisExpand synopsis={series.synopsis} />
        </div>

        {/* Mobile Tags */}
        {series.tags && series.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 items-center">
            <span className="text-[12px] text-[var(--muted)] mr-1">Tags:</span>
            {series.tags.map((tag) => (
              <Link key={tag.slug} href={tagPath(tag.slug)}>
                <Tag size="sm" variant="subtle">
                  {tag.name}
                </Tag>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Two-Column Layout (1024px and up): Left column 320px sticky, Right column content */}
      <div className="flex flex-col lg:flex-row gap-8 lg:gap-10 items-start">
        {/* Left Column: 320px sticky below header, containing only Poster and TitleActions */}
        <aside className="hidden lg:block lg:w-[320px] lg:shrink-0 space-y-4 lg:sticky lg:top-20">
          <Poster
            title={series.title}
            year={series.year}
            episodeCount={series.episodeCount}
            priority={true}
            className="w-full"
          />
          <TitleActions series={series} />
        </aside>

        {/* Right Column: title block, synopsis, tags, then the sections */}
        <div className="flex-1 min-w-0 w-full space-y-8">
          {/* Desktop Title Header Block (no card, no background, border or radius) */}
          <div className="hidden lg:block space-y-3">
            <h1 className="text-[32px] font-semibold text-[var(--ink)] tracking-tight leading-tight">
              {series.title}
            </h1>

            <div className="space-y-0.5 text-[14px]">
              {primaryOriginalAlias && (
                <p className="text-[var(--ink)] font-normal">
                  <span className="text-[var(--muted)] text-[12px] mr-1.5">{originalLangName}:</span>
                  <span lang={series.originalLanguage}>{primaryOriginalAlias.text}</span>
                </p>
              )}

              {series.romanizedTitle && (
                <p className="text-[var(--muted)] text-[12px]">
                  <span className="mr-1.5">Romanized:</span>
                  <span>{series.romanizedTitle}</span>
                </p>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[14px] text-[var(--muted)] pt-1 border-t border-[var(--line)]">
              <span className="tabular-nums font-semibold text-[var(--ink)]">{series.year}</span>
              {originCountryName && <span>{originCountryName}</span>}
              <span className="tabular-nums">{series.episodeCount} episodes</span>
              {series.avgEpisodeMinutes ? (
                <span className="tabular-nums">{series.avgEpisodeMinutes} min per episode</span>
              ) : null}
              {series.productionStatus && (
                <span className="capitalize">{series.productionStatus}</span>
              )}
            </div>

            {/* Desktop Synopsis */}
            <div className="pt-3 border-t border-[var(--line)]">
              <SynopsisExpand synopsis={series.synopsis} />
            </div>

            {/* Desktop Tags */}
            {series.tags && series.tags.length > 0 && (
              <div className="pt-1 flex flex-wrap gap-1.5 items-center">
                <span className="text-[12px] text-[var(--muted)] mr-1">Tags:</span>
                {series.tags.map((tag) => (
                  <Link key={tag.slug} href={tagPath(tag.slug)}>
                    <Tag size="sm" variant="subtle">
                      {tag.name}
                    </Tag>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* In-Page Quick Nav Sticky Bar */}
          <TitleNav />

          {/* Section 1: Names ("Also Known As" Ledger) */}
          <section id="names" className="scroll-mt-16">
            <AliasLedger series={series} />
          </section>

          {/* Section 2: Where to Watch */}
          <section id="watch" className="scroll-mt-16">
            <WhereToWatch series={series} />
          </section>

          {/* Section 3: Versions */}
          {series.releases && series.releases.length > 0 && (
            <section id="versions" className="scroll-mt-16 space-y-3">
              <div className="border-b border-[var(--line)] pb-2.5">
                <h2 className="text-[17px] sm:text-[18px] font-semibold text-[var(--ink)]">
                  Versions
                </h2>
                <p className="text-[13px] text-[var(--muted)] mt-0.5">
                  Release variations, dub languages, and episode count formats
                </p>
              </div>

              <div className="w-full overflow-x-auto">
                <table className="w-full text-left border-collapse text-[13px]">
                  <thead>
                    <tr className="border-b border-[var(--line)] text-[12px] font-semibold text-[var(--muted)]">
                      <th scope="col" className="py-2.5 pr-4 pl-1 font-semibold">
                        Language
                      </th>
                      <th scope="col" className="py-2.5 px-3 font-semibold">
                        Episodes
                      </th>
                      <th scope="col" className="py-2.5 px-3 font-semibold">
                        Platform
                      </th>
                      <th scope="col" className="py-2.5 pl-3 pr-1 font-semibold text-right sm:text-left">
                        Year
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--line)]">
                    {series.releases.map((release, idx) => {
                      const langDisplay = release.dubLanguage
                        ? getLanguageName(release.dubLanguage)
                        : 'Original';
                      const epCount = release.episodeCount || series.episodeCount;
                      const relYear = release.releasedYear || series.year;

                      return (
                        <tr
                          key={release.id || idx}
                          className="hover:bg-[var(--surface-hover)] transition-colors"
                        >
                          <td className="py-3 pr-4 pl-1 align-middle font-medium text-[var(--ink)]">
                            {langDisplay}
                          </td>
                          <td className="py-3 px-3 align-middle tabular-nums text-[var(--ink)]">
                            {epCount} eps
                          </td>
                          <td className="py-3 px-3 align-middle text-[var(--muted)]">
                            {release.platform}
                          </td>
                          <td className="py-3 pl-3 pr-1 align-middle tabular-nums text-[var(--muted)] text-right sm:text-left">
                            {relYear}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {hasDifferingEpisodeCounts && (
                <p className="text-[13px] text-[var(--muted)] pt-1">
                  Episode counts differ between versions.
                </p>
              )}
            </section>
          )}

          {/* Section 4: Cast and Crew */}
          {series.cast && series.cast.length > 0 && (
            <section id="cast" className="scroll-mt-16 space-y-6">
              <div className="border-b border-[var(--line)] pb-2.5">
                <h2 className="text-[17px] sm:text-[18px] font-semibold text-[var(--ink)]">
                  Cast and crew
                </h2>
                <p className="text-[13px] text-[var(--muted)] mt-0.5">
                  Verified creative team and on-screen performers
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {castMembers.length > 0 && (
                  <div className="space-y-2">
                    <h3 className="text-[12px] font-semibold uppercase tracking-wider text-[var(--muted)]">
                      Cast
                    </h3>
                    <ul className="divide-y divide-[var(--line)] border-y border-[var(--line)]">
                      {castMembers.map((c, i) => (
                        <li
                          key={i}
                          className="py-2.5 flex items-baseline justify-between gap-3 text-[14px]"
                        >
                          <Link
                            href={personPath(c.person)}
                            className="font-medium text-[var(--ink)] hover:text-[var(--crimson)] hover:underline"
                          >
                            {c.person.name}
                          </Link>
                          <span className="text-[13px] text-[var(--muted)] text-right">
                            {c.characterName ? `as ${c.characterName}` : 'Actor'}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {crewMembers.length > 0 && (
                  <div className="space-y-2">
                    <h3 className="text-[12px] font-semibold uppercase tracking-wider text-[var(--muted)]">
                      Crew
                    </h3>
                    <ul className="divide-y divide-[var(--line)] border-y border-[var(--line)]">
                      {crewMembers.map((c, i) => (
                        <li
                          key={i}
                          className="py-2.5 flex items-baseline justify-between gap-3 text-[14px]"
                        >
                          <Link
                            href={personPath(c.person)}
                            className="font-medium text-[var(--ink)] hover:text-[var(--crimson)] hover:underline"
                          >
                            {c.person.name}
                          </Link>
                          <span className="text-[13px] text-[var(--muted)] text-right capitalize">
                            {c.roleType}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </section>
          )}

          {/* Section 5: Community Stats */}
          <section id="community" className="scroll-mt-16">
            <CommunityStats
              score={series.ratingScore}
              ratingCount={series.ratingCount}
              popularity={series.popularity}
            />
          </section>

          {/* Section 6: Similar Short Dramas */}
          <section className="space-y-3">
            <div className="border-b border-[var(--line)] pb-2 flex items-center justify-between">
              <div>
                <h2 className="text-[17px] sm:text-[18px] font-semibold text-[var(--ink)]">
                  Similar short dramas
                </h2>
                <p className="text-[13px] text-[var(--muted)] mt-0.5">
                  Titles sharing genres, themes, and formats
                </p>
              </div>
              {firstTag && (
                <Link
                  href={tagPath(firstTag.slug)}
                  className="text-[12px] text-[var(--muted)] hover:text-[var(--crimson)] transition-colors"
                >
                  More {firstTag.name}
                </Link>
              )}
            </div>

            {relatedSeries.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                {relatedSeries.map((rel) => (
                  <Link
                    key={rel.id}
                    href={titlePath(rel)}
                    className="group flex flex-col space-y-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--crimson)] rounded-[8px]"
                  >
                    <Poster
                      title={rel.title}
                      year={rel.year}
                      episodeCount={rel.episodeCount}
                      className="group-hover:border-[var(--line-strong)]"
                    />
                    <div className="space-y-0.5">
                      <h3 className="font-semibold text-[12px] text-[var(--ink)] line-clamp-2 leading-snug group-hover:text-[var(--crimson)] transition-colors">
                        {rel.title}
                      </h3>
                      <span className="text-[11px] text-[var(--muted)] tabular-nums">
                        {rel.episodeCount} eps
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-[13px] text-[var(--muted)]">
                No similar short dramas indexed yet.
              </p>
            )}
          </section>

          {/* Title Footer History and Report Links */}
          <TitleFooterHistory series={series} />
        </div>
      </div>
    </div>
  );
}
