import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { getStreamServer } from '@/lib/stream'

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    const clerkId = session.userId
    if (!clerkId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { requestId, action } = await req.json()
    if (!requestId || !action) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
    }

    const server = getStreamServer()
    const ch = server.channel('team', 'friend_requests')
    await ch.watch()

    const response = await ch.query({ messages: { limit: 100 } })
    const msg = (response.messages || []).find((m: any) => m.id === requestId)
    if (!msg) {
      return NextResponse.json({ error: 'Request not found' }, { status: 404 })
    }

    const parts = (msg.text || '').split(':')
    if (parts[3] !== 'pending') {
      return NextResponse.json({ error: 'Request already handled' }, { status: 409 })
    }

    const fromUserId = parts[1]
    const toUserId = parts[2]

    if (clerkId !== toUserId) {
      return NextResponse.json({ error: 'Not authorized to respond' }, { status: 403 })
    }

    if (action === 'accept') {
      const newText = `request:${fromUserId}:${toUserId}:accepted`
      await (ch as any).updateMessage({ id: requestId, text: newText })

      const dmId = [fromUserId, toUserId].sort().join('--')
      const dm = server.channel('messaging', dmId, {
        members: [fromUserId, toUserId],
        created_by_id: fromUserId,
      })
      await dm.create()
      await dm.addMembers([fromUserId, toUserId])

      return NextResponse.json({ ok: true, dmChannelId: dmId })
    } else {
      const newText = `request:${fromUserId}:${toUserId}:declined`
      await (ch as any).updateMessage({ id: requestId, text: newText })
      return NextResponse.json({ ok: true })
    }
  } catch {
    return NextResponse.json({ error: 'Failed to respond' }, { status: 500 })
  }
}
