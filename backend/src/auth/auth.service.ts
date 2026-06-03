import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClerkClient, verifyToken } from '@clerk/clerk-sdk-node';
import { PrismaService } from '../common/prisma.service';
import { UsersService } from '../users/users.service';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class AuthService {
  private clerkClient: ReturnType<typeof createClerkClient>;

  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
    private usersService: UsersService,
  ) {
    this.clerkClient = createClerkClient({
      secretKey: this.configService.get('CLERK_SECRET_KEY'),
    });
  }

  async validateClerkSession(sessionId: string) {
    try {
      const session = await verifyToken(sessionId, {
        secretKey: this.configService.get('CLERK_SECRET_KEY'),
      });
      return session;
    } catch {
      throw new UnauthorizedException('Invalid session');
    }
  }

  async webhookHandler(event: any) {
    const { type, data } = event;

    switch (type) {
      case 'user.created':
        return this.handleUserCreated(data);
      case 'user.updated':
        return this.handleUserUpdated(data);
      case 'user.deleted':
        return this.handleUserDeleted(data);
      case 'session.created':
        return this.handleSessionCreated(data);
      case 'session.ended':
        return this.handleSessionEnded(data);
      default:
        return { received: true };
    }
  }

  private async handleUserCreated(data: any) {
    const username = data.username || `user_${uuidv4().slice(0, 8)}`;
    const displayName = data.first_name
      ? `${data.first_name} ${data.last_name || ''}`.trim()
      : username;

    await this.usersService.createUser({
      clerkId: data.id,
      username: `@${username}`,
      email: data.email_addresses[0]?.email_address,
      displayName,
      avatar: data.image_url,
      bio: 'Hey there! I am using CyberChat',
    });
  }

  private async handleUserUpdated(data: any) {
    const username = data.username || data.id;
    await this.prisma.user.update({
      where: { clerkId: data.id },
      data: {
        username: `@${username}`,
        displayName: `${data.first_name || ''} ${data.last_name || ''}`.trim(),
        avatar: data.image_url,
      },
    });
  }

  private async handleUserDeleted(data: any) {
    await this.prisma.user.delete({
      where: { clerkId: data.id },
    });
  }

  private async handleSessionCreated(data: any) {
    await this.prisma.user.update({
      where: { clerkId: data.user_id },
      data: { isOnline: true, lastSeen: new Date() },
    });
  }

  private async handleSessionEnded(data: any) {
    await this.prisma.user.update({
      where: { clerkId: data.user_id },
      data: { isOnline: false, lastSeen: new Date() },
    });
  }
}
