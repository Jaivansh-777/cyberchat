import { prisma } from '@/lib/prisma'

function generateCyberId(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let id = 'CYBER'
  for (let i = 0; i < 8; i++) id += chars[Math.floor(Math.random() * chars.length)]
  return id
}

export async function syncUser(clerkUser: {
  id: string
  email?: string
  username?: string
  firstName?: string
  lastName?: string
  imageUrl?: string
}) {
  const email = clerkUser.email || ''
  const displayName = [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(' ') || clerkUser.username || email.split('@')[0] || 'User'

  let user = await prisma.user.findUnique({ where: { clerkId: clerkUser.id } })

  if (!user) {
    let cyberId = generateCyberId()
    while (await prisma.user.findUnique({ where: { cyberId } })) {
      cyberId = generateCyberId()
    }

    user = await prisma.user.create({
      data: {
        clerkId: clerkUser.id,
        cyberId,
        username: clerkUser.username || '',
        displayName,
        avatarUrl: clerkUser.imageUrl || null,
        email,
      },
    })
  } else {
    user = await prisma.user.update({
      where: { clerkId: clerkUser.id },
      data: {
        username: clerkUser.username || user.username,
        displayName: displayName || user.displayName,
        avatarUrl: clerkUser.imageUrl || user.avatarUrl,
        email: email || user.email,
        lastSeen: new Date(),
      },
    })
  }

  return user
}

export async function getUserByClerkId(clerkId: string) {
  return prisma.user.findUnique({ where: { clerkId } })
}

export async function getUserByCyberId(cyberId: string) {
  return prisma.user.findUnique({ where: { cyberId } })
}
