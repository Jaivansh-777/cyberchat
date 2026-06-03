import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async createUser(data: {
    clerkId: string;
    username: string;
    email: string;
    displayName: string;
    avatar?: string;
    bio?: string;
  }) {
    const existingUser = await this.prisma.user.findUnique({
      where: { username: data.username },
    });

    if (existingUser) {
      data.username = `${data.username}_${Math.random().toString(36).slice(2, 6)}`;
    }

    return this.prisma.user.create({ data });
  }

  async findByClerkId(clerkId: string) {
    const user = await this.prisma.user.findUnique({ where: { clerkId } });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async findById(id: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async findByUsername(username: string) {
    const q = username.replace(/^@/, '').trim().toLowerCase();
    const user = await this.prisma.user.findFirst({
      where: { username: { equals: q, mode: 'insensitive' as any } },
    });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async updateProfile(id: string, data: {
    displayName?: string;
    bio?: string;
    avatar?: string;
    publicKey?: string;
  }) {
    return this.prisma.user.update({
      where: { id },
      data,
    });
  }

  async searchUsers(query: string, excludeId?: string) {
    const q = query.replace(/^@/, '').trim().toLowerCase();

    return this.prisma.user.findMany({
      where: {
        AND: [
          {
            OR: [
              { username: { contains: q, mode: 'insensitive' as any } },
              { displayName: { contains: q, mode: 'insensitive' as any } },
            ],
          },
          excludeId ? { id: { not: excludeId } } : {},
        ],
      },
      take: 10,
      select: {
        id: true,
        username: true,
        displayName: true,
        avatar: true,
        bio: true,
        isOnline: true,
        lastSeen: true,
      },
    });
  }

  async setOnlineStatus(userId: string, isOnline: boolean) {
    return this.prisma.user.update({
      where: { id: userId },
      data: { isOnline, lastSeen: new Date() },
    });
  }
}
