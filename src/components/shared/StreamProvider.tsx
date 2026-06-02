'use client'

import { StreamChat } from 'stream-chat'
import { useEffect, useState, useRef, createContext, useContext } from 'react'
import { useChatStore } from '@/store/chat-store'
import { useUser } from '@clerk/nextjs'

interface StreamContextValue {
  client: StreamChat | null
  userId: string
  userName: string
}

const StreamContext = createContext<StreamContextValue>({
  client: null,
  userId: '',
  userName: '',
})

export const useStreamClient = () => useContext(StreamContext)

export function StreamProvider({ children }: { children: React.ReactNode }) {
  const setStreamReady = useChatStore((s) => s.setStreamReady)
  const { user, isLoaded } = useUser()
  const clientRef = useRef<StreamChat | null>(null)
  const [client, setClient] = useState<StreamChat | null>(null)
  const [ready, setReady] = useState(false)

  const clerkId = user?.id || ''
  const displayName = user?.fullName || user?.primaryEmailAddress?.emailAddress?.split('@')[0] || 'User'
  const avatarUrl = user?.imageUrl

  useEffect(() => {
    if (!isLoaded || !clerkId) return
    let cancelled = false

    const initStream = async () => {
      try {
        const response = await fetch('/api/stream/token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        })
        const data = await response.json()
        if (!data.token) {
          console.error('Stream token error:', data.error)
          return
        }

        const streamKey = process.env.NEXT_PUBLIC_STREAM_KEY!
        if (!streamKey) {
          console.warn('Stream key not configured')
          return
        }

        const chatClient = StreamChat.getInstance(streamKey)
        await chatClient.connectUser(
          { id: clerkId, name: displayName, image: avatarUrl },
          data.token
        )

        if (!cancelled) {
          clientRef.current = chatClient
          setClient(chatClient)
          setStreamReady(true)
          setReady(true)
        }
      } catch (error) {
        console.error('Failed to connect to Stream:', error)
      }
    }

    initStream()

    return () => {
      cancelled = true
      if (clientRef.current) {
        clientRef.current.disconnectUser()
        setStreamReady(false)
        clientRef.current = null
      }
    }
  }, [isLoaded, clerkId, displayName, avatarUrl, setStreamReady])

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex items-center gap-3">
          <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-gray-500 text-sm">Loading...</span>
        </div>
      </div>
    )
  }

  if (!clerkId) {
    return <>{children}</>
  }

  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex items-center gap-3">
          <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-gray-500 text-sm">Connecting...</span>
        </div>
      </div>
    )
  }

  return (
    <StreamContext.Provider value={{ client, userId: clerkId, userName: displayName }}>
      {children}
    </StreamContext.Provider>
  )
}
