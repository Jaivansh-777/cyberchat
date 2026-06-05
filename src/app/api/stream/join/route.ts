import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { getStreamServer } from '@/lib/stream'

const DEFAULT_TEAMS = [
  { id: 'group_cyber_classes', name: 'Cyber Classes', description: 'Official class and learning discussion group.' },
  { id: 'group_students', name: 'Students', description: 'General student discussion group.' },
]

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    const clerkId = session.userId
    if (!clerkId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const server = getStreamServer()

    let created = 0
    for (const team of DEFAULT_TEAMS) {
      try {
        const existing = await server.queryChannels({ type: 'team', id: team.id }, { limit: 1 } as any)
        if (existing.length === 0) {
          const ch = server.channel('team', team.id, {
            name: team.name,
            description: team.description,
            created_by_id: 'system',
          } as any)
          await ch.create()
          created++
        }
      } catch {
        // channel may already exist but query failed; try adding member anyway
      }
    }

    const filter = { type: 'team' }
    const channels = await server.queryChannels(filter, {} as any)

    for (const ch of channels) {
      const members = Object.keys(ch.state?.members || {})
      if (!members.includes(clerkId)) {
        try {
          await ch.addMembers([clerkId])
        } catch {}
      }
    }

    return NextResponse.json({ joined: channels.length, created })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to sync channels' }, { status: 500 })
  }
}
