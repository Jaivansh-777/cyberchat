'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { MessageCircle, Hash, Users, UserPlus } from 'lucide-react'
import { useStreamClient } from '@/components/shared/StreamProvider'
import { MobileHeader } from '@/app/(main)/layout'
import { sanitizeDisplayName } from '@/lib/display-name'
import { UserAvatar } from '@/components/shared/UserAvatar'
import type { Channel } from 'stream-chat'

function ChannelListSkeleton() {
  return (
    <div className="space-y-2 p-5">
      {[1, 2, 3].map((i) => (
        <div key={i} className="flex items-center gap-3 p-3 rounded-xl">
          <div className="w-10 h-10 rounded-xl skeleton" />
          <div className="flex-1 space-y-2">
            <div className="w-28 h-4 rounded skeleton" />
            <div className="w-44 h-3 rounded skeleton" />
          </div>
        </div>
      ))}
    </div>
  )
}

function getDMOtherUser(ch: Channel, userId: string) {
  const members = Object.keys(ch.state?.members || {})
  const otherId = members.find((m) => m !== userId)
  const otherUser = ch.state?.members?.[otherId || '']
  const name = sanitizeDisplayName(
    otherUser?.user?.name,
    otherId,
  )
  return {
    id: otherId || 'unknown',
    name,
    initial: name.charAt(0).toUpperCase(),
    avatarUrl: otherUser?.user?.image || '',
  }
}

export default function ChatsPage() {
  const router = useRouter()
  const { client, userId } = useStreamClient()
  const [channels, setChannels] = useState<Channel[]>([])
  const [loading, setLoading] = useState(true)

  const ensureChannels = useCallback(async () => {
    if (!client || !userId) return []

    try {
      await fetch('/api/stream/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      })

      const filter = { members: { $in: [userId] } }
      const result = await client.queryChannels(filter, { last_message_at: -1 } as any, { watch: true })

      return result
    } catch (err) {
      console.error('Failed to load channels', err)
      return []
    }
  }, [client, userId])

  useEffect(() => {
    setLoading(true)
    ensureChannels().then((chs) => {
      setChannels(chs || [])
      setLoading(false)
    })
  }, [ensureChannels])

  if (loading) {
    return (
      <div className="h-full flex flex-col bg-white">
        <MobileHeader />
        <ChannelListSkeleton />
      </div>
    )
  }

  const teamChs = channels.filter((ch) => ch.type === 'team')
  const dmChs = channels.filter((ch) => ch.type !== 'team')

  if (channels.length === 0) {
    return (
      <div className="h-full flex flex-col bg-white">
        <MobileHeader />
        <div className="flex-1 flex items-center justify-center px-8">
          <div className="flex flex-col items-center text-center max-w-sm">
            <div className="empty-state-icon">
              <MessageCircle className="w-8 h-8 text-[#4f7cff]/50" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900 mb-1.5">No chats yet</h2>
            <p className="text-sm text-gray-400 mb-7 leading-relaxed">
              Start a new conversation by adding friends or joining a group.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 w-full">
              <button
                onClick={() => router.push('/friends')}
                className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#4f7cff] text-white text-sm font-medium hover:bg-[#3b5fd9] transition-colors shadow-sm"
              >
                <UserPlus className="w-4 h-4" />
                Add Friends
              </button>
              <button
                onClick={() => router.push('/groups')}
                className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gray-100 text-gray-700 text-sm font-medium hover:bg-gray-200 transition-colors"
              >
                <Users className="w-4 h-4" />
                Browse Groups
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col bg-white">
      <MobileHeader />
      <div className="flex-1 overflow-y-auto scrollbar-cyber px-4 py-4 space-y-5">
        {dmChs.length > 0 && (
          <div>
            <h2 className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 mb-2 px-1">
              Direct Messages
            </h2>
            <div className="space-y-0.5">
              {dmChs.map((ch, i) => {
                const other = getDMOtherUser(ch, userId || '')
                const lastMsg = ch.state?.latestMessages?.[0]
                return (
                  <motion.button
                    key={ch.cid}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.025 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => router.push(`/chats/${ch.id}?type=messaging`)}
                    className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-all text-left group"
                  >
                    <UserAvatar name={other.name} url={other.avatarUrl} size="md" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-semibold text-gray-900 truncate">{other.name}</h3>
                        {lastMsg && (
                          <span className="text-[10px] text-gray-400 flex-shrink-0 ml-2">
                            {new Date(lastMsg.created_at!).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-400 truncate mt-0.5">
                        {lastMsg ? lastMsg.text || 'Sent a file' : 'No messages yet'}
                      </p>
                    </div>
                  </motion.button>
                )
              })}
            </div>
          </div>
        )}

        {teamChs.length > 0 && (
          <div>
            <h2 className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 mb-2 px-1">
              Channels
            </h2>
            <div className="space-y-0.5">
              {teamChs.map((ch, i) => {
                const chData = ch.data as Record<string, unknown> | undefined
                const name = sanitizeDisplayName((chData?.name as string) || ch.id)
                const desc = (chData?.description as string) || ''
                const memberCount = Object.keys(ch.state?.members || {}).length
                const lastMsg = ch.state?.latestMessages?.[0]
                return (
                  <motion.button
                    key={ch.cid}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.04 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => router.push(`/chats/${ch.id}`)}
                    className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors text-left group"
                  >
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#4f7cff]/10 to-indigo-500/10 flex items-center justify-center flex-shrink-0">
                      <Hash className="w-5 h-5 text-[#4f7cff]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-semibold text-gray-900 truncate"># {name}</h3>
                        <div className="flex items-center gap-1.5 text-[10px] text-gray-400 flex-shrink-0 ml-2">
                          <Users className="w-3 h-3" />
                          <span>{memberCount}</span>
                        </div>
                      </div>
                      <p className="text-xs text-gray-400 truncate mt-0.5">
                        {lastMsg
                          ? `${sanitizeDisplayName(lastMsg.user?.name, lastMsg.user?.id)}: ${lastMsg.text || 'Sent a file'}`
                          : desc || `${memberCount} members`}
                      </p>
                    </div>
                  </motion.button>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
