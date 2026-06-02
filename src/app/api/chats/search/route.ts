import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { getStreamServer } from '@/lib/stream'

export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    const clerkId = session.userId
    if (!clerkId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const channelId = searchParams.get('channelId')
    const query = searchParams.get('q')

    if (!channelId || !query) {
      return NextResponse.json({ error: 'Missing channelId or q' }, { status: 400 })
    }

    const server = getStreamServer()
    const ch = server.channel('messaging', channelId)
    await ch.watch()

    const response = await ch.query({
      messages: { limit: 100 },
    })

    const results = (response.messages || [])
      .filter((m: any) => m.text?.toLowerCase().includes(query.toLowerCase()))
      .map((m: any) => ({
        id: m.id,
        text: m.text,
        userId: m.user?.id,
        userName: m.user?.name || m.user?.id,
        createdAt: m.created_at,
      }))

    return NextResponse.json({ results })
  } catch {
    return NextResponse.json({ error: 'Search failed' }, { status: 500 })
  }
}
