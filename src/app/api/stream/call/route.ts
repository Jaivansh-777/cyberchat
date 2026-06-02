import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { StreamClient } from '@stream-io/node-sdk'

const apiKey = process.env.NEXT_PUBLIC_STREAM_KEY!
const secret = process.env.STREAM_SECRET!

export async function POST(req: Request) {
  try {
    const session = await auth()
    const clerkId = session.userId
    if (!clerkId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { type, callId, members } = await req.json()

    const client = new StreamClient(apiKey, secret)

    const call = client.video.call('default', callId)
    await call.getOrCreate({
      data: {
        created_by_id: clerkId,
        members: members.map((id: string) => ({ user_id: id })),
        custom: { type: type || 'audio' },
      },
    })

    return NextResponse.json({ callId })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create call' }, { status: 500 })
  }
}
