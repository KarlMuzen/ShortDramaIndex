import React from 'react';
import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import { getUserProfileData } from '@/src/data/repository';
import { siteConfig } from '@/src/config/site';
import { ProfileTabs } from '@/src/components/profile/profile-tabs';
import { Breadcrumb } from '@/src/components/ui/breadcrumb';

interface UserPageProps {
  params: Promise<{
    handle: string;
  }>;
}

export async function generateMetadata({
  params,
}: UserPageProps): Promise<Metadata> {
  const { handle } = await params;
  const profile = await getUserProfileData(handle);

  if (!profile) {
    return {
      title: 'User not found',
      robots: { index: false },
    };
  }

  return {
    title: `${profile.user.name} (@${profile.user.handle})`,
    description: `View ${profile.user.name}'s short drama watchlists, ratings, and alias contributions.`,
    robots: {
      index: false,
    },
    alternates: {
      canonical: `${siteConfig.baseUrl}/u/${profile.user.handle}`,
    },
  };
}

export default async function UserProfilePage({ params }: UserPageProps) {
  const { handle } = await params;
  const profileData = await getUserProfileData(handle);

  if (!profileData) {
    notFound();
  }

  const { user, titlesListedCount, namesAddedCount, reportsAcceptedCount } = profileData;

  return (
    <div className="space-y-6 pb-16 text-left max-w-4xl mx-auto">
      <Breadcrumb
        items={[
          { label: 'Home', href: '/' },
          { label: `@${user.handle}`, isCurrent: true },
        ]}
      />

      {/* Profile Header */}
      <header className="p-6 bg-[var(--surface)] border border-[var(--line)] rounded-[12px] space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            {/* Initial Avatar */}
            <div className="w-14 h-14 rounded-full bg-[var(--crimson)] text-white text-[20px] font-bold flex items-center justify-center shrink-0 select-none shadow-xs">
              {user.name.charAt(0).toUpperCase()}
            </div>

            <div className="space-y-0.5">
              <h1 className="text-[22px] sm:text-[24px] font-semibold text-[var(--ink)] tracking-tight">
                {user.name}
              </h1>
              <p className="text-[13px] text-[var(--muted)]">
                @{user.handle} • Role:{' '}
                <span className="capitalize font-medium text-[var(--ink)]">
                  {user.role}
                </span>
                {user.joinedAt && (
                  <span className="ml-1.5 tabular-nums">
                    • Joined {user.joinedAt}
                  </span>
                )}
              </p>
            </div>
          </div>
        </div>

        {/* Counts Bar */}
        <div className="grid grid-cols-3 gap-3 pt-3 border-t border-[var(--line)]">
          <div className="space-y-0.5">
            <span className="text-[12px] text-[var(--muted)] uppercase tracking-wider font-medium block">
              Titles listed
            </span>
            <span className="text-[20px] sm:text-[24px] font-semibold text-[var(--ink)] tabular-nums">
              {titlesListedCount}
            </span>
          </div>

          <div className="space-y-0.5 border-l border-[var(--line)] pl-3 sm:pl-4">
            <span className="text-[12px] text-[var(--muted)] uppercase tracking-wider font-medium block">
              Names added
            </span>
            <span className="text-[20px] sm:text-[24px] font-semibold text-[var(--ink)] tabular-nums">
              {namesAddedCount}
            </span>
          </div>

          <div className="space-y-0.5 border-l border-[var(--line)] pl-3 sm:pl-4">
            <span className="text-[12px] text-[var(--muted)] uppercase tracking-wider font-medium block">
              Reports accepted
            </span>
            <span className="text-[20px] sm:text-[24px] font-semibold text-[var(--status-verified)] tabular-nums">
              {reportsAcceptedCount}
            </span>
          </div>
        </div>
      </header>

      {/* Tabs: Lists, Ratings, Contributions, Reports */}
      <ProfileTabs profileData={profileData} />
    </div>
  );
}
