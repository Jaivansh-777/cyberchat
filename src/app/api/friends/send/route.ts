import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { getUserByClerkId, getUserByCyberId } from '@/lib/db/sync-user'
import { getStreamServer } from '@/lib/stream'

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    const clerkId = session.userId
    if (!clerkId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { toCyberId } = await req.json()
    if (!toCyberId) return NextResponse.json({ error: 'Missing toCyberId' }, { status: 400 })

    const sender = await getUserByClerkId(clerkId)
    if (!sender) return NextResponse.json({ error: 'Your account not found' }, { status: 404 })

    const receiver = await getUserByCyberId(toCyberId)
    if (!receiver) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    if (sender.clerkId === receiver.clerkId) {
      return NextResponse.json({ error: 'Cannot send request to yourself' }, { status: 400 })
    }

    const existing = await prisma.friendRequest.findUnique({
      where: { senderId_receiverId: { senderId: sender.clerkId, receiverId: receiver.clerkId } },
    })
    if (existing && existing.status === 'pending') {
      return NextResponse.json({ error: 'Request already sent' }, { status: 409 })
    }
    if (existing && existing.status === 'accepted') {
      return NextResponse.json({ error: 'Already friends' }, { status: 409 })
    }

    const reverseRequest = await prisma.friendRequest.findUnique({
      where: { senderId_receiverId: { senderId: receiver.clerkId, receiverId: sender.clerkId } },
    })
    if (reverseRequest && reverseRequest.status === 'accepted') {
      return NextResponse.json({ error: 'Already friends' }, { status: 409 })
    }

    if (existing && existing.status === 'declined') {
      const fr = await prisma.friendRequest.update({
        where: { id: existing.id },
        data: { status: 'pending', updatedAt: new Date() },
      })
      return NextResponse.json({ requestId: fr.id, status: 'pending' })
    }

    const fr = await prisma.friendRequest.create({
      data: {
        senderId: sender.clerkId,
        receiverId: receiver.clerkId,
        status: 'pending',
      },
    })

    return NextResponse.json({ requestId: fr.id, status: 'pending' })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to send request' }, { status: 500 })
  }
}
