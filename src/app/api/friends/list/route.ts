import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const session = await auth()
    const clerkId = session.userId
    if (!clerkId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const friendships = await prisma.friendship.findMany({
      where: { userClerkId: clerkId },
      include: {
        friend: { select: { clerkId: true, cyberId: true, displayName: true, avatarUrl: true, username: true, lastSeen: true } },
      },
      orderBy: { createdAt: 'desc' },
    })

    const mapped = friendships.map((f) => ({
      clerkId: f.friend.clerkId,
      cyberId: f.friend.cyberId,
      name: f.friend.displayName || f.friend.username || f.friend.clerkId,
      avatar: f.friend.avatarUrl || '',
      lastSeen: f.friend.lastSeen.toISOString(),
      since: f.createdAt.toISOString(),
    }))

    return NextResponse.json({ friends: mapped })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to get friends list' }, { status: 500 })
  }
}
