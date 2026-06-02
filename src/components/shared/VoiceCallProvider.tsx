'use client'

import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Phone, PhoneOff, PhoneIncoming, Volume2, Mic, MicOff } from 'lucide-react'
import { useStreamVideoClient } from '@stream-io/video-react-bindings'
import type { Call } from '@stream-io/video-client'

interface VoiceCallContextValue {
  initiateCall: (targetUserId: string, channelId: string, targetUserName?: string) => Promise<void>
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

function createRingtone() {
  let ctx: AudioContext | null = null
  let gain: GainNode | null = null
  let playing = false
  let timeout: ReturnType<typeof setTimeout> | null = null

  function tone(freq: number, dur: number, startTime: number) {
    if (!ctx || !gain) return
    const o = ctx.createOscillator()
    o.type = 'sine'
    o.frequency.setValueAtTime(freq, startTime)
    const g = ctx.createGain()
    g.gain.setValueAtTime(0.3, startTime)
    g.gain.exponentialRampToValueAtTime(0.01, startTime + dur)
    o.connect(g)
    g.connect(gain)
    o.start(startTime)
    o.stop(startTime + dur)
  }

  return {
    start() {
      if (playing) return
      playing = true
      ctx = new AudioContext()
      gain = ctx.createGain()
      gain.gain.setValueAtTime(0.4, ctx.currentTime)
      gain.connect(ctx.destination)

      const pattern = () => {
        if (!playing || !ctx) return
        const now = ctx.currentTime
        tone(440, 0.4, now)
        tone(480, 0.4, now + 0.5)
        timeout = setTimeout(pattern, 1200)
      }
      pattern()
    },
    stop() {
      playing = false
      if (timeout) { clearTimeout(timeout); timeout = null }
      if (ctx) { ctx.close(); ctx = null }
      gain = null
    },
  }
}

function stopRingtone(ref: React.MutableRefObject<ReturnType<typeof createRingtone> | null>) {
  if (ref.current) {
    ref.current.stop()
    ref.current = null
  }
}

function startRingtone(ref: React.MutableRefObject<ReturnType<typeof createRingtone> | null>) {
  stopRingtone(ref)
  const r = createRingtone()
  r.start()
  ref.current = r
}

async function requestMicPermission(): Promise<boolean> {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    stream.getTracks().forEach(t => t.stop())
    return true
  } catch {
    return false
  }
}

