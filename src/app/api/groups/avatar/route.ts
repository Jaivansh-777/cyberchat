import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { uploadToDrive, getStorageFolder } from '@/lib/drive'
import { getStreamServer } from '@/lib/stream'

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    const clerkId = session.userId
    if (!clerkId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const formData = await req.formData()
    const file = formData.get('avatar') as File | null
    const groupId = formData.get('groupId') as string | null
    if (!file || !groupId) return NextResponse.json({ error: 'Missing file or groupId' }, { status: 400 })

    const membership = await prisma.groupMember.findUnique({
      where: { groupId_clerkId: { groupId, clerkId } },
    })
    if (!membership || membership.role !== 'admin') {
      return NextResponse.json({ error: 'Only admins can change group avatar' }, { status: 403 })
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    const fileName = `group_${groupId}_${Date.now()}.${file.name.split('.').pop() || 'jpg'}`
    const folderId = getStorageFolder('avatar')
    const driveResult = await uploadToDrive(buffer, fileName, file.type, folderId)

    await prisma.group.update({ where: { id: groupId }, data: { avatarUrl: driveResult.webViewLink } })

    const group = await prisma.group.findUnique({ where: { id: groupId } })
    if (group?.streamChannelId) {
      try {
      const server = getStreamServer()
      await (server.channel('team', group.streamChannelId) as any).update({ image: driveResult.webViewLink })
      } catch {}
    }

    return NextResponse.json({ avatarUrl: driveResult.webViewLink })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to upload group avatar' }, { status: 500 })
  }
}
