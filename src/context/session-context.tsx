'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User, UserRole } from '@/src/data/types';
import { createClient } from '@/src/data/supabase-browser';

interface SessionContextValue {
  user: User | null;
  setUser: (user: User | null) => void;
  signOut: () => Promise<void>;
  refreshSession: () => Promise<void>;
  isLoading: boolean;
}

const SessionContext = createContext<SessionContextValue | undefined>(undefined);

export function SessionProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const supabase = createClient();

  const fetchUserProfile = useCallback(async (authUser: any): Promise<User | null> => {
    if (!authUser) return null;

    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('id, handle, display_name, role, joined_at, avatar_url')
        .eq('id', authUser.id)
        .single();

      if (profile && !error) {
        return {
          id: profile.id,
          name: profile.display_name,
          handle: profile.handle,
          role: profile.role as UserRole,
          avatar: profile.avatar_url || undefined,
          joinedAt: profile.joined_at ? String(profile.joined_at).split('T')[0] : undefined,
        };
      }
    } catch {
      // Ignore
    }

    // Fallback if profile trigger is still running or in preview
    const fallbackHandle = authUser.user_metadata?.handle || authUser.email?.split('@')[0] || 'user';
    const fallbackName = authUser.user_metadata?.display_name || authUser.email?.split('@')[0] || 'Reader';
    return {
      id: authUser.id,
      name: fallbackName,
      handle: fallbackHandle,
      role: 'reader' as UserRole,
      joinedAt: new Date().toISOString().split('T')[0],
    };
  }, [supabase]);

  const refreshSession = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const profileUser = await fetchUserProfile(session.user);
        setUser(profileUser);
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, [supabase, fetchUserProfile]);

  useEffect(() => {
    let isMounted = true;

    // Initial session check
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!isMounted) return;
      if (session?.user) {
        fetchUserProfile(session.user).then((u) => {
          if (isMounted) {
            setUser(u);
            setIsLoading(false);
          }
        });
      } else {
        setUser(null);
        setIsLoading(false);
      }
    });

    // Listen for auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!isMounted) return;
      if (session?.user) {
        const profileUser = await fetchUserProfile(session.user);
        if (isMounted) setUser(profileUser);
      } else {
        if (isMounted) setUser(null);
      }
      setIsLoading(false);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [supabase, fetchUserProfile]);

  const signOut = async () => {
    setIsLoading(true);
    try {
      await supabase.auth.signOut();
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SessionContext.Provider
      value={{
        user,
        setUser,
        signOut,
        refreshSession,
        isLoading,
      }}
    >
      {children}
    </SessionContext.Provider>
  );
}

export function useSession() {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error('useSession must be used within a SessionProvider');
  }
  return context;
}
