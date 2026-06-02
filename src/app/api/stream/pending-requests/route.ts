import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { getStreamServer } from '@/lib/stream'

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    const clerkId = session.userId
    if (!clerkId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const server = getStreamServer()
    const ch = server.channel('team', 'friend_requests')
    try {
      await ch.watch()
    } catch {
      return NextResponse.json({ requests: [] })
    }

    const response = await ch.query({ messages: { limit: 100 } })
    const requests = (response.messages || [])
      .filter((m: any) => {
        const parts = (m.text || '').split(':')
        return parts[0] === 'request' && parts[3] === 'pending' && parts[2] === clerkId
      })
      .map((m: any) => {
        const parts = m.text!.split(':')
        return {
          id: m.id,
          fromUserId: parts[1],
          fromUserName: m.user?.name || parts[1],
          toUserId: parts[2],
          status: parts[3],
          timestamp: m.created_at ? new Date(m.created_at).getTime() : 0,
        }
      })

    return NextResponse.json({ requests })
  } catch {
    return NextResponse.json({ requests: [] })
  }
}
