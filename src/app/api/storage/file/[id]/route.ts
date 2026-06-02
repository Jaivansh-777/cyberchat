import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const session = await auth()
    const clerkId = session.userId
    if (!clerkId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const file = await prisma.mediaFile.findUnique({ where: { id } })
    if (!file) return NextResponse.json({ error: 'File not found' }, { status: 404 })
    if (file.clerkId !== clerkId) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 })
    }

    return NextResponse.json({
      id: file.id,
      driveFileId: file.driveFileId,
      fileName: file.fileName,
      mimeType: file.mimeType,
      size: file.size,
      webViewLink: file.webViewLink,
      webContentLink: file.webContentLink,
      folder: file.folder,
      messageId: file.messageId,
      createdAt: file.createdAt.toISOString(),
    })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to get file' }, { status: 500 })
  }
}
