import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const session = await auth()
    const clerkId = session.userId
    if (!clerkId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const requests = await prisma.friendRequest.findMany({
      where: { receiverId: clerkId, status: 'pending' },
      include: {
        sender: { select: { clerkId: true, cyberId: true, displayName: true, avatarUrl: true, username: true } },
      },
      orderBy: { createdAt: 'desc' },
    })

    const mapped = requests.map((r) => ({
      id: r.id,
      senderId: r.sender.clerkId,
      senderName: r.sender.displayName || r.sender.username || r.sender.clerkId,
      senderCyberId: r.sender.cyberId,
      senderAvatar: r.sender.avatarUrl || '',
      createdAt: r.createdAt.toISOString(),
    }))

    return NextResponse.json({ requests: mapped })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to get requests' }, { status: 500 })
  }
}
