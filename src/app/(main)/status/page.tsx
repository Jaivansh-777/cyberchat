'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Circle, Plus, Camera, Image, X } from 'lucide-react'
import { useStreamClient } from '@/components/shared/StreamProvider'

interface StatusItem {
  id: string
  userId: string
  userName: string
  content: string
  timestamp: number
}

function StatusViewer({
  statuses,
  initialIndex,
  onClose,
}: {
  statuses: StatusItem[]
  initialIndex: number
  onClose: () => void
}) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex)
  const [progress, setProgress] = useState(0)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const current = statuses[currentIndex]

  useEffect(() => {
    setProgress(0)
    timerRef.current = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          if (currentIndex < statuses.length - 1) {
            setCurrentIndex(currentIndex + 1)
          } else {
            onClose()
          }
          return 0
        }
        return prev + 1
      })
    }, 50)

    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [currentIndex])

  const handleTap = (e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left
    if (x < rect.width / 2) {
      if (currentIndex > 0) setCurrentIndex(currentIndex - 1)
    } else {
      if (currentIndex < statuses.length - 1) setCurrentIndex(currentIndex + 1)
      else onClose()
    }
    setProgress(0)
    if (timerRef.current) clearInterval(timerRef.current)
  }

  if (!current) return null

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] bg-black flex flex-col"
      onClick={handleTap}
    >
      <div className="flex gap-1 px-3 pt-3 pb-2">
        {statuses.map((s, i) => (
          <div key={s.id} className="flex-1 h-[2px] bg-white/30 rounded-full overflow-hidden">
            <div
              className="h-full bg-white rounded-full transition-all duration-75"
              style={{
                width: i < currentIndex ? '100%' : i === currentIndex ? `${progress}%` : '0%',
              }}
            />
          </div>
        ))}
      </div>

      <div className="flex items-center gap-3 px-4 py-3">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-sm font-bold text-white">
          {(current.userName || '?')[0].toUpperCase()}
        </div>
        <div className="flex-1">
          <p className="text-sm font-semibold text-white">{current.userName}</p>
          <p className="text-[10px] text-white/60">{formatTimeAgo(current.timestamp)}</p>
        </div>
        <button onClick={(e) => { e.stopPropagation(); onClose() }} className="p-1">
          <X className="w-6 h-6 text-white" />
        </button>
      </div>

      <div className="flex-1 flex items-center justify-center px-8" onClick={(e) => e.stopPropagation()}>
        <p className="text-2xl text-white font-medium text-center leading-relaxed">{current.content}</p>
      </div>
    </motion.div>
  )
}

