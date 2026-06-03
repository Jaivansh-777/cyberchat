'use client';

import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { AuthProvider } from '@/components/auth/AuthProvider';
import { CallOverlay } from '@/components/calls/CallOverlay';
import { useUIStore } from '@/store/ui-store';
import { useSocket } from '@/hooks/useSocket';
import { api } from '@/lib/api';

function DashboardInner({ children }: { children: React.ReactNode }) {
  const { isSignedIn, isLoaded } = useUser();
  const router = useRouter();
  const { setProfile } = useUIStore();

  useSocket();

  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      router.push('/');
    }
  }, [isLoaded, isSignedIn, router]);

  useEffect(() => {
    if (isLoaded && isSignedIn) {
      api.getMe().then((data) => {
        setProfile(data);
      }).catch(() => {});
    }
  }, [isLoaded, isSignedIn, setProfile]);

  const sidebarOpen = useUIStore((s) => s.sidebarOpen);

  if (!isLoaded || !isSignedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-surface-900">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-2 border-cyber-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-surface-500">Loading CyberChat...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex overflow-hidden bg-white dark:bg-surface-900">
      <Sidebar />
      <main className={`flex-1 flex flex-col transition-all duration-300 ${sidebarOpen ? 'md:ml-72' : 'ml-0'}`}>
        {children}
      </main>
      <CallOverlay />
    </div>
  );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <DashboardInner>{children}</DashboardInner>
    </AuthProvider>
  );
}
