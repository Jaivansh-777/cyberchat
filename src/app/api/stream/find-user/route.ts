import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { getStreamServer } from '@/lib/stream'
import { getUserByClerkId, getUserByCyberId } from '@/lib/db/sync-user'

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    const clerkId = session.userId
    if (!clerkId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { cyberId } = await req.json()
    if (!cyberId) return NextResponse.json({ error: 'Missing cyberId' }, { status: 400 })

    const targetUser = await getUserByClerkId(clerkId)
    if (!targetUser) return NextResponse.json({ error: 'Your account not found' }, { status: 404 })

    const found = await getUserByCyberId(cyberId)
    if (!found) {
      return NextResponse.json({ found: false }, { status: 404 })
    }

    const server = getStreamServer()
    let streamUser: any = null
    try {
      const resp = await server.queryUsers({ id: found.clerkId })
      streamUser = resp.users?.[0] || null
    } catch {}

    return NextResponse.json({
      found: true,
      user: {
        id: found.clerkId,
        cyberId: found.cyberId,
        name: found.displayName || found.username || found.clerkId,
        image: found.avatarUrl || streamUser?.image || '',
      },
    })
  } catch {
    return NextResponse.json({ error: 'Failed to find user' }, { status: 500 })
  }
}
