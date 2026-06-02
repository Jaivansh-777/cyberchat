import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'

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
      data: { status: 'declined', updatedAt: new Date() },
    })

    return NextResponse.json({ ok: true })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to decline request' }, { status: 500 })
  }
}
