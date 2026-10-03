import { User } from './types';

export async function loadSession(): Promise<User | null> {
  try {
    const res = await fetch('/api/session', {
      cache: 'no-store',
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}
