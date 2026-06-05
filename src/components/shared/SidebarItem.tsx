'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { type LucideIcon } from 'lucide-react'

interface SidebarItemProps {
  href: string
  icon: LucideIcon
  label: string
  active: boolean
  badge?: number
  onClick?: () => void
}

export function SidebarItem({ href, icon: Icon, label, active, badge, onClick }: SidebarItemProps) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={`sidebar-pill relative ${active ? 'sidebar-pill-active' : ''}`}
    >
      {active && (
        <motion.div
          layoutId="sidebar-indicator"
          className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full bg-[#4f7cff]"
          transition={{ type: 'spring', stiffness: 380, damping: 30 }}
        />
      )}
      <div className="relative flex items-center gap-3 w-full">
        <div className="relative">
          <Icon className={`w-5 h-5 ${active ? 'text-[#4f7cff]' : 'text-[#475569]'}`} />
          {badge !== undefined && badge > 0 && (
            <span className="absolute -top-2 -right-2 min-w-[18px] h-[18px] rounded-full bg-red-500 text-[9px] font-bold text-white flex items-center justify-center px-1 shadow-md">
              {badge > 99 ? '99+' : badge}
            </span>
          )}
        </div>
        <span className={`text-sm ${active ? 'font-semibold text-[#4f7cff]' : 'font-medium text-[#475569]'}`}>
          {label}
        </span>
        {active && (
          <motion.div
            layoutId="sidebar-pill-bg"
            className="absolute inset-0 rounded-[0.625rem] bg-[#eef2ff] -z-10"
            transition={{ type: 'spring', stiffness: 380, damping: 30 }}
          />
        )}
      </div>
    </Link>
  )
}
