import { create } from 'zustand';
import type { CallState } from '@/types';

interface UIState {
  sidebarOpen: boolean;
  isDarkMode: boolean;
  callInProgress: boolean;
  callData: any | null;
  searchOpen: boolean;
  profile: any | null;

  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  toggleDarkMode: () => void;
  setDarkMode: (dark: boolean) => void;
  setCallInProgress: (inProgress: boolean, data?: any) => void;
  setSearchOpen: (open: boolean) => void;
  setProfile: (profile: any) => void;
}

export const useUIStore = create<UIState>((set) => ({
  sidebarOpen: true,
  isDarkMode: false,
  callInProgress: false,
  callData: null,
  searchOpen: false,
  profile: null,

  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  toggleDarkMode: () =>
    set((s) => {
      const newDark = !s.isDarkMode;
      if (typeof window !== 'undefined') {
        document.documentElement.classList.toggle('dark', newDark);
        localStorage.setItem('cyberchat_dark', String(newDark));
      }
      return { isDarkMode: newDark };
    }),
  setDarkMode: (dark) =>
    set(() => {
      if (typeof window !== 'undefined') {
        document.documentElement.classList.toggle('dark', dark);
        localStorage.setItem('cyberchat_dark', String(dark));
      }
      return { isDarkMode: dark };
    }),
  setCallInProgress: (inProgress, data) =>
    set({ callInProgress: inProgress, callData: data || null }),
  setSearchOpen: (open) => set({ searchOpen: open }),
  setProfile: (profile) => set({ profile }),
}));
