'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from '@/src/context/session-context';

export function ProfileRedirect() {
  const router = useRouter();
  const { user, isLoading } = useSession();

  useEffect(() => {
    if (!isLoading) {
      if (user) {
        router.replace(`/u/${user.handle}`);
      } else {
        router.replace('/sign-in');
      }
    }
  }, [user, isLoading, router]);

  return null;
}
