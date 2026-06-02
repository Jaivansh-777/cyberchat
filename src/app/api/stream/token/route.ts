import { NextRequest, NextResponse } from 'next/server'
import { auth, clerkClient } from '@clerk/nextjs/server'
import { generateStreamToken, upsertStreamUser } from '@/lib/stream'
import { syncUser, getUserByClerkId } from '@/lib/db/sync-user'

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    const clerkId = session.userId
    if (!clerkId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    let user = await getUserByClerkId(clerkId)
    if (!user) {
      const clerk = await clerkClient()
      const clerkUser = await clerk.users.getUser(clerkId)
      user = await syncUser({
        id: clerkUser.id,
        email: clerkUser.primaryEmailAddress?.emailAddress || '',
        username: clerkUser.username || '',
        firstName: clerkUser.firstName || '',
        lastName: clerkUser.lastName || '',
        imageUrl: clerkUser.imageUrl || '',
      })
    }

    await upsertStreamUser(clerkId, user.displayName || user.username || 'User', user.avatarUrl || undefined)
    const token = generateStreamToken(clerkId)

    return NextResponse.json({ token, user: { id: clerkId, cyberId: user.cyberId, name: user.displayName, image: user.avatarUrl } })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to generate token' }, { status: 500 })
  }
}
