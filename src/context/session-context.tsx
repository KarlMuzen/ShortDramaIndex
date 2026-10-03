'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '@/src/data/types';
import { mockUsers } from '@/src/data/mock';
import { setMockUserAction } from '@/src/data/actions';
import { loadSession } from '@/src/data/session-client';

interface SessionContextValue {
  user: User | null;
  setUser: (user: User | null) => void;
  switchUser: (userId: string) => Promise<void>;
  availableUsers: User[];
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

  useEffect(() => {
    let isMounted = true;
    loadSession().then((loaded) => {
      if (isMounted) {
        setUser(loaded || mockUsers[0]);
        setIsLoading(false);
      }
    });
    return () => {
      isMounted = false;
    };
  }, []);

  const switchUser = async (userId: string) => {
    setIsLoading(true);
    try {
      const updated = await setMockUserAction(userId);
      if (updated) {
        setUser(updated);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SessionContext.Provider
      value={{
        user,
        setUser,
        switchUser,
        availableUsers: mockUsers,
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
