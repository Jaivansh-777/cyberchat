'use client'

import { motion } from 'framer-motion'
import { getInitial } from '@/lib/display-name'

interface UserAvatarProps {
  name?: string | null
  url?: string | null
  size?: 'sm' | 'md' | 'lg' | 'xl'
  gradient?: string
  className?: string
  ring?: boolean
}

const sizeMap = {
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-14 h-14 text-xl',
  xl: 'w-28 h-28 text-4xl',
}

const ringSize = {
  sm: 'w-8 h-8',
  md: 'w-10 h-10',
  lg: 'w-14 h-14',
  xl: 'w-28 h-28',
}

export function UserAvatar({
  name,
  url,
  size = 'md',
  gradient = 'from-emerald-400 to-teal-500',
  className = '',
  ring = false,
}: UserAvatarProps) {
  const dim = sizeMap[size]
  const initial = getInitial(name)

  const inner = url ? (
    <img src={url} alt="" className="w-full h-full object-cover" />
  ) : (
    <span className={`font-bold ${size === 'xl' ? 'text-blue-500' : 'text-white'}`}>
      {initial}
    </span>
  )

  const baseClass = `${ringSize[size]} rounded-full bg-gradient-to-br ${gradient} flex items-center justify-center ${dim} flex-shrink-0 overflow-hidden ${className}`

  if (ring) {
    return (
      <div className={`${ringSize[size]} rounded-full p-[2px] bg-gradient-to-br ${gradient}`}>
        <div className="w-full h-full rounded-full bg-white flex items-center justify-center overflow-hidden">
          {url ? (
            <img src={url} alt="" className="w-full h-full object-cover" />
          ) : (
            <span className={`font-bold ${size === 'xl' ? 'text-blue-500' : ''} ${dim.split(' ').find(c => c.startsWith('text-'))}`}>
              {initial}
            </span>
          )}
        </div>
      </div>
    )
  }

  return (
    <motion.div
      whileHover={{ scale: 1.05 }}
      transition={{ duration: 0.15 }}
      className={baseClass}
    >
      {inner}
    </motion.div>
  )
}
