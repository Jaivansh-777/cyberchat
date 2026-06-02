import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { deleteFromDrive } from '@/lib/drive'

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    const clerkId = session.userId
    if (!clerkId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { driveFileId } = await req.json()
    if (!driveFileId) return NextResponse.json({ error: 'Missing driveFileId' }, { status: 400 })

    const file = await prisma.mediaFile.findUnique({ where: { driveFileId } })
    if (!file) return NextResponse.json({ error: 'File not found' }, { status: 404 })
    if (file.clerkId !== clerkId) {
      return NextResponse.json({ error: 'Not authorized to delete this file' }, { status: 403 })
    }

    await deleteFromDrive(driveFileId)
    await prisma.mediaFile.delete({ where: { driveFileId } })

    return NextResponse.json({ ok: true })
  } catch (error) {
    return NextResponse.json({ error: 'Delete failed' }, { status: 500 })
  }
}
