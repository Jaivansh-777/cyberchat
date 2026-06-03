import { Controller, Get, Query, UseGuards, Req } from '@nestjs/common';
import { SearchService } from './search.service';
import { ClerkAuthGuard } from '../common/clerk-auth.guard';
import { UsersService } from '../users/users.service';

@Controller('search')
@UseGuards(ClerkAuthGuard)
export class SearchController {
  constructor(
    private searchService: SearchService,
    private usersService: UsersService,
  ) {}

  @Get()
  async search(@Query('q') query: string, @Req() req: any) {
    const user = await this.usersService.findByClerkId(req.user.sub);
    return this.searchService.searchAll(query, user.id);
  }

  @Get('users')
  async searchUsers(@Query('q') query: string, @Req() req: any) {
    const user = await this.usersService.findByClerkId(req.user.sub);
    return this.searchService.searchUsers(query, user.id);
  }

  @Get('messages')
  async searchMessages(@Query('q') query: string, @Req() req: any) {
    const user = await this.usersService.findByClerkId(req.user.sub);
    return this.searchService.searchMessages(query, user.id);
  }

  @Get('groups')
  async searchGroups(@Query('q') query: string, @Req() req: any) {
    const user = await this.usersService.findByClerkId(req.user.sub);
    return this.searchService.searchGroups(query, user.id);
  }

  @Get('media')
  async searchMedia(@Query('chatId') chatId: string, @Query('type') type: string) {
    return this.searchService.searchMedia(chatId, type);
  }
}
