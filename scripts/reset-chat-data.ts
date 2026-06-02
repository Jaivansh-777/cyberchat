import { PrismaClient } from '@prisma/client'
import { getStreamServer } from '../src/lib/stream'

const prisma = new PrismaClient()

async function main() {
  if (process.env.NODE_ENV === 'production') {
    console.error('\n❌ SAFETY: Cannot run reset in production!\n')
    process.exit(1)
  }

  console.log('\n⚠️  CYBERCHAT CHAT DATA RESET')
  console.log('   This will clear all chat-related data.')
  console.log('   User accounts and profiles will be preserved.\n')

  console.log('   Proceeding in 3 seconds... (Ctrl+C to abort)')
  await new Promise((r) => setTimeout(r, 3000))

  console.log('\n🗑️  Clearing old data...')

  const r1 = await prisma.callLog.deleteMany()
  console.log(`   ✓ Call logs: ${r1.count} deleted`)

  const r2 = await prisma.groupMember.deleteMany()
  console.log(`   ✓ Group members: ${r2.count} deleted`)

  const r3 = await prisma.group.deleteMany()
  console.log(`   ✓ Groups: ${r3.count} deleted`)

  const r4 = await prisma.friendRequest.deleteMany()
  console.log(`   ✓ Friend requests: ${r4.count} deleted`)

  const r5 = await prisma.friendship.deleteMany()
  console.log(`   ✓ Friendships: ${r5.count} deleted`)

  const r6 = await prisma.mediaFile.deleteMany()
  console.log(`   ✓ Media files: ${r6.count} deleted`)

  const r7 = await prisma.blockedUser.deleteMany()
  console.log(`   ✓ Blocked users: ${r7.count} deleted`)

  try {
    const server = getStreamServer()
    const channelsToDelete = ['general', 'random', 'tech', 'status_updates']
    for (const cid of channelsToDelete) {
      try {
        const ch = server.channel('team', cid)
        await ch.delete()
        console.log(`   ✓ Stream channel #${cid} deleted`)
      } catch {}
    }
  } catch {
    console.log('   ⚠️  Could not delete Stream channels (server not available)')
  }

  console.log('\n✅ Reset complete! Old chat data has been cleared.')
  console.log('   Run `npm run db:seed-default-groups` to recreate default groups.\n')

  await prisma.$disconnect()
}

main().catch((e) => {
  console.error('Reset failed:', e)
  process.exit(1)
})
