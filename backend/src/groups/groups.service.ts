import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { MemberRole } from '@prisma/client';

@Injectable()
export class GroupsService {
  constructor(private prisma: PrismaService) {}

  async createGroup(data: {
    name: string;
    description?: string;
    icon?: string;
    ownerId: string;
    memberIds: string[];
  }) {
    const uniqueMembers = [...new Set([data.ownerId, ...data.memberIds])];

    const group = await this.prisma.group.create({
      data: {
        name: data.name,
        description: data.description,
        icon: data.icon,
        ownerId: data.ownerId,
        members: {
          createMany: {
            data: uniqueMembers.map((userId) => ({
              userId,
              role: userId === data.ownerId ? MemberRole.OWNER : MemberRole.MEMBER,
            })),
          },
        },
      },
      include: {
        members: {
          include: { user: { select: { id: true, username: true, displayName: true, avatar: true } } },
        },
      },
    });

    await this.prisma.chat.create({
      data: {
        type: 'GROUP',
        members: {
          createMany: {
            data: uniqueMembers.map((userId) => ({ userId })),
          },
        },
      },
    });

    return group;
  }

  async getUserGroups(userId: string) {
    return this.prisma.group.findMany({
      where: { members: { some: { userId } } },
      include: {
        members: {
          include: { user: { select: { id: true, username: true, displayName: true, avatar: true, isOnline: true } } },
        },
        owner: { select: { id: true, username: true, displayName: true } },
      },
    });
  }

  async getGroupById(groupId: string, userId: string) {
    const group = await this.prisma.group.findFirst({
      where: {
        id: groupId,
        members: { some: { userId } },
      },
      include: {
        members: {
          include: { user: { select: { id: true, username: true, displayName: true, avatar: true, isOnline: true } } },
        },
        owner: { select: { id: true, username: true, displayName: true } },
      },
    });

    if (!group) throw new NotFoundException('Group not found');
    return group;
  }

  async updateGroup(groupId: string, userId: string, data: { name?: string; description?: string; icon?: string }) {
    await this.checkAdminAccess(groupId, userId);
    return this.prisma.group.update({ where: { id: groupId }, data });
  }

  async addMember(groupId: string, userId: string, targetUserId: string) {
    await this.checkAdminAccess(groupId, userId);
    const existing = await this.prisma.groupMember.findUnique({
      where: { groupId_userId: { groupId, userId: targetUserId } },
    });
    if (existing) throw new BadRequestException('User is already a member');

    return this.prisma.groupMember.create({
      data: { groupId, userId: targetUserId, role: MemberRole.MEMBER },
    });
  }

  async removeMember(groupId: string, userId: string, targetUserId: string) {
    await this.checkAdminAccess(groupId, userId);
    return this.prisma.groupMember.delete({
      where: { groupId_userId: { groupId, userId: targetUserId } },
    });
  }

  async updateMemberRole(groupId: string, userId: string, targetUserId: string, role: MemberRole) {
    const group = await this.prisma.group.findUnique({ where: { id: groupId } });
    if (!group) throw new NotFoundException('Group not found');

    if (group.ownerId !== userId) {
      throw new ForbiddenException('Only the owner can change roles');
    }

    return this.prisma.groupMember.update({
      where: { groupId_userId: { groupId, userId: targetUserId } },
      data: { role },
    });
  }

  async transferOwnership(groupId: string, userId: string, newOwnerId: string) {
    const group = await this.prisma.group.findUnique({ where: { id: groupId } });
    if (!group) throw new NotFoundException('Group not found');
    if (group.ownerId !== userId) throw new ForbiddenException('Only the owner can transfer ownership');

    await this.prisma.$transaction([
      this.prisma.groupMember.update({
        where: { groupId_userId: { groupId, userId: group.ownerId } },
        data: { role: MemberRole.ADMIN },
      }),
      this.prisma.groupMember.update({
        where: { groupId_userId: { groupId, userId: newOwnerId } },
        data: { role: MemberRole.OWNER },
      }),
      this.prisma.group.update({
        where: { id: groupId },
        data: { ownerId: newOwnerId },
      }),
    ]);

    return { success: true };
  }

  private async checkAdminAccess(groupId: string, userId: string) {
    const member = await this.prisma.groupMember.findUnique({
      where: { groupId_userId: { groupId, userId } },
    });
    if (!member || (member.role !== MemberRole.OWNER && member.role !== MemberRole.ADMIN && member.role !== MemberRole.MODERATOR)) {
      throw new ForbiddenException('Insufficient permissions');
    }
  }
}
