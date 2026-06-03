import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../common/prisma.service';
import { StreamChat } from 'stream-chat';
import { CallType, CallStatus } from '@prisma/client';

@Injectable()
export class CallsService {
  private streamClient: StreamChat;

  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
  ) {
    const apiKey = this.configService.get<string>('STREAM_API_KEY') || '';
    const apiSecret = this.configService.get<string>('STREAM_API_SECRET') || '';
    this.streamClient = new StreamChat(apiKey, apiSecret);
  }

  async generateToken(userId: string) {
    const token = this.streamClient.createToken(userId);
    return { token, apiKey: this.configService.get('STREAM_API_KEY') };
  }

  async initiateCall(data: {
    callerId: string;
    receiverId: string;
    type: CallType;
  }) {
    const callId = `call_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

    const callLog = await this.prisma.callLog.create({
      data: {
        callerId: data.callerId,
        receiverId: data.receiverId,
        type: data.type,
        status: CallStatus.INITIATED,
        streamCallId: callId,
      },
    });

    return { ...callLog, streamCallId: callId };
  }

  async updateCallStatus(callId: string, status: CallStatus, duration?: number) {
    return this.prisma.callLog.update({
      where: { id: callId },
      data: { status, ...(duration ? { duration } : {}) },
    });
  }

  async getCallHistory(userId: string) {
    return this.prisma.callLog.findMany({
      where: {
        OR: [{ callerId: userId }, { receiverId: userId }],
      },
      include: {
        caller: { select: { id: true, username: true, displayName: true, avatar: true } },
        receiver: { select: { id: true, username: true, displayName: true, avatar: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }
}
