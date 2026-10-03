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

  // Check if releases have differing episode counts
  const distinctEpisodeCounts = Array.from(
    new Set(series.releases.map((r) => r.episodeCount).filter(Boolean))
  );
  const hasDifferingEpisodeCounts = distinctEpisodeCounts.length > 1;

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
        countryOfOrigin: {
          '@type': 'Country',
          name:
            series.originalLanguage === 'zh'
              ? 'China'
              : series.originalLanguage === 'ko'
              ? 'South Korea'
              : series.originalLanguage === 'ja'
              ? 'Japan'
              : 'Global',
        },
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

      {/* Main Title Hero Card */}
      <section className="bg-[var(--surface)] border border-[var(--line)] rounded-[12px] p-4 sm:p-6 lg:p-8">
        <div className="flex flex-col md:flex-row gap-6 lg:gap-8 items-start">
          {/* Left: Poster */}
          <div className="w-full sm:w-48 md:w-56 lg:w-64 shrink-0 mx-auto md:mx-0 max-w-[240px] md:max-w-none">
            <Poster
              title={series.title}
              year={series.year}
              episodeCount={series.episodeCount}
              className="w-full"
              priority={true}
            />
          </div>

          {/* Right: Header & Essential Meta */}
          <div className="flex-1 min-w-0 space-y-4 w-full">
            <div className="space-y-1.5">
              {/* Primary H1 Title */}
              <h1 className="text-[28px] font-semibold text-[var(--ink)] tracking-tight leading-tight">
                {series.title}
              </h1>

              {/* Native Language Name & Romanization */}
              <div className="space-y-0.5 text-[14px]">
                {primaryOriginalAlias && (
                  <p className="text-[var(--ink)] font-normal">
                    <span className="text-[var(--muted)] text-[12px] mr-1.5">
                      {originalLangName}:
                    </span>
                    <span lang={series.originalLanguage}>
                      {primaryOriginalAlias.text}
                    </span>
                  </p>
                )}

                {series.romanizedTitle && (
                  <p className="text-[var(--muted)] text-[12px]">
                    <span className="mr-1.5">Romanized:</span>
                    <span>{series.romanizedTitle}</span>
                  </p>
                )}
              </div>
            </div>

            {/* Meta facts row (clean spaced items, no bullet strings) */}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[14px] text-[var(--muted)] pt-1 border-t border-[var(--line)]">
              <span className="tabular-nums font-semibold text-[var(--ink)]">
                {series.year}
              </span>
              <span className="tabular-nums">
                {series.episodeCount} episodes
              </span>
              <span>{originalLangName}</span>
              {series.productionStatus && (
                <span className="capitalize">{series.productionStatus}</span>
              )}
            </div>

            {/* User List & Rating Stepper Actions */}
            <div className="pt-2">
              <TitleActions series={series} />
            </div>

            {/* Synopsis Section */}
            <div className="pt-3 border-t border-[var(--line)]">
              <SynopsisExpand synopsis={series.synopsis} />
            </div>

            {/* Tags / Tropes */}
            {series.tags && series.tags.length > 0 && (
              <div className="pt-2 flex flex-wrap gap-1.5 items-center">
                <span className="text-[12px] text-[var(--muted)] mr-1">
                  Tags:
                </span>
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
        </div>
      </section>

      {/* In-Page Quick Nav Sticky Bar */}
      <TitleNav />

      {/* Section 1: The Core "Also Known As" Ledger */}
      <section id="names" className="scroll-mt-16">
        <AliasLedger series={series} />
      </section>

      {/* Section 2: Where to Watch */}
      <section id="watch" className="scroll-mt-16">
        <WhereToWatch series={series} />
      </section>

      {/* Section 3: Cast and Credits */}
      {series.cast && series.cast.length > 0 && (
        <section
          id="cast"
          className="scroll-mt-16 p-4 sm:p-6 bg-[var(--surface)] border border-[var(--line)] rounded-[12px] space-y-4"
        >
          <div className="border-b border-[var(--line)] pb-2.5">
            <h2 className="text-[16px] font-semibold text-[var(--ink)]">
              Cast and credits
            </h2>
            <p className="text-[12px] text-[var(--muted)]">
              Verified creative team and on-screen cast
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {series.cast.map((c, i) => (
              <div
                key={i}
                className="p-3 bg-[var(--surface-subtle)] rounded-[8px] flex items-center gap-3 border border-[var(--line)]"
              >
                <div className="w-10 h-10 rounded-full bg-[var(--surface)] border border-[var(--line)] flex items-center justify-center text-[var(--crimson)] text-[14px] font-semibold shrink-0">
                  {c.person.name.charAt(0)}
                </div>
                <div className="min-w-0">
                  <Link
                    href={personPath(c.person)}
                    className="font-semibold text-[13px] text-[var(--ink)] hover:text-[var(--crimson)] hover:underline truncate block"
                  >
                    {c.person.name}
                  </Link>
                  <p className="text-[12px] text-[var(--muted)] truncate">
                    {c.characterName ? `as ${c.characterName}` : c.roleType}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Section 4: Community Data & Related Dramas */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Community Stats */}
        <div className="lg:col-span-4">
          <CommunityStats
            score={series.ratingScore}
            ratingCount={series.ratingCount}
            popularity={series.popularity}
          />
        </div>

        {/* Right: Related Dramas */}
        <div className="lg:col-span-8 space-y-3">
          <div className="border-b border-[var(--line)] pb-2 flex items-center justify-between">
            <h2 className="text-[16px] font-semibold text-[var(--ink)]">
              Similar short dramas
            </h2>
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
            <div className="grid grid-cols-3 sm:grid-cols-3 gap-3">
              {relatedSeries.map((rel) => (
                <Link
                  key={rel.id}
                  href={titlePath(rel)}
                  className="group flex flex-col space-y-1.5"
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
        </div>
      </div>

      {/* Title Footer History and Report Links */}
      <TitleFooterHistory series={series} />
    </div>
  );
}
