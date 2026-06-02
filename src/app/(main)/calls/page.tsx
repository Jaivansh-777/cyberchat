'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Phone, Video, History, PhoneCall, PhoneMissed, PhoneOff, Clock, ArrowRight, User } from 'lucide-react'
import { useUser } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'

interface CallLog {
  id: string
  callerId: string
  receiverId: string
  callType: string
  status: string
  startedAt: string
  duration: number | null
}

function formatDuration(sec: number | null): string {
  if (!sec) return ''
  const m = Math.floor(sec / 60)
  const s = sec % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

function formatTimeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'Just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

export default function CallsPage() {
  const router = useRouter()
  const { user } = useUser()
  const clerkId = user?.id || ''
  const [callLogs, setCallLogs] = useState<CallLog[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch('/api/calls/history')
        const data = await res.json()
        if (data.logs) setCallLogs(data.logs)
      } catch {} finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const startCall = async (type: 'audio' | 'video') => {
    const callId = `call_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`
    router.push(`/call/${callId}?type=${type}`)
  }

  return (
    <div className="h-full bg-white flex flex-col pb-16 md:pb-0">
      <div className="px-5 py-4 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center shadow-sm">
            <Phone className="w-5 h-5 text-white" />
          </div>
          <h1 className="text-lg font-bold text-gray-900">Calls</h1>
        </div>
      </div>

      <div className="flex gap-3 px-4 py-4">
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => startCall('audio')}
          className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl bg-green-500 text-white font-medium shadow-sm"
        >
          <PhoneCall className="w-5 h-5" />
          Voice Call
        </motion.button>
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => startCall('video')}
          className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl bg-blue-500 text-white font-medium shadow-sm"
        >
          <Video className="w-5 h-5" />
          Video Call
        </motion.button>
      </div>

      <div className="px-4 pb-2">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3">Recent Calls</h2>
      </div>

      <div className="flex-1 overflow-y-auto px-3">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : callLogs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-8 text-center">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500/10 to-indigo-500/10 flex items-center justify-center mb-4">
              <History className="w-10 h-10 text-blue-500/40" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900 mb-1">No call history</h2>
            <p className="text-sm text-gray-400 max-w-xs">
              Your call logs will appear here once you start making calls.
            </p>
          </div>
        ) : (
          <div className="space-y-1">
            {callLogs.map((log) => {
              const isOutgoing = log.callerId === clerkId
              const statusIcon = log.status === 'missed'
                ? <PhoneMissed className="w-4 h-4 text-red-500" />
                : log.status === 'cancelled'
                  ? <PhoneOff className="w-4 h-4 text-gray-400" />
                  : <Phone className="w-4 h-4 text-emerald-500" />
              const statusLabel = log.status === 'missed' ? 'Missed'
                : log.status === 'cancelled' ? 'Cancelled'
                : formatDuration(log.duration) || 'Connected'
              return (
                <motion.div key={log.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-3 p-3 rounded-2xl hover:bg-gray-50 transition-colors"
                >
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                    log.status === 'missed' ? 'bg-red-50' : 'bg-gray-100'
                  }`}>
                    {statusIcon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">
                      {isOutgoing ? 'Outgoing call' : 'Incoming call'}
                    </p>
                    <div className="flex items-center gap-2">
                      <p className={`text-[10px] ${log.status === 'missed' ? 'text-red-500 font-medium' : 'text-gray-400'}`}>
                        {statusLabel}
                      </p>
                      <span className="text-[10px] text-gray-400">·</span>
                      <p className="text-[10px] text-gray-400">{formatTimeAgo(log.startedAt)}</p>
                    </div>
                  </div>
                  <span className="text-[10px] text-gray-400 font-mono uppercase">{log.callType}</span>
                </motion.div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
