'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Users, Search, UserPlus, UserCheck, AlertCircle,
  Loader2, ArrowRight, Check, X, Clock, MessageCircle, UserX, UserMinus,
} from 'lucide-react'
import { useUser } from '@clerk/nextjs'
import { getDmChannelId } from '@/lib/dm-channel'

interface IncomingRequest {
  id: string
  senderId: string
  senderName: string
  senderCyberId: string
  senderAvatar: string
  createdAt: string
}

interface OutgoingRequest {
  id: string
  receiverId: string
  receiverName: string
  receiverCyberId: string
  receiverAvatar: string
  createdAt: string
}

interface Friend {
  clerkId: string
  cyberId: string
  name: string
  avatar: string
  lastSeen: string
  since: string
}

export default function FriendsPage() {
  const router = useRouter()
  const { user } = useUser()
  const clerkId = user?.id || ''

  const [targetId, setTargetId] = useState('')
  const [finding, setFinding] = useState(false)
  const [foundUser, setFoundUser] = useState<{ id: string; cyberId: string; name: string; image: string } | null>(null)
  const [notFound, setNotFound] = useState(false)
  const [requestSent, setRequestSent] = useState(false)
  const [requestLoading, setRequestLoading] = useState(false)

  const [incoming, setIncoming] = useState<IncomingRequest[]>([])
  const [outgoing, setOutgoing] = useState<OutgoingRequest[]>([])
  const [friends, setFriends] = useState<Friend[]>([])
  const [loading, setLoading] = useState(true)
  const [newRequestToast, setNewRequestToast] = useState<string | null>(null)

  const loadData = useCallback(async () => {
    if (!clerkId) return
    try {
      const [inRes, outRes, friendsRes] = await Promise.all([
        fetch('/api/friends/incoming'),
        fetch('/api/friends/outgoing'),
        fetch('/api/friends/list'),
      ])
      const inData = await inRes.json()
      const outData = await outRes.json()
      const friendsData = await friendsRes.json()

      if (inData.requests) {
        const newIds = inData.requests.map((r: IncomingRequest) => r.id)
        const oldIds = incoming.map((r) => r.id)
        const fresh = newIds.filter((id: string) => !oldIds.includes(id))
        if (fresh.length > 0 && incoming.length > 0) {
          const newest = inData.requests.find((r: IncomingRequest) => r.id === fresh[0])
          if (newest) setNewRequestToast(newest.senderName)
        }
        setIncoming(inData.requests)
      }
      if (outData.requests) setOutgoing(outData.requests)
      if (friendsData.friends) setFriends(friendsData.friends)
    } catch {} finally {
      setLoading(false)
    }
  }, [clerkId, incoming])

  useEffect(() => {
    loadData()
    const interval = setInterval(loadData, 10000)
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
      const res = await fetch(`/api/friends/find-user?cyberId=${encodeURIComponent(id)}`)
      if (res.status === 404) setNotFound(true)
      else if (res.ok) {
        const data = await res.json()
        setFoundUser(data.user)
      } else setNotFound(true)
    } catch { setNotFound(true) }
    finally { setFinding(false) }
  }

  const sendRequest = async (toCyberId: string) => {
    setRequestLoading(true)
    try {
      const res = await fetch('/api/friends/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ toCyberId }),
      })
      if (res.ok) setRequestSent(true)
      else {
        const data = await res.json()
        if (data.error === 'Request already sent' || data.error === 'Already friends') {
          setRequestSent(true)
        }
      }
    } catch {} finally {
      setRequestLoading(false)
    }
  }

  const acceptRequest = async (requestId: string) => {
    try {
      const res = await fetch('/api/friends/accept', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestId }),
      })
      if (res.ok) {
        const data = await res.json()
        loadData()
        if (data.dmChannelId) router.push(`/chats/${data.dmChannelId}?type=messaging`)
      }
    } catch {}
  }

  const declineRequest = async (requestId: string) => {
    try {
      await fetch('/api/friends/decline', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestId }),
      })
      loadData()
    } catch {}
  }

  const removeFriend = async (friendClerkId: string) => {
    try {
      await fetch('/api/friends/remove', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ friendClerkId }),
      })
      loadData()
    } catch {}
  }

  const incomingCount = incoming.length
  const outgoingCount = outgoing.length

  return (
    <div className="h-full bg-gradient-to-br from-white via-blue-50/30 to-indigo-50/20 flex flex-col pb-16 md:pb-0">
      <div className="px-5 py-4 border-b border-gray-100 bg-white/80 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center shadow-sm relative">
            <Users className="w-5 h-5 text-white" />
            {incomingCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 text-[9px] font-bold text-white flex items-center justify-center shadow">
                {incomingCount}
              </span>
            )}
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-900">Friends</h1>
            <p className="text-[10px] text-gray-400">
              {friends.length} friend{friends.length !== 1 ? 's' : ''}
              {incomingCount > 0 && ` · ${incomingCount} request${incomingCount !== 1 ? 's' : ''}`}
            </p>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {newRequestToast && (
          <motion.div
            initial={{ opacity: 0, y: -40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -40 }}
            className="absolute top-16 left-4 right-4 z-50"
          >
            <div className="bg-blue-500 text-white px-4 py-3 rounded-2xl shadow-lg flex items-center gap-3">
              <UserPlus className="w-5 h-5 flex-shrink-0" />
              <p className="text-sm font-medium">New friend request from {newRequestToast}</p>
              <button onClick={() => setNewRequestToast(null)} className="ml-auto text-white/70 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {incomingCount > 0 && (
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
                Incoming Requests ({incomingCount})
              </h2>
            </div>
            <div className="space-y-2">
              {incoming.map((req) => (
                <div key={req.id} className="flex items-center gap-3 p-3 rounded-2xl bg-amber-50 border border-amber-200">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500/20 to-indigo-500/20 flex items-center justify-center text-sm font-bold text-blue-500 flex-shrink-0">
                    {(req.senderName || '?')[0].toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{req.senderName}</p>
                    <p className="text-[10px] font-mono text-gray-400">{req.senderCyberId}</p>
                  </div>
                  <div className="flex gap-1.5">
                    <motion.button
                      whileTap={{ scale: 0.85 }}
                      onClick={() => acceptRequest(req.id)}
                      className="p-2 rounded-xl bg-emerald-500 text-white"
                    >
                      <Check className="w-4 h-4" />
                    </motion.button>
                    <motion.button
                      whileTap={{ scale: 0.85 }}
                      onClick={() => declineRequest(req.id)}
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

        {outgoingCount > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 rounded-3xl bg-white border border-gray-100 shadow-sm"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-500/20 to-indigo-500/20 flex items-center justify-center">
                <ArrowRight className="w-5 h-5 text-blue-500" />
              </div>
              <h2 className="text-sm font-semibold text-gray-900">
                Sent Requests ({outgoingCount})
              </h2>
            </div>
            <div className="space-y-2">
              {outgoing.map((req) => (
                <div key={req.id} className="flex items-center gap-3 p-3 rounded-2xl bg-blue-50 border border-blue-200">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-400/30 to-gray-500/30 flex items-center justify-center text-sm font-bold text-gray-500 flex-shrink-0">
                    {(req.receiverName || '?')[0].toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{req.receiverName}</p>
                    <p className="text-[10px] font-mono text-gray-400">{req.receiverCyberId}</p>
                  </div>
                  <span className="text-[10px] text-gray-400 font-medium bg-white px-2 py-1 rounded-lg">Pending</span>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {friends.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 rounded-3xl bg-white border border-gray-100 shadow-sm"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-400/20 to-teal-500/20 flex items-center justify-center">
                <UserCheck className="w-5 h-5 text-emerald-600" />
              </div>
              <h2 className="text-sm font-semibold text-gray-900">
                Friends ({friends.length})
              </h2>
            </div>
            <div className="space-y-2">
              {friends.map((f) => (
                <div key={f.clerkId} className="flex items-center gap-3 p-3 rounded-2xl hover:bg-gray-50 transition-colors">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center text-sm font-bold text-white flex-shrink-0">
                    {(f.name || '?')[0].toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{f.name}</p>
                    <p className="text-[10px] font-mono text-gray-400">{f.cyberId}</p>
                  </div>
                  <div className="flex gap-1.5">
                    <motion.button
                      whileTap={{ scale: 0.85 }}
                      onClick={() => router.push(`/chats/${getDmChannelId(clerkId, f.clerkId)}?type=messaging`)}
                      className="p-2 rounded-xl bg-blue-500 text-white"
                    >
                      <MessageCircle className="w-4 h-4" />
                    </motion.button>
                    <motion.button
                      whileTap={{ scale: 0.85 }}
                      onClick={() => removeFriend(f.clerkId)}
                      className="p-2 rounded-xl bg-red-100 text-red-500 hover:bg-red-200"
                    >
                      <UserMinus className="w-4 h-4" />
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
              <h2 className="text-sm font-semibold text-gray-900">Add by Cyber ID</h2>
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
                    {requestLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
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

        {friends.length === 0 && incomingCount === 0 && outgoingCount === 0 && !loading && (
          <div className="flex flex-col items-center py-12 text-center">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500/10 to-indigo-500/10 flex items-center justify-center mb-4">
              <Users className="w-10 h-10 text-blue-400/50" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900 mb-1">No friends yet</h2>
            <p className="text-sm text-gray-400 max-w-xs">
              Search for someone by their Cyber ID above to send a friend request.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
