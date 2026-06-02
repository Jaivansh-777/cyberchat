import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    const clerkId = session.userId
    if (!clerkId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { friendClerkId } = await req.json()
    if (!friendClerkId) return NextResponse.json({ error: 'Missing friendClerkId' }, { status: 400 })

    await prisma.friendship.deleteMany({
      where: {
        OR: [
          { userClerkId: clerkId, friendClerkId },
          { userClerkId: friendClerkId, friendClerkId: clerkId },
        ],
      },
    })

    await prisma.friendRequest.deleteMany({
      where: {
        OR: [
          { senderId: clerkId, receiverId: friendClerkId },
          { senderId: friendClerkId, receiverId: clerkId },
        ],
      },
    })

    return NextResponse.json({ ok: true })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to remove friend' }, { status: 500 })
  }
}
