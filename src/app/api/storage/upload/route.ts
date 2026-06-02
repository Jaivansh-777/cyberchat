import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { uploadToDrive, ensureUserFolder, getStorageFolder } from '@/lib/drive'
import { getUserByClerkId } from '@/lib/db/sync-user'

const MAX_FILE_SIZE = 50 * 1024 * 1024

const ALLOWED_MIME_TYPES: Record<string, string[]> = {
  avatar: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
  'chat-image': ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml'],
  'voice-note': ['audio/mpeg', 'audio/webm', 'audio/ogg', 'audio/wav', 'audio/mp4'],
  document: ['application/pdf', 'text/plain', 'text/csv',
    'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/zip', 'application/x-tar', 'application/gzip'],
  video: ['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime'],
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    const clerkId = session.userId
    if (!clerkId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const user = await getUserByClerkId(clerkId)
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    const formData = await req.formData()
    const file = formData.get('file') as File | null
    const fileType = (formData.get('type') as string) || 'chat-image'
    const messageId = (formData.get('messageId') as string) || undefined

    if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 })

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: 'File too large. Max 50MB' }, { status: 413 })
    }

    const allowedTypes = ALLOWED_MIME_TYPES[fileType]
    if (allowedTypes && !allowedTypes.includes(file.type)) {
      return NextResponse.json({
        error: `Invalid file type. Allowed: ${allowedTypes.join(', ')}`,
      }, { status: 415 })
    }

    const userFolderId = await ensureUserFolder(user.cyberId)
    const subFolder = getStorageFolder(fileType)

    const subFolderId = await findSubFolder(userFolderId, subFolder)
    const buffer = Buffer.from(await file.arrayBuffer())

    const driveResult = await uploadToDrive(buffer, file.name, file.type, subFolderId)

    const mediaFile = await prisma.mediaFile.create({
      data: {
        userId: user.id,
        clerkId,
        driveFileId: driveResult.driveFileId,
        fileName: file.name,
        mimeType: file.type,
        size: file.size,
        webViewLink: driveResult.webViewLink,
        webContentLink: driveResult.webContentLink,
        folder: fileType,
        messageId,
      },
    })

    return NextResponse.json({
      id: mediaFile.id,
      driveFileId: mediaFile.driveFileId,
      fileName: mediaFile.fileName,
      mimeType: mediaFile.mimeType,
      size: mediaFile.size,
      webViewLink: mediaFile.webViewLink,
      webContentLink: mediaFile.webContentLink,
      createdAt: mediaFile.createdAt.toISOString(),
    })
  } catch (error) {
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 })
  }
}

async function findSubFolder(parentId: string, name: string): Promise<string> {
  const { google } = await import('googleapis')
  const { getDriveClient } = await import('@/lib/drive')
  const drive = getDriveClient()
  const res = await drive.files.list({
    q: `name='${name}' and '${parentId}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`,
    fields: 'files(id)',
    pageSize: 1,
  })
  if (res.data.files?.[0]?.id) return res.data.files[0].id
  const createRes = await drive.files.create({
    requestBody: { name, mimeType: 'application/vnd.google-apps.folder', parents: [parentId] },
    fields: 'id',
  })
  return createRes.data.id!
}
