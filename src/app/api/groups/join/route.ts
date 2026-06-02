import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { getStreamServer } from '@/lib/stream'

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    const clerkId = session.userId
    if (!clerkId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { inviteCode } = await req.json()
    if (!inviteCode) return NextResponse.json({ error: 'Missing inviteCode' }, { status: 400 })

    const group = await prisma.group.findUnique({ where: { inviteCode } })
    if (!group) return NextResponse.json({ error: 'Invalid invite code' }, { status: 404 })

    const existing = await prisma.groupMember.findUnique({
      where: { groupId_clerkId: { groupId: group.id, clerkId } },
    })
    if (existing) return NextResponse.json({ error: 'Already a member' }, { status: 400 })

    await prisma.groupMember.create({
      data: { groupId: group.id, clerkId, role: 'member' },
    })

    if (group.streamChannelId) {
      try {
      const server = getStreamServer()
      await (server.channel('team', group.streamChannelId) as any).addMembers([clerkId])
      } catch {}
    }

    return NextResponse.json({ group, streamChannelId: group.streamChannelId })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to join group' }, { status: 500 })
  }
}
