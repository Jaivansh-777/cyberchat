import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { uploadToDrive, ensureUserFolder, getStorageFolder } from '@/lib/drive'
import { getStreamServer } from '@/lib/stream'

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    const clerkId = session.userId
    if (!clerkId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const user = await prisma.user.findUnique({ where: { clerkId } })
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    const formData = await req.formData()
    const file = formData.get('avatar') as File | null
    if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 })

    const buffer = Buffer.from(await file.arrayBuffer())
    const fileName = `avatar_${clerkId}_${Date.now()}.${file.name.split('.').pop() || 'jpg'}`

    const userFolderId = await ensureUserFolder(user.cyberId)
    const subfolder = getStorageFolder('avatar')
    const avatarFolderId = userFolderId

    const driveResult = await uploadToDrive(buffer, fileName, file.type, avatarFolderId)

    await prisma.user.update({
      where: { clerkId },
      data: { avatarUrl: driveResult.webViewLink },
    })

    try {
      const server = getStreamServer()
      await server.upsertUser({
        id: clerkId,
        name: user.displayName || user.username || 'User',
        image: driveResult.webViewLink || undefined,
      })
    } catch {}

    return NextResponse.json({ avatarUrl: driveResult.webViewLink })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to upload avatar' }, { status: 500 })
  }
}
