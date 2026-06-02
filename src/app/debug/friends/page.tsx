'use client'

import { useState, useEffect } from 'react'
import { useUser } from '@clerk/nextjs'

export default function DebugFriendsPage() {
  const { user, isLoaded } = useUser()
  const [incoming, setIncoming] = useState<any[]>([])
  const [outgoing, setOutgoing] = useState<any[]>([])
  const [friends, setFriends] = useState<any[]>([])
  const [me, setMe] = useState<any>(null)
  const [raw, setRaw] = useState<any>({})

  useEffect(() => {
    if (!isLoaded || !user) return

    const load = async () => {
      try {
        const meRes = await fetch('/api/user/me')
        const meData = await meRes.json()
        setMe(meData)

        const [inRes, outRes, fRes] = await Promise.all([
          fetch('/api/friends/incoming'),
          fetch('/api/friends/outgoing'),
          fetch('/api/friends/list'),
        ])

        const inData = await inRes.json()
        const outData = await outRes.json()
        const fData = await fRes.json()

        setIncoming(inData.requests || [])
        setOutgoing(outData.requests || [])
        setFriends(fData.friends || [])
        setRaw({ incoming: inData, outgoing: outData, friends: fData })
      } catch (e) {
        console.error(e)
      }
    }

    load()
    const interval = setInterval(load, 5000)
    return () => clearInterval(interval)
  }, [isLoaded, user])

  return (
    <div className="min-h-screen bg-gray-50 p-6 font-mono text-sm">
      <h1 className="text-xl font-bold text-gray-900 mb-6">Debug: Friends</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Section title="Current User">
          <pre className="text-xs">{JSON.stringify(me, null, 2)}</pre>
        </Section>

        <Section title={`Incoming Requests (${incoming.length})`}>
          {incoming.length === 0 && <p className="text-gray-400">None</p>}
          {incoming.map((r) => (
            <div key={r.id} className="border border-amber-200 bg-amber-50 rounded-lg p-2 mb-2">
              <p><strong>ID:</strong> {r.id}</p>
              <p><strong>Sender:</strong> {r.senderName} ({r.senderCyberId})</p>
              <p><strong>Sender ID:</strong> {r.senderId}</p>
              <p><strong>Date:</strong> {r.createdAt}</p>
            </div>
          ))}
        </Section>

        <Section title={`Outgoing Requests (${outgoing.length})`}>
          {outgoing.length === 0 && <p className="text-gray-400">None</p>}
          {outgoing.map((r) => (
            <div key={r.id} className="border border-blue-200 bg-blue-50 rounded-lg p-2 mb-2">
              <p><strong>ID:</strong> {r.id}</p>
              <p><strong>Receiver:</strong> {r.receiverName} ({r.receiverCyberId})</p>
              <p><strong>Receiver ID:</strong> {r.receiverId}</p>
              <p><strong>Date:</strong> {r.createdAt}</p>
            </div>
          ))}
        </Section>

        <Section title={`Friends (${friends.length})`}>
          {friends.length === 0 && <p className="text-gray-400">None</p>}
          {friends.map((f) => (
            <div key={f.clerkId} className="border border-emerald-200 bg-emerald-50 rounded-lg p-2 mb-2">
              <p><strong>Name:</strong> {f.name}</p>
              <p><strong>CyberID:</strong> {f.cyberId}</p>
              <p><strong>ClerkID:</strong> {f.clerkId}</p>
              <p><strong>Since:</strong> {f.since}</p>
              <p><strong>LastSeen:</strong> {f.lastSeen}</p>
            </div>
          ))}
        </Section>

        <Section title="Raw API Responses" className="md:col-span-2">
          <pre className="text-xs max-h-96 overflow-auto">{JSON.stringify(raw, null, 2)}</pre>
        </Section>
      </div>
    </div>
  )
}

function Section({ title, children, className = '' }: { title: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-white rounded-2xl border border-gray-200 p-4 shadow-sm ${className}`}>
      <h2 className="text-sm font-bold text-gray-700 mb-3">{title}</h2>
      {children}
    </div>
  )
}
