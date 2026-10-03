'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { siteConfig } from '@/src/config/site';
import { useSession } from '@/src/context/session-context';
import { useToast } from '@/src/components/ui/toast';
import { Button } from '@/src/components/ui/button';
import { TextField } from '@/src/components/ui/text-field';
import { Checkbox } from '@/src/components/ui/checkbox';
import { AlertCircle } from 'lucide-react';

export default function SignUpPage() {
  const router = useRouter();
  const { switchUser, availableUsers } = useSession();
  const { showToast } = useToast();

  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [agreedGuidelines, setAgreedGuidelines] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!displayName.trim()) {
      setErrorMessage('Please enter a display name for your profile.');
      return;
    }

    if (!email.trim() || !email.includes('@')) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }

    if (password.length < 6) {
      setErrorMessage('Password must be at least 6 characters long.');
      return;
    }

    if (!agreedGuidelines) {
      setErrorMessage('Please accept the community guidelines to proceed.');
      return;
    }

    setIsLoading(true);
    try {
      await switchUser(availableUsers[0].id);
      showToast({
        title: 'Account created',
        description: `Welcome to ${siteConfig.name}, ${displayName}.`,
        type: 'success',
      });
      router.push(`/u/${availableUsers[0].handle}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignUp = async () => {
    setIsLoading(true);
    try {
      await switchUser(availableUsers[0].id);
      showToast({
        title: 'Account created with Google',
        description: `Welcome, ${availableUsers[0].name}.`,
        type: 'success',
      });
      router.push(`/u/${availableUsers[0].handle}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="py-12 px-4 flex justify-center text-left">
      <div className="w-full max-w-[400px] space-y-6">
        {/* Header */}
        <div className="space-y-1.5 text-center">
          <h1 className="text-[24px] font-semibold text-[var(--ink)] tracking-tight">
            Create account
          </h1>
          <p className="text-[13px] text-[var(--muted)]">
            Join the reference index for short vertical dramas
          </p>
        </div>

        {/* Error Alert Box */}
        {errorMessage && (
          <div className="p-3 bg-[var(--status-disputed-bg)] border border-[var(--crimson)]/30 rounded-[8px] text-[13px] text-[var(--crimson)] flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Third-Party Auth: Google */}
        <div className="space-y-3">
          <button
            type="button"
            onClick={handleGoogleSignUp}
            disabled={isLoading}
            className="w-full h-11 px-4 rounded-[8px] border border-[var(--line)] bg-[var(--surface)] hover:bg-[var(--surface-hover)] text-[var(--ink)] font-medium text-[14px] flex items-center justify-center gap-2.5 transition-colors cursor-pointer select-none"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>Continue with Google</span>
          </button>

          <div className="flex items-center gap-3 py-1">
            <div className="flex-1 h-px bg-[var(--line)]" />
            <span className="text-[12px] text-[var(--muted)] uppercase tracking-wider font-medium">
              or with email
            </span>
            <div className="flex-1 h-px bg-[var(--line)]" />
          </div>
        </div>

        {/* Sign up form */}
        <form onSubmit={handleSignUp} className="space-y-4">
          <TextField
            label="Display name"
            placeholder="e.g. Elena Vance"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            required
            autoComplete="name"
          />

          <TextField
            label="Email address"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
          />

          <TextField
            label="Password"
            type="password"
            placeholder="At least 6 characters"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="new-password"
          />

          <div className="pt-1">
            <Checkbox
              checked={agreedGuidelines}
              onChange={(e) => setAgreedGuidelines(e.target.checked)}
              label="I agree to follow the community editing and submission guidelines."
            />
          </div>

          <Button
            type="submit"
            variant="primary"
            size="md"
            fullWidth
            isLoading={isLoading}
            className="h-11 font-semibold"
          >
            Create account
          </Button>
        </form>

        {/* Sign in link */}
        <div className="pt-2 text-center text-[13px] text-[var(--muted)]">
          <span>Already have an account?</span>{' '}
          <Link
            href="/sign-in"
            className="font-medium text-[var(--crimson)] hover:underline"
          >
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
