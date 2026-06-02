import { PrismaClient } from '@prisma/client'
import { getStreamServer } from '../src/lib/stream'

const prisma = new PrismaClient()

const defaultGroups = [
  { name: 'Cyber Classes', description: 'Official class and learning discussion group.', streamId: 'group_cyber_classes' },
  { name: 'Students', description: 'General student discussion group.', streamId: 'group_students' },
]

async function main() {
  if (process.env.NODE_ENV === 'production') {
    console.error('\n❌ SAFETY: Cannot seed in production!\n')
    process.exit(1)
  }

  console.log('\n🌱 Seeding default groups...\n')

  for (const g of defaultGroups) {
    const existing = await prisma.group.findFirst({ where: { name: g.name } })
    if (existing) {
      console.log(`   ✓ Group "${g.name}" already exists (id: ${existing.id})`)
      continue
    }

    const group = await prisma.group.create({
      data: {
        name: g.name,
        description: g.description,
        inviteCode: `${g.name.toLowerCase().replace(/\s+/g, '_')}_${Date.now().toString(36)}`,
        createdBy: 'system',
        streamChannelId: g.streamId,
      },
    })
    console.log(`   ✓ Created group "${g.name}" (id: ${group.id})`)

    try {
      const server = getStreamServer()
      const ch = server.channel('team', g.streamId, {
        name: g.name,
        description: g.description,
        created_by_id: 'system',
      } as any)
      await ch.create()
      console.log(`   ✓ Created Stream channel #${g.streamId}`)
    } catch {
      console.log(`   ⚠️  Could not create Stream channel #${g.streamId}`)
    }
  }

  console.log('\n✅ Default groups seeded successfully!')
  console.log('   Users will see these groups in their Groups & Chats lists.\n')

  await prisma.$disconnect()
}

main().catch((e) => {
  console.error('Seed failed:', e)
  process.exit(1)
})
