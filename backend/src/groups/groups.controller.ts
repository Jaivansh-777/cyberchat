import { Controller, Get, Post, Put, Patch, Delete, Body, Param, UseGuards, Req } from '@nestjs/common';
import { GroupsService } from './groups.service';
import { ClerkAuthGuard } from '../common/clerk-auth.guard';
import { UsersService } from '../users/users.service';

@Controller('groups')
@UseGuards(ClerkAuthGuard)
export class GroupsController {
  constructor(
    private groupsService: GroupsService,
    private usersService: UsersService,
  ) {}

  @Get()
  async getGroups(@Req() req: any) {
    const user = await this.usersService.findByClerkId(req.user.sub);
    return this.groupsService.getUserGroups(user.id);
  }

  @Post()
  async createGroup(@Req() req: any, @Body() body: any) {
    const user = await this.usersService.findByClerkId(req.user.sub);
    return this.groupsService.createGroup({ ...body, ownerId: user.id });
  }

  @Get(':id')
  async getGroup(@Param('id') id: string, @Req() req: any) {
    const user = await this.usersService.findByClerkId(req.user.sub);
    return this.groupsService.getGroupById(id, user.id);
  }

  @Put(':id')
  async updateGroup(@Param('id') id: string, @Req() req: any, @Body() body: any) {
    const user = await this.usersService.findByClerkId(req.user.sub);
    return this.groupsService.updateGroup(id, user.id, body);
  }

  @Post(':id/members')
  async addMember(@Param('id') id: string, @Req() req: any, @Body('userId') targetUserId: string) {
    const user = await this.usersService.findByClerkId(req.user.sub);
    return this.groupsService.addMember(id, user.id, targetUserId);
  }

  @Delete(':id/members/:userId')
  async removeMember(@Param('id') id: string, @Param('userId') targetUserId: string, @Req() req: any) {
    const user = await this.usersService.findByClerkId(req.user.sub);
    return this.groupsService.removeMember(id, user.id, targetUserId);
  }

  @Patch(':id/members/:userId/role')
  async updateRole(
    @Param('id') id: string,
    @Param('userId') targetUserId: string,
    @Req() req: any,
    @Body('role') role: any,
  ) {
    const user = await this.usersService.findByClerkId(req.user.sub);
    return this.groupsService.updateMemberRole(id, user.id, targetUserId, role);
  }

  @Post(':id/transfer')
  async transferOwnership(@Param('id') id: string, @Req() req: any, @Body('newOwnerId') newOwnerId: string) {
    const user = await this.usersService.findByClerkId(req.user.sub);
    return this.groupsService.transferOwnership(id, user.id, newOwnerId);
  }
}
