'use client'

import { StreamProvider, useStreamClient } from '@/components/shared/StreamProvider'
import { VideoProvider } from '@/components/shared/VideoProvider'
import { VoiceCallProvider } from '@/components/shared/VoiceCallProvider'
import { NotificationProvider } from '@/components/shared/NotificationProvider'
import { MessageCircle, Users, Phone, User, Hash, Circle, UsersRound } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { UserButton, useUser } from '@clerk/nextjs'
import { useIncomingRequestCount } from '@/hooks/useIncomingRequestCount'

const navItems = [
  { href: '/status', icon: Circle, label: 'Status' },
  { href: '/groups', icon: UsersRound, label: 'Groups' },
  { href: '/chats', icon: MessageCircle, label: 'Chats' },
  { href: '/friends', icon: Users, label: 'Friends' },
  { href: '/calls', icon: Phone, label: 'Calls' },
  { href: '/profile', icon: User, label: 'Profile' },
]

function Sidebar() {
  const pathname = usePathname()
  const { user } = useUser()
  const requestCount = useIncomingRequestCount()
  const currentBase = '/' + pathname.split('/')[1]

  return (
    <aside className="hidden md:flex flex-col w-56 h-screen bg-white/80 backdrop-blur-xl border-r border-gray-200/80 flex-shrink-0">
      <div className="px-5 py-5 border-b border-gray-100/80">
        <Link href="/chats" className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center shadow-sm">
            <Hash className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-gray-800">CyberChat</h1>
            <p className="text-[9px] text-gray-400 tracking-widest uppercase">Messenger</p>
          </div>
        </Link>
      </div>
      <nav className="flex-1 py-4 px-3 space-y-1">
        {navItems.map((item) => {
          const active = currentBase === item.href
          const Icon = item.icon
          return (
            <Link key={item.href} href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-sm ${
                active
                  ? 'bg-gradient-to-r from-blue-500/10 to-indigo-500/10 text-blue-600 font-medium shadow-sm'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50/80'
              }`}>
              <div className="relative">
                <Icon className={`w-5 h-5 ${active ? 'text-blue-500' : ''}`} />
                {item.href === '/friends' && requestCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-red-500 text-[9px] font-bold text-white flex items-center justify-center shadow-md">{requestCount}</span>
                )}
              </div>
              <span>{item.label}</span>
              {active && (
                <motion.div layoutId="sidebar-active" className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-500" />
              )}
            </Link>
          )
        })}
      </nav>
      <div className="px-4 py-3 border-t border-gray-100/80 bg-gray-50/30">
        <div className="flex items-center gap-2.5">
          <UserButton />
          <span className="text-xs text-gray-600 truncate">{user?.fullName || user?.primaryEmailAddress?.emailAddress?.split('@')[0] || 'User'}</span>
        </div>
      </div>
    </aside>
  )
}

function BottomNav() {
  const pathname = usePathname()
  const requestCount = useIncomingRequestCount()
  const currentBase = '/' + pathname.split('/')[1]

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-xl border-t border-gray-200/80 shadow-lg">
      <div className="flex items-center justify-around px-2 py-1.5 safe-area-bottom">
        {navItems.map((item) => {
          const active = currentBase === item.href
          const Icon = item.icon
          return (
            <Link key={item.href} href={item.href}
              className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all ${
                active ? 'text-blue-500' : 'text-gray-400'
              }`}>
              <div className="relative">
                <Icon className={`w-5 h-5 ${active ? 'text-blue-500' : ''}`} />
                {item.href === '/friends' && requestCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 w-3.5 h-3.5 rounded-full bg-red-500 text-[7px] font-bold text-white flex items-center justify-center shadow-md">{requestCount}</span>
                )}
              </div>
              <span className="text-[9px] font-medium tracking-wide">{item.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}

function AnimatedContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  return (
    <AnimatePresence mode="wait">
      <motion.div key={pathname} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.2, ease: 'easeOut' }}>
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
          <div className="flex h-screen overflow-hidden bg-gradient-to-br from-gray-50 via-blue-50/20 to-indigo-50/10">
            <Sidebar />
            <main className="flex-1 overflow-hidden">
              <AnimatedContent>{children}</AnimatedContent>
            </main>
            <BottomNav />
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
