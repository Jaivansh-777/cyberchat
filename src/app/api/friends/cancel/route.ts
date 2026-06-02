import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    const clerkId = session.userId
    if (!clerkId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { toCyberId } = await req.json()
    if (!toCyberId) return NextResponse.json({ error: 'Missing toCyberId' }, { status: 400 })

    const receiver = await prisma.user.findUnique({ where: { cyberId: toCyberId.toUpperCase() } })
    if (!receiver) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    const request = await prisma.friendRequest.findUnique({
      where: { senderId_receiverId: { senderId: clerkId, receiverId: receiver.clerkId } },
    })
    if (!request || request.status !== 'pending') {
      return NextResponse.json({ error: 'No pending request to cancel' }, { status: 400 })
    }

    await prisma.friendRequest.update({
      where: { id: request.id },
      data: { status: 'declined' },
    })

    return NextResponse.json({ ok: true })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to cancel request' }, { status: 500 })
  }
}
