import React from 'react';
import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import { getSeriesById } from '@/src/data/repository';
import { parseTitleParam } from '@/src/lib/urls';
import { TitleEditView } from '@/src/components/title/title-edit-view';

interface TitleEditPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export async function generateMetadata({
  params,
}: TitleEditPageProps): Promise<Metadata> {
  const { slug } = await params;
  const id = parseTitleParam(slug);
  if (!id) return { title: 'Edit Catalog Entry', robots: { index: false, follow: true } };

  const series = await getSeriesById(id);
  if (!series) return { title: 'Edit Catalog Entry', robots: { index: false, follow: true } };

  return {
    title: `Edit: ${series.title}`,
    robots: {
      index: false,
      follow: true,
    },
  };
}

export default async function TitleEditPage({
  params,
}: TitleEditPageProps) {
  const { slug } = await params;
  const id = parseTitleParam(slug);

  if (!id) {
    notFound();
  }

  const series = await getSeriesById(id);
  if (!series) {
    notFound();
  }

  return <TitleEditView initialSeries={series} />;
}
