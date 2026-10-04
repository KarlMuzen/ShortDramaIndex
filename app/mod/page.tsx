import { Metadata } from 'next';
import { siteConfig } from '@/src/config/site';
import { ModQueueView } from '@/src/components/mod/mod-queue-view';

export const metadata: Metadata = {
  title: `Moderation Queue | ${siteConfig.name}`,
  robots: {
    index: false,
    follow: true,
  },
};

export default function ModQueuePage() {
  return <ModQueueView />;
}