export function VoiceCallProvider({ children, userId, userName }: {
  children: React.ReactNode
  userId: string
  userName: string
}) {
  const videoClient = useStreamVideoClient()
  const [callState, setCallState] = useState<'idle' | 'outgoing' | 'connected' | 'incoming'>('idle')
  const [activeCall, setActiveCall] = useState<Call | null>(null)
  const [activeCallId, setActiveCallId] = useState<string | null>(null)
  const [callerInfo, setCallerInfo] = useState<{ id: string; name: string }>({ id: '', name: '' })
  const [targetUserName, setTargetUserName] = useState('')
  const [micEnabled, setMicEnabled] = useState(false)
  const ringtoneRef = useRef<ReturnType<typeof createRingtone> | null>(null)
  const callStartRef = useRef<number>(0)
  const stateRef = useRef(callState)
  stateRef.current = callState

  const log = useCallback((...args: unknown[]) => {
    console.log('[VoiceCall]', ...args)
  }, [])

  log('Mount — userId:', userId, 'videoClient:', !!videoClient)

  const cleanupActiveCall = useCallback(() => {
    stopRingtone(ringtoneRef)
    setActiveCall(null)
    setActiveCallId(null)
    setCallerInfo({ id: '', name: '' })
    setMicEnabled(false)
    setCallState('idle')
  }, [])

  useEffect(() => {
    if (!videoClient) { log('No video client'); return }
    log('Setting up global event listeners')
    log('Current user:', userId)

    const client = videoClient as any

    client.on('call.ring', (e: any) => {
      log('📞 call.ring RECEIVED', {
        callId: e.call?.id,
        callerId: e.user?.id,
        callerName: e.user?.name,
        members: e.members?.map((m: any) => m.user_id),
      })

      const callId = e.call?.id
      const callerId = e.user?.id || ''
      const callerName = e.user?.name || callerId || 'User'

      if (!callId) { log('No callId — ignoring'); return }

      if (stateRef.current !== 'idle') {
        log('Already in a call — auto-rejecting')
        if (e.call?.reject) e.call.reject('busy')
        return
      }

      setActiveCallId(callId)
      setCallerInfo({ id: callerId, name: callerName })
      setCallState('incoming')

      if (e.call) {
        setActiveCall(e.call)
        log('Call object set from event')
      } else {
        log('No call object in event — creating')
        const call = videoClient.call('default', callId)
        setActiveCall(call)
      }

      startRingtone(ringtoneRef)

      log('✅ Incoming call popup should appear now')
    })

    client.on('call.created', (e: any) => {
      log('📞 call.created received', { callId: e.call?.id, caller: e.user?.id })
    })

    client.on('call.accepted', (e: any) => {
      log('✅ call.accepted', { callId: e.call?.id, by: e.user?.id })
    })

    client.on('call.rejected', (e: any) => {
      log('❌ call.rejected', { callId: e.call?.id, by: e.user?.id })
      if (stateRef.current === 'outgoing') {
        cleanupActiveCall()
      }
    })

    client.on('call.ended', (e: any) => {
      log('🔚 call.ended', { callId: e.call?.id })
      cleanupActiveCall()
    })

    return () => {
      log('Cleanup global listeners')
      stopRingtone(ringtoneRef)
    }
  }, [videoClient, userId, cleanupActiveCall, log])

  const initiateCall = useCallback(async (targetUserId: string, channelId: string, targetUserNameParam?: string) => {
    if (!videoClient) { log('No videoClient — cannot call'); return }

    const callId = `call_${channelId}`
    log('📞 initiateCall', { targetUserId, channelId, callId, from: userId })

    setActiveCallId(callId)
    setCallState('outgoing')
    setCallerInfo({ id: targetUserId, name: targetUserNameParam || '' })
    if (targetUserNameParam) setTargetUserName(targetUserNameParam)
    callStartRef.current = Date.now()

    try {
      const micOk = await requestMicPermission()
      log('Mic permission:', micOk)

      const call: Call = videoClient.call('default', callId)
      log('Call object created')

      await call.create({
        data: { members: [{ user_id: userId }, { user_id: targetUserId }] },
        ring: true,
      })
      log('Call created with ring=true')

      await call.camera.disable()
      log('Camera disabled')

      call.on('call.accepted', async () => {
        log('✅ Remote accepted — joining')
        try {
          await call.join()
          log('Joined call (accepted)')
          try { await call.microphone.enable(); setMicEnabled(true); log('Mic enabled') } catch (e) { log('Mic enable error:', e) }
          setCallState('connected')
        } catch (e) { log('Join error on accept:', e) }
      })

      call.on('call.rejected', () => {
        log('❌ Remote rejected')
        cleanupActiveCall()
      })

      call.on('call.ended', () => {
        log('🔚 Remote ended')
        cleanupActiveCall()
      })

      await call.join()
      log('Joined call (initial)')
      try { await call.microphone.enable(); setMicEnabled(true); log('Mic enabled') } catch (e) { log('Mic enable error:', e) }

      setActiveCall(call)
      setCallState('connected')

      await fetch('/api/calls/log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ receiverId: targetUserId, callType: 'audio', status: 'outgoing' }),
      }).catch(() => {})
    } catch (err) {
      log('❌ initiateCall failed:', err)
      cleanupActiveCall()
    }
  }, [videoClient, userId, cleanupActiveCall, log])

  const acceptCall = useCallback(async () => {
    if (!activeCall) { log('No active call to accept'); return }
    log('✅ acceptCall', { callId: activeCallId })
    stopRingtone(ringtoneRef)
    callStartRef.current = Date.now()

    try {
      const micOk = await requestMicPermission()
      log('Mic permission:', micOk)

      await activeCall.accept()
      log('Call accepted')

      await activeCall.camera.disable()
      log('Camera disabled')

      await activeCall.join()
      log('Joined call')

      try { await activeCall.microphone.enable(); setMicEnabled(true); log('Mic enabled') } catch (e) { log('Mic enable error:', e) }

      setCallState('connected')
      log('✅ Call connected!')
    } catch (err) {
      log('❌ acceptCall failed:', err)
      cleanupActiveCall()
    }
  }, [activeCall, activeCallId, cleanupActiveCall, log])

  const rejectCall = useCallback(async () => {
    log('❌ rejectCall', { activeCallId })
    stopRingtone(ringtoneRef)
    if (activeCall) {
      try { await activeCall.reject(); log('Call rejected') } catch {}
      try { await activeCall.leave(); log('Left call') } catch {}
    }
    if (activeCallId) {
      await fetch('/api/calls/log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ receiverId: '', callType: 'audio', status: 'missed' }),
      }).catch(() => {})
    }
    cleanupActiveCall()
  }, [activeCall, activeCallId, cleanupActiveCall, log])

  const endCall = useCallback(async () => {
    log('🔚 endCall', { activeCallId, state: callState })
    stopRingtone(ringtoneRef)
    if (activeCall) {
      try { await activeCall.microphone.disable() } catch {}
      try { await activeCall.leave(); log('Left call') } catch {}
    }
    const duration = callStartRef.current ? Math.floor((Date.now() - callStartRef.current) / 1000) : null
    if (activeCallId && duration !== null) {
      await fetch('/api/calls/log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ receiverId: '', callType: 'audio', status: 'completed', duration }),
      }).catch(() => {})
    }
    cleanupActiveCall()
  }, [activeCall, activeCallId, callState, cleanupActiveCall, log])

  const displayName = callerInfo.name || targetUserName || 'User'

  return (
    <VoiceCallContext.Provider value={{ initiateCall, endCall, callState, activeCallId }}>
      {children}

      {/* Debug panel */}
      <div className="fixed bottom-20 left-2 z-[300] text-[10px] font-mono text-green-400 bg-black/80 rounded-lg p-2 max-w-[200px] hidden">
        <p>callState: {callState}</p>
        <p>callId: {activeCallId || '—'}</p>
        <p>caller: {callerInfo.name || '—'}</p>
        <p>mic: {micEnabled ? 'ON' : 'OFF'}</p>
        <p>videoClient: {videoClient ? 'OK' : 'NONE'}</p>
        <p>userId: {userId}</p>
      </div>

      <AnimatePresence>
        {callState === 'incoming' && (
          <motion.div
            key="incoming-call"
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
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center mx-auto mb-4 animate-bounce">
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
            key="active-call"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] bg-black/90 flex flex-col items-center justify-center"
          >
            {callState === 'outgoing' && (
              <div className="flex flex-col items-center gap-6">
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-3xl font-bold text-white animate-pulse">
                  {(displayName || '?')[0].toUpperCase()}
                </div>
                <p className="text-white text-lg font-medium">Calling {displayName}...</p>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse" />
                  <span className="text-yellow-400 text-sm">Ringing</span>
                </div>
                <motion.button whileTap={{ scale: 0.85 }} onClick={endCall}
                  className="w-16 h-16 rounded-full bg-red-500 flex items-center justify-center hover:bg-red-600 transition-colors">
                  <PhoneOff className="w-7 h-7 text-white" />
                </motion.button>
              </div>
            )}
            {callState === 'connected' && (
              <div className="flex flex-col items-center gap-6">
                <div className="w-32 h-32 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-5xl font-bold text-white">
                  {(displayName || '?')[0].toUpperCase()}
                </div>
                <p className="text-white text-lg">Voice call with {displayName}</p>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                  <span className="text-emerald-400 text-sm">Connected</span>
                  {micEnabled ? (
                    <Mic className="w-4 h-4 text-emerald-400 ml-2" />
                  ) : (
                    <MicOff className="w-4 h-4 text-red-400 ml-2" />
                  )}
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
