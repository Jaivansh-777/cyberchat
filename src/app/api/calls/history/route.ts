import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const session = await auth()
    const clerkId = session.userId
    if (!clerkId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const logs = await prisma.callLog.findMany({
      where: {
        OR: [{ callerId: clerkId }, { receiverId: clerkId }],
      },
      orderBy: { startedAt: 'desc' },
      take: 50,
    })

    return NextResponse.json({ logs })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to get call history' }, { status: 500 })
  }
}
