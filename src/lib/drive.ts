import { google, drive_v3 } from 'googleapis'
import { prisma } from '@/lib/prisma'

const ROOT_FOLDER_NAME = 'CyberChat'
const SUBFOLDERS = ['users', 'groups', 'temp', 'backups']

let driveClient: drive_v3.Drive | null = null
let rootFolderId: string | null = null

function getAuth() {
  const email = process.env.GOOGLE_CLIENT_EMAIL
  const key = process.env.GOOGLE_PRIVATE_KEY
  if (!email || !key) {
    throw new Error('Missing GOOGLE_CLIENT_EMAIL or GOOGLE_PRIVATE_KEY environment variables')
  }
  const auth = new google.auth.JWT({
    email,
    key: key.replace(/\\n/g, '\n'),
    scopes: ['https://www.googleapis.com/auth/drive.file'],
  })
  return auth
}

export function getDriveClient() {
  if (driveClient) return driveClient
  const auth = getAuth()
  driveClient = google.drive({ version: 'v3', auth })
  return driveClient
}

async function findFolderByName(name: string, parentId?: string): Promise<string | null> {
  const drive = getDriveClient()
  const query = `name='${name}' and mimeType='application/vnd.google-apps.folder' and trashed=false`
  const parentQuery = parentId ? ` and '${parentId}' in parents` : ''
  const res = await drive.files.list({
    q: query + parentQuery,
    fields: 'files(id, name)',
    pageSize: 1,
  })
  return res.data.files?.[0]?.id || null
}

async function createFolder(name: string, parentId?: string): Promise<string> {
  const drive = getDriveClient()
  const res = await drive.files.create({
    requestBody: {
      name,
      mimeType: 'application/vnd.google-apps.folder',
      parents: parentId ? [parentId] : undefined,
    },
    fields: 'id',
  })
  return res.data.id!
}

export async function ensureRootFolder(): Promise<string> {
  if (rootFolderId) return rootFolderId

  const providedId = process.env.GOOGLE_DRIVE_ROOT_FOLDER_ID
  if (providedId) {
    try {
      const drive = getDriveClient()
      const res = await drive.files.get({ fileId: providedId, fields: 'id,name' })
      if (res.data.id) {
        rootFolderId = res.data.id
        return rootFolderId
      }
    } catch {}
  }

  let id = await findFolderByName(ROOT_FOLDER_NAME)
  if (!id) {
    id = await createFolder(ROOT_FOLDER_NAME)
  }
  rootFolderId = id
  return rootFolderId
}

export async function ensureSubfolders(): Promise<Record<string, string>> {
  const rootId = await ensureRootFolder()
  const result: Record<string, string> = {}

  for (const name of SUBFOLDERS) {
    let id = await findFolderByName(name, rootId)
    if (!id) {
      id = await createFolder(name, rootId)
    }
    result[name] = id
  }

  return result
}

export async function ensureUserFolder(cyberId: string): Promise<string> {
  const subfolders = await ensureSubfolders()
  const usersFolderId = subfolders.users

  let userFolderId = await findFolderByName(cyberId, usersFolderId)
  if (!userFolderId) {
    userFolderId = await createFolder(cyberId, usersFolderId)
    for (const sub of ['avatars', 'chat-files', 'voice-notes', 'documents']) {
      await createFolder(sub, userFolderId)
    }
  }
  return userFolderId
}

export async function uploadToDrive(
  fileBuffer: Buffer,
  fileName: string,
  mimeType: string,
  folderId: string
): Promise<{
  driveFileId: string
  webViewLink: string | null
  webContentLink: string | null
}> {
  const drive = getDriveClient()
  const res = await drive.files.create({
    requestBody: {
      name: fileName,
      mimeType,
      parents: [folderId],
    },
    media: {
      mimeType,
      body: fileBuffer,
    },
    fields: 'id, webViewLink, webContentLink',
  })

  return {
    driveFileId: res.data.id!,
    webViewLink: res.data.webViewLink || null,
    webContentLink: res.data.webContentLink || null,
  }
}

export async function deleteFromDrive(driveFileId: string): Promise<void> {
  const drive = getDriveClient()
  await drive.files.delete({ fileId: driveFileId })
}

export async function getDriveFileMetadata(driveFileId: string) {
  const drive = getDriveClient()
  const res = await drive.files.get({
    fileId: driveFileId,
    fields: 'id, name, mimeType, size, webViewLink, webContentLink, createdTime',
  })
  return res.data
}

export async function checkDriveHealth() {
  try {
    const drive = getDriveClient()
    await drive.about.get({ fields: 'user' })
    const rootId = await ensureRootFolder()
    const root = await drive.files.get({ fileId: rootId, fields: 'id,name' })
    return {
      connected: true,
      rootFolderFound: !!root.data.id,
      rootFolderName: root.data.name || null,
    }
  } catch (error) {
    return { connected: false, rootFolderFound: false, error: String(error) }
  }
}

export function getStorageFolder(targetFolder: string): string {
  const folderMap: Record<string, string> = {
    avatar: 'avatars',
    'chat-image': 'chat-files',
    'voice-note': 'voice-notes',
    document: 'documents',
    video: 'chat-files',
  }
  return folderMap[targetFolder] || 'chat-files'
}
