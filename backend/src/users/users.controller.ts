import { Controller, Get, Put, Body, Param, Query, UseGuards, Req } from '@nestjs/common';
import { UsersService } from './users.service';
import { ClerkAuthGuard } from '../common/clerk-auth.guard';

@Controller('users')
@UseGuards(ClerkAuthGuard)
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get('me')
  async getMe(@Req() req: any) {
    return this.usersService.findByClerkId(req.user.sub);
  }

  @Put('profile')
  async updateProfile(@Req() req: any, @Body() body: any) {
    const user = await this.usersService.findByClerkId(req.user.sub);
    return this.usersService.updateProfile(user.id, body);
  }

  @Get('search')
  async search(@Query('q') query: string, @Req() req: any) {
    const user = await this.usersService.findByClerkId(req.user.sub);
    return this.usersService.searchUsers(query, user.id);
  }

  @Get(':id')
  async getUser(@Param('id') id: string) {
    return this.usersService.findById(id);
  }

  @Get('username/:username')
  async getUserByUsername(@Param('username') username: string) {
    return this.usersService.findByUsername(username);
  }
}