function formatTimeAgo(timestamp: number): string {
  const diff = Date.now() - timestamp
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'Just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

export default function StatusPage() {
  const { userName, userId } = useStreamClient()
  const [mounted, setMounted] = useState(false)
  const [myStatusText, setMyStatusText] = useState('')
  const [allStatuses, setAllStatuses] = useState<StatusItem[]>([])
  const [viewingIndex, setViewingIndex] = useState<number | null>(null)
  const [showPost, setShowPost] = useState(false)

  useEffect(() => { setMounted(true) }, [])

  const loadStatuses = async () => {
    if (!userId) return
    try {
      const res = await fetch('/api/stream/status/list', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })
      const data = await res.json()
      if (data.statuses) setAllStatuses(data.statuses)
    } catch {}
  }

  useEffect(() => {
    loadStatuses()
    const interval = setInterval(loadStatuses, 10000)
    return () => clearInterval(interval)
  }, [userId])

  const postStatus = async () => {
    const text = myStatusText.trim()
    if (!text || !userId) return

    try {
      await fetch('/api/stream/status/post', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: text }),
      })
      setMyStatusText('')
      setShowPost(false)
      loadStatuses()
    } catch {}
  }

  const myStatuses = allStatuses.filter((s) => s.userId === userId)
  const otherStatuses = allStatuses.filter((s) => s.userId !== userId)
  const hasMyStatus = myStatuses.length > 0

  const grouped = otherStatuses.reduce<Record<string, StatusItem[]>>((acc, s) => {
    if (!acc[s.userId]) acc[s.userId] = []
    acc[s.userId].push(s)
    return acc
  }, {})

  const allViewable = [...myStatuses, ...otherStatuses]

  return (
    <div className="h-full bg-gradient-to-br from-white via-blue-50/30 to-indigo-50/20 flex flex-col pb-16 md:pb-0">
      <div className="px-5 py-4 border-b border-gray-100 bg-white/80 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-sm">
            <Circle className="w-5 h-5 text-white" />
          </div>
          <h1 className="text-lg font-bold text-gray-900">Status</h1>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-cyber">
        <div className="px-4 py-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 rounded-3xl bg-white border border-gray-100 shadow-sm"
          >
            <div className="flex items-center gap-4">
              <div className="relative flex-shrink-0">
                <div className={`w-16 h-16 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-xl font-bold text-white ${hasMyStatus ? 'ring-2 ring-emerald-500 ring-offset-2' : ''}`}>
                  {mounted ? (userName || '?')[0].toUpperCase() : '?'}
                </div>
                <button
                  onClick={() => setShowPost(true)}
                  className="absolute -bottom-0.5 -right-0.5 w-6 h-6 rounded-full bg-accent border-2 border-white flex items-center justify-center"
                >
                  <Plus className="w-3 h-3 text-white" />
                </button>
              </div>
              <div className="flex-1 min-w-0" onClick={() => { if (myStatuses.length > 0) setViewingIndex(0) }}>
                <p className="text-sm font-semibold text-gray-900">{mounted ? userName : 'Loading...'}</p>
                <p className="text-xs text-gray-400">
                  {hasMyStatus
                    ? `Posted ${formatTimeAgo(myStatuses[myStatuses.length - 1].timestamp)}`
                    : 'Tap to add a status update'}
                </p>
              </div>
            </div>
          </motion.div>
        </div>

        {otherStatuses.length > 0 && (
          <div className="px-4 pb-2">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3 px-1">
              Recent updates
            </h2>
            <div className="space-y-2">
              {Object.entries(grouped).map(([uid, items]) => {
                const latest = items.sort((a, b) => b.timestamp - a.timestamp)[0]
                return (
                  <motion.button
                    key={uid}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    onClick={() => {
                      const idx = allViewable.findIndex((s) => s.id === items[0].id)
                      if (idx >= 0) setViewingIndex(idx)
                    }}
                    className="w-full flex items-center gap-4 p-3 rounded-2xl hover:bg-white transition-colors text-left"
                  >
                    <div className="w-14 h-14 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-lg font-bold text-white flex-shrink-0 ring-2 ring-emerald-500 ring-offset-2">
                      {(latest.userName || '?')[0].toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900">{latest.userName}</p>
                      <p className="text-xs text-gray-400">{formatTimeAgo(latest.timestamp)}</p>
                    </div>
                    <div className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center">
                      <Circle className="w-3 h-3 text-white" fill="white" />
                    </div>
                  </motion.button>
                )
              })}
            </div>
          </div>
        )}

        {otherStatuses.length === 0 && (
          <div className="flex flex-col items-center py-16 px-8 text-center">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-emerald-400/20 to-teal-500/20 flex items-center justify-center mb-4">
              <Camera className="w-10 h-10 text-emerald-500/40" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900 mb-1">No status updates</h2>
            <p className="text-sm text-gray-400 max-w-xs">
              When your friends post a status, you&apos;ll see it here.
            </p>
          </div>
        )}

        <div className="h-8" />
      </div>

      <AnimatePresence>
        {showPost && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[90] bg-black/50 backdrop-blur-sm flex items-end justify-center"
            onClick={() => setShowPost(false)}
          >
            <motion.div
              initial={{ y: 300 }}
              animate={{ y: 0 }}
              exit={{ y: 300 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="w-full max-w-lg bg-white rounded-3xl rounded-b-none p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-gray-900">Add Status</h3>
                <button onClick={() => setShowPost(false)} className="p-1 rounded-xl hover:bg-gray-100">
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>

              <textarea
                value={myStatusText}
                onChange={(e) => setMyStatusText(e.target.value)}
                placeholder="What&apos;s on your mind?"
                className="w-full h-32 bg-gray-50 border border-gray-200 rounded-2xl p-4 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-accent/50 transition-colors resize-none"
                maxLength={500}
              />

              <div className="flex items-center justify-between mt-4">
                <div className="flex gap-2">
                  <button className="p-2.5 rounded-2xl bg-gray-100 text-gray-500 hover:bg-gray-200 transition-colors" disabled>
                    <Image className="w-5 h-5" />
                  </button>
                  <button className="p-2.5 rounded-2xl bg-gray-100 text-gray-500 hover:bg-gray-200 transition-colors" disabled>
                    <Camera className="w-5 h-5" />
                  </button>
                </div>
                <motion.button
                  whileTap={{ scale: 0.85 }}
                  onClick={postStatus}
                  disabled={!myStatusText.trim()}
                  className="px-6 py-2.5 rounded-2xl bg-gradient-to-r from-accent to-indigo-500 text-white text-sm font-semibold shadow-sm disabled:opacity-50"
                >
                  Post
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {viewingIndex !== null && (
          <StatusViewer
            statuses={allViewable}
            initialIndex={viewingIndex}
            onClose={() => setViewingIndex(null)}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
