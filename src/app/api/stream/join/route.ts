import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { getStreamServer } from '@/lib/stream'

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    const clerkId = session.userId
    if (!clerkId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const server = getStreamServer()
    const filter = { type: 'team' }
    const channels = await server.queryChannels(filter, {} as any)

    for (const ch of channels) {
      const members = Object.keys(ch.state?.members || {})
      if (!members.includes(clerkId)) {
        try {
          await ch.addMembers([clerkId])
        } catch {}
      }
    }

    return NextResponse.json({ joined: channels.length })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to sync channels' }, { status: 500 })
  }
}
