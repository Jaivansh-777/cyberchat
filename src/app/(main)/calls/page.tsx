'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Phone, History, Video, PhoneCall } from 'lucide-react'
import { useUser } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'

export default function CallsPage() {
  const router = useRouter()
  const { user } = useUser()

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

      <div className="flex-1 flex flex-col items-center justify-center px-8 text-center">
        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500/10 to-indigo-500/10 flex items-center justify-center mb-4">
          <History className="w-10 h-10 text-blue-500/40" />
        </div>
        <h2 className="text-lg font-semibold text-gray-900 mb-1">No call history</h2>
        <p className="text-sm text-gray-400 max-w-xs">
          Your call logs will appear here once you start making calls.
        </p>
      </div>
    </div>
  )
}
