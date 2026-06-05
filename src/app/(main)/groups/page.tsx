'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
import {
  UsersRound, Plus, X, Hash, Copy, CheckCircle2, Link as LinkIcon,
  Loader2, UserPlus, UserMinus, Settings, MessageCircle,
} from 'lucide-react'
import { useUser } from '@clerk/nextjs'
import { UserAvatar } from '@/components/shared/UserAvatar'
import { sanitizeDisplayName } from '@/lib/display-name'

interface GroupInfo {
  id: string
  name: string
  description: string
  avatarUrl: string | null
  inviteCode: string
  createdBy: string
  streamChannelId: string
  _count: { members: number }
  members: {
    clerkId: string
    role: string
    user: { clerkId: string; displayName: string; avatarUrl: string | null }
  }[]
}

export default function GroupsPage() {
  const router = useRouter()
  const { user } = useUser()
  const clerkId = user?.id || ''

  const [groups, setGroups] = useState<GroupInfo[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [createName, setCreateName] = useState('')
  const [createDesc, setCreateDesc] = useState('')
  const [creating, setCreating] = useState(false)
  const [showInvite, setShowInvite] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [joinCode, setJoinCode] = useState('')
  const [showJoin, setShowJoin] = useState(false)
  const [joining, setJoining] = useState(false)
  const [joinError, setJoinError] = useState('')

  const loadGroups = async () => {
    try {
      const res = await fetch('/api/groups/my-groups')
      const data = await res.json()
      if (data.groups) setGroups(data.groups)
    } catch {} finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadGroups() }, [])

  const createGroup = async () => {
    if (!createName.trim() || creating) return
    setCreating(true)
    try {
      const res = await fetch('/api/groups/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: createName.trim(), description: createDesc.trim() }),
      })
      if (res.ok) {
        setShowCreate(false)
        setCreateName('')
        setCreateDesc('')
        loadGroups()
      }
    } catch {} finally {
      setCreating(false)
    }
  }

  const joinGroup = async () => {
    if (!joinCode.trim() || joining) return
    setJoining(true)
    setJoinError('')
    try {
      const res = await fetch('/api/groups/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ inviteCode: joinCode.trim() }),
      })
      if (res.ok) {
        setShowJoin(false)
        setJoinCode('')
        loadGroups()
      } else {
        const data = await res.json()
        setJoinError(data.error || 'Failed to join')
      }
    } catch {
      setJoinError('Failed to join group')
    } finally {
      setJoining(false)
    }
  }

  const copyInvite = (code: string) => {
    const url = `${window.location.origin}/groups?join=${code}`
    navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="h-full bg-gradient-to-br from-white via-blue-50/30 to-indigo-50/20 flex flex-col">
      <div className="px-5 py-4 border-b border-gray-100 bg-white/80 backdrop-blur-sm flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-sm">
            <UsersRound className="w-5 h-5 text-white" />
          </div>
          <h1 className="text-lg font-bold text-gray-900">Groups</h1>
        </div>
        <div className="flex gap-2">
          <motion.button whileTap={{ scale: 0.85 }} onClick={() => setShowJoin(true)}
            className="p-2 rounded-xl bg-gray-100 text-gray-500 hover:bg-gray-200">
            <Hash className="w-4 h-4" />
          </motion.button>
          <motion.button whileTap={{ scale: 0.85 }} onClick={() => setShowCreate(true)}
            className="p-2 rounded-xl bg-blue-500 text-white">
            <Plus className="w-4 h-4" />
          </motion.button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 scrollbar-cyber">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 animate-spin text-gray-300" />
          </div>
        ) : groups.length === 0 ? (
          <div className="flex flex-col items-center py-16 text-center">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-emerald-400/20 to-teal-500/20 flex items-center justify-center mb-4">
              <UsersRound className="w-10 h-10 text-emerald-500/40" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900 mb-1">No groups yet</h2>
            <p className="text-sm text-gray-400 max-w-xs">Create a group or join one with an invite link.</p>
          </div>
        ) : (
          groups.map((g) => {
            const isAdmin = g.members.find(m => m.clerkId === clerkId)?.role === 'admin'
            return (
              <motion.div key={g.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                className="p-4 rounded-3xl bg-white border border-gray-100 shadow-sm premium-card">
                <div className="flex items-center gap-3">
                  <UserAvatar name={sanitizeDisplayName(g.name)} url={g.avatarUrl} size="lg" gradient="from-emerald-500 to-teal-600" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold text-gray-900 truncate">{sanitizeDisplayName(g.name)}</h3>
                      {isAdmin && <span className="text-[9px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full font-medium">Admin</span>}
                    </div>
                    {g.description && <p className="text-xs text-gray-400 truncate">{g.description}</p>}
                    <p className="text-[10px] text-gray-400">{g._count.members} member{g._count.members !== 1 ? 's' : ''}</p>
                  </div>
                  <div className="flex gap-1.5">
                    <motion.button whileTap={{ scale: 0.85 }}
                      onClick={() => router.push(`/chats/${g.streamChannelId}`)}
                      className="p-2 rounded-xl bg-blue-500 text-white">
                      <MessageCircle className="w-4 h-4" />
                    </motion.button>
                    <motion.button whileTap={{ scale: 0.85 }}
                      onClick={() => setShowInvite(showInvite === g.id ? null : g.id)}
                      className="p-2 rounded-xl bg-gray-100 text-gray-500 hover:bg-gray-200">
                      <LinkIcon className="w-4 h-4" />
                    </motion.button>
                  </div>
                </div>
                {showInvite === g.id && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                    className="mt-3 pt-3 border-t border-gray-100">
                    <div className="flex items-center gap-2 bg-gray-50 rounded-2xl p-2">
                      <code className="flex-1 text-xs font-mono text-gray-600 truncate px-2">{g.inviteCode}</code>
                      <motion.button whileTap={{ scale: 0.85 }} onClick={() => copyInvite(g.inviteCode)}
                        className="p-1.5 rounded-xl bg-white border border-gray-200 text-gray-500">
                        {copied ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                      </motion.button>
                    </div>
                    <p className="text-[10px] text-gray-400 mt-1.5 px-1">Share this code for others to join</p>
                  </motion.div>
                )}
              </motion.div>
            )
          })
        )}
        <div className="h-4" />
      </div>

      <AnimatePresence>
        {showCreate && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[90] bg-black/50 backdrop-blur-sm flex items-end justify-center"
            onClick={() => setShowCreate(false)}>
            <motion.div initial={{ y: 300 }} animate={{ y: 0 }} exit={{ y: 300 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="w-full max-w-lg bg-white rounded-3xl rounded-b-none p-6"
              onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-gray-900">Create Group</h3>
                <button onClick={() => setShowCreate(false)} className="p-1 rounded-xl hover:bg-gray-100">
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>
              <input value={createName} onChange={(e) => setCreateName(e.target.value)}
                placeholder="Group name" maxLength={50}
                className="w-full bg-gray-50 border border-gray-200 rounded-2xl py-3 px-4 text-sm mb-3 focus:outline-none focus:border-emerald-500/50" />
              <input value={createDesc} onChange={(e) => setCreateDesc(e.target.value)}
                placeholder="Description (optional)" maxLength={200}
                className="w-full bg-gray-50 border border-gray-200 rounded-2xl py-3 px-4 text-sm mb-4 focus:outline-none focus:border-emerald-500/50" />
              <motion.button whileTap={{ scale: 0.85 }} onClick={createGroup} disabled={!createName.trim() || creating}
                className="w-full py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-semibold shadow-sm disabled:opacity-50">
                {creating ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : 'Create Group'}
              </motion.button>
            </motion.div>
          </motion.div>
        )}

        {showJoin && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[90] bg-black/50 backdrop-blur-sm flex items-end justify-center"
            onClick={() => setShowJoin(false)}>
            <motion.div initial={{ y: 300 }} animate={{ y: 0 }} exit={{ y: 300 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="w-full max-w-lg bg-white rounded-3xl rounded-b-none p-6"
              onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-gray-900">Join Group</h3>
                <button onClick={() => setShowJoin(false)} className="p-1 rounded-xl hover:bg-gray-100">
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>
              <input value={joinCode} onChange={(e) => setJoinCode(e.target.value)}
                placeholder="Paste invite code" 
                className="w-full bg-gray-50 border border-gray-200 rounded-2xl py-3 px-4 text-sm mb-3 focus:outline-none focus:border-emerald-500/50" />
              {joinError && <p className="text-xs text-red-500 mb-3">{joinError}</p>}
              <motion.button whileTap={{ scale: 0.85 }} onClick={joinGroup} disabled={!joinCode.trim() || joining}
                className="w-full py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-semibold shadow-sm disabled:opacity-50">
                {joining ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : 'Join Group'}
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
