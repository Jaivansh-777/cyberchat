import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';

@Injectable()
export class SearchService {
  constructor(private prisma: PrismaService) {}

  async searchAll(query: string, userId: string) {
    const [users, messages, groups] = await Promise.all([
      this.searchUsers(query, userId),
      this.searchMessages(query, userId),
      this.searchGroups(query, userId),
    ]);

    return { users, messages, groups };
  }

  async searchUsers(query: string, userId: string) {
    return this.prisma.user.findMany({
      where: {
        AND: [
          { id: { not: userId } },
          {
            OR: [
              { username: { contains: query, mode: 'insensitive' } },
              { displayName: { contains: query, mode: 'insensitive' } },
              { email: { contains: query, mode: 'insensitive' } },
            ],
          },
        ],
      },
      select: {
        id: true,
        username: true,
        displayName: true,
        avatar: true,
        bio: true,
        isOnline: true,
        lastSeen: true,
      },
      take: 20,
    });
  }

  async searchMessages(query: string, userId: string) {
    return this.prisma.message.findMany({
      where: {
        AND: [
          { isDeleted: false },
          {
            chat: {
              members: { some: { userId } },
            },
          },
          {
            encryptedContent: { contains: query, mode: 'insensitive' },
          },
        ],
      },
      include: {
        sender: { select: { id: true, username: true, displayName: true } },
        chat: {
          select: { id: true, type: true, members: { take: 2, include: { user: { select: { id: true, username: true, displayName: true } } } } },
        },
      },
      take: 50,
      orderBy: { createdAt: 'desc' },
    });
  }

  async searchGroups(query: string, userId: string) {
    return this.prisma.group.findMany({
      where: {
        AND: [
          { members: { some: { userId } } },
          {
            OR: [
              { name: { contains: query, mode: 'insensitive' } },
              { description: { contains: query, mode: 'insensitive' } },
            ],
          },
        ],
      },
      include: {
        members: { take: 5, include: { user: { select: { id: true, username: true, displayName: true, avatar: true } } } },
        owner: { select: { id: true, username: true, displayName: true } },
      },
      take: 20,
    });
  }

  async searchMedia(chatId: string, mediaType?: string) {
    const where: any = { chatId, isDeleted: false };
    if (mediaType) {
      where.messageType = mediaType;
    } else {
      where.messageType = { in: ['IMAGE', 'VIDEO', 'AUDIO', 'DOCUMENT', 'PDF', 'VOICE_NOTE'] };
    }

    return this.prisma.message.findMany({
      where,
      select: {
        id: true,
        mediaUrl: true,
        mediaType: true,
        messageType: true,
        createdAt: true,
        sender: { select: { id: true, username: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
  }
}
