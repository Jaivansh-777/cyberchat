import { Injectable, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { MessageType } from '@prisma/client';

@Injectable()
export class MessagesService {
  constructor(private prisma: PrismaService) {}

  async sendMessage(data: {
    chatId: string;
    senderId: string;
    encryptedContent?: string;
    messageType: MessageType;
    mediaUrl?: string;
    mediaType?: string;
    replyToId?: string;
  }) {
    const isMember = await this.prisma.chatMember.findUnique({
      where: { chatId_userId: { chatId: data.chatId, userId: data.senderId } },
    });

    if (!isMember) throw new ForbiddenException('Not a member of this chat');

    const message = await this.prisma.message.create({
      data,
      include: {
        sender: { select: { id: true, username: true, displayName: true, avatar: true } },
        replyTo: {
          select: { id: true, encryptedContent: true, sender: { select: { id: true, username: true, displayName: true } } },
        },
      },
    });

    await this.prisma.chat.update({
      where: { id: data.chatId },
      data: { updatedAt: new Date() },
    });

    await this.prisma.message.update({
      where: { id: message.id },
      data: { status: 'DELIVERED' },
    });

    return message;
  }

  async getMessages(chatId: string, userId: string, cursor?: string, limit = 50) {
    const isMember = await this.prisma.chatMember.findUnique({
      where: { chatId_userId: { chatId, userId } },
    });

    if (!isMember) throw new ForbiddenException('Not a member of this chat');

    const messages = await this.prisma.message.findMany({
      where: {
        chatId,
        isDeleted: false,
      },
      take: limit,
      ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
      orderBy: { createdAt: 'desc' },
      include: {
        sender: { select: { id: true, username: true, displayName: true, avatar: true } },
        replyTo: {
          select: { id: true, encryptedContent: true, messageType: true, sender: { select: { id: true, username: true, displayName: true } } },
        },
        reactions: {
          include: { user: { select: { id: true, username: true, displayName: true } } },
        },
        pinnedBy: { take: 1 },
      },
    });

    return messages;
  }

  async editMessage(messageId: string, userId: string, encryptedContent: string) {
    const message = await this.prisma.message.findUnique({ where: { id: messageId } });
    if (!message || message.senderId !== userId) {
      throw new ForbiddenException('Cannot edit this message');
    }

    return this.prisma.message.update({
      where: { id: messageId },
      data: { encryptedContent, editedAt: new Date() },
    });
  }

  async deleteMessage(messageId: string, userId: string, deleteForEveryone = false) {
    const message = await this.prisma.message.findUnique({ where: { id: messageId } });
    if (!message) throw new ForbiddenException('Message not found');

    if (deleteForEveryone && message.senderId !== userId) {
      throw new ForbiddenException('Cannot delete for everyone');
    }

    if (deleteForEveryone) {
      return this.prisma.message.update({
        where: { id: messageId },
        data: { isDeleted: true, encryptedContent: null },
      });
    }

    return { deleted: true };
  }

  async addReaction(messageId: string, userId: string, emoji: string) {
    return this.prisma.messageReaction.upsert({
      where: { messageId_userId_emoji: { messageId, userId, emoji } },
      create: { messageId, userId, emoji },
      update: {},
    });
  }

  async removeReaction(messageId: string, userId: string, emoji: string) {
    return this.prisma.messageReaction.delete({
      where: { messageId_userId_emoji: { messageId, userId, emoji } },
    });
  }

  async pinMessage(chatId: string, messageId: string, userId: string) {
    return this.prisma.pinnedMessage.create({
      data: { chatId, messageId, pinnedBy: userId },
    });
  }

  async unpinMessage(chatId: string, messageId: string) {
    return this.prisma.pinnedMessage.delete({
      where: { chatId_messageId: { chatId, messageId } },
    });
  }

  async forwardMessage(originalMsgId: string, targetChatId: string, forwardedById: string) {
    const original = await this.prisma.message.findUnique({ where: { id: originalMsgId } });
    if (!original) throw new ForbiddenException('Message not found');

    const forwarded = await this.prisma.message.create({
      data: {
        chatId: targetChatId,
        senderId: forwardedById,
        encryptedContent: original.encryptedContent,
        mediaUrl: original.mediaUrl,
        mediaType: original.mediaType,
        messageType: original.messageType,
      },
    });

    return forwarded;
  }

  async markAsRead(chatId: string, userId: string) {
    await this.prisma.message.updateMany({
      where: {
        chatId,
        senderId: { not: userId },
        status: { not: 'READ' },
      },
      data: { status: 'READ' },
    });

    return { success: true };
  }
}
