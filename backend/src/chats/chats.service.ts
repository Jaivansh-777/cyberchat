import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { ChatType } from '@prisma/client';

@Injectable()
export class ChatsService {
  constructor(private prisma: PrismaService) {}

  async getOrCreatePrivateChat(userId1: string, userId2: string) {
    if (userId1 === userId2) {
      throw new BadRequestException('Cannot create chat with yourself');
    }

    const existingChat = await this.prisma.chat.findFirst({
      where: {
        type: ChatType.PRIVATE,
        AND: [
          { members: { some: { userId: userId1 } } },
          { members: { some: { userId: userId2 } } },
        ],
      },
      include: {
        members: {
          include: { user: { select: { id: true, username: true, displayName: true, avatar: true, isOnline: true, lastSeen: true } } },
        },
        messages: {
          take: 1,
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (existingChat) return existingChat;

    const chat = await this.prisma.chat.create({
      data: {
        type: ChatType.PRIVATE,
        members: {
          createMany: {
            data: [
              { userId: userId1 },
              { userId: userId2 },
            ],
          },
        },
      },
      include: {
        members: {
          include: { user: { select: { id: true, username: true, displayName: true, avatar: true, isOnline: true, lastSeen: true } } },
        },
      },
    });

    return chat;
  }

  async getUserChats(userId: string) {
    return this.prisma.chat.findMany({
      where: {
        members: { some: { userId } },
      },
      include: {
        members: {
          include: { user: { select: { id: true, username: true, displayName: true, avatar: true, isOnline: true, lastSeen: true } } },
        },
        messages: {
          take: 1,
          orderBy: { createdAt: 'desc' },
          include: {
            sender: { select: { id: true, username: true, displayName: true } },
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async getChatById(chatId: string, userId: string) {
    const chat = await this.prisma.chat.findFirst({
      where: {
        id: chatId,
        members: { some: { userId } },
      },
      include: {
        members: {
          include: { user: { select: { id: true, username: true, displayName: true, avatar: true, isOnline: true, lastSeen: true } } },
        },
        pinnedMessages: {
          include: {
            message: true,
            user: { select: { id: true, username: true, displayName: true } },
          },
        },
      },
    });

    if (!chat) throw new NotFoundException('Chat not found');
    return chat;
  }
}
