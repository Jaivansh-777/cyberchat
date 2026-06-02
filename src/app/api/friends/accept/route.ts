import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { getStreamServer } from '@/lib/stream'
import { getDmChannelId } from '@/lib/dm-channel'

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    const clerkId = session.userId
    if (!clerkId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { requestId } = await req.json()
    if (!requestId) return NextResponse.json({ error: 'Missing requestId' }, { status: 400 })

    const request = await prisma.friendRequest.findUnique({ where: { id: requestId } })
    if (!request) return NextResponse.json({ error: 'Request not found' }, { status: 404 })
    if (request.receiverId !== clerkId) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 })
    }
    if (request.status !== 'pending') {
      return NextResponse.json({ error: 'Request already handled' }, { status: 409 })
    }

    await prisma.friendRequest.update({
      where: { id: requestId },
      data: { status: 'accepted', updatedAt: new Date() },
    })

    await prisma.friendship.createMany({
      data: [
        { userClerkId: request.senderId, friendClerkId: request.receiverId },
        { userClerkId: request.receiverId, friendClerkId: request.senderId },
      ],
      skipDuplicates: true,
    })

    const dmId = getDmChannelId(request.senderId, request.receiverId)
    try {
      const server = getStreamServer()
      const dm = server.channel('messaging', dmId, {
        members: [request.senderId, request.receiverId],
        created_by_id: request.senderId,
      })
      await dm.create()
      await dm.addMembers([request.senderId, request.receiverId])
    } catch (error) {
      console.error('Failed to create DM channel:', error)
    }

    return NextResponse.json({ ok: true, dmChannelId: dmId, friendId: request.senderId })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to accept request' }, { status: 500 })
  }
}
