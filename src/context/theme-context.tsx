'use client';

import React, { createContext, useContext, useEffect, useSyncExternalStore } from 'react';

export type ThemeMode = 'system' | 'light' | 'dark';

interface ThemeContextValue {
  theme: ThemeMode;
  resolvedTheme: 'light' | 'dark';
  mounted: boolean;
  setTheme: (theme: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

let themeListeners: (() => void)[] = [];

function emitThemeChange() {
  for (const listener of themeListeners) {
    listener();
  }
}

function subscribeTheme(callback: () => void) {
  themeListeners.push(callback);
  return () => {
    themeListeners = themeListeners.filter((l) => l !== callback);
  };
}

function getThemeSnapshot(): ThemeMode {
  if (typeof window === 'undefined') return 'system';
  try {
    const saved = localStorage.getItem('sdi_theme') as ThemeMode | null;
    if (saved === 'light' || saved === 'dark' || saved === 'system') {
      return saved;
    }
  } catch {
    // Ignore
  }
  return 'system';
}

function getThemeServerSnapshot(): ThemeMode {
  return 'system';
}

const emptySubscribe = () => () => {};

function getMountedSnapshot() {
  return true;
}

function getMountedServerSnapshot() {
  return false;
}

function subscribeToMedia(callback: () => void) {
  if (typeof window === 'undefined') return () => {};
  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
  mediaQuery.addEventListener('change', callback);
  return () => mediaQuery.removeEventListener('change', callback);
}

function getSystemIsDark() {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

function getServerSystemIsDark() {
  return false;
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const mounted = useSyncExternalStore(emptySubscribe, getMountedSnapshot, getMountedServerSnapshot);
  const theme = useSyncExternalStore(subscribeTheme, getThemeSnapshot, getThemeServerSnapshot);
  const systemIsDark = useSyncExternalStore(subscribeToMedia, getSystemIsDark, getServerSystemIsDark);

  const resolvedTheme: 'light' | 'dark' =
    theme === 'dark' ? 'dark' : theme === 'light' ? 'light' : systemIsDark ? 'dark' : 'light';

  useEffect(() => {
    const root = document.documentElement;
    if (resolvedTheme === 'dark') {
      root.classList.add('dark');
      root.setAttribute('data-theme', 'dark');
    } else {
      root.classList.remove('dark');
      root.setAttribute('data-theme', 'light');
    }
  }, [resolvedTheme]);

  const setTheme = (newTheme: ThemeMode) => {
    try {
      localStorage.setItem('sdi_theme', newTheme);
      emitThemeChange();
    } catch {
      // Ignore
    }
  };

  return (
    <ThemeContext.Provider value={{ theme, resolvedTheme, mounted, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
