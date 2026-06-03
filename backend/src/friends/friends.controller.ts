import { Controller, Get, Post, Delete, Body, Param, UseGuards, Req } from '@nestjs/common';
import { FriendsService } from './friends.service';
import { ClerkAuthGuard } from '../common/clerk-auth.guard';
import { UsersService } from '../users/users.service';

@Controller('friends')
@UseGuards(ClerkAuthGuard)
export class FriendsController {
  constructor(
    private friendsService: FriendsService,
    private usersService: UsersService,
  ) {}

  @Get()
  async getFriends(@Req() req: any) {
    const user = await this.usersService.findByClerkId(req.user.sub);
    return this.friendsService.getFriends(user.id);
  }

  @Get('requests/incoming')
  async getIncomingRequests(@Req() req: any) {
    const user = await this.usersService.findByClerkId(req.user.sub);
    return this.friendsService.getIncomingRequests(user.id);
  }

  @Get('requests/sent')
  async getSentRequests(@Req() req: any) {
    const user = await this.usersService.findByClerkId(req.user.sub);
    return this.friendsService.getSentRequests(user.id);
  }

  @Post('request')
  async sendRequest(@Req() req: any, @Body('receiverId') receiverId: string) {
    const user = await this.usersService.findByClerkId(req.user.sub);
    return this.friendsService.sendRequest(user.id, receiverId);
  }

  @Post('accept/:requestId')
  async acceptRequest(@Req() req: any, @Param('requestId') requestId: string) {
    const user = await this.usersService.findByClerkId(req.user.sub);
    return this.friendsService.acceptRequest(requestId, user.id);
  }

  @Post('reject/:requestId')
  async rejectRequest(@Req() req: any, @Param('requestId') requestId: string) {
    const user = await this.usersService.findByClerkId(req.user.sub);
    return this.friendsService.rejectRequest(requestId, user.id);
  }

  @Post('cancel/:requestId')
  async cancelRequest(@Req() req: any, @Param('requestId') requestId: string) {
    const user = await this.usersService.findByClerkId(req.user.sub);
    return this.friendsService.cancelRequest(requestId, user.id);
  }

  @Delete(':friendId')
  async removeFriend(@Req() req: any, @Param('friendId') friendId: string) {
    const user = await this.usersService.findByClerkId(req.user.sub);
    return this.friendsService.removeFriend(user.id, friendId);
  }

  @Get('mutual/:userId')
  async getMutualFriends(@Req() req: any, @Param('userId') otherUserId: string) {
    const user = await this.usersService.findByClerkId(req.user.sub);
    return this.friendsService.getMutualFriendsCount(user.id, otherUserId);
  }
}
