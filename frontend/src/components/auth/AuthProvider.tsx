'use client';

import { useEffect } from 'react';
import { useSession } from '@clerk/nextjs';
import { setTokenProvider } from '@/lib/api';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { session, isLoaded } = useSession();

  useEffect(() => {
    if (!isLoaded || !session) return;

    setTokenProvider(async () => {
      try {
        const token = await session.getToken();
        return token || null;
      } catch {
        return null;
      }
    });
  }, [session, isLoaded]);

  return <>{children}</>;
}
