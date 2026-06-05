'use client'

import { StreamProvider, useStreamClient } from '@/components/shared/StreamProvider'
import { VideoProvider } from '@/components/shared/VideoProvider'
import { VoiceCallProvider } from '@/components/shared/VoiceCallProvider'
import { NotificationProvider } from '@/components/shared/NotificationProvider'
import { SidebarItem } from '@/components/shared/SidebarItem'
import { SearchInput } from '@/components/shared/SearchInput'
import {
  MessageCircle, Users, Phone, User, Hash, Circle, UsersRound,
  Plus, Settings, Moon, Sun, Menu, X,
} from 'lucide-react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { UserButton, useUser } from '@clerk/nextjs'
import { useIncomingRequestCount } from '@/hooks/useIncomingRequestCount'
import { sanitizeDisplayName } from '@/lib/display-name'

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

  const handleSearch = (query: string) => {
    if (query.trim()) {
      router.push(`/find/${query.trim().toUpperCase()}`)
      onNavClick?.()
    }
  }

  const displayName = sanitizeDisplayName(
    user?.fullName,
    user?.primaryEmailAddress?.emailAddress?.split('@')[0],
  )

  return (
    <div className="flex flex-col h-full">
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

      <div className="px-4 pb-3 flex-shrink-0">
        <SearchInput
          value={searchQuery}
          onChange={setSearchQuery}
          onSearch={handleSearch}
          placeholder="Search users..."
          debounceMs={400}
        />
      </div>

      <nav className="flex-1 overflow-y-auto px-3 space-y-0.5 scrollbar-cyber">
        {navItems.map((item) => {
          const active = currentBase === item.href
          return (
            <SidebarItem
              key={item.href}
              href={item.href}
              icon={item.icon}
              label={item.label}
              active={active}
              badge={item.href === '/friends' ? requestCount : undefined}
              onClick={onNavClick}
            />
          )
        })}
      </nav>

      <div className="flex-shrink-0 px-3 py-3 border-t border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            <UserButton />
            <span className="text-xs font-medium text-gray-600 truncate">
              {displayName}
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
            <aside className="hidden md:flex flex-col w-[280px] flex-shrink-0 h-full bg-[#f8fafc] border-r border-gray-200/80 shadow-sidebar">
              <SidebarContent />
            </aside>

            <main className="flex-1 flex flex-col min-w-0 h-full bg-white relative">
              <MobileHeader />
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
