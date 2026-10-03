'use client';

import React, { createContext, useContext, useState } from 'react';
import { User } from '@/src/data/types';
import { mockUsers } from '@/src/data/mock';
import { setMockUserAction } from '@/src/data/actions';

interface SessionContextValue {
  user: User | null;
  setUser: (user: User | null) => void;
  switchUser: (userId: string) => Promise<void>;
  availableUsers: User[];
  isLoading: boolean;
}

const SessionContext = createContext<SessionContextValue | undefined>(undefined);

export function SessionProvider({
  initialUser,
  children,
}: {
  initialUser: User | null;
  children: React.ReactNode;
}) {
  const [user, setUser] = useState<User | null>(initialUser || mockUsers[0]);
  const [isLoading, setIsLoading] = useState(false);

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
