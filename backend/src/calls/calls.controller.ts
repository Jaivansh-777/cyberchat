import { Controller, Get, Post, Patch, Body, Param, UseGuards, Req } from '@nestjs/common';
import { CallsService } from './calls.service';
import { ClerkAuthGuard } from '../common/clerk-auth.guard';
import { UsersService } from '../users/users.service';

@Controller('calls')
@UseGuards(ClerkAuthGuard)
export class CallsController {
  constructor(
    private callsService: CallsService,
    private usersService: UsersService,
  ) {}

  @Get('token')
  async getToken(@Req() req: any) {
    const user = await this.usersService.findByClerkId(req.user.sub);
    return this.callsService.generateToken(user.id);
  }

  @Post('initiate')
  async initiateCall(@Req() req: any, @Body() body: any) {
    const user = await this.usersService.findByClerkId(req.user.sub);
    return this.callsService.initiateCall({
      callerId: user.id,
      receiverId: body.receiverId,
      type: body.type,
    });
  }

  @Patch(':id/status')
  async updateStatus(@Param('id') id: string, @Body() body: any) {
    return this.callsService.updateCallStatus(id, body.status, body.duration);
  }

  @Get('history')
  async getHistory(@Req() req: any) {
    const user = await this.usersService.findByClerkId(req.user.sub);
    return this.callsService.getCallHistory(user.id);
  }
}
