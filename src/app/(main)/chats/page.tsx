'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { MessageCircle, Hash, Users, UserPlus, RefreshCw } from 'lucide-react'
import { useStreamClient } from '@/components/shared/StreamProvider'
import type { Channel } from 'stream-chat'

function ChannelListSkeleton() {
  return (
    <div className="space-y-2 p-4">
      {[1, 2, 3].map((i) => (
        <div key={i} className="flex items-center gap-3 p-3 rounded-2xl">
          <div className="w-10 h-10 rounded-xl skeleton" />
          <div className="flex-1 space-y-2">
            <div className="w-24 h-4 rounded skeleton" />
            <div className="w-36 h-3 rounded skeleton" />
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
  return {
    id: otherId || 'unknown',
    name: otherUser?.user?.name || otherId || 'User',
    initial: (otherUser?.user?.name || otherId || 'U')[0].toUpperCase(),
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
      <div className="h-full bg-white">
        <ChannelListSkeleton />
      </div>
    )
  }

  const teamChs = channels.filter((ch) => ch.type === 'team')
  const dmChs = channels.filter((ch) => ch.type !== 'team')

  return (
    <div className="h-full bg-white flex flex-col pb-16 md:pb-0">
      <div className="px-5 py-4 border-b border-gray-100 bg-white/80 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-accent to-indigo-500 flex items-center justify-center shadow-sm">
            <Hash className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-gradient">CyberChat</h1>
            <p className="text-[10px] text-gray-400 tracking-wide">PUBLIC CHAT</p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-cyber px-3 py-3">
        <AnimatePresence mode="wait">
          {channels.length === 0 ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center py-16 px-8 text-center"
            >
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-accent/10 to-indigo-500/10 flex items-center justify-center mb-4">
                <MessageCircle className="w-10 h-10 text-accent/40" />
              </div>
              <h2 className="text-lg font-semibold text-gray-900 mb-2">No channels yet</h2>
              <p className="text-sm text-gray-400 mb-6 max-w-xs">
                Add friends to start chatting, or join a group channel to get started.
              </p>
              <div className="flex gap-3">
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() => router.push('/friends')}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-blue-500 to-indigo-500 text-white text-sm font-medium shadow-lg"
                >
                  <UserPlus className="w-4 h-4" />
                  Add Friends
                </motion.button>
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() => router.push('/groups')}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-gray-100 text-gray-700 text-sm font-medium hover:bg-gray-200"
                >
                  <Users className="w-4 h-4" />
                  Browse Groups
                </motion.button>
              </div>
            </motion.div>
          ) : (
            <motion.div key="list" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              {dmChs.length > 0 && (
                <div className="mb-4">
                  <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2 px-2">
                    Direct Messages
                  </h2>
                  <div className="space-y-1">
                    {dmChs.map((ch, i) => {
                      const other = getDMOtherUser(ch, userId || '')
                      const lastMsg = ch.state?.latestMessages?.[0]
                      return (
                        <motion.button
                          key={ch.cid}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.03 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => router.push(`/chats/${ch.id}?type=messaging`)}
                          className="w-full flex items-center gap-3 p-3 rounded-2xl hover:bg-gray-50 transition-all text-left"
                        >
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-sm font-bold text-white flex-shrink-0 overflow-hidden shadow-sm">
                            {other.avatarUrl ? (
                              <img src={other.avatarUrl} alt="" className="w-full h-full object-cover" />
                            ) : (
                              other.initial
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="text-sm font-medium text-gray-900">{other.name}</h3>
                            <p className="text-xs text-gray-400 truncate">
                              {lastMsg
                                ? `${lastMsg.text || 'Sent a file'}`
                                : 'No messages yet'}
                            </p>
                          </div>
                        </motion.button>
                      )
                    })}
                  </div>
                </div>
              )}

              <div>
                <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2 px-2">
                  Channels
                </h2>
                <div className="space-y-1">
                  {teamChs.map((ch, i) => {
                    const chData = ch.data as Record<string, unknown> | undefined
                    const name = (chData?.name as string) || ch.id
                    const desc = (chData?.description as string) || ''
                    const memberCount = Object.keys(ch.state?.members || {}).length
                    const lastMsg = ch.state?.latestMessages?.[0]
                    return (
                      <motion.button
                        key={ch.cid}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => router.push(`/chats/${ch.id}`)}
                        className="w-full flex items-center gap-3 p-3 rounded-2xl hover:bg-gray-50 transition-colors text-left"
                      >
                        <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-accent/10 to-indigo-500/10 flex items-center justify-center flex-shrink-0">
                          <Hash className="w-5 h-5 text-accent" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-sm font-medium text-gray-900"># {name}</h3>
                          <p className="text-xs text-gray-400 truncate">
                            {lastMsg
                              ? `${lastMsg.user?.name || lastMsg.user?.id}: ${lastMsg.text || 'Sent a file'}`
                              : desc || `${memberCount} members`}
                          </p>
                        </div>
                        <div className="flex items-center gap-1.5 text-[10px] text-gray-400">
                          <Users className="w-3 h-3" />
                          <span>{memberCount}</span>
                        </div>
                      </motion.button>
                    )
                  })}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
