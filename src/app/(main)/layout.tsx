'use client'

import { StreamProvider, useStreamClient } from '@/components/shared/StreamProvider'
import { VideoProvider } from '@/components/shared/VideoProvider'
import { VoiceCallProvider } from '@/components/shared/VoiceCallProvider'
import { NotificationProvider } from '@/components/shared/NotificationProvider'
import {
  MessageCircle, Users, Phone, User, Hash, Circle, UsersRound,
  Plus, Search, Settings, Moon, Sun, Menu, X,
} from 'lucide-react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { UserButton, useUser } from '@clerk/nextjs'
import { useIncomingRequestCount } from '@/hooks/useIncomingRequestCount'

const navItems = [
  { href: '/chats', icon: MessageCircle, label: 'Chats' },
  { href: '/friends', icon: Users, label: 'Friends' },
  { href: '/groups', icon: UsersRound, label: 'Groups' },
  { href: '/calls', icon: Phone, label: 'Calls' },
  { href: '/status', icon: Circle, label: 'Status' },
  { href: '/profile', icon: User, label: 'Profile' },
]

function SidebarContent({ onNavClick }: { onNavClick?: () => void }) {
  const pathname = usePathname()
  const router = useRouter()
  const { user } = useUser()
  const requestCount = useIncomingRequestCount()
  const currentBase = '/' + pathname.split('/')[1]
  const [searchQuery, setSearchQuery] = useState('')
  const [dark, setDark] = useState(false)

  useEffect(() => {
    const isDark = document.documentElement.classList.contains('dark')
    setDark(isDark)
  }, [])

  const toggleDark = () => {
    const next = !dark
    setDark(next)
    document.documentElement.classList.toggle('dark', next)
  }

  const handleSearch = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && searchQuery.trim()) {
      router.push(`/find/${searchQuery.trim().toUpperCase()}`)
      onNavClick?.()
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Logo + New Chat */}
      <div className="flex items-center justify-between px-5 py-4 flex-shrink-0">
        <Link href="/chats" onClick={onNavClick} className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#4f7cff] to-indigo-500 flex items-center justify-center shadow-sm">
            <Hash className="w-4 h-4 text-white" />
          </div>
          <span className="text-sm font-bold text-gray-900">CyberChat</span>
        </Link>
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => { router.push('/friends'); onNavClick?.() }}
          className="w-8 h-8 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 hover:text-gray-700 transition-colors"
          title="New chat"
        >
          <Plus className="w-4 h-4" />
        </motion.button>
      </div>

      {/* Search */}
      <div className="px-4 pb-3 flex-shrink-0">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={handleSearch}
            placeholder="Search users..."
            className="w-full bg-gray-100 border-none rounded-lg py-2 pl-9 pr-3 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#4f7cff]/30 focus:bg-white transition-all"
          />
        </div>
      </div>

      {/* Nav items */}
      <nav className="flex-1 overflow-y-auto px-3 space-y-0.5 scrollbar-cyber">
        {navItems.map((item) => {
          const active = currentBase === item.href
          const Icon = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavClick}
              className={`sidebar-pill relative ${active ? 'sidebar-pill-active' : ''}`}
            >
              <div className="relative">
                <Icon className={`w-5 h-5 ${active ? 'text-[#4f7cff]' : ''}`} />
                {item.href === '/friends' && requestCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-red-500 text-[9px] font-bold text-white flex items-center justify-center shadow-md">
                    {requestCount}
                  </span>
                )}
              </div>
              <span>{item.label}</span>
              {active && (
                <motion.div
                  layoutId="sidebar-pill-active"
                  className="absolute inset-0 rounded-[0.625rem] bg-[#eef2ff] -z-10"
                  transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                />
              )}
            </Link>
          )
        })}
      </nav>

      {/* Bottom: User + Settings */}
      <div className="flex-shrink-0 px-3 py-3 border-t border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            <UserButton />
            <span className="text-xs text-gray-600 truncate">
              {user?.fullName || user?.primaryEmailAddress?.emailAddress?.split('@')[0] || 'User'}
            </span>
          </div>
          <div className="flex items-center gap-0.5">
            <button
              onClick={toggleDark}
              className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors"
              title="Toggle theme"
            >
              {dark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
            <Link
              href="/settings"
              onClick={onNavClick}
              className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors"
              title="Settings"
            >
              <Settings className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export function MobileHeader() {
  const pathname = usePathname()
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const isInChat = pathname.startsWith('/chats/') && pathname !== '/chats'

  return (
    <>
      {/* Top bar on mobile */}
      <div className="md:hidden flex items-center justify-between px-4 h-12 glass-panel flex-shrink-0">
        <div className="flex items-center gap-3">
          {isInChat ? (
            <button
              onClick={() => router.back()}
              className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-500"
            >
              <ArrowLeftIcon className="w-5 h-5" />
            </button>
          ) : (
            <button
              onClick={() => setOpen(true)}
              className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-500"
            >
              <Menu className="w-5 h-5" />
            </button>
          )}
          <span className="text-sm font-semibold text-gray-900">
            {isInChat ? 'Chat' : 'CyberChat'}
          </span>
        </div>
      </div>

      {/* Mobile drawer overlay */}
      <AnimatePresence>
        {open && (
          <motion.div
            key="sidebar-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="sidebar-overlay md:hidden"
            onClick={() => setOpen(false)}
          >
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              onClick={(e) => e.stopPropagation()}
              className="absolute left-0 top-0 bottom-0 w-[280px] max-w-[85vw] bg-white shadow-elevated flex flex-col"
            >
              <div className="flex items-center justify-end px-4 pt-4 pb-0">
                <button
                  onClick={() => setOpen(false)}
                  className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-400"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="flex-1 overflow-hidden">
                <SidebarContent onNavClick={() => setOpen(false)} />
              </div>
            </motion.aside>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

function ArrowLeftIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M19 12H5" />
      <polyline points="12 19 5 12 12 5" />
    </svg>
  )
}

function AnimatedContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={pathname}
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -4 }}
        transition={{ duration: 0.15, ease: 'easeOut' }}
        className="h-full flex flex-col"
      >
        {children}
      </motion.div>
    </AnimatePresence>
  )
}

function AppProviders({ children }: { children: React.ReactNode }) {
  const { client, userId, userName } = useStreamClient()

  return (
    <VideoProvider>
      <VoiceCallProvider userId={userId} userName={userName}>
        <NotificationProvider userId={userId}>
          <div className="flex h-screen overflow-hidden bg-white">
            {/* Desktop sidebar — always visible md+ */}
            <aside className="hidden md:flex flex-col w-[280px] flex-shrink-0 h-full bg-[#f8fafc] border-r border-gray-200/80 shadow-sidebar">
              <SidebarContent />
            </aside>

            {/* Main content area — flex-1 takes remaining width */}
            <main className="flex-1 flex flex-col min-w-0 h-full bg-white relative">
              <AnimatedContent>{children}</AnimatedContent>
            </main>
          </div>
        </NotificationProvider>
      </VoiceCallProvider>
    </VideoProvider>
  )
}

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <StreamProvider>
      <AppProviders>
        {children}
      </AppProviders>
    </StreamProvider>
  )
}
