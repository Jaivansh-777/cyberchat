'use client'

import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Phone, PhoneOff, PhoneIncoming } from 'lucide-react'
import { useStreamVideoClient } from '@stream-io/video-react-bindings'
import type { Call } from '@stream-io/video-client'

interface VoiceCallContextValue {
  initiateCall: (targetUserId: string, channelId: string) => Promise<void>
  endCall: () => void
  callState: 'idle' | 'outgoing' | 'connected' | 'incoming'
  activeCallId: string | null
}

const VoiceCallContext = createContext<VoiceCallContextValue>({
  initiateCall: async () => {},
  endCall: () => {},
  callState: 'idle',
  activeCallId: null,
})

export const useVoiceCall = () => useContext(VoiceCallContext)

export function VoiceCallProvider({ children, userId, userName, otherUserId, otherUserName }: {
  children: React.ReactNode
  userId: string
  userName: string
  otherUserId?: string
  otherUserName?: string
}) {
  const videoClient = useStreamVideoClient()
  const [callState, setCallState] = useState<'idle' | 'outgoing' | 'connected' | 'incoming'>('idle')
  const [activeCall, setActiveCall] = useState<Call | null>(null)
  const [activeCallId, setActiveCallId] = useState<string | null>(null)
  const [incomingCallerName, setIncomingCallerName] = useState('')
  const callStartRef = useRef<number>(0)

  useEffect(() => {
    if (!videoClient) return
    const unsub = (videoClient as any).on('call.ringing', (e: any) => {
      if (e.call?.id) {
        setActiveCallId(e.call.id)
        setIncomingCallerName(e.call.state?.createdBy?.name || e.call.state?.createdBy?.id || 'User')
        setCallState('incoming')
        setActiveCall(e.call)
      }
    })
    return () => { if (typeof unsub === 'function') unsub() }
  }, [videoClient])

  const initiateCall = useCallback(async (targetUserId: string, channelId: string) => {
    if (!videoClient) return
    const callId = `call_${channelId}`
    setActiveCallId(callId)
    setCallState('outgoing')
    callStartRef.current = Date.now()

    try {
      const call: Call = videoClient.call('default', callId)
      await call.create({
        data: { members: [{ user_id: userId }, { user_id: targetUserId }] },
        ring: true,
      })
      await call.camera.disable()
      await call.join()
      setActiveCall(call)
      setCallState('connected')

      await fetch('/api/calls/log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ receiverId: targetUserId, callType: 'audio', status: 'outgoing' }),
      })

      call.on('call.ended', () => endCall())
    } catch {
      setCallState('idle')
      setActiveCallId(null)
    }
  }, [videoClient, userId])

  const acceptCall = useCallback(async () => {
    if (!activeCall) return
    callStartRef.current = Date.now()
    try {
      await activeCall.camera.disable()
      await activeCall.join()
      setCallState('connected')
    } catch {
      setCallState('idle')
    }
  }, [activeCall])

  const endCall = useCallback(async () => {
    if (activeCall) {
      try { await activeCall.leave() } catch {}
    }
    const duration = callStartRef.current ? Math.floor((Date.now() - callStartRef.current) / 1000) : null
    if (activeCallId && duration !== null) {
      await fetch('/api/calls/log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ receiverId: '', callType: 'audio', status: 'completed', duration }),
      })
    }
    setCallState('idle')
    setActiveCall(null)
    setActiveCallId(null)
  }, [activeCall, activeCallId])

  const rejectCall = useCallback(async () => {
    if (activeCall) {
      try { await activeCall.leave() } catch {}
    }
    if (activeCallId) {
      await fetch('/api/calls/log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ receiverId: '', callType: 'audio', status: 'missed' }),
      })
    }
    setCallState('idle')
    setActiveCall(null)
    setActiveCallId(null)
  }, [activeCall, activeCallId])

  const displayName = incomingCallerName || otherUserName || 'User'

  return (
    <VoiceCallContext.Provider value={{ initiateCall, endCall, callState, activeCallId }}>
      {children}
      <AnimatePresence>
        {callState === 'incoming' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ y: 20 }}
              animate={{ y: 0 }}
              className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl text-center"
            >
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center mx-auto mb-4">
                <PhoneIncoming className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-lg font-bold text-gray-900 mb-1">Incoming Voice Call</h2>
              <p className="text-gray-500 text-sm mb-6">{displayName}</p>
              <div className="flex items-center justify-center gap-4">
                <motion.button
                  whileTap={{ scale: 0.85 }}
                  onClick={acceptCall}
                  className="w-14 h-14 rounded-full bg-emerald-500 flex items-center justify-center shadow-lg hover:bg-emerald-600 transition-colors"
                >
                  <Phone className="w-6 h-6 text-white" />
                </motion.button>
                <motion.button
                  whileTap={{ scale: 0.85 }}
                  onClick={rejectCall}
                  className="w-14 h-14 rounded-full bg-red-500 flex items-center justify-center shadow-lg hover:bg-red-600 transition-colors"
                >
                  <PhoneOff className="w-6 h-6 text-white" />
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}

        {(callState === 'outgoing' || callState === 'connected') && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] bg-black/90 flex flex-col items-center justify-center"
          >
            {callState === 'outgoing' && (
              <div className="flex flex-col items-center gap-6">
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-3xl font-bold text-white animate-pulse">
                  {(otherUserName || '?')[0].toUpperCase()}
                </div>
                <p className="text-white text-lg font-medium">Calling...</p>
                <motion.button whileTap={{ scale: 0.85 }} onClick={endCall}
                  className="w-16 h-16 rounded-full bg-red-500 flex items-center justify-center hover:bg-red-600 transition-colors">
                  <PhoneOff className="w-7 h-7 text-white" />
                </motion.button>
              </div>
            )}
            {callState === 'connected' && (
              <div className="flex flex-col items-center gap-6">
                <div className="w-32 h-32 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-5xl font-bold text-white">
                  {(otherUserName || '?')[0].toUpperCase()}
                </div>
                <p className="text-white text-lg">Voice call</p>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                  <span className="text-emerald-400 text-sm">Connected</span>
                </div>
                <motion.button whileTap={{ scale: 0.85 }} onClick={endCall}
                  className="w-16 h-16 rounded-full bg-red-500 flex items-center justify-center hover:bg-red-600 transition-colors">
                  <PhoneOff className="w-7 h-7 text-white" />
                </motion.button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </VoiceCallContext.Provider>
  )
}
