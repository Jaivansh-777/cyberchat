import { Controller, Post, Delete, UseInterceptors, UploadedFile, Body, UseGuards, Req } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { MediaService } from './media.service';
import { ClerkAuthGuard } from '../common/clerk-auth.guard';

@Controller('media')
@UseGuards(ClerkAuthGuard)
export class MediaController {
  constructor(private mediaService: MediaService) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(@UploadedFile() file: Express.Multer.File) {
    const url = await this.mediaService.uploadFile(file);
    return { url, fileName: file.originalname, mimeType: file.mimetype, size: file.size };
  }

  @Delete()
  async deleteFile(@Body('url') url: string) {
    await this.mediaService.deleteFile(url);
    return { deleted: true };
  }
}
