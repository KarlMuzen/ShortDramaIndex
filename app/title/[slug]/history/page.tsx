import React from 'react';
import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import { getSeriesById, getSeriesRevisions } from '@/src/data/repository';
import { parseTitleParam, titlePath } from '@/src/lib/urls';
import { siteConfig } from '@/src/config/site';
import { TitleHistoryView } from '@/src/components/title/title-history-view';

interface TitleHistoryPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export async function generateMetadata({
  params,
}: TitleHistoryPageProps): Promise<Metadata> {
  const { slug } = await params;
  const id = parseTitleParam(slug);
  if (!id) return { title: 'Revision History' };

  const series = await getSeriesById(id);
  if (!series) return { title: 'Revision History' };

  return {
    title: `Revision History: ${series.title}`,
    description: `Audit trail of community edits, alias additions, and verification events for ${series.title}.`,
    robots: {
      index: false,
      follow: true,
    },
    alternates: {
      canonical: `${siteConfig.baseUrl}${titlePath(series)}/history`,
    },
  };
}

export default async function TitleHistoryPage({
  params,
}: TitleHistoryPageProps) {
  const { slug } = await params;
  const id = parseTitleParam(slug);

  if (!id) {
    notFound();
  }

  const series = await getSeriesById(id);
  if (!series) {
    notFound();
  }

  const revisions = await getSeriesRevisions(series.id);

  return <TitleHistoryView series={series} revisions={revisions} />;
}
