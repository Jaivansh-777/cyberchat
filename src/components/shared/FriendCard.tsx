'use client'

import { motion } from 'framer-motion'
import { MessageCircle, UserMinus, Check, X, Clock, Loader2, UserPlus } from 'lucide-react'
import { UserAvatar } from './UserAvatar'
import { sanitizeDisplayName } from '@/lib/display-name'

interface FriendCardBaseProps {
  name?: string | null
  cyberId?: string
  avatar?: string | null
  action?: 'chat' | 'remove' | 'accept' | 'decline' | 'cancel' | 'add' | 'pending'
  onAction?: () => void
  loading?: boolean
  subtitle?: string
}

export function FriendCard({
  name,
  cyberId,
  avatar,
  action,
  onAction,
  loading,
  subtitle,
}: FriendCardBaseProps) {
  const displayName = sanitizeDisplayName(name)

  const actionButton = () => {
    if (!action) return null

    const baseClass = 'flex items-center justify-center p-2 rounded-xl transition-colors disabled:opacity-50'

    switch (action) {
      case 'chat':
        return (
          <motion.button
            whileTap={{ scale: 0.85 }}
            onClick={onAction}
            disabled={loading}
            className={`${baseClass} bg-blue-500 text-white hover:bg-blue-600`}
            title="Send message"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <MessageCircle className="w-4 h-4" />}
          </motion.button>
        )
      case 'remove':
        return (
          <motion.button
            whileTap={{ scale: 0.85 }}
            onClick={onAction}
            disabled={loading}
            className={`${baseClass} bg-red-100 text-red-500 hover:bg-red-200`}
            title="Remove friend"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserMinus className="w-4 h-4" />}
          </motion.button>
        )
      case 'accept':
        return (
          <div className="flex gap-1.5">
            <motion.button
              whileTap={{ scale: 0.85 }}
              onClick={onAction}
              disabled={loading}
              className={`${baseClass} bg-emerald-500 text-white`}
              title="Accept"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.85 }}
              onClick={onAction}
              disabled={loading}
              className={`${baseClass} bg-red-500 text-white`}
              title="Decline"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <X className="w-4 h-4" />}
            </motion.button>
          </div>
        )
      case 'decline':
        return (
          <motion.button
            whileTap={{ scale: 0.85 }}
            onClick={onAction}
            disabled={loading}
            className={`${baseClass} bg-red-100 text-red-500 hover:bg-red-200`}
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <X className="w-4 h-4" />}
          </motion.button>
        )
      case 'cancel':
        return (
          <motion.button
            whileTap={{ scale: 0.85 }}
            onClick={onAction}
            disabled={loading}
            className={`${baseClass} bg-gray-100 text-gray-500 hover:bg-gray-200`}
            title="Cancel request"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <X className="w-4 h-4" />}
          </motion.button>
        )
      case 'add':
        return (
          <motion.button
            whileTap={{ scale: 0.85 }}
            onClick={onAction}
            disabled={loading}
            className={`${baseClass} bg-blue-500 text-white hover:bg-blue-600`}
            title="Add friend"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
          </motion.button>
        )
      case 'pending':
        return (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 text-amber-600 text-[10px] font-medium">
            <Clock className="w-3 h-3" />
            Pending
          </div>
        )
      default:
        return null
    }
  }

  return (
    <div className="flex items-center gap-3 p-3 rounded-2xl hover:bg-gray-50 transition-colors group">
      <UserAvatar name={displayName} url={avatar} size="md" gradient={action === 'accept' ? 'from-amber-400 to-orange-500' : 'from-emerald-400 to-teal-500'} />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-gray-900 truncate">{displayName}</p>
        <div className="flex items-center gap-1.5">
          {cyberId && (
            <p className="text-[10px] font-mono text-gray-400">{cyberId}</p>
          )}
          {subtitle && (
            <>
              <span className="text-[10px] text-gray-300">·</span>
              <p className="text-[10px] text-gray-400">{subtitle}</p>
            </>
          )}
        </div>
      </div>
      {actionButton()}
    </div>
  )
}
