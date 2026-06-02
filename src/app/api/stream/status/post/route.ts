import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { getStreamServer } from '@/lib/stream'

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    const clerkId = session.userId
    if (!clerkId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { content } = await req.json()
    if (!content) return NextResponse.json({ error: 'Missing content' }, { status: 400 })

    const server = getStreamServer()
    const ch = server.channel('team', 'status_updates', {
      name: 'Status Updates',
    } as any)

    await ch.create()
    await ch.addMembers([clerkId])

    await ch.sendMessage({
      text: content,
      user_id: clerkId,
    } as any)

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Failed to post status' }, { status: 500 })
  }
}
