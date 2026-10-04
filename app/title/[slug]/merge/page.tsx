import React from 'react';
import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import { getSeriesById } from '@/src/data/repository';
import { parseTitleParam } from '@/src/lib/urls';
import { TitleMergeView } from '@/src/components/title/title-merge-view';

interface TitleMergePageProps {
  params: Promise<{
    slug: string;
  }>;
}

export async function generateMetadata({
  params,
}: TitleMergePageProps): Promise<Metadata> {
  const { slug } = await params;
  const id = parseTitleParam(slug);
  if (!id) return { title: 'Merge Duplicate Drama Entry', robots: { index: false, follow: true } };

  const series = await getSeriesById(id);
  if (!series) return { title: 'Merge Duplicate Drama Entry', robots: { index: false, follow: true } };

  return {
    title: `Merge Duplicate: ${series.title}`,
    robots: {
      index: false,
      follow: true,
    },
  };
}

export default async function TitleMergePage({
  params,
}: TitleMergePageProps) {
  const { slug } = await params;
  const id = parseTitleParam(slug);

  if (!id) {
    notFound();
  }

  const series = await getSeriesById(id);
  if (!series) {
    notFound();
  }

  return <TitleMergeView sourceSeries={series} />;
}
