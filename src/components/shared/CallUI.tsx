'use client'

import { useStreamVideoClient } from '@stream-io/video-react-bindings'
import { StreamCall } from '@stream-io/video-react-sdk'
import { useState, useCallback, useEffect, useRef } from 'react'
import { PhoneOff } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import type { Call } from '@stream-io/video-client'

export { useStreamVideoClient }

export function initiateCall(client: any, callId: string, members: string[]) {
  if (!client) return null
  const call: Call = client.call('default', callId)
  call.create({ data: { members: members.map((id: string) => ({ user_id: id })) }, ring: true }).catch(console.error)
  return call
}

export function CallUI({
  channelId,
  otherUserId,
  currentUserId,
  callTrigger,
  onCallTriggered,
}: {
  channelId: string
  otherUserId: string
  currentUserId: string
  callTrigger?: 'voice' | 'video' | null
  onCallTriggered?: () => void
}) {
  const client = useStreamVideoClient()
  const [callState, setCallState] = useState<'idle' | 'outgoing' | 'connected'>('idle')
  const [activeCall, setActiveCall] = useState<Call | null>(null)
  const [isVideo, setIsVideo] = useState(false)

  const callId = `call_${channelId}`
  const triggeredRef = useRef(false)

  useEffect(() => {
    if (callTrigger && !triggeredRef.current) {
      triggeredRef.current = true
      startCall(callTrigger)
      onCallTriggered?.()
    }
  }, [callTrigger])

  const startCall = useCallback(async (type: 'voice' | 'video') => {
    if (!client) return
    setIsVideo(type === 'video')
    setCallState('outgoing')
    const call: Call = client.call('default', callId)
    try {
      await call.create({
        data: { members: [{ user_id: currentUserId }, { user_id: otherUserId }] },
        ring: true,
      })
      if (type === 'video') {
        await call.camera.enable()
      } else {
        await call.camera.disable()
      }
      await call.join()
      setActiveCall(call)
      setCallState('connected')
    } catch {
      setCallState('idle')
    }
  }, [client, callId, currentUserId, otherUserId])

  const endCall = useCallback(async () => {
    if (activeCall) {
      try { await activeCall.leave() } catch {}
    }
    setCallState('idle')
    setActiveCall(null)
  }, [activeCall])

  if (callState === 'idle') return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] bg-black/90 flex flex-col items-center justify-center"
      >
        {callState === 'outgoing' && (
          <div className="flex flex-col items-center gap-6">
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-3xl font-bold text-white animate-pulse">
              ?
            </div>
            <p className="text-white text-lg font-medium">Calling...</p>
            <button
              onClick={endCall}
              className="w-16 h-16 rounded-full bg-red-500 flex items-center justify-center hover:bg-red-600 transition-colors"
            >
              <PhoneOff className="w-7 h-7 text-white" />
            </button>
          </div>
        )}

        {callState === 'connected' && activeCall && (
          <StreamCall call={activeCall}>
            <div className="w-full h-full flex flex-col">
              <div className="flex-1 flex items-center justify-center">
                {isVideo ? (
                  <div className="w-full h-full relative bg-gray-900">
                    <video
                      autoPlay
                      playsInline
                      muted
                      className="w-full h-full object-cover"
                      ref={(el) => {
                        if (el && activeCall) {
                          const p = activeCall.state?.localParticipant
                          if (p?.videoStream) el.srcObject = p.videoStream
                        }
                      }}
                    />
                    <div className="absolute bottom-4 left-4 text-white text-sm">
                      Connected
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-4">
                    <div className="w-32 h-32 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-5xl font-bold text-white">
                      ?
                    </div>
                    <p className="text-white text-lg">Voice call</p>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                      <span className="text-emerald-400 text-sm">Connected</span>
                    </div>
                  </div>
                )}
              </div>
              <div className="flex items-center justify-center gap-6 py-8">
                <button
                  onClick={endCall}
                  className="w-16 h-16 rounded-full bg-red-500 flex items-center justify-center hover:bg-red-600 transition-colors"
                >
                  <PhoneOff className="w-7 h-7 text-white" />
                </button>
              </div>
            </div>
          </StreamCall>
        )}
      </motion.div>
    </AnimatePresence>
  )
}
