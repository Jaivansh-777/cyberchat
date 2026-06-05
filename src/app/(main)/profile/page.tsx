'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Copy, CheckCircle2, Fingerprint, Share2, QrCode, X, Camera, Loader2 } from 'lucide-react'
import { useUser } from '@clerk/nextjs'
import QRCode from 'qrcode'
import { UserAvatar } from '@/components/shared/UserAvatar'
import { sanitizeDisplayName, safeString } from '@/lib/display-name'

export default function ProfilePage() {
  const { user } = useUser()
  const [copied, setCopied] = useState(false)
  const [cyberId, setCyberId] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [avatarUrl, setAvatarUrl] = useState('')
  const [showQR, setShowQR] = useState(false)
  const [qrDataUrl, setQrDataUrl] = useState('')
  const [uploading, setUploading] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const appUrl = typeof window !== 'undefined' ? window.location.origin : ''

  useEffect(() => {
    fetch('/api/user/me')
      .then((r) => r.json())
      .then((data) => {
        setCyberId(data.cyberId || '')
        setDisplayName(sanitizeDisplayName(data.displayName, user?.fullName))
        setAvatarUrl(data.avatarUrl || '')
      })
      .catch(() => {})
  }, [user])

  useEffect(() => {
    if (showQR && cyberId) {
      QRCode.toDataURL(`${appUrl}/find/${cyberId}`, {
        width: 280,
        margin: 2,
        color: { dark: '#1e293b', light: '#ffffff' },
      }).then(setQrDataUrl)
    }
  }, [showQR, cyberId, appUrl])

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const dataUrl = URL.createObjectURL(file)
    setPreviewUrl(dataUrl)
    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('avatar', file)
      const res = await fetch('/api/user/avatar', { method: 'POST', body: formData })
      if (res.ok) {
        const data = await res.json()
        setAvatarUrl(data.avatarUrl)
        setPreviewUrl(null)
      }
    } catch {} finally {
      setUploading(false)
    }
    e.target.value = ''
  }

  const copyId = async () => {
    if (!cyberId) return
    try {
      await navigator.clipboard.writeText(cyberId)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {}
  }

  const shareProfile = async () => {
    const url = `${appUrl}/find/${cyberId}`
    if (navigator.share) {
      try {
        await navigator.share({ title: displayName, text: `Chat with me on CyberChat! My ID: ${cyberId}`, url })
      } catch {}
    } else {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const nameToShow = sanitizeDisplayName(displayName)
  const idToShow = safeString(cyberId)

  return (
    <div className="h-full bg-gradient-to-br from-white via-blue-50/30 to-indigo-50/20 flex flex-col">
      <div className="px-5 py-4 border-b border-gray-100 bg-white/80 backdrop-blur-sm">
        <h1 className="text-lg font-bold text-gray-900">Profile</h1>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6 scrollbar-cyber">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center py-6 px-4 rounded-3xl bg-white border border-gray-100 shadow-sm premium-card"
        >
          <div className="relative mb-4 group">
            <UserAvatar name={nameToShow} url={avatarUrl || previewUrl || undefined} size="xl" ring />
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={handleFileSelect}
            />
            <motion.button
              whileTap={{ scale: 0.85 }}
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="absolute bottom-0 right-0 w-9 h-9 rounded-full bg-blue-500 text-white flex items-center justify-center shadow-lg hover:bg-blue-600 transition-colors disabled:opacity-50"
            >
              {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
            </motion.button>
          </div>

          <h2 className="text-xl font-bold text-gray-900">{nameToShow}</h2>
          <div className="flex items-center gap-1.5 mt-1">
            <div className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="text-xs text-emerald-600 font-medium">Online</span>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="p-5 rounded-3xl bg-white border border-gray-100 shadow-sm premium-card"
        >
          <div className="section-header">
            <div className="section-icon bg-gradient-to-br from-amber-400/20 to-orange-500/20">
              <Fingerprint className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900">Your Cyber ID</p>
              <p className="text-[10px] text-gray-400">Share this to let others chat with you</p>
            </div>
          </div>
          <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-2xl p-3">
            <div className="flex-1 font-mono text-sm text-gray-700 truncate">
              {idToShow}
            </div>
            <motion.button
              whileTap={{ scale: 0.85 }}
              onClick={copyId}
              className="p-2 rounded-xl bg-white border border-gray-200 text-gray-500 hover:text-blue-500 hover:border-blue-500/50 transition-colors"
            >
              {copied ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
            </motion.button>
          </div>
          {copied && (
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-xs text-emerald-600 mt-2">
              Copied!
            </motion.p>
          )}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="grid grid-cols-2 gap-3"
        >
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={shareProfile}
            className="flex flex-col items-center gap-2 p-4 rounded-3xl bg-white border border-gray-100 shadow-sm hover:border-blue-500/30 hover:shadow-md hover:-translate-y-0.5 transition-all"
          >
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-500/10 to-indigo-500/10 flex items-center justify-center">
              <Share2 className="w-5 h-5 text-blue-500" />
            </div>
            <span className="text-xs font-medium text-gray-700">Share Profile</span>
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowQR(true)}
            className="flex flex-col items-center gap-2 p-4 rounded-3xl bg-white border border-gray-100 shadow-sm hover:border-blue-500/30 hover:shadow-md hover:-translate-y-0.5 transition-all"
          >
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-purple-400/10 to-pink-500/10 flex items-center justify-center">
              <QrCode className="w-5 h-5 text-purple-600" />
            </div>
            <span className="text-xs font-medium text-gray-700">My QR Code</span>
          </motion.button>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="p-5 rounded-3xl bg-white border border-gray-100 shadow-sm premium-card"
        >
          <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3">Account Info</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between py-2">
              <span className="text-sm text-gray-500">Display name</span>
              <span className="text-sm font-semibold text-gray-900">{nameToShow}</span>
            </div>
            <div className="h-px bg-gray-100" />
            <div className="flex items-center justify-between py-2">
              <span className="text-sm text-gray-500">Cyber ID</span>
              <span className="text-sm font-mono text-gray-700 text-right truncate max-w-[180px]">
                {idToShow}
              </span>
            </div>
            <div className="h-px bg-gray-100" />
            <div className="flex items-center justify-between py-2">
              <span className="text-sm text-gray-500">Status</span>
              <span className="text-sm font-medium text-emerald-600">Online</span>
            </div>
          </div>
        </motion.div>
      </div>

      <AnimatePresence>
        {showQR && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[90] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setShowQR(false)}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="bg-white rounded-3xl p-6 w-full max-w-xs text-center shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-900">Your QR Code</h3>
                <button onClick={() => setShowQR(false)} className="p-1 rounded-xl hover:bg-gray-100">
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>
              {qrDataUrl ? (
                <img src={qrDataUrl} alt="QR Code" className="w-64 h-64 mx-auto rounded-2xl" />
              ) : (
                <div className="w-64 h-64 mx-auto rounded-2xl bg-gray-100 flex items-center justify-center">
                  <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                </div>
              )}
              <p className="text-xs text-gray-400 mt-4">Scan to chat with me on CyberChat</p>
              <p className="text-xs font-mono text-gray-600 mt-1">{idToShow}</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
