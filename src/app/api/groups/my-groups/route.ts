import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const session = await auth()
    const clerkId = session.userId
    if (!clerkId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const groups = await prisma.group.findMany({
      where: { members: { some: { clerkId } } },
      include: {
        members: {
          include: { user: { select: { clerkId: true, displayName: true, avatarUrl: true } } },
        },
        _count: { select: { members: true } },
      },
      orderBy: { updatedAt: 'desc' },
    })

    return NextResponse.json({ groups })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to list groups' }, { status: 500 })
  }
}
