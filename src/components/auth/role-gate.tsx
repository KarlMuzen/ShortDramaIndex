'use client';

import React from 'react';
import Link from 'next/link';
import { useSession } from '@/src/context/session-context';
import { Button } from '@/src/components/ui/button';
import { ShieldAlert, UserCheck, ArrowRight } from 'lucide-react';

interface RoleGateProps {
  requiredRole: 'editor' | 'moderator';
  children: React.ReactNode;
}

export function RoleGate({ requiredRole, children }: RoleGateProps) {
  const { user, switchUser, availableUsers } = useSession();

  const isModerator = user?.role === 'moderator';
  const isEditor = user?.role === 'editor' || isModerator;

  const hasAccess = requiredRole === 'moderator' ? isModerator : isEditor;

  if (hasAccess) {
    return <>{children}</>;
  }

  const targetDemoUser = availableUsers.find((u) =>
    requiredRole === 'moderator' ? u.role === 'moderator' : u.role === 'editor' || u.role === 'moderator'
  );

  return (
    <div className="py-16 px-4 max-w-md mx-auto text-left space-y-6">
      <div className="p-6 bg-[var(--surface)] border border-[var(--line)] rounded-[12px] space-y-4">
        <div className="w-10 h-10 rounded-[8px] bg-[var(--status-disputed-bg)] text-[var(--crimson)] flex items-center justify-center">
          <ShieldAlert className="w-5 h-5" />
        </div>

        <div className="space-y-1">
          <h1 className="text-[18px] font-semibold text-[var(--ink)]">
            You need {requiredRole} access
          </h1>
          <p className="text-[13px] text-[var(--muted)] leading-relaxed">
            This workspace is reserved for {requiredRole}s to review reference data, merge duplicate short dramas, and manage community submissions.
          </p>
        </div>

        <div className="p-3 bg-[var(--surface-subtle)] rounded-[8px] border border-[var(--line)] text-[12px] space-y-1">
          <span className="text-[var(--muted)]">Current account:</span>
          <div className="font-medium text-[var(--ink)]">
            {user?.name || 'Guest'} (Role: <span className="capitalize">{user?.role || 'reader'}</span>)
          </div>
        </div>

        {targetDemoUser && (
          <div className="pt-2 space-y-2">
            <span className="text-[11px] text-[var(--muted)] uppercase tracking-wider font-semibold block">
              Quick Test Switcher
            </span>
            <Button
              variant="primary"
              size="md"
              fullWidth
              onClick={() => switchUser(targetDemoUser.id)}
              leftIcon={<UserCheck className="w-4 h-4" />}
            >
              Switch to {targetDemoUser.name} ({targetDemoUser.role})
            </Button>
          </div>
        )}
      </div>

      <div className="text-center">
        <Link
          href="/"
          className="text-[13px] text-[var(--muted)] hover:text-[var(--crimson)] hover:underline inline-flex items-center gap-1"
        >
          <span>Return to catalog</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
}
