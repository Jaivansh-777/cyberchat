import { Controller, Post, Body, Headers } from '@nestjs/common';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('webhook')
  async webhook(@Body() event: any) {
    return this.authService.webhookHandler(event);
  }

  @Post('verify')
  async verifySession(@Headers('authorization') auth: string) {
    const token = auth?.replace('Bearer ', '');
    return this.authService.validateClerkSession(token);
  }
}
