import { Controller, Post, Patch, Param, UseGuards, UseInterceptors, UploadedFile, Body, BadRequestException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { UploadsService } from './uploads.service.js';
import { UploadAttachmentDto } from './dto/upload-attachment.dto.js';
import { UpdateAttachmentDto } from './dto/update-attachment.dto.js';

// SPECIFICATION - File Filter Security Check:
// Whitelist allowed MIME types and .log extensions
const multerFileFilter = (_req: any, file: Express.Multer.File, cb: (error: Error | null, acceptFile: boolean) => void) => {
  const allowedMimes = ['image/png', 'image/jpeg', 'image/webp', 'image/gif', 'text/plain', 'application/json', 'text/csv', 'application/pdf'];

  if (allowedMimes.includes(file.mimetype) || file.originalname.endsWith('.log')) {
    cb(null, true);
  } else {
    cb(new BadRequestException(`Unsupported file type: ${file.mimetype}`), false);
  }
};

@Controller('uploads')
@UseGuards(JwtAuthGuard)
export class UploadsController {
  constructor(private readonly uploadsService: UploadsService) {}

  // SPECIFICATION:
  @Post()
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: 10 * 1024 * 1024 },
      fileFilter: multerFileFilter,
    }),
  )
  async uploadFile(@UploadedFile() file: Express.Multer.File, @Body() dto: UploadAttachmentDto) {
    return this.uploadsService.saveAttachment(file, dto);
  }

  @Patch(':id')
  async updateAttachment(@Param('id') id: string, @Body() dto: UpdateAttachmentDto) {
    return this.uploadsService.updateAttachment(id, dto);
  }
}
