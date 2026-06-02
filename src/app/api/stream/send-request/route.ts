import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { getStreamServer } from '@/lib/stream'
import { getUserByClerkId, getUserByCyberId } from '@/lib/db/sync-user'

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    const clerkId = session.userId
    if (!clerkId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { toCyberId } = await req.json()
    if (!toCyberId) return NextResponse.json({ error: 'Missing toCyberId' }, { status: 400 })

    const sender = await getUserByClerkId(clerkId)
    if (!sender) return NextResponse.json({ error: 'Your account not found' }, { status: 404 })

    const receiver = await getUserByCyberId(toCyberId)
    if (!receiver) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    if (sender.clerkId === receiver.clerkId) {
      return NextResponse.json({ error: 'Cannot request yourself' }, { status: 400 })
    }

    const server = getStreamServer()
    const ch = server.channel('team', 'friend_requests', {
      name: 'Friend Requests',
      members: [sender.clerkId, receiver.clerkId],
    } as any)
    await ch.create()

    const existing = await ch.query({ messages: { limit: 100 } })
    const alreadyPending = (existing.messages || []).some(
      (m: any) =>
        m.text?.includes(`request:${sender.clerkId}:${receiver.clerkId}`) &&
        m.text?.includes(':pending')
    )
    if (alreadyPending) {
      return NextResponse.json({ error: 'Request already sent' }, { status: 409 })
    }

    await ch.sendMessage({
      text: `request:${sender.clerkId}:${receiver.clerkId}:pending`,
      user_id: sender.clerkId,
      user: { id: sender.clerkId, name: sender.displayName || sender.clerkId },
    } as any)

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Failed to send request' }, { status: 500 })
  }
}
