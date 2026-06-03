'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useUser, useClerk } from '@clerk/nextjs';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MessageCircle, Users, Phone, Search, Settings, LogOut,
  ChevronLeft, ChevronRight, Moon, Sun, Plus, UserPlus
} from 'lucide-react';
import { useUIStore } from '@/store/ui-store';
import { cn, getInitials, generateAvatarColor } from '@/lib/utils';

const navItems = [
  { href: '/chats', icon: MessageCircle, label: 'Chats' },
  { href: '/groups', icon: Users, label: 'Groups' },
  { href: '/calls', icon: Phone, label: 'Calls' },
  { href: '/search', icon: Search, label: 'Search' },
  { href: '/settings', icon: Settings, label: 'Settings' },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user } = useUser();
  const { signOut } = useClerk();
  const { sidebarOpen, toggleSidebar, isDarkMode, toggleDarkMode, profile } = useUIStore();
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);

  const avatarUrl = profile?.avatar || user?.imageUrl;
  const displayName = profile?.displayName || user?.fullName || user?.username || '';
  const username = profile?.username || user?.username || '';
  const userBio = profile?.bio;

  return (
    <motion.aside
      initial={false}
      animate={{ width: sidebarOpen ? 288 : 72 }}
      className="h-screen bg-white dark:bg-surface-800 border-r border-surface-200 dark:border-surface-700 flex flex-col fixed left-0 top-0 z-50 overflow-hidden"
    >
      <div className="flex items-center justify-between p-4 h-16 border-b border-surface-200 dark:border-surface-700">
        <AnimatePresence mode="wait">
          {sidebarOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center gap-2"
            >
              <div className="w-8 h-8 rounded-lg bg-cyber-500 flex items-center justify-center">
                <MessageCircle className="w-4 h-4 text-white" />
              </div>
              <span className="font-semibold text-surface-900 dark:text-white">CyberChat</span>
            </motion.div>
          )}
        </AnimatePresence>
        <button
          onClick={toggleSidebar}
          className="btn-ghost p-2 rounded-lg"
        >
          {sidebarOpen ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        </button>
      </div>

      <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto scrollbar-thin">
        {navItems.map((item) => {
          const isActive = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              onMouseEnter={() => setHoveredItem(item.label)}
              onMouseLeave={() => setHoveredItem(null)}
              className={cn(
                'flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 relative',
                isActive
                  ? 'bg-cyber-50 dark:bg-cyber-900/30 text-cyber-700 dark:text-cyber-300'
                  : 'text-surface-600 dark:text-surface-400 hover:bg-surface-100 dark:hover:bg-surface-700'
              )}
            >
              <item.icon className="w-5 h-5 shrink-0" />
              <AnimatePresence mode="wait">
                {sidebarOpen && (
                  <motion.span
                    initial={{ opacity: 0, width: 0 }}
                    animate={{ opacity: 1, width: 'auto' }}
                    exit={{ opacity: 0, width: 0 }}
                    className="text-sm font-medium whitespace-nowrap"
                  >
                    {item.label}
                  </motion.span>
                )}
              </AnimatePresence>
              {!sidebarOpen && (
                <div className="absolute left-full ml-2 px-2 py-1 bg-surface-900 dark:bg-surface-100 text-white dark:text-surface-900 text-xs rounded-md whitespace-nowrap shadow-lg pointer-events-none"
                  style={{ opacity: hoveredItem === item.label ? 1 : 0, transition: 'opacity 0.15s' }}
                >
                  {item.label}
                </div>
              )}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-surface-200 dark:border-surface-700 p-2 space-y-1">
        <button
          onClick={toggleDarkMode}
          className="flex items-center gap-3 w-full px-3 py-3 rounded-xl text-surface-600 dark:text-surface-400 hover:bg-surface-100 dark:hover:bg-surface-700 transition-all duration-200"
        >
          {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          {sidebarOpen && <span className="text-sm font-medium">{isDarkMode ? 'Light Mode' : 'Dark Mode'}</span>}
        </button>

        {sidebarOpen && (
          <Link href="/settings" className="flex items-center gap-3 px-3 py-3 hover:bg-surface-100 dark:hover:bg-surface-700 rounded-xl transition-all duration-200">
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-medium shrink-0 overflow-hidden"
              style={{ backgroundColor: generateAvatarColor(displayName) }}
            >
              {avatarUrl ? (
                <img src={avatarUrl} alt="" className="w-full h-full rounded-full object-cover" />
              ) : (
                getInitials(displayName || 'U')
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-surface-900 dark:text-white truncate">
                {displayName}
              </p>
              <p className="text-xs text-surface-500 truncate">
                @{username}
              </p>
              {userBio && (
                <p className="text-[10px] text-surface-400 truncate mt-0.5">{userBio}</p>
              )}
            </div>
          </Link>
        )}

        {sidebarOpen && (
          <button
            onClick={() => signOut()}
            className="flex items-center gap-3 w-full px-3 py-3 rounded-xl text-surface-600 dark:text-surface-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400 transition-all duration-200"
          >
            <LogOut className="w-5 h-5" />
            <span className="text-sm font-medium">Sign Out</span>
          </button>
        )}
      </div>
    </motion.aside>
  );
}
