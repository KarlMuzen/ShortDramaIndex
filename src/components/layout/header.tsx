'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { siteConfig } from '@/src/config/site';
import { useSession } from '@/src/context/session-context';
import { useTheme } from '@/src/context/theme-context';
import { IconButton } from '../ui/icon-button';
import { Menu, MenuItem, MenuDivider } from '../ui/menu';
import { Search, Sun, Moon, Laptop, LogOut, User as UserIcon, X } from 'lucide-react';

export function Header() {
  const router = useRouter();
  const { user, signOut, isLoading } = useSession();
  const { theme, setTheme, mounted } = useTheme();
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const mobileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (mobileSearchOpen && mobileInputRef.current) {
      mobileInputRef.current.focus();
    }
  }, [mobileSearchOpen]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setMobileSearchOpen(false);
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-[var(--surface)] border-b border-[var(--line)]">
      <div className="max-w-[1120px] mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between gap-4">
        {/* Mobile Search Overlay when expanded */}
        {mobileSearchOpen ? (
          <div className="flex items-center w-full gap-2 py-2">
            <form
              onSubmit={handleSearchSubmit}
              className="flex-1 flex items-center relative"
            >
              <Search className="w-4 h-4 text-[var(--muted)] absolute left-3 pointer-events-none" />
              <input
                ref={mobileInputRef}
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by title, alias, Chinese name..."
                className="w-full h-9 pl-9 pr-8 text-[14px] bg-[var(--surface-subtle)] text-[var(--ink)] placeholder:text-[var(--muted)] rounded-[8px] border border-[var(--line)] focus:border-[var(--crimson)] outline-none"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 p-1 text-[var(--muted)] hover:text-[var(--ink)]"
                  aria-label="Clear search"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </form>
            <IconButton
              size="sm"
              aria-label="Close search"
              onClick={() => setMobileSearchOpen(false)}
            >
              <X className="w-4 h-4" />
            </IconButton>
          </div>
        ) : (
          <>
            {/* Left: Wordmark */}
            <div className="flex items-center gap-6 shrink-0">
              <Link
                href="/"
                className="text-[17px] font-semibold text-[var(--ink)] hover:text-[var(--crimson)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--crimson)] rounded-[4px]"
              >
                {siteConfig.name}
              </Link>

              {/* Quick nav links for desktop */}
              <nav className="hidden lg:flex items-center gap-4 text-[13px] font-medium text-[var(--muted)]">
                <Link
                  href="/search"
                  className="hover:text-[var(--ink)] transition-colors"
                >
                  Browse
                </Link>
                <Link
                  href="/dev/kit"
                  className="hover:text-[var(--crimson)] transition-colors text-[var(--crimson)] font-medium"
                >
                  UI Kit
                </Link>
              </nav>
            </div>

            {/* Center: Search Field (Desktop 768px and up) */}
            <div className="hidden md:flex flex-1 max-w-md mx-auto">
              <form
                onSubmit={handleSearchSubmit}
                className="w-full relative flex items-center"
              >
                <Search className="w-4 h-4 text-[var(--muted)] absolute left-3 pointer-events-none" />
                <input
                  type="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search titles, aliases (e.g. 霸总, CEO, English)..."
                  className="w-full h-9 pl-9 pr-3 text-[13px] bg-[var(--surface-subtle)] text-[var(--ink)] placeholder:text-[var(--muted)] rounded-[8px] border border-[var(--line)] hover:border-[var(--line-strong)] focus:border-[var(--crimson)] focus:bg-[var(--surface)] outline-none transition-colors"
                />
              </form>
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-1.5 shrink-0">
              {/* Mobile Search Trigger (<768px) */}
              <div className="md:hidden">
                <IconButton
                  size="sm"
                  aria-label="Search"
                  onClick={() => setMobileSearchOpen(true)}
                >
                  <Search className="w-4 h-4" />
                </IconButton>
              </div>

              {/* Theme Toggle Menu */}
              <Menu
                align="right"
                trigger={
                  <IconButton size="sm" aria-label="Theme settings">
                    {!mounted ? (
                      <Laptop className="w-4 h-4" />
                    ) : theme === 'dark' ? (
                      <Moon className="w-4 h-4" />
                    ) : theme === 'light' ? (
                      <Sun className="w-4 h-4" />
                    ) : (
                      <Laptop className="w-4 h-4" />
                    )}
                  </IconButton>
                }
              >
                <div className="px-3 py-1.5 text-[12px] text-[var(--muted)]">
                  Theme
                </div>
                <MenuItem
                  icon={<Sun className="w-3.5 h-3.5" />}
                  onClick={() => setTheme('light')}
                  className={theme === 'light' ? 'text-[var(--crimson)] font-semibold' : ''}
                >
                  Light
                </MenuItem>
                <MenuItem
                  icon={<Moon className="w-3.5 h-3.5" />}
                  onClick={() => setTheme('dark')}
                  className={theme === 'dark' ? 'text-[var(--crimson)] font-semibold' : ''}
                >
                  Dark
                </MenuItem>
                <MenuItem
                  icon={<Laptop className="w-3.5 h-3.5" />}
                  onClick={() => setTheme('system')}
                  className={theme === 'system' ? 'text-[var(--crimson)] font-semibold' : ''}
                >
                  System
                </MenuItem>
              </Menu>

              {/* User Session Avatar / Menu */}
              {user ? (
                <Menu
                  align="right"
                  trigger={
                    <button
                      type="button"
                      aria-label="User profile menu"
                      className="flex items-center gap-2 pl-1.5 pr-2 py-1 rounded-[8px] hover:bg-[var(--surface-subtle)] border border-transparent hover:border-[var(--line)] transition-colors select-none cursor-pointer h-8"
                    >
                      <div className="w-6 h-6 rounded-full bg-[var(--crimson)] text-white text-[11px] font-bold flex items-center justify-center">
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                      <span className="text-[13px] font-medium text-[var(--ink)] hidden sm:inline-block max-w-[100px] truncate">
                        {user.name}
                      </span>
                    </button>
                  }
                >
                  <div className="px-3 py-2 text-left">
                    <p className="text-[13px] font-semibold text-[var(--ink)] leading-none">
                      {user.name}
                    </p>
                    <p className="text-[11px] text-[var(--muted)] mt-1 capitalize">
                      Role: <span className="font-medium text-[var(--ink)]">{user.role}</span>
                    </p>
                  </div>

                  <MenuDivider />

                  <MenuItem onClick={() => router.push(`/u/${user.handle}`)}>
                    My profile & lists
                  </MenuItem>
                  {user.role === 'moderator' && (
                    <MenuItem onClick={() => router.push('/mod')}>
                      Moderation queue
                    </MenuItem>
                  )}
                  <MenuItem onClick={() => router.push('/settings')}>
                    Settings
                  </MenuItem>
                  <MenuItem onClick={() => router.push('/dev/kit')}>
                    UI Kit & Tokens
                  </MenuItem>

                  <MenuDivider />
                  <MenuItem
                    icon={<LogOut className="w-3.5 h-3.5 text-[var(--crimson)]" />}
                    onClick={async () => {
                      await signOut();
                      router.push('/');
                    }}
                    className="text-[var(--crimson)]"
                  >
                    Sign out
                  </MenuItem>
                </Menu>
              ) : isLoading ? (
                <div
                  className="flex items-center gap-2 pl-1.5 pr-2 py-1 rounded-[8px] h-8 bg-[var(--surface-subtle)] border border-[var(--line)] select-none"
                  aria-hidden="true"
                >
                  <div className="w-6 h-6 rounded-full bg-[var(--line)]" />
                  <span className="hidden sm:inline-block w-16 h-3 bg-[var(--line)] rounded-[4px]" />
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Link
                    href="/sign-in"
                    className="px-3 py-1.5 text-[13px] font-medium text-[var(--ink)] hover:text-[var(--crimson)] transition-colors"
                  >
                    Sign in
                  </Link>
                  <Link
                    href="/sign-up"
                    className="px-3 py-1.5 text-[13px] font-medium bg-[var(--crimson)] text-white hover:bg-[var(--crimson-hover)] rounded-[8px] transition-colors shadow-xs"
                  >
                    Sign up
                  </Link>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </header>
  );
}
