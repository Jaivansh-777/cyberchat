'use client'

import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MessageCircle, UserPlus, X } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useStreamClient } from './StreamProvider'

interface Notification {
  id: string
  type: 'message' | 'friend_request'
  title: string
  body: string
  channelId?: string
  friendId?: string
}

const NotificationContext = createContext<{
  notifications: Notification[]
  dismiss: (id: string) => void
}>({ notifications: [], dismiss: () => {} })

export const useNotifications = () => useContext(NotificationContext)

export function NotificationProvider({ children, userId }: {
  children: React.ReactNode
  userId: string
}) {
  const router = useRouter()
  const { client } = useStreamClient()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const prevIncomingRef = useRef<string[]>([])

  const addNotification = useCallback((n: Notification) => {
    setNotifications((prev) => [n, ...prev].slice(0, 5))
    setTimeout(() => {
      setNotifications((prev) => prev.filter((x) => x.id !== n.id))
    }, 5000)
  }, [])

  const dismiss = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id))
  }, [])

  useEffect(() => {
    if (!client || !userId) return

    const unsubMsg = client.on('message.new', (e) => {
      if (!e.message || e.message.user?.id === userId) return
      const channelId = e.channel_id || e.channel?.id
      if (!channelId) return
      addNotification({
        id: `msg_${e.message.id}`,
        type: 'message',
        title: e.message.user?.name || 'User',
        body: e.message.text || 'Sent a message',
        channelId,
      })
    })

    const unsubNotif = client.on('notification.message_new', (e) => {
      if (!e.message || e.message.user?.id === userId) return
      const channelId = e.channel?.id || e.channel_id
      if (!channelId) return
      addNotification({
        id: `notif_${e.message.id}`,
        type: 'message',
        title: e.message.user?.name || 'User',
        body: e.message.text || 'Sent a message',
        channelId,
      })
    })

    return () => {
      unsubMsg?.unsubscribe()
      unsubNotif?.unsubscribe()
    }
  }, [client, userId, addNotification])

  useEffect(() => {
    if (!userId) return
    const poll = setInterval(async () => {
      try {
        const res = await fetch('/api/friends/incoming')
        const data = await res.json()
        if (data.requests) {
          const currentIds = data.requests.map((r: any) => r.id)
          const newIds = currentIds.filter((id: string) => !prevIncomingRef.current.includes(id))
          if (newIds.length > 0 && prevIncomingRef.current.length > 0) {
            const newest = data.requests.find((r: any) => r.id === newIds[0])
            if (newest) {
              addNotification({
                id: `fr_${newest.id}`,
                type: 'friend_request',
                title: 'New Friend Request',
                body: `${newest.senderName} sent you a friend request`,
              })
            }
          }
          prevIncomingRef.current = currentIds
        }
      } catch {}
    }, 10000)
    return () => clearInterval(poll)
  }, [userId, addNotification])

  const handleClick = (n: Notification) => {
    dismiss(n.id)
    if (n.type === 'message' && n.channelId) {
      const type = n.channelId.startsWith('dm_') ? 'messaging' : 'team'
      router.push(`/chats/${n.channelId}?type=${type}`)
    } else if (n.type === 'friend_request') {
      router.push('/friends')
    }
  }

  return (
    <NotificationContext.Provider value={{ notifications, dismiss }}>
      {children}
      <div className="fixed top-4 right-4 z-[300] flex flex-col gap-2 max-w-sm w-full pointer-events-none">
        <AnimatePresence>
          {notifications.map((n) => (
            <motion.div
              key={n.id}
              initial={{ opacity: 0, x: 80 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 80 }}
              onClick={() => handleClick(n)}
              className="pointer-events-auto bg-white rounded-2xl shadow-lg border border-gray-100 p-4 flex items-start gap-3 cursor-pointer hover:shadow-xl transition-shadow"
            >
              <div className={`w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 ${
                n.type === 'message' ? 'bg-blue-100 text-blue-500' : 'bg-green-100 text-green-500'
              }`}>
                {n.type === 'message' ? <MessageCircle className="w-5 h-5" /> : <UserPlus className="w-5 h-5" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 truncate">{n.title}</p>
                <p className="text-xs text-gray-500 truncate">{n.body}</p>
              </div>
              <button onClick={(e) => { e.stopPropagation(); dismiss(n.id) }}
                className="p-0.5 rounded-lg hover:bg-gray-100 flex-shrink-0">
                <X className="w-3.5 h-3.5 text-gray-400" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </NotificationContext.Provider>
  )
}
