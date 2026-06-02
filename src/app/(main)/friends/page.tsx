'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Users, Search, UserPlus, UserCheck, AlertCircle,
  Loader2, ArrowRight, Check, X, Clock,
} from 'lucide-react'
import { useUser } from '@clerk/nextjs'

interface PendingRequest {
  id: string
  fromUserId: string
  fromUserName: string
  toUserId: string
  status: string
  timestamp: number
}

export default function FriendsPage() {
  const router = useRouter()
  const { user } = useUser()
  const [targetId, setTargetId] = useState('')
  const [finding, setFinding] = useState(false)
  const [foundUser, setFoundUser] = useState<{ id: string; cyberId: string; name: string; image: string } | null>(null)
  const [notFound, setNotFound] = useState(false)
  const [pendingRequests, setPendingRequests] = useState<PendingRequest[]>([])
  const [requestSent, setRequestSent] = useState(false)
  const [requestLoading, setRequestLoading] = useState(false)
  const clerkId = user?.id || ''

  const loadRequests = async () => {
    if (!clerkId) return
    try {
      const res = await fetch('/api/stream/pending-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })
      const data = await res.json()
      if (data.requests) setPendingRequests(data.requests)
    } catch {}
  }

  useEffect(() => {
    loadRequests()
    const interval = setInterval(loadRequests, 5000)
    return () => clearInterval(interval)
  }, [clerkId])

  const findUser = async () => {
    const id = targetId.trim().toUpperCase()
    if (!id || !clerkId) return

    setFinding(true)
    setNotFound(false)
    setFoundUser(null)
    setRequestSent(false)

    try {
      const res = await fetch('/api/stream/find-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cyberId: id }),
      })
      if (res.status === 404) {
        setNotFound(true)
      } else if (res.ok) {
        const data = await res.json()
        setFoundUser(data.user)
      } else {
        setNotFound(true)
      }
    } catch {
      setNotFound(true)
    } finally {
      setFinding(false)
    }
  }

  const sendRequest = async (toCyberId: string) => {
    setRequestLoading(true)
    try {
      const res = await fetch('/api/stream/send-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ toCyberId }),
      })
      if (res.ok) {
        setRequestSent(true)
      } else {
        const data = await res.json()
        if (data.error === 'Request already sent') {
          setRequestSent(true)
        }
      }
    } catch {} finally {
      setRequestLoading(false)
    }
  }

  const respondToRequest = async (requestId: string, action: 'accept' | 'decline') => {
    if (!clerkId) return
    try {
      const res = await fetch('/api/stream/respond-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestId, action }),
      })
      if (res.ok) {
        const data = await res.json()
        loadRequests()
        if (action === 'accept' && data.dmChannelId) {
          router.push(`/chats/${data.dmChannelId}?type=messaging`)
        }
      }
    } catch {}
  }

  return (
    <div className="h-full bg-gradient-to-br from-white via-blue-50/30 to-indigo-50/20 flex flex-col pb-16 md:pb-0">
      <div className="px-5 py-4 border-b border-gray-100 bg-white/80 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center shadow-sm">
            <Users className="w-5 h-5 text-white" />
          </div>
          <h1 className="text-lg font-bold text-gray-900">Add People</h1>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {pendingRequests.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 rounded-3xl bg-white border border-gray-100 shadow-sm"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-400/20 to-orange-500/20 flex items-center justify-center">
                <Clock className="w-5 h-5 text-amber-600" />
              </div>
              <h2 className="text-sm font-semibold text-gray-900">
                Pending Requests ({pendingRequests.length})
              </h2>
            </div>
            <div className="space-y-2">
              {pendingRequests.map((req) => (
                <div
                  key={req.id}
                  className="flex items-center gap-3 p-3 rounded-2xl bg-amber-50 border border-amber-200"
                >
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500/20 to-indigo-500/20 flex items-center justify-center text-sm font-bold text-blue-500">
                    {(req.fromUserName || '?')[0].toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">{req.fromUserName}</p>
                  </div>
                  <div className="flex gap-1.5">
                    <motion.button
                      whileTap={{ scale: 0.85 }}
                      onClick={() => respondToRequest(req.id, 'accept')}
                      className="p-2 rounded-xl bg-emerald-500 text-white"
                    >
                      <Check className="w-4 h-4" />
                    </motion.button>
                    <motion.button
                      whileTap={{ scale: 0.85 }}
                      onClick={() => respondToRequest(req.id, 'decline')}
                      className="p-2 rounded-xl bg-red-500 text-white"
                    >
                      <X className="w-4 h-4" />
                    </motion.button>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="p-5 rounded-3xl bg-white border border-gray-100 shadow-sm"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-500/20 to-indigo-500/20 flex items-center justify-center">
              <UserPlus className="w-5 h-5 text-blue-500" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-gray-900">Chat by User ID</h2>
              <p className="text-[10px] text-gray-400">Enter someone&apos;s CyberID to send a request</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex-1 relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                value={targetId}
                onChange={(e) => {
                  setTargetId(e.target.value.toUpperCase())
                  setFoundUser(null)
                  setNotFound(false)
                  setRequestSent(false)
                }}
                onKeyDown={(e) => e.key === 'Enter' && findUser()}
                placeholder="CYBERXXXXXXX..."
                className="w-full bg-gray-50 border border-gray-200 rounded-2xl py-2.5 pl-10 pr-4 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-blue-500/50 transition-colors uppercase"
              />
            </div>
            <motion.button
              whileTap={{ scale: 0.85 }}
              onClick={findUser}
              disabled={finding}
              className="p-2.5 rounded-2xl bg-blue-500 text-white shadow-sm disabled:opacity-50"
            >
              {finding ? <Loader2 className="w-5 h-5 animate-spin" /> : <ArrowRight className="w-5 h-5" />}
            </motion.button>
          </div>

          <AnimatePresence>
            {foundUser && !requestSent && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-3 overflow-hidden"
              >
                <div className="flex items-center justify-between p-3 rounded-2xl bg-blue-50 border border-blue-200">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center text-sm font-bold text-white">
                      {(foundUser.name || '?')[0].toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{foundUser.name}</p>
                      <p className="text-[10px] text-gray-400 font-mono">{foundUser.cyberId}</p>
                    </div>
                  </div>
                  <motion.button
                    whileTap={{ scale: 0.85 }}
                    onClick={() => sendRequest(foundUser.cyberId)}
                    disabled={requestLoading}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-blue-500 text-white text-sm font-medium shadow-sm disabled:opacity-50"
                  >
                    {requestLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <UserPlus className="w-4 h-4" />
                    )}
                    Add
                  </motion.button>
                </div>
              </motion.div>
            )}

            {requestSent && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-3 overflow-hidden"
              >
                <div className="flex items-center gap-2.5 p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-700">
                  <UserCheck className="w-4 h-4 flex-shrink-0" />
                  <p className="text-xs font-medium">Request sent! Waiting for them to accept.</p>
                </div>
              </motion.div>
            )}

            {notFound && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-3 overflow-hidden"
              >
                <div className="flex items-center gap-2.5 p-3 rounded-2xl bg-red-50 border border-red-200 text-red-600">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <p className="text-xs font-medium">User not found. Check the ID and try again.</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  )
}
