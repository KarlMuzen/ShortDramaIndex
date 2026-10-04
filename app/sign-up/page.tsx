'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { siteConfig } from '@/src/config/site';
import { createClient } from '@/src/data/supabase-browser';
import { useSession } from '@/src/context/session-context';
import { useToast } from '@/src/components/ui/toast';
import { Button } from '@/src/components/ui/button';
import { TextField } from '@/src/components/ui/text-field';
import { Checkbox } from '@/src/components/ui/checkbox';
import { AlertCircle, CheckCircle2 } from 'lucide-react';

export default function SignUpPage() {
  const router = useRouter();
  const { refreshSession } = useSession();
  const { showToast } = useToast();
  const supabase = createClient();

  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [agreedGuidelines, setAgreedGuidelines] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

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

    const cleanHandle =
      displayName
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9_]/g, '') ||
      email.split('@')[0].toLowerCase().replace(/[^a-z0-9_]/g, '') ||
      `user_${Math.floor(Math.random() * 10000)}`;

    try {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            display_name: displayName.trim(),
            handle: cleanHandle,
          },
        },
      });

      if (error) {
        setErrorMessage(error.message);
        return;
      }

      if (data?.session) {
        await refreshSession();
        showToast({
          title: 'Account created',
          description: `Welcome to ${siteConfig.name}, ${displayName}.`,
          type: 'success',
        });
        router.push('/');
      } else {
        // Confirmation email required
        setIsSuccess(true);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'An error occurred during account creation.');
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

        {isSuccess ? (
          <div className="p-6 bg-[var(--surface)] border border-[var(--line)] rounded-[12px] space-y-4 text-center">
            <div className="w-12 h-12 rounded-full bg-[var(--status-verified-bg)] text-[var(--status-verified)] flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div className="space-y-1.5">
              <h2 className="text-[18px] font-semibold text-[var(--ink)]">
                Check your email
              </h2>
              <p className="text-[13px] text-[var(--muted)] leading-relaxed">
                We sent a confirmation link to <strong className="text-[var(--ink)]">{email}</strong>. Please verify your email to activate your account.
              </p>
            </div>
            <div className="pt-2">
              <Link href="/sign-in">
                <Button variant="primary" size="md" fullWidth>
                  Return to sign in
                </Button>
              </Link>
            </div>
          </div>
        ) : (
          /* Sign up form */
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
        )}

        {/* Sign in link */}
        {!isSuccess && (
          <div className="pt-2 text-center text-[13px] text-[var(--muted)]">
            <span>Already have an account?</span>{' '}
            <Link
              href="/sign-in"
              className="font-medium text-[var(--crimson)] hover:underline"
            >
              Sign in
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
