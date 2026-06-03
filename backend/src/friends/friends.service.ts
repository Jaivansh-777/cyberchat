import { Injectable, ConflictException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';

@Injectable()
export class FriendsService {
  constructor(private prisma: PrismaService) {}

  async sendRequest(senderId: string, receiverId: string) {
    if (senderId === receiverId) {
      throw new ForbiddenException('Cannot send friend request to yourself');
    }

    const existing = await this.prisma.friendRequest.findUnique({
      where: { senderId_receiverId: { senderId, receiverId } },
    });

    if (existing) {
      throw new ConflictException('Friend request already exists');
    }

    const reverse = await this.prisma.friendRequest.findUnique({
      where: { senderId_receiverId: { senderId: receiverId, receiverId: senderId } },
    });

    if (reverse) {
      if (reverse.status === 'PENDING') {
        await this.acceptRequest(reverse.id, receiverId);
        return { accepted: true };
      }
      throw new ConflictException('Friend request already exists');
    }

    const alreadyFriends = await this.prisma.friend.findUnique({
      where: { userId_friendId: { userId: senderId, friendId: receiverId } },
    });

    if (alreadyFriends) {
      throw new ConflictException('Already friends');
    }

    return this.prisma.friendRequest.create({
      data: { senderId, receiverId, status: 'PENDING' },
      include: {
        sender: { select: { id: true, username: true, displayName: true, avatar: true, isOnline: true } },
        receiver: { select: { id: true, username: true, displayName: true, avatar: true, isOnline: true } },
      },
    });
  }

  async acceptRequest(requestId: string, userId: string) {
    const request = await this.prisma.friendRequest.findUnique({ where: { id: requestId } });

    if (!request) throw new NotFoundException('Request not found');
    if (request.receiverId !== userId) throw new ForbiddenException('Not your request');

    await this.prisma.friend.create({
      data: { userId: request.senderId, friendId: request.receiverId },
    });

    await this.prisma.friend.create({
      data: { userId: request.receiverId, friendId: request.senderId },
    });

    return this.prisma.friendRequest.update({
      where: { id: requestId },
      data: { status: 'ACCEPTED' },
      include: {
        sender: { select: { id: true, username: true, displayName: true, avatar: true, isOnline: true } },
        receiver: { select: { id: true, username: true, displayName: true, avatar: true, isOnline: true } },
      },
    });
  }

  async rejectRequest(requestId: string, userId: string) {
    const request = await this.prisma.friendRequest.findUnique({ where: { id: requestId } });

    if (!request) throw new NotFoundException('Request not found');
    if (request.receiverId !== userId) throw new ForbiddenException('Not your request');

    return this.prisma.friendRequest.update({
      where: { id: requestId },
      data: { status: 'REJECTED' },
    });
  }

  async cancelRequest(requestId: string, userId: string) {
    const request = await this.prisma.friendRequest.findUnique({ where: { id: requestId } });

    if (!request) throw new NotFoundException('Request not found');
    if (request.senderId !== userId) throw new ForbiddenException('Not your request');

    return this.prisma.friendRequest.delete({ where: { id: requestId } });
  }

  async getFriends(userId: string) {
    const friends = await this.prisma.friend.findMany({
      where: { userId },
      include: {
        friend: {
          select: { id: true, username: true, displayName: true, avatar: true, bio: true, isOnline: true, lastSeen: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return friends.map((f) => ({
      ...f.friend,
      friendshipId: f.id,
      addedAt: f.createdAt,
    }));
  }

  async getIncomingRequests(userId: string) {
    return this.prisma.friendRequest.findMany({
      where: { receiverId: userId, status: 'PENDING' },
      include: {
        sender: { select: { id: true, username: true, displayName: true, avatar: true, isOnline: true, bio: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getSentRequests(userId: string) {
    return this.prisma.friendRequest.findMany({
      where: { senderId: userId, status: 'PENDING' },
      include: {
        receiver: { select: { id: true, username: true, displayName: true, avatar: true, isOnline: true, bio: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async removeFriend(userId: string, friendId: string) {
    await this.prisma.friend.deleteMany({
      where: {
        OR: [
          { userId, friendId },
          { userId: friendId, friendId: userId },
        ],
      },
    });

    return { success: true };
  }

  async getMutualFriendsCount(userId: string, otherUserId: string) {
    const userFriends = await this.prisma.friend.findMany({
      where: { userId },
      select: { friendId: true },
    });

    const otherFriends = await this.prisma.friend.findMany({
      where: { userId: otherUserId },
      select: { friendId: true },
    });

    const userFriendIds = new Set(userFriends.map((f) => f.friendId));
    const mutual = otherFriends.filter((f) => userFriendIds.has(f.friendId));

    return { count: mutual.length };
  }
}
