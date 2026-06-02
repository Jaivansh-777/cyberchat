import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const session = await auth()
    const clerkId = session.userId
    if (!clerkId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const requests = await prisma.friendRequest.findMany({
      where: { senderId: clerkId, status: 'pending' },
      include: {
        receiver: { select: { clerkId: true, cyberId: true, displayName: true, avatarUrl: true, username: true } },
      },
      orderBy: { createdAt: 'desc' },
    })

    const mapped = requests.map((r) => ({
      id: r.id,
      receiverId: r.receiver.clerkId,
      receiverName: r.receiver.displayName || r.receiver.username || r.receiver.clerkId,
      receiverCyberId: r.receiver.cyberId,
      receiverAvatar: r.receiver.avatarUrl || '',
      createdAt: r.createdAt.toISOString(),
    }))

    return NextResponse.json({ requests: mapped })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to get requests' }, { status: 500 })
  }
}
