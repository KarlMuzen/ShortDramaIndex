'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { UserProfileData } from '@/src/data/types';
import { titlePath } from '@/src/lib/urls';
import { useSession } from '@/src/context/session-context';
import { UserListView } from './user-list-view';
import { StatusMark } from '@/src/components/ui/status-mark';
import { EmptyState } from '@/src/components/ui/empty-state';
import { Star, CheckCircle2, Clock, AlertTriangle, ExternalLink, Bookmark } from 'lucide-react';

interface ProfileTabsProps {
  profileData: UserProfileData;
  isOwner?: boolean;
}

export function ProfileTabs({ profileData, isOwner: isOwnerProp }: ProfileTabsProps) {
  const { user: currentUser } = useSession();
  const isOwner = isOwnerProp !== undefined ? isOwnerProp : currentUser?.id === profileData.user.id;
  const [activeTab, setActiveTab] = useState<'lists' | 'ratings' | 'contributions' | 'reports'>('lists');

  const { listEntries, ratings, contributions, reports } = profileData;

  return (
    <div className="space-y-6 text-left">
      {/* Main Tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-[var(--line)]">
        <button
          type="button"
          onClick={() => setActiveTab('lists')}
          className={`px-4 py-2.5 text-[14px] font-medium transition-colors border-b-2 -mb-px cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'lists'
              ? 'border-[var(--crimson)] text-[var(--crimson)] font-semibold'
              : 'border-transparent text-[var(--muted)] hover:text-[var(--ink)]'
          }`}
        >
          <span>Lists</span>
          <span className="text-[12px] tabular-nums text-[var(--muted)]">
            ({listEntries.length})
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('ratings')}
          className={`px-4 py-2.5 text-[14px] font-medium transition-colors border-b-2 -mb-px cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'ratings'
              ? 'border-[var(--crimson)] text-[var(--crimson)] font-semibold'
              : 'border-transparent text-[var(--muted)] hover:text-[var(--ink)]'
          }`}
        >
          <span>Ratings</span>
          <span className="text-[12px] tabular-nums text-[var(--muted)]">
            ({ratings.length})
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('contributions')}
          className={`px-4 py-2.5 text-[14px] font-medium transition-colors border-b-2 -mb-px cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'contributions'
              ? 'border-[var(--crimson)] text-[var(--crimson)] font-semibold'
              : 'border-transparent text-[var(--muted)] hover:text-[var(--ink)]'
          }`}
        >
          <span>Contributions</span>
          <span className="text-[12px] tabular-nums text-[var(--muted)]">
            ({contributions.length})
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('reports')}
          className={`px-4 py-2.5 text-[14px] font-medium transition-colors border-b-2 -mb-px cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'reports'
              ? 'border-[var(--crimson)] text-[var(--crimson)] font-semibold'
              : 'border-transparent text-[var(--muted)] hover:text-[var(--ink)]'
          }`}
        >
          <span>Reports</span>
          <span className="text-[12px] tabular-nums text-[var(--muted)]">
            ({reports.length})
          </span>
        </button>
      </div>

      {/* Tab 1: Lists */}
      {activeTab === 'lists' && (
        <UserListView initialEntries={listEntries} isOwner={isOwner} />
      )}

      {/* Tab 2: Ratings */}
      {activeTab === 'ratings' && (
        <div className="space-y-3">
          {ratings.length > 0 ? (
            <div className="divide-y divide-[var(--line)] border-b border-[var(--line)]">
              {ratings.map((item) => (
                <div
                  key={item.seriesId}
                  className="py-3 flex items-center justify-between gap-3"
                >
                  <div className="space-y-0.5">
                    <Link
                      href={titlePath(item.series)}
                      className="font-semibold text-[14px] text-[var(--ink)] hover:text-[var(--crimson)] hover:underline"
                    >
                      {item.series.title}
                    </Link>
                    <div className="text-[12px] text-[var(--muted)] tabular-nums">
                      {item.series.year} • {item.series.episodeCount} episodes
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 text-[14px] font-semibold text-[var(--ink)] bg-[var(--surface-subtle)] px-2.5 py-1 rounded-[6px] border border-[var(--line)]">
                    <Star className="w-3.5 h-3.5 fill-[var(--crimson)] text-[var(--crimson)]" />
                    <span className="tabular-nums">{item.score}/10</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              title="No drama ratings recorded"
              description="Click 'Rate' on any short drama to record your score from 1 to 10."
            />
          )}
        </div>
      )}

      {/* Tab 3: Contributions */}
      {activeTab === 'contributions' && (
        <div className="space-y-3">
          {contributions.length > 0 ? (
            <div className="divide-y divide-[var(--line)] border-b border-[var(--line)]">
              {contributions.map((c) => (
                <div
                  key={c.id}
                  className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-semibold text-[var(--muted)] bg-[var(--surface-subtle)] px-1.5 py-0.5 rounded-[4px] border border-[var(--line)]">
                        {c.type}
                      </span>
                      <Link
                        href={titlePath({ slug: c.seriesSlug, shortId: c.seriesShortId })}
                        className="font-medium text-[14px] text-[var(--ink)] hover:text-[var(--crimson)] hover:underline"
                      >
                        {c.seriesTitle}
                      </Link>
                    </div>
                    <p className="text-[13px] text-[var(--muted)]">
                      {c.description}
                    </p>
                  </div>

                  <div className="flex items-center gap-3 text-[12px] text-[var(--muted)] shrink-0">
                    <StatusMark status={c.status} size="sm" />
                    <span className="tabular-nums">{c.date}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              title="No contributions yet"
              description="Contribute alternate names, CJK romanizations, or official platform links to help build the index."
            />
          )}
        </div>
      )}

      {/* Tab 4: Reports */}
      {activeTab === 'reports' && (
        <div className="space-y-3">
          {reports.length > 0 ? (
            <div className="space-y-3">
              {reports.map((rep) => (
                <div
                  key={rep.id}
                  className="p-4 bg-[var(--surface)] border border-[var(--line)] rounded-[12px] space-y-2.5"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      {rep.status === 'accepted' && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[4px] text-[11px] font-semibold bg-[var(--status-verified-bg)] text-[var(--status-verified)] border border-[var(--status-verified)]/20">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Accepted</span>
                        </span>
                      )}
                      {rep.status === 'open' && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[4px] text-[11px] font-semibold bg-[var(--status-pending-bg)] text-[var(--status-pending)] border border-[var(--status-pending)]/20">
                          <Clock className="w-3 h-3" />
                          <span>Open</span>
                        </span>
                      )}
                      {rep.status === 'declined' && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[4px] text-[11px] font-semibold bg-[var(--status-disputed-bg)] text-[var(--crimson)] border border-[var(--crimson)]/30">
                          <AlertTriangle className="w-3 h-3" />
                          <span>Declined</span>
                        </span>
                      )}

                      <span className="text-[13px] font-semibold text-[var(--ink)]">
                        {rep.typeName}
                      </span>
                    </div>

                    <span className="text-[12px] text-[var(--muted)] tabular-nums">
                      {rep.submittedAt}
                    </span>
                  </div>

                  <div className="text-[13px]">
                    <span className="text-[var(--muted)] mr-1">Target:</span>
                    <Link
                      href={titlePath({ slug: rep.data?.targetAlias ? 'title' : 'title', shortId: String(rep.seriesId) })}
                      className="font-medium text-[var(--ink)] hover:text-[var(--crimson)] hover:underline"
                    >
                      {rep.seriesTitle}
                    </Link>
                  </div>

                  {/* Declined Moderator Reason */}
                  {rep.status === 'declined' && rep.moderatorNote && (
                    <div className="p-2.5 bg-[var(--status-disputed-bg)] border border-[var(--crimson)]/20 rounded-[6px] text-[12px] text-[var(--ink)]">
                      <span className="font-semibold text-[var(--crimson)] mr-1">
                        Moderator feedback:
                      </span>
                      <span>{rep.moderatorNote}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              title="No reports submitted"
              description="Your reported inaccuracies and watch source verification reports will be listed here."
            />
          )}
        </div>
      )}
    </div>
  );
}
