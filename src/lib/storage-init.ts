import { ensureRootFolder, ensureSubfolders, checkDriveHealth } from '@/lib/drive'

const REQUIRED_VARS = [
  'GOOGLE_CLIENT_EMAIL',
  'GOOGLE_PRIVATE_KEY',
  'DATABASE_URL',
  'CLERK_SECRET_KEY',
  'NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY',
  'NEXT_PUBLIC_STREAM_KEY',
  'STREAM_SECRET',
]

function validateEnv(): string[] {
  const missing: string[] = []
  for (const v of REQUIRED_VARS) {
    if (!process.env[v]) missing.push(v)
  }
  return missing
}

export async function initStorage() {
  const missing = validateEnv()
  if (missing.length > 0) {
    console.error(`[Storage] Missing required env vars: ${missing.join(', ')}`)
    return false
  }

  try {
    const health = await checkDriveHealth()
    if (!health.connected) {
      console.error('[Storage] Google Drive connection failed')
      return false
    }

    const rootId = await ensureRootFolder()
    await ensureSubfolders()
    return true
  } catch (error) {
    console.error('[Storage] Init failed:', error)
    return false
  }
}

if (process.env.NODE_ENV !== 'production') {
  initStorage().then((ok) => {
    if (ok) console.log('[Storage] Google Drive initialized successfully')
    else console.warn('[Storage] Google Drive initialization failed')
  })
}
