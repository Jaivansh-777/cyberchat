import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { getStreamServer } from '@/lib/stream'

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    const clerkId = session.userId
    if (!clerkId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { content, imageUrl } = await req.json()
    if (!content && !imageUrl) return NextResponse.json({ error: 'Missing content or image' }, { status: 400 })

    const server = getStreamServer()
    const ch = server.channel('team', 'status_updates', {
      name: 'Status Updates',
    } as any)

    await ch.create()
    await ch.addMembers([clerkId])

    const msgData: any = {}
    if (content) msgData.text = content
    if (imageUrl) {
      msgData.attachments = [{ image_url: imageUrl, type: 'image' }]
      msgData.text = msgData.text || ''
    }
    msgData.user_id = clerkId

    await ch.sendMessage(msgData as any)

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Failed to post status' }, { status: 500 })
  }
}
