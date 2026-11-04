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
import { TitleActions } from '@/src/components/title/title-actions';
import { SynopsisExpand } from '@/src/components/title/synopsis-expand';
import { AliasLedger } from '@/src/components/title/alias-ledger';
import { WhereToWatch } from '@/src/components/title/where-to-watch';
import { CommunityStats } from '@/src/components/title/community-stats';
import { TitleFooterHistory } from '@/src/components/title/title-footer-history';
import { ChevronDown, Star } from 'lucide-react';

export const dynamicParams = true;
export const revalidate = 3600;

export async function generateStaticParams() {
  try {
    const seriesList = await getAllSeries();
    return seriesList.map((series) => ({
      slug: `${series.slug}-${series.shortId}`,
    }));
  } catch {
    return [];
  }
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
  const seriesId = parseTitleParam(slug);

  if (!seriesId) {
    return {
      title: 'Short drama not found',
      robots: { index: false },
    };
  }

  const series = await getSeriesById(seriesId);
  if (!series) {
    return {
      title: 'Short drama not found',
      robots: { index: false },
    };
  }

  const titleString = `${series.title} - Aliases & Where to Watch`;
  const fullDesc = series.synopsis || `${series.title} short drama facts, aliases, and official sources.`;
  const description = fullDesc.length > 155 ? `${fullDesc.slice(0, 152)}...` : fullDesc;
  const canonicalUrl = `${siteConfig.baseUrl}${titlePath(series)}`;

  return {
    title: titleString,
    description,
    alternates: {
      canonical: canonicalUrl,
    },
    ...(series.visibility === 'hidden'
      ? { robots: { index: false, follow: false } }
      : {}),
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
  const seriesId = parseTitleParam(slug);

  if (!seriesId) {
    notFound();
  }

  // 1. Permanent redirect check if merged
  const redirectedToId = await checkRedirect(seriesId);
  if (redirectedToId) {
    const target = await getSeriesById(redirectedToId);
    if (target) {
      permanentRedirect(titlePath(target));
    }
  }

  // 2. Fetch primary series data
  const series = await getSeriesById(seriesId);

  // 3. Return 404 if record is not found or marked 'removed'
  if (!series || series.visibility === 'removed') {
    notFound();
  }

  // Canonical slug redirect if slug is outdated
  const expectedSlug = `${series.slug}-${series.shortId}`;
  if (slug !== expectedSlug) {
    permanentRedirect(titlePath(series));
  }

  // 4. Fetch related series for recommendations
  const relatedSeries = await getRelatedSeries(series.id, 6);

  const firstTag = series.tags[0];
  const originCountryName = series.originCountry ? getCountryName(series.originCountry) : null;
  const originalLangName = getLanguageName(series.originalLanguage);

  // Extract primary native alias
  const primaryOriginalAlias = series.aliases.find(
    (a) => a.language === series.originalLanguage
  );

  const castMembers = series.cast?.filter((c) => c.roleType === 'actor') || [];
  const crewMembers = series.cast?.filter((c) => c.roleType !== 'actor') || [];

  const episodeCounts = new Set(
    series.releases.map((r) => r.episodeCount).filter(Boolean)
  );
  const hasDifferingEpisodeCounts = episodeCounts.size > 1;

  // Schema.org Structured Data (TVEpisode / TVSeries)
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'TVSeries',
    '@id': `${siteConfig.baseUrl}${titlePath(series)}`,
    name: series.title,
    description: series.synopsis,
    numberOfEpisodes: series.episodeCount,
    startDate: `${series.year}`,
    inLanguage: series.originalLanguage,
    ...(series.ratingCount > 0 && series.ratingScore > 0 && {
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: series.ratingScore,
        bestRating: 10,
        worstRating: 1,
        ratingCount: series.ratingCount,
      },
    }),
    ...(primaryOriginalAlias && {
      alternateName: primaryOriginalAlias.text,
    }),
    genre: series.tags.map((t) => t.name),
  };

  return (
    <div className="space-y-6 pb-16 text-left max-w-4xl mx-auto">
      {/* Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }}
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

      {/* 1. Header block at 390px: 96px poster beside the h1 (grid 96px 1fr) */}
      <div className="grid grid-cols-[96px_1fr] sm:grid-cols-[112px_1fr] md:grid-cols-[128px_1fr] gap-4 sm:gap-6 items-start text-left">
        {/* 96px Poster */}
        <div className="w-24 sm:w-28 md:w-32 shrink-0 aspect-[9/16]">
          <Poster
            title={series.title}
            src={series.posterUrl}
            priority={true}
            className="w-full h-full"
          />
        </div>

        {/* Title, Original language, Romanization & Meta */}
        <div className="space-y-2 min-w-0">
          <h1 className="text-[20px] sm:text-[24px] lg:text-[28px] font-semibold text-[var(--ink)] leading-tight tracking-tight">
            {series.title}
          </h1>

          <div className="space-y-0.5 text-[13px]">
            {primaryOriginalAlias && (
              <p className="text-[var(--ink)] font-normal">
                <span className="text-[var(--muted)] text-[11px] mr-1.5">
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

          {/* Editorial verification badge */}
          <div className="flex flex-wrap items-center gap-2 pt-1">
            {series.verificationStatus === 'verified_commercial' && (
              <span className="inline-flex items-center rounded-full border border-[var(--status-verified)]/30 bg-[var(--status-verified-bg)] px-2.5 py-0.5 text-[12px] font-semibold text-[var(--status-verified)]">
                Verified Studio Production
              </span>
            )}
            {series.verificationStatus === 'editorial_approved' && (
              <span className="inline-flex items-center rounded-full border border-[#BFDBFE] bg-[#EFF6FF] px-2.5 py-0.5 text-[12px] font-semibold text-[#1D4ED8]">
                Editorial Approved
              </span>
            )}
            {series.verificationStatus === 'community_submitted' && (
              <span className="inline-flex items-center rounded-full border border-[var(--line)] bg-[var(--surface-subtle)] px-2.5 py-0.5 text-[12px] font-medium text-[var(--muted)]">
                Community Submitted
              </span>
            )}
            {series.verificationStatus === 'unverified' && (
              <span className="inline-flex items-center rounded-full border border-[var(--line)] bg-[var(--surface-subtle)] px-2.5 py-0.5 text-[12px] font-medium text-[var(--muted)]">
                Verification Pending
              </span>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] text-[var(--muted)] tabular-nums pt-1 border-t border-[var(--line)]">
            <span className="font-semibold text-[var(--ink)]">{series.year}</span>
            {series.studioName && <span>{series.studioName}</span>}
            {originCountryName && <span>{originCountryName}</span>}
            {series.originalLanguage === 'en' ? (
              <span className="font-medium text-[var(--status-verified)]">Original English</span>
            ) : (
              <span>English Subtitled / Adapted</span>
            )}
            <span>{series.episodeCount} eps</span>
            {series.avgEpisodeMinutes ? (
              <span>{series.avgEpisodeMinutes} min/ep</span>
            ) : null}
            {series.productionStatus && (
              <span className="capitalize">{series.productionStatus}</span>
            )}
          </div>
        </div>
      </div>

      {/* 2. Actions row: "Add to list" primary, "Rate" and "Report a problem" secondary */}
      <div className="w-full pt-1">
        <TitleActions series={series} />
      </div>

      {/* 3. Synopsis */}
      <div className="w-full pt-2 border-t border-[var(--line)]">
        <SynopsisExpand synopsis={series.synopsis} />
      </div>

      {/* 4. Tags as text links */}
      {series.tags && series.tags.length > 0 && (
        <div className="w-full pt-1 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[13px] text-[var(--muted)]">
          <span>Tags:</span>
          {series.tags.map((tag) => (
            <Link
              key={tag.slug}
              href={tagPath(tag.slug)}
              className="text-[var(--ink)] hover:text-[var(--crimson)] hover:underline"
            >
              {tag.name}
            </Link>
          ))}
        </div>
      )}

      {/* 5. "Also known as" Ledger */}
      <section id="names" className="w-full scroll-mt-16 pt-2">
        <AliasLedger series={series} />
      </section>

      {/* 6. "Where to watch" */}
      <section id="watch" className="w-full scroll-mt-16 pt-2">
        <WhereToWatch series={series} />
      </section>

      {/* 7. <details> block for Versions */}
      {series.releases && series.releases.length > 0 && (
        <details
          id="versions"
          className="group border border-[var(--line)] rounded-[12px] p-4 bg-[var(--surface)] text-left [&_summary::-webkit-details-marker]:hidden"
        >
          <summary className="font-semibold text-[16px] text-[var(--ink)] cursor-pointer flex items-center justify-between select-none">
            <span>Versions ({series.releases.length})</span>
            <ChevronDown className="w-4 h-4 text-[var(--muted)] transition-transform group-open:rotate-180" />
          </summary>
          <div className="pt-3 border-t border-[var(--line)] mt-3 space-y-3">
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
          </div>
        </details>
      )}

      {/* 8. <details> block for Cast and crew */}
      {series.cast && series.cast.length > 0 && (
        <details
          id="cast"
          className="group border border-[var(--line)] rounded-[12px] p-4 bg-[var(--surface)] text-left [&_summary::-webkit-details-marker]:hidden"
        >
          <summary className="font-semibold text-[16px] text-[var(--ink)] cursor-pointer flex items-center justify-between select-none">
            <span>Cast and crew ({series.cast.length})</span>
            <ChevronDown className="w-4 h-4 text-[var(--muted)] transition-transform group-open:rotate-180" />
          </summary>
          <div className="pt-3 border-t border-[var(--line)] mt-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {castMembers.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-[12px] font-semibold text-[var(--muted)]">
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
                  <h3 className="text-[12px] font-semibold text-[var(--muted)]">
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
          </div>
        </details>
      )}

      {/* 9. <details> block for Community */}
      <details
        id="community"
        className="group border border-[var(--line)] rounded-[12px] p-4 bg-[var(--surface)] text-left [&_summary::-webkit-details-marker]:hidden"
      >
        <summary className="font-semibold text-[16px] text-[var(--ink)] cursor-pointer flex items-center justify-between select-none">
          <span>
            Community ({series.ratingScore > 0 ? `${series.ratingScore.toFixed(1)}/10` : 'Stats'})
          </span>
          <ChevronDown className="w-4 h-4 text-[var(--muted)] transition-transform group-open:rotate-180" />
        </summary>
        <div className="pt-3 border-t border-[var(--line)] mt-3">
          <CommunityStats
            score={series.ratingScore}
            ratingCount={series.ratingCount}
            popularity={series.popularity}
          />
        </div>
      </details>

      {/* 10. <details> block for Similar short dramas */}
      <details
        id="similar"
        className="group border border-[var(--line)] rounded-[12px] p-4 bg-[var(--surface)] text-left [&_summary::-webkit-details-marker]:hidden"
      >
        <summary className="font-semibold text-[16px] text-[var(--ink)] cursor-pointer flex items-center justify-between select-none">
          <span>Similar short dramas ({relatedSeries.length})</span>
          <ChevronDown className="w-4 h-4 text-[var(--muted)] transition-transform group-open:rotate-180" />
        </summary>
        <div className="pt-4 border-t border-[var(--line)] mt-3 space-y-4">
          {relatedSeries.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4">
              {relatedSeries.map((rel) => (
                <Link
                  key={rel.id}
                  href={titlePath(rel)}
                  className="group/item flex flex-col focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--crimson)] rounded-[12px] text-left"
                >
                  <div className="mb-2">
                    <Poster
                      title={rel.title}
                      src={rel.posterUrl}
                      className="group-hover/item:border-[var(--line-strong)] transition-colors"
                    />
                  </div>
                  <div className="flex flex-col flex-1">
                    <h3 className="text-[14px] font-semibold text-[var(--ink)] leading-snug line-clamp-2 group-hover/item:text-[var(--crimson)] transition-colors">
                      {rel.title}
                    </h3>
                    <div className="flex items-center gap-2 text-[12px] text-[var(--muted)] tabular-nums mt-1">
                      <span>{rel.year}</span>
                      <span>{rel.episodeCount} eps</span>
                      {rel.ratingScore > 0 && (
                        <span className="inline-flex items-center gap-1 text-[var(--ink)] font-semibold">
                          <Star className="w-3 h-3 fill-[var(--crimson)] text-[var(--crimson)] shrink-0" />
                          {rel.ratingScore.toFixed(1)}
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-[13px] text-[var(--muted)]">
              No similar short dramas indexed yet.
            </p>
          )}

          {/* 7. "More Revenge" becomes a crimson link "All revenge titles" on its own row */}
          {firstTag && (
            <div className="pt-2 border-t border-[var(--line)]">
              <Link
                href={tagPath(firstTag.slug)}
                className="text-[13px] font-semibold text-[var(--crimson)] hover:underline inline-block"
              >
                All {firstTag.name.toLowerCase()} titles
              </Link>
            </div>
          )}
        </div>
      </details>

      {/* 11. Title Footer History */}
      <div className="w-full pt-2">
        <TitleFooterHistory series={series} />
      </div>
    </div>
  );
}
