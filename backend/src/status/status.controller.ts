import { Controller, Get, Post, Delete, Body, Param, UseGuards, Req } from '@nestjs/common';
import { StatusService } from './status.service';
import { ClerkAuthGuard } from '../common/clerk-auth.guard';
import { UsersService } from '../users/users.service';

@Controller('status')
@UseGuards(ClerkAuthGuard)
export class StatusController {
  constructor(
    private statusService: StatusService,
    private usersService: UsersService,
  ) {}

  @Post('create')
  async createStatus(@Req() req: any, @Body() body: any) {
    const user = await this.usersService.findByClerkId(req.user.sub);
    return this.statusService.createStatus(user.id, body);
  }

  @Get('feed')
  async getFeed(@Req() req: any) {
    const user = await this.usersService.findByClerkId(req.user.sub);
    return this.statusService.getFeed(user.id);
  }

  @Get('my')
  async getMyStatuses(@Req() req: any) {
    const user = await this.usersService.findByClerkId(req.user.sub);
    return this.statusService.getMyStatuses(user.id);
  }

  @Post('view/:id')
  async viewStatus(@Req() req: any, @Param('id') id: string) {
    const user = await this.usersService.findByClerkId(req.user.sub);
    return this.statusService.viewStatus(id, user.id);
  }

  @Delete(':id')
  async deleteStatus(@Req() req: any, @Param('id') id: string) {
    const user = await this.usersService.findByClerkId(req.user.sub);
    return this.statusService.deleteStatus(id, user.id);
  }
}
