import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { getStreamServer } from '@/lib/stream'

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    const clerkId = session.userId
    if (!clerkId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { groupId, memberClerkId } = await req.json()
    if (!groupId || !memberClerkId) {
      return NextResponse.json({ error: 'Missing groupId or memberClerkId' }, { status: 400 })
    }

    const membership = await prisma.groupMember.findUnique({
      where: { groupId_clerkId: { groupId, clerkId } },
    })
    if (!membership || membership.role !== 'admin') {
      return NextResponse.json({ error: 'Only admins can remove members' }, { status: 403 })
    }

    await prisma.groupMember.deleteMany({
      where: { groupId, clerkId: memberClerkId },
    })

    const group = await prisma.group.findUnique({ where: { id: groupId } })
    if (group?.streamChannelId) {
      try {
      const server = getStreamServer()
      await (server.channel('team', group.streamChannelId) as any).removeMembers([memberClerkId])
      } catch {}
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to remove member' }, { status: 500 })
  }
}
