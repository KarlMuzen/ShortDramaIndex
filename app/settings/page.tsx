import { Metadata } from 'next';
import { siteConfig } from '@/src/config/site';
import { SettingsContent } from '@/src/components/settings/settings-content';

export const metadata: Metadata = {
  title: `Account & Display Settings | ${siteConfig.name}`,
  robots: {
    index: false,
    follow: true,
  },
};

export default function SettingsPage() {
  return <SettingsContent />;
}
