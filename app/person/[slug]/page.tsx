import React from 'react';
import { notFound, permanentRedirect } from 'next/navigation';
import { Metadata } from 'next';
import Link from 'next/link';
import { getPersonByIdOrSlug, getAllPeople } from '@/src/data/repository';
import { siteConfig } from '@/src/config/site';
import { titlePath, personPath } from '@/src/lib/urls';
import { Breadcrumb } from '@/src/components/ui/breadcrumb';
import { Poster } from '@/src/components/ui/poster';
import { Star } from 'lucide-react';

export const dynamicParams = true;
export const revalidate = 3600;

export async function generateStaticParams() {
  const people = await getAllPeople();
  return people.map((person) => ({
    slug: `${person.id}-${person.slug}`,
  }));
}

interface PersonPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export async function generateMetadata({
  params,
}: PersonPageProps): Promise<Metadata> {
  const { slug } = await params;
  const data = await getPersonByIdOrSlug(slug);

  if (!data) {
    return {
      title: 'Person not found',
      robots: { index: false },
    };
  }

  const titleString = `${data.person.name}: short drama credits`;
  const fullDesc = `Credits and filmography for ${data.person.name} across indexed short vertical dramas. View verified acting and directing roles.`;
  const description = fullDesc.length > 155 ? `${fullDesc.slice(0, 152)}...` : fullDesc;
  const canonicalUrl = `${siteConfig.baseUrl}${personPath(data.person)}`;

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
      type: 'profile',
      siteName: siteConfig.name,
    },
    twitter: {
      card: 'summary',
      title: titleString,
      description,
    },
  };
}

export default async function PersonPage({ params }: PersonPageProps) {
  const { slug } = await params;
  const personData = await getPersonByIdOrSlug(slug);

  if (!personData) {
    notFound();
  }

  const { person, credits } = personData;

  // Canonical slug enforcement (same logic as the title page)
  const expectedSlug = `${person.id}-${person.slug}`;
  if (slug !== expectedSlug) {
    permanentRedirect(personPath(person));
  }

  const canonicalUrl = `${siteConfig.baseUrl}${personPath(person)}`;

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
        name: `${person.name}: short drama credits`,
        item: canonicalUrl,
      },
    ],
  };

  return (
    <div className="space-y-8 pb-16 text-left max-w-4xl mx-auto">
      {/* Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <Breadcrumb
        items={[
          { label: 'Home', href: '/' },
          { label: 'People', href: '/search' },
          { label: person.name, isCurrent: true },
        ]}
      />

      {/* Person Header */}
      <header className="p-6 bg-[var(--surface)] border border-[var(--line)] rounded-[12px] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-[var(--surface-subtle)] border-2 border-[var(--line)] flex items-center justify-center text-[var(--crimson)] shrink-0 text-[22px] font-bold">
            {person.name.charAt(0)}
          </div>

          <div className="space-y-1">
            <div className="text-[12px] text-[var(--muted)]">
              <span>{person.role === 'director' ? 'Director and creator' : 'Actor and performer'}</span>
            </div>
            <h1 className="text-[28px] font-semibold text-[var(--ink)] tracking-tight">
              {person.name}
            </h1>
            {person.nativeName && (
              <p className="text-[14px] text-[var(--muted)]">
                Native name: <span className="text-[var(--ink)] font-normal">{person.nativeName}</span>
              </p>
            )}
          </div>
        </div>

        <div className="text-[13px] text-[var(--muted)] tabular-nums">
          <span className="font-semibold text-[var(--ink)] text-[18px]">
            {credits.length}
          </span>{' '}
          drama credits indexed
        </div>
      </header>

      {/* Credits List */}
      <section className="space-y-4">
        <div className="border-b border-[var(--line)] pb-2.5">
          <h2 className="text-[18px] font-semibold text-[var(--ink)]">
            Drama filmography & credits
          </h2>
          <p className="text-[13px] text-[var(--muted)] mt-0.5">
            Verified appearances and creative roles across short vertical drama series
          </p>
        </div>

        <div className="divide-y divide-[var(--line)] border-b border-[var(--line)]">
          {credits.map((credit, idx) => (
            <div
              key={credit.series.id || idx}
              className="py-3.5 flex gap-3.5 items-center justify-between"
            >
              <div className="flex gap-3 items-center min-w-0">
                <Link
                  href={titlePath(credit.series)}
                  className="w-12 aspect-[9/16] shrink-0"
                >
                  <Poster
                    title={credit.series.title}
                    year={credit.series.year}
                    episodeCount={credit.series.episodeCount}
                    className="rounded-[4px] h-full"
                  />
                </Link>

                <div className="space-y-0.5 min-w-0">
                  <Link
                    href={titlePath(credit.series)}
                    className="font-semibold text-[14px] text-[var(--ink)] hover:text-[var(--crimson)] hover:underline leading-snug line-clamp-1"
                  >
                    {credit.series.title}
                  </Link>

                  <div className="text-[12px] text-[var(--muted)] flex items-center gap-2">
                    <span className="capitalize text-[var(--ink)]">
                      {credit.characterName ? `Role: ${credit.characterName}` : `Credit: ${credit.roleType}`}
                    </span>
                    <span className="tabular-nums">{credit.series.year}</span>
                    <span className="tabular-nums">{credit.series.episodeCount} eps</span>
                  </div>
                </div>
              </div>

              {credit.series.ratingScore > 0 && (
                <div className="flex items-center gap-1 text-[13px] font-semibold text-[var(--ink)] shrink-0">
                  <Star className="w-3.5 h-3.5 fill-[var(--crimson)] text-[var(--crimson)]" />
                  <span className="tabular-nums">{credit.series.ratingScore.toFixed(1)}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
