import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { ConfigService } from '@nestjs/config';
import { verifyToken } from '@clerk/clerk-sdk-node';
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';

interface AuthenticatedSocket extends Socket {
  userId?: string;
  username?: string;
}

@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  },
  namespace: '/ws',
  transports: ['websocket', 'polling'],
})
export class GatewayService implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private onlineUsers = new Map<string, Set<string>>();

  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
  ) {}

  async handleConnection(client: AuthenticatedSocket) {
    const token = client.handshake.auth?.token || client.handshake.query?.token;
    if (!token) {
      client.disconnect();
      return;
    }

    try {
      const payload = await verifyToken(token as string, {
        secretKey: this.configService.get('CLERK_SECRET_KEY'),
      });
      client.userId = payload.sub;

      client.join(`user:${client.userId}`);

      if (!this.onlineUsers.has(client.userId)) {
        this.onlineUsers.set(client.userId, new Set());
      }
      this.onlineUsers.get(client.userId)!.add(client.id);

      this.server.emit('user:online', { userId: client.userId });
    } catch {
      client.disconnect();
    }
  }

  handleDisconnect(client: AuthenticatedSocket) {
    if (client.userId) {
      const sessions = this.onlineUsers.get(client.userId);
      if (sessions) {
        sessions.delete(client.id);
        if (sessions.size === 0) {
          this.onlineUsers.delete(client.userId);
          this.server.emit('user:offline', { userId: client.userId });
        }
      }
    }
  }

  @SubscribeMessage('message:send')
  async handleMessage(@ConnectedSocket() client: AuthenticatedSocket, @MessageBody() data: any) {
    const { chatId, encryptedContent, messageType, mediaUrl, mediaType, replyToId } = data;
    const clerkId = client.userId;

    try {
      const user = await this.prisma.user.findUnique({ where: { clerkId } });
      if (!user) return;

      const isMember = await this.prisma.chatMember.findUnique({
        where: { chatId_userId: { chatId, userId: user.id } },
      });
      if (!isMember) return;

      const message = await this.prisma.message.create({
        data: {
          chatId,
          senderId: user.id,
          encryptedContent,
          messageType: (messageType as any) || 'TEXT',
          mediaUrl,
          mediaType,
          replyToId,
          status: 'SENT',
        },
        include: {
          sender: { select: { id: true, username: true, displayName: true, avatar: true } },
          replyTo: {
            select: { id: true, encryptedContent: true, sender: { select: { id: true, username: true, displayName: true } } },
          },
        },
      });

      await this.prisma.chat.update({
        where: { id: chatId },
        data: { updatedAt: new Date() },
      });

      this.server.to(`chat:${chatId}`).emit('message:new', message);

      setTimeout(async () => {
        try {
          await this.prisma.message.update({
            where: { id: message.id },
            data: { status: 'DELIVERED' },
          });
          this.server.to(`chat:${chatId}`).emit('message:status', {
            chatId,
            messageId: message.id,
            status: 'DELIVERED',
          });
        } catch {}
      }, 500);
    } catch (err) {
      console.error('Failed to save message:', err);
    }
  }

  @SubscribeMessage('chat:join')
  handleJoinChat(@ConnectedSocket() client: AuthenticatedSocket, @MessageBody() chatId: string) {
    client.join(`chat:${chatId}`);
  }

  @SubscribeMessage('chat:leave')
  handleLeaveChat(@ConnectedSocket() client: AuthenticatedSocket, @MessageBody() chatId: string) {
    client.leave(`chat:${chatId}`);
  }

  @SubscribeMessage('typing:start')
  handleTypingStart(@ConnectedSocket() client: AuthenticatedSocket, @MessageBody() data: { chatId: string }) {
    client.to(`chat:${data.chatId}`).emit('typing:start', { userId: client.userId, chatId: data.chatId });
  }

  @SubscribeMessage('typing:stop')
  handleTypingStop(@ConnectedSocket() client: AuthenticatedSocket, @MessageBody() data: { chatId: string }) {
    client.to(`chat:${data.chatId}`).emit('typing:stop', { userId: client.userId, chatId: data.chatId });
  }

  @SubscribeMessage('message:read')
  handleMessageRead(@ConnectedSocket() client: AuthenticatedSocket, @MessageBody() data: { chatId: string; messageId: string }) {
    this.server.to(`chat:${data.chatId}`).emit('message:read', {
      userId: client.userId,
      chatId: data.chatId,
      messageId: data.messageId,
    });
  }

  @SubscribeMessage('message:reaction')
  handleReaction(@ConnectedSocket() client: AuthenticatedSocket, @MessageBody() data: any) {
    this.server.to(`chat:${data.chatId}`).emit('message:reaction', {
      userId: client.userId,
      ...data,
    });
  }

  @SubscribeMessage('call:signal')
  async handleCallSignal(@ConnectedSocket() client: AuthenticatedSocket, @MessageBody() data: any) {
    let dbUserId = client.userId;
    try {
      const user = await this.prisma.user.findUnique({ where: { clerkId: client.userId } });
      if (user) dbUserId = user.id;
    } catch {}
    this.server.to(`user:${data.targetUserId}`).emit('call:incoming', {
      fromUserId: dbUserId,
      callerDisplayName: data.callerName,
      callerAvatar: data.callerAvatar,
      streamCallId: data.streamCallId,
      callId: data.callId,
      callType: data.callType,
      callerName: data.callerName,
    });
  }

  @SubscribeMessage('call:accept')
  async handleCallAccept(@ConnectedSocket() client: AuthenticatedSocket, @MessageBody() data: any) {
    if (data.callId) {
      try {
        await this.prisma.callLog.update({
          where: { id: data.callId },
          data: { status: 'CONNECTED' },
        });
      } catch {}
    }
    let dbUserId = client.userId;
    try {
      const user = await this.prisma.user.findUnique({ where: { clerkId: client.userId } });
      if (user) dbUserId = user.id;
    } catch {}
    this.server.to(`user:${data.targetUserId}`).emit('call:accepted', {
      userId: dbUserId,
      ...data,
    });
  }

  @SubscribeMessage('call:end')
  async handleCallEnd(@ConnectedSocket() client: AuthenticatedSocket, @MessageBody() data: any) {
    if (data.callId) {
      try {
        await this.prisma.callLog.update({
          where: { id: data.callId },
          data: { status: 'COMPLETED', duration: data.duration },
        });
      } catch {}
    }
    this.server.to(`user:${data.targetUserId}`).emit('call:ended', {
      userId: client.userId,
      ...data,
    });
  }

  @SubscribeMessage('call:missed')
  async handleCallMissed(@ConnectedSocket() client: AuthenticatedSocket, @MessageBody() data: any) {
    if (data.callId) {
      try {
        await this.prisma.callLog.update({
          where: { id: data.callId },
          data: { status: 'MISSED' },
        });
      } catch {}
    }
    this.server.to(`user:${data.targetUserId}`).emit('call:missed', {
      userId: client.userId,
      ...data,
    });
  }

  @SubscribeMessage('message:deleted')
  handleMessageDeleted(@ConnectedSocket() client: AuthenticatedSocket, @MessageBody() data: any) {
    const { chatId, messageId, forEveryone } = data;
    this.server.to(`chat:${chatId}`).emit('message:deleted', {
      chatId,
      messageId,
      forEveryone: !!forEveryone,
    });
  }

  @SubscribeMessage('message:status')
  handleMessageStatusUpdate(@ConnectedSocket() client: AuthenticatedSocket, @MessageBody() data: any) {
    const { chatId, messageId, status } = data;
    this.server.to(`chat:${chatId}`).emit('message:status', {
      chatId,
      messageId,
      status,
    });
  }

  sendToUser(userId: string, event: string, data: any) {
    this.server.to(`user:${userId}`).emit(event, data);
  }

  sendToChat(chatId: string, event: string, data: any) {
    this.server.to(`chat:${chatId}`).emit(event, data);
  }

  isUserOnline(userId: string): boolean {
    return this.onlineUsers.has(userId) && this.onlineUsers.get(userId)!.size > 0;
  }
}
