import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { StatusType } from '@prisma/client';

@Injectable()
export class StatusService {
  constructor(private prisma: PrismaService) {}

  async createStatus(userId: string, data: {
    type: StatusType;
    text?: string;
    mediaUrl?: string;
    driveFileId?: string;
  }) {
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    return this.prisma.status.create({
      data: {
        userId,
        type: data.type,
        text: data.text,
        mediaUrl: data.mediaUrl,
        driveFileId: data.driveFileId,
        expiresAt,
      },
      include: {
        user: { select: { id: true, username: true, displayName: true, avatar: true } },
        views: { include: { viewer: { select: { id: true, username: true, displayName: true, avatar: true } } } },
      },
    });
  }

  async getFeed(userId: string) {
    const friendIds = await this.prisma.friend.findMany({
      where: { userId },
      select: { friendId: true },
    });

    const friendIdSet = new Set(friendIds.map((f) => f.friendId));
    friendIdSet.add(userId);

    const statuses = await this.prisma.status.findMany({
      where: {
        userId: { in: Array.from(friendIdSet) },
        expiresAt: { gt: new Date() },
      },
      include: {
        user: { select: { id: true, username: true, displayName: true, avatar: true } },
        views: { select: { viewerId: true, viewedAt: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return statuses.map((s) => ({
      ...s,
      viewedByCurrentUser: s.views.some((v) => v.viewerId === userId),
      viewCount: s.views.length,
      views: undefined,
    }));
  }

  async getMyStatuses(userId: string) {
    return this.prisma.status.findMany({
      where: {
        userId,
        expiresAt: { gt: new Date() },
      },
      include: {
        views: {
          include: { viewer: { select: { id: true, username: true, displayName: true, avatar: true } } },
          orderBy: { viewedAt: 'desc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async viewStatus(statusId: string, viewerId: string) {
    const status = await this.prisma.status.findUnique({ where: { id: statusId } });
    if (!status) throw new NotFoundException('Status not found');

    if (status.userId === viewerId) return { viewed: true };

    const areFriends = await this.prisma.friend.findUnique({
      where: { userId_friendId: { userId: viewerId, friendId: status.userId } },
    });
    if (!areFriends) throw new ForbiddenException('Not friends with this user');

    await this.prisma.statusView.upsert({
      where: { statusId_viewerId: { statusId, viewerId } },
      create: { statusId, viewerId },
      update: { viewedAt: new Date() },
    });

    return { viewed: true };
  }

  async deleteStatus(statusId: string, userId: string) {
    const status = await this.prisma.status.findUnique({ where: { id: statusId } });
    if (!status) throw new NotFoundException('Status not found');
    if (status.userId !== userId) throw new ForbiddenException('Not your status');

    await this.prisma.status.delete({ where: { id: statusId } });
    return { deleted: true };
  }
}
