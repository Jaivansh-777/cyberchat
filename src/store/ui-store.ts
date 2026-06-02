'use client'

import { create } from 'zustand'
import type { NavTab } from '@/types'

interface UIState {
  activeTab: NavTab
  isSearchOpen: boolean
  searchQuery: string
  isMobileMenuOpen: boolean
  showStoryViewer: boolean
  activeStoryUserId: string | null
  isCallActive: boolean
  callType: 'VOICE' | 'VIDEO' | null
  callTarget: string | null

  setActiveTab: (tab: NavTab) => void
  setSearchOpen: (open: boolean) => void
  setSearchQuery: (query: string) => void
  setMobileMenuOpen: (open: boolean) => void
  setShowStoryViewer: (show: boolean) => void
  setActiveStoryUserId: (userId: string | null) => void
  setCallActive: (active: boolean) => void
  setCallType: (type: 'VOICE' | 'VIDEO' | null) => void
  setCallTarget: (target: string | null) => void
}

export const useUIStore = create<UIState>((set) => ({
  activeTab: 'chats',
  isSearchOpen: false,
  searchQuery: '',
  isMobileMenuOpen: false,
  showStoryViewer: false,
  activeStoryUserId: null,
  isCallActive: false,
  callType: null,
  callTarget: null,

  setActiveTab: (activeTab) => set({ activeTab }),
  setSearchOpen: (isSearchOpen) => set({ isSearchOpen }),
  setSearchQuery: (searchQuery) => set({ searchQuery }),
  setMobileMenuOpen: (isMobileMenuOpen) => set({ isMobileMenuOpen }),
  setShowStoryViewer: (showStoryViewer) => set({ showStoryViewer }),
  setActiveStoryUserId: (activeStoryUserId) => set({ activeStoryUserId }),
  setCallActive: (isCallActive) => set({ isCallActive }),
  setCallType: (callType) => set({ callType }),
  setCallTarget: (callTarget) => set({ callTarget }),
}))
