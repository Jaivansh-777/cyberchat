import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards, Req } from '@nestjs/common';
import { MessagesService } from './messages.service';
import { ClerkAuthGuard } from '../common/clerk-auth.guard';
import { UsersService } from '../users/users.service';

@Controller('messages')
@UseGuards(ClerkAuthGuard)
export class MessagesController {
  constructor(
    private messagesService: MessagesService,
    private usersService: UsersService,
  ) {}

  @Get('chat/:chatId')
  async getMessages(
    @Param('chatId') chatId: string,
    @Query('cursor') cursor: string,
    @Req() req: any,
  ) {
    const user = await this.usersService.findByClerkId(req.user.sub);
    return this.messagesService.getMessages(chatId, user.id, cursor);
  }

  @Post()
  async sendMessage(@Req() req: any, @Body() body: any) {
    const user = await this.usersService.findByClerkId(req.user.sub);
    return this.messagesService.sendMessage({
      ...body,
      senderId: user.id,
    });
  }

  @Patch(':id')
  async editMessage(@Param('id') id: string, @Req() req: any, @Body('content') content: string) {
    const user = await this.usersService.findByClerkId(req.user.sub);
    return this.messagesService.editMessage(id, user.id, content);
  }

  @Delete(':id')
  async deleteMessage(
    @Param('id') id: string,
    @Req() req: any,
    @Query('forEveryone') forEveryone: string,
  ) {
    const user = await this.usersService.findByClerkId(req.user.sub);
    return this.messagesService.deleteMessage(id, user.id, forEveryone === 'true');
  }

  @Post(':id/reactions')
  async addReaction(@Param('id') id: string, @Req() req: any, @Body('emoji') emoji: string) {
    const user = await this.usersService.findByClerkId(req.user.sub);
    return this.messagesService.addReaction(id, user.id, emoji);
  }

  @Delete(':id/reactions')
  async removeReaction(@Param('id') id: string, @Req() req: any, @Body('emoji') emoji: string) {
    const user = await this.usersService.findByClerkId(req.user.sub);
    return this.messagesService.removeReaction(id, user.id, emoji);
  }

  @Post(':id/pin')
  async pinMessage(@Param('id') id: string, @Req() req: any, @Body('chatId') chatId: string) {
    const user = await this.usersService.findByClerkId(req.user.sub);
    return this.messagesService.pinMessage(chatId, id, user.id);
  }

  @Post('forward')
  async forwardMessage(@Req() req: any, @Body() body: { messageId: string; chatId: string }) {
    const user = await this.usersService.findByClerkId(req.user.sub);
    return this.messagesService.forwardMessage(body.messageId, body.chatId, user.id);
  }

  @Post('read/:chatId')
  async markAsRead(@Param('chatId') chatId: string, @Req() req: any) {
    const user = await this.usersService.findByClerkId(req.user.sub);
    return this.messagesService.markAsRead(chatId, user.id);
  }
}
