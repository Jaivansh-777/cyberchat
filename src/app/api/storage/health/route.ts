import { NextResponse } from 'next/server'
import { checkDriveHealth } from '@/lib/drive'

export async function GET() {
  try {
    const health = await checkDriveHealth()
    return NextResponse.json({
      driveConnected: health.connected,
      rootFolderFound: health.rootFolderFound,
    })
  } catch (error) {
    return NextResponse.json({ driveConnected: false, rootFolderFound: false }, { status: 500 })
  }
}
