'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { UserPlus, UserCheck, Loader2, ArrowLeft, MessageCircle, AlertCircle } from 'lucide-react'
import Link from 'next/link'
import { useUser } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import { UserAvatar } from '@/components/shared/UserAvatar'
import { ActionButton } from '@/components/shared/ActionButton'
import { sanitizeDisplayName, safeString } from '@/lib/display-name'

export default function FindUserPage({ params }: { params: { cyberId: string } }) {
  const { user, isLoaded } = useUser()
  const router = useRouter()
  const [foundUser, setFoundUser] = useState<{ id: string; cyberId: string; name: string; image: string } | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [requestSent, setRequestSent] = useState(false)
  const [requestLoading, setRequestLoading] = useState(false)
  const [requestError, setRequestError] = useState('')

  useEffect(() => {
    if (!isLoaded) return
    if (!user) {
      router.push(`/sign-in?redirect_url=/find/${params.cyberId}`)
      return
    }

    const fetchUser = async () => {
      try {
        const res = await fetch(`/api/friends/find-user?cyberId=${encodeURIComponent(params.cyberId)}`)
        if (res.status === 404) setNotFound(true)
        else if (res.ok) {
          const data = await res.json()
          setFoundUser(data.user)
        }
      } catch { setNotFound(true) }
      finally { setLoading(false) }
    }
    fetchUser()
  }, [isLoaded, user, params.cyberId, router])

  const sendRequest = async () => {
    if (!foundUser) return
    setRequestLoading(true)
    setRequestError('')
    try {
      const res = await fetch('/api/friends/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ toCyberId: foundUser.cyberId }),
      })
      if (res.ok) setRequestSent(true)
      else {
        const data = await res.json()
        if (data.error === 'Request already sent' || data.error === 'Already friends') setRequestSent(true)
        else setRequestError(data.error || 'Failed to send request')
      }
    } catch { setRequestError('Network error') }
    finally { setRequestLoading(false) }
  }

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-white via-blue-50/30 to-indigo-50/20 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-blue-50/30 to-indigo-50/20 flex flex-col">
      <div className="px-5 py-4 border-b border-gray-100 bg-white/80 backdrop-blur-sm">
        <Link href="/chats" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700">
          <ArrowLeft className="w-4 h-4" />
          Back
        </Link>
      </div>

      <div className="flex-1 flex items-center justify-center px-6">
        {loading ? (
          <div className="text-center">
            <Loader2 className="w-8 h-8 text-blue-500 animate-spin mx-auto mb-3" />
            <p className="text-sm text-gray-400">Finding user...</p>
          </div>
        ) : notFound ? (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center max-w-sm">
            <div className="w-20 h-20 rounded-full bg-red-50 border border-red-200 flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-10 h-10 text-red-400" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-1">User Not Found</h2>
            <p className="text-sm text-gray-400 mb-6">
              No user with ID <span className="font-mono text-gray-600">{safeString(params.cyberId)}</span>
            </p>
            <Link href="/friends" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-blue-500 text-white text-sm font-medium">
              Search Again
            </Link>
          </motion.div>
        ) : foundUser ? (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center max-w-sm w-full">
            <div className="w-28 h-28 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 p-[3px] mx-auto mb-4">
              <div className="w-full h-full rounded-full bg-white flex items-center justify-center">
                {foundUser.image ? (
                  <img src={foundUser.image} alt="" className="w-full h-full rounded-full object-cover" />
                ) : (
                  <span className="text-4xl font-bold text-blue-500">
                    {sanitizeDisplayName(foundUser.name).charAt(0).toUpperCase()}
                  </span>
                )}
              </div>
            </div>

            <h2 className="text-xl font-bold text-gray-900">{sanitizeDisplayName(foundUser.name)}</h2>
            <p className="text-sm font-mono text-gray-400 mt-1">{safeString(foundUser.cyberId)}</p>

            <div className="mt-6 flex flex-col gap-3">
              {requestSent ? (
                <div className="flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm font-medium">
                  <UserCheck className="w-4 h-4" />
                  Request Sent
                </div>
              ) : (
                <ActionButton
                  onClick={sendRequest}
                  icon={requestLoading ? undefined : UserPlus}
                  variant="primary"
                  loading={requestLoading}
                  disabled={requestLoading}
                  label="Add Friend"
                  className="!w-full !justify-center !py-3 !rounded-2xl"
                />
              )}

              {requestError && (
                <p className="text-xs text-red-500 mt-1">{requestError}</p>
              )}

              <Link href="/chats" className="flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-white border border-gray-200 text-gray-700 text-sm font-medium hover:bg-gray-50 transition-colors">
                <MessageCircle className="w-4 h-4" />
                My Chats
              </Link>
            </div>
          </motion.div>
        ) : null}
      </div>
    </div>
  )
}
