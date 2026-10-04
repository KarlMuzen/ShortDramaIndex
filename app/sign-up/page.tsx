import { Metadata } from 'next';
import { siteConfig } from '@/src/config/site';
import { SignUpForm } from '@/src/components/auth/sign-up-form';

export const metadata: Metadata = {
  title: `Create account | ${siteConfig.name}`,
  robots: {
    index: false,
    follow: true,
  },
};

export default function SignUpPage() {
  return <SignUpForm />;
}
