import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    const clerkId = session.userId
    if (!clerkId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const targetCyberId = searchParams.get('cyberId')
    if (targetCyberId) {
      const found = await prisma.user.findUnique({ where: { cyberId: targetCyberId } })
      if (!found) return NextResponse.json({ found: false }, { status: 404 })
      return NextResponse.json({
        found: true,
        user: {
          id: found.clerkId,
          cyberId: found.cyberId,
          name: found.displayName || found.username || found.clerkId,
          image: found.avatarUrl || '',
        },
      })
    }

    return NextResponse.json({ error: 'Missing cyberId query param' }, { status: 400 })
  } catch {
    return NextResponse.json({ error: 'Failed to find user' }, { status: 500 })
  }
}
