'use client'

import { useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { useUser } from '@clerk/nextjs'
import { StreamCall, StreamVideo, StreamVideoClient, Call } from '@stream-io/video-react-sdk'
import '@stream-io/video-react-sdk/dist/css/styles.css'
import { PhoneOff, Mic, MicOff, Video, VideoOff } from 'lucide-react'

export default function CallPage({ params }: { params: { callId: string } }) {
  const { user, isLoaded } = useUser()
  const searchParams = useSearchParams()
  const callType = searchParams.get('type') || 'audio'
  const [client, setClient] = useState<StreamVideoClient | null>(null)
  const [call, setCall] = useState<Call | null>(null)
  const [micOn, setMicOn] = useState(true)
  const [camOn, setCamOn] = useState(callType === 'video')
  const [ended, setEnded] = useState(false)

  useEffect(() => {
    if (!isLoaded || !user) return

    const init = async () => {
      const res = await fetch('/api/stream/token', { method: 'POST' })
      const data = await res.json()
      if (!data.token) return

      const streamClient = new StreamVideoClient({
        apiKey: process.env.NEXT_PUBLIC_STREAM_KEY!,
        token: data.token,
        user: { id: user.id, name: user.fullName || 'User' },
      })

      const c = streamClient.call('default', params.callId)
      await c.join({ create: true })

      setClient(streamClient)
      setCall(c)
    }

    init()
    return () => {
      client?.disconnectUser()
    }
  }, [isLoaded, user])

  const endCall = async () => {
    await call?.leave()
    setEnded(true)
  }

  if (!isLoaded || !client || !call) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Connecting to call...</p>
        </div>
      </div>
    )
  }

  if (ended) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="text-center">
          <div className="w-20 h-20 rounded-full bg-gray-800 flex items-center justify-center mx-auto mb-4">
            <PhoneOff className="w-10 h-10 text-red-500" />
          </div>
          <h2 className="text-xl font-bold text-white mb-1">Call Ended</h2>
          <p className="text-gray-400">You left the call</p>
        </div>
      </div>
    )
  }

  return (
    <StreamVideo client={client}>
      <StreamCall call={call}>
        <div className="min-h-screen bg-gray-900 flex flex-col">
          <div className="flex-1 flex items-center justify-center relative">
            <div className="w-32 h-32 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center">
              <span className="text-5xl font-bold text-white">
                {(user?.fullName || '?')[0].toUpperCase()}
              </span>
            </div>
          </div>

          <div className="flex items-center justify-center gap-6 pb-12">
            <button
              onClick={() => setMicOn(!micOn)}
              className={`p-4 rounded-full ${micOn ? 'bg-gray-700' : 'bg-red-500'} text-white`}
            >
              {micOn ? <Mic className="w-6 h-6" /> : <MicOff className="w-6 h-6" />}
            </button>
            <button
              onClick={endCall}
              className="p-4 rounded-full bg-red-500 text-white"
            >
              <PhoneOff className="w-6 h-6" />
            </button>
            {callType === 'video' && (
              <button
                onClick={() => setCamOn(!camOn)}
                className={`p-4 rounded-full ${camOn ? 'bg-gray-700' : 'bg-red-500'} text-white`}
              >
                {camOn ? <Video className="w-6 h-6" /> : <VideoOff className="w-6 h-6" />}
              </button>
            )}
          </div>
        </div>
      </StreamCall>
    </StreamVideo>
  )
}
