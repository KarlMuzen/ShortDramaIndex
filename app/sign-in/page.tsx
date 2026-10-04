import { Metadata } from 'next';
import { siteConfig } from '@/src/config/site';
import { SignInForm } from '@/src/components/auth/sign-in-form';

export const metadata: Metadata = {
  title: `Sign in | ${siteConfig.name}`,
  robots: {
    index: false,
    follow: true,
  },
};

export default function SignInPage() {
  return <SignInForm />;
}
