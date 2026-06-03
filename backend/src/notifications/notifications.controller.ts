import { Controller, Post, Body, UseGuards, Req } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { ClerkAuthGuard } from '../common/clerk-auth.guard';

@Controller('notifications')
@UseGuards(ClerkAuthGuard)
export class NotificationsController {
  constructor(private notificationsService: NotificationsService) {}

  @Post('subscribe')
  async subscribe(@Body() subscription: any) {
    return { success: true, subscription };
  }

  @Post('unsubscribe')
  async unsubscribe(@Body() subscription: any) {
    return { success: true };
  }
}
