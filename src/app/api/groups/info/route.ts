import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    const clerkId = session.userId
    if (!clerkId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const groupId = searchParams.get('groupId')

    if (!groupId) return NextResponse.json({ error: 'Missing groupId' }, { status: 400 })

    const group = await prisma.group.findUnique({
      where: { id: groupId },
      include: {
        members: {
          include: { user: { select: { clerkId: true, cyberId: true, displayName: true, avatarUrl: true } } },
        },
      },
    })
    if (!group) return NextResponse.json({ error: 'Group not found' }, { status: 404 })

    return NextResponse.json({ group })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to get group' }, { status: 500 })
  }
}
