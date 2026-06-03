import { Controller, Get, Post, Param, Body, UseGuards, Req } from '@nestjs/common';
import { ChatsService } from './chats.service';
import { ClerkAuthGuard } from '../common/clerk-auth.guard';
import { UsersService } from '../users/users.service';

@Controller('chats')
@UseGuards(ClerkAuthGuard)
export class ChatsController {
  constructor(
    private chatsService: ChatsService,
    private usersService: UsersService,
  ) {}

  @Get()
  async getChats(@Req() req: any) {
    const user = await this.usersService.findByClerkId(req.user.sub);
    return this.chatsService.getUserChats(user.id);
  }

  @Post('private')
  async createPrivateChat(@Req() req: any, @Body('userId') targetUserId: string) {
    const user = await this.usersService.findByClerkId(req.user.sub);
    return this.chatsService.getOrCreatePrivateChat(user.id, targetUserId);
  }

  @Get(':id')
  async getChat(@Param('id') id: string, @Req() req: any) {
    const user = await this.usersService.findByClerkId(req.user.sub);
    return this.chatsService.getChatById(id, user.id);
  }
}
