import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { generateStreamToken, upsertStreamUser } from '@/lib/stream'
import { getUserByClerkId } from '@/lib/db/sync-user'

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    const clerkId = session.userId
    if (!clerkId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const user = await getUserByClerkId(clerkId)
    if (!user) return NextResponse.json({ error: 'User not found in DB' }, { status: 404 })

    await upsertStreamUser(clerkId, user.displayName || user.username || 'User', user.avatarUrl || undefined)
    const token = generateStreamToken(clerkId)

    return NextResponse.json({ token, user: { id: clerkId, cyberId: user.cyberId, name: user.displayName, image: user.avatarUrl } })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to generate token' }, { status: 500 })
  }
}
