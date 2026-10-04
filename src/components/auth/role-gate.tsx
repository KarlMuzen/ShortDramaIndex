'use client';

import React from 'react';
import Link from 'next/link';
import { useSession } from '@/src/context/session-context';
import { ShieldAlert, ArrowRight } from 'lucide-react';

interface RoleGateProps {
  requiredRole: 'editor' | 'moderator';
  children: React.ReactNode;
}

export function RoleGate({ requiredRole, children }: RoleGateProps) {
  const { user, isLoading } = useSession();

  const isModerator = user?.role === 'moderator';
  const isEditor = user?.role === 'editor' || isModerator;

  const hasAccess = requiredRole === 'moderator' ? isModerator : isEditor;

  if (isLoading) {
    return (
      <div className="py-16 text-center text-[13px] text-[var(--muted)]">
        Verifying permissions...
      </div>
    );
  }

  if (hasAccess) {
    return <>{children}</>;
  }

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
            {user ? `${user.name} (Role: ${user.role})` : 'Not signed in'}
          </div>
        </div>

        {!user && (
          <div className="pt-2">
            <Link
              href="/sign-in"
              className="w-full inline-flex items-center justify-center px-4 py-2.5 bg-[var(--crimson)] text-white text-[13px] font-semibold rounded-[8px] hover:bg-[var(--crimson-hover)] transition-colors"
            >
              Sign in to your account
            </Link>
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
