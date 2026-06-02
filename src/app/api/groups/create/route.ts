import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { getStreamServer } from '@/lib/stream'

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    const clerkId = session.userId
    if (!clerkId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { name, description } = await req.json()
    if (!name || name.trim().length === 0) {
      return NextResponse.json({ error: 'Group name required' }, { status: 400 })
    }

    const user = await prisma.user.findUnique({ where: { clerkId } })
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    const group = await prisma.group.create({
      data: {
        name: name.trim(),
        description: description || '',
        createdBy: clerkId,
        members: {
          create: { clerkId, role: 'admin' },
        },
      },
    })

    try {
      const streamId = `group_${group.id}`
      const server = getStreamServer()
      await (server.channel('team', streamId, {
        name: group.name,
        description: group.description,
        created_by_id: clerkId,
      } as any)).create()
      await (server.channel('team', streamId) as any).addMembers([clerkId])
      await prisma.group.update({ where: { id: group.id }, data: { streamChannelId: streamId } })
    } catch {}

    return NextResponse.json({ group })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create group' }, { status: 500 })
  }
}
