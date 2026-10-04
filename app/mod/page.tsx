import { Metadata } from 'next';
import { siteConfig } from '@/src/config/site';
import { getAllModerationReports, getAllSeries } from '@/src/data/repository';
import { ModQueueView } from '@/src/components/mod/mod-queue-view';

export const metadata: Metadata = {
  title: `Moderation Queue | ${siteConfig.name}`,
  robots: {
    index: false,
    follow: true,
  },
};

export default async function ModQueuePage() {
  const [reports, seriesList] = await Promise.all([
    getAllModerationReports(),
    getAllSeries(),
  ]);

  return <ModQueueView initialReports={reports} seriesList={seriesList} />;
}
