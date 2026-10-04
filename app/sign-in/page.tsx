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
import { Dialog } from '@/src/components/ui/dialog';
import { AlertCircle } from 'lucide-react';

export default function SignInPage() {
  const router = useRouter();
  const { refreshSession } = useSession();
  const { showToast } = useToast();
  const supabase = createClient();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Forgot Password modal state
  const [forgotPasswordOpen, setForgotPasswordOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [resetSent, setResetSent] = useState(false);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setIsLoading(true);

    if (!email.trim() || !password.trim()) {
      setErrorMessage('Please enter both your email address and password.');
      setIsLoading(false);
      return;
    }

    if (!email.includes('@')) {
      setErrorMessage('Please enter a valid email address with an @ symbol.');
      setIsLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        setErrorMessage(error.message);
        return;
      }

      if (data?.user) {
        await refreshSession();
        showToast({
          title: 'Signed in',
          description: 'Welcome back.',
          type: 'success',
        });
        router.push('/');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'An unexpected error occurred during sign in.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendResetLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail || !forgotEmail.includes('@')) {
      showToast({
        title: 'Invalid email',
        description: 'Please enter a valid email address to receive password reset instructions.',
        type: 'error',
      });
      return;
    }

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(forgotEmail.trim(), {
        redirectTo: `${siteConfig.baseUrl}/settings`,
      });

      if (error) {
        showToast({
          title: 'Error',
          description: error.message,
          type: 'error',
        });
        return;
      }

      setResetSent(true);
      showToast({
        title: 'Reset instructions sent',
        description: `If an account exists for ${forgotEmail}, you will receive a reset link shortly.`,
        type: 'success',
      });
    } catch {
      setResetSent(true);
    }
  };

  return (
    <div className="py-12 px-4 flex justify-center text-left">
      <div className="w-full max-w-[400px] space-y-6">
        {/* Header */}
        <div className="space-y-1.5 text-center">
          <h1 className="text-[24px] font-semibold text-[var(--ink)] tracking-tight">
            Sign in
          </h1>
          <p className="text-[13px] text-[var(--muted)]">
            Sign in to track watchlists, rate dramas, and contribute aliases
          </p>
        </div>

        {/* Error Alert Box */}
        {errorMessage && (
          <div className="p-3 bg-[var(--status-disputed-bg)] border border-[var(--crimson)]/30 rounded-[8px] text-[13px] text-[var(--crimson)] flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Email & Password Form */}
        <form onSubmit={handleSignIn} className="space-y-4">
          <TextField
            label="Email address"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
          />

          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="text-[13px] font-medium text-[var(--ink)]">
                Password
              </label>
              <button
                type="button"
                onClick={() => {
                  setForgotPasswordOpen(true);
                  setResetSent(false);
                }}
                className="text-[12px] text-[var(--crimson)] hover:underline cursor-pointer"
              >
                Forgot password?
              </button>
            </div>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              className="w-full h-10 px-3 text-[14px] bg-[var(--surface)] text-[var(--ink)] placeholder:text-[var(--muted)] rounded-[8px] border border-[var(--line)] focus:border-[var(--crimson)] outline-none"
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
            Sign in
          </Button>
        </form>

        {/* Sign up link */}
        <div className="pt-2 text-center text-[13px] text-[var(--muted)]">
          <span>Don&apos;t have an account?</span>{' '}
          <Link
            href="/sign-up"
            className="font-medium text-[var(--crimson)] hover:underline"
          >
            Create account
          </Link>
        </div>
      </div>

      {/* Forgot Password Modal */}
      <Dialog
        open={forgotPasswordOpen}
        onClose={() => setForgotPasswordOpen(false)}
        title="Reset your password"
        description="Enter the email associated with your account and we will send password reset instructions."
        maxWidth="sm"
        footer={
          resetSent ? (
            <Button
              variant="secondary"
              size="sm"
              fullWidth
              onClick={() => setForgotPasswordOpen(false)}
            >
              Done
            </Button>
          ) : (
            <>
              <Button
                variant="quiet"
                size="sm"
                onClick={() => setForgotPasswordOpen(false)}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleSendResetLink}
              >
                Send reset link
              </Button>
            </>
          )
        }
      >
        {resetSent ? (
          <div className="p-3 bg-[var(--surface-subtle)] border border-[var(--line)] rounded-[8px] text-[13px] text-[var(--ink)] space-y-1">
            <span className="font-semibold text-[var(--status-verified)] block">
              Instructions dispatched
            </span>
            <p className="text-[var(--muted)]">
              Check your inbox for a password reset email from {siteConfig.domain}.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSendResetLink} className="space-y-3 text-left">
            <TextField
              label="Account email address"
              type="email"
              placeholder="you@example.com"
              value={forgotEmail}
              onChange={(e) => setForgotEmail(e.target.value)}
              required
              autoFocus
            />
          </form>
        )}
      </Dialog>
    </div>
  );
}
