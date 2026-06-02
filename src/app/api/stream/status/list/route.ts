import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { getStreamServer } from '@/lib/stream'

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session.userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const server = getStreamServer()
    const ch = server.channel('team', 'status_updates')
    try {
      await ch.watch()
    } catch {
      return NextResponse.json({ statuses: [] })
    }

    const response = await ch.query({ messages: { limit: 100 } })
    const twentyFourHoursAgo = Date.now() - 24 * 60 * 60 * 1000

    const statuses = (response.messages || [])
      .filter((m: any) => {
        const ts = m.created_at ? new Date(m.created_at).getTime() : 0
        return ts > twentyFourHoursAgo
      })
      .map((m: any) => ({
        id: m.id,
        userId: m.user?.id || '',
        userName: m.user?.name || m.user?.id || 'Unknown',
        content: m.text || '',
        imageUrl: m.attachments?.[0]?.image_url || '',
        timestamp: m.created_at ? new Date(m.created_at).getTime() : 0,
      }))

    return NextResponse.json({ statuses })
  } catch {
    return NextResponse.json({ statuses: [] })
  }
}
