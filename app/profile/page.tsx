import { Metadata } from 'next';
import { siteConfig } from '@/src/config/site';
import { ProfileRedirect } from '@/src/components/profile/profile-redirect';

export const metadata: Metadata = {
  title: `Profile | ${siteConfig.name}`,
  robots: {
    index: false,
    follow: true,
  },
};

export default function ProfilePage() {
  return <ProfileRedirect />;
}
