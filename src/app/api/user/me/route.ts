import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { syncUser, getUserByClerkId } from '@/lib/db/sync-user'
import { clerkClient } from '@clerk/nextjs/server'

export async function GET() {
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

    return NextResponse.json({
      id: user.clerkId,
      cyberId: user.cyberId,
      username: user.username,
      displayName: user.displayName,
      avatarUrl: user.avatarUrl,
      email: user.email,
    })
  } catch {
    return NextResponse.json({ error: 'Failed to get user' }, { status: 500 })
  }
}
