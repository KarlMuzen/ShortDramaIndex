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
import { AlertCircle, Eye, EyeOff } from 'lucide-react';

export function SignInForm() {
  const router = useRouter();
  const { refreshSession } = useSession();
  const { showToast } = useToast();
  const supabase = createClient();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Forgot Password modal state
  const [forgotPasswordOpen, setForgotPasswordOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [resetSent, setResetSent] = useState(false);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!email.trim() || !password.trim()) {
      setErrorMessage('Please enter both your email address and password.');
      return;
    }

    if (!email.includes('@')) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }

    if (password.length < 8) {
      setErrorMessage('Password must be at least 8 characters long.');
      return;
    }

    setIsLoading(true);

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
            Sign in to add short dramas to lists, rate them and report names.
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
              <label htmlFor="signin-password" className="text-[13px] font-medium text-[var(--ink)]">
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
            <div className="relative flex items-center">
              <input
                id="signin-password"
                type={showPassword ? 'text' : 'password'}
                placeholder="At least 8 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                className="w-full h-10 pl-3 pr-11 text-[14px] bg-[var(--surface)] text-[var(--ink)] placeholder:text-[var(--muted)] rounded-[8px] border border-[var(--line)] focus:border-[var(--crimson)] outline-none"
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute right-0 top-0 h-10 w-11 min-w-[44px] min-h-[44px] flex items-center justify-center text-[var(--muted)] hover:text-[var(--ink)] cursor-pointer"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                title={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
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
      >
        <form onSubmit={handleSendResetLink} className="space-y-4 text-left">
          {resetSent ? (
            <div className="p-3 bg-[var(--status-verified-bg)] border border-[var(--status-verified)]/30 rounded-[8px] text-[13px] text-[var(--status-verified)]">
              Password reset link sent to <strong>{forgotEmail}</strong>. Please check your inbox.
            </div>
          ) : (
            <TextField
              label="Account email address"
              type="email"
              placeholder="you@example.com"
              value={forgotEmail}
              onChange={(e) => setForgotEmail(e.target.value)}
              required
              autoComplete="email"
            />
          )}

          <div className="flex items-center justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="quiet"
              size="sm"
              onClick={() => setForgotPasswordOpen(false)}
            >
              Close
            </Button>
            {!resetSent && (
              <Button type="submit" variant="primary" size="sm">
                Send reset link
              </Button>
            )}
          </div>
        </form>
      </Dialog>
    </div>
  );
}
