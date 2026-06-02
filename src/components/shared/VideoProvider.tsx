'use client'

import { StreamVideo, StreamVideoClient } from '@stream-io/video-react-sdk'
import { useEffect, useState, useRef } from 'react'
import { useUser } from '@clerk/nextjs'
import { useStreamClient } from './StreamProvider'

let videoClientInstance: StreamVideoClient | null = null

export function useVideoClient() {
  return videoClientInstance
}

export function VideoProvider({ children }: { children: React.ReactNode }) {
  const { user, isLoaded } = useUser()
  const { client: chatClient } = useStreamClient()
  const [ready, setReady] = useState(false)
  const clientRef = useRef<StreamVideoClient | null>(null)
  const [videoClient, setVideoClient] = useState<StreamVideoClient | null>(null)

  useEffect(() => {
    if (!isLoaded || !user?.id || !chatClient) return
    let cancelled = false

    const init = async () => {
      try {
        const res = await fetch('/api/stream/token', { method: 'POST' })
        const data = await res.json()
        if (!data.token) return

        const streamKey = process.env.NEXT_PUBLIC_STREAM_KEY!
        const client = new StreamVideoClient({
          apiKey: streamKey,
          user: { id: user.id, name: user.fullName || 'User', image: user.imageUrl || undefined },
          token: data.token,
        })

        if (!cancelled) {
          videoClientInstance = client
          clientRef.current = client
          setVideoClient(client)
          setReady(true)
        }
      } catch (e) {
        console.error('Video init error:', e)
      }
    }

    init()

    return () => {
      cancelled = true
    }
  }, [isLoaded, user, chatClient])

  if (!ready || !videoClient) return <>{children}</>

  return <StreamVideo client={videoClient}>{children}</StreamVideo>
}
