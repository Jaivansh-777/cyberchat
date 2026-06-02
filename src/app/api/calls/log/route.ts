import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    const clerkId = session.userId
    if (!clerkId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { receiverId, callType, status, duration } = await req.json()
    if (!receiverId || !callType || !status) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
    }

    const log = await prisma.callLog.create({
      data: {
        callerId: clerkId,
        receiverId,
        callType,
        status,
        duration: duration || null,
        endedAt: status !== 'missed' ? new Date() : null,
      },
    })

    return NextResponse.json({ log })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to log call' }, { status: 500 })
  }
}
