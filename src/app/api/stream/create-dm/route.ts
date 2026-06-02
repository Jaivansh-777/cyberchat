import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { getStreamServer } from '@/lib/stream'

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    const clerkId = session.userId
    if (!clerkId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { targetUserId } = await req.json()
    if (!targetUserId) {
      return NextResponse.json({ error: 'Missing targetUserId' }, { status: 400 })
    }

    const server = getStreamServer()
    const channelId = [clerkId, targetUserId].sort().join('--')
    const channel = server.channel('messaging', channelId, {
      members: [clerkId, targetUserId],
      created_by_id: clerkId,
    })

    await channel.create()
    await channel.addMembers([clerkId, targetUserId])

    return NextResponse.json({
      channelId,
      channelType: 'messaging',
    })
  } catch {
    return NextResponse.json({ error: 'Failed to create DM' }, { status: 500 })
  }
}
