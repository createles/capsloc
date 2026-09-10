import {
  Controller,
  Post,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  Body,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { randomUUID } from 'crypto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { UploadsService } from './uploads.service.js';
import { UploadAttachmentDto } from './dto/upload-attachment.dto.js';

// SPECIFICATION - Multer Disk Storage Engine:
// 1. destination: join(process.cwd(), 'uploads')
// 2. filename: combine Date.now(), randomUUID(), and extname(file.originalname).toLowerCase()
// **mark unused arguments with _ (underscore) to appease TypeScript linter
const multerDiskStorage = diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, join(process.cwd(), 'uploads'));
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${randomUUID()}`;
    const fileExtension = extname(file.originalname).toLowerCase();
    cb(null, `${uniqueSuffix}${fileExtension}`);
  },
});

// SPECIFICATION - File Filter Security Check:
// Whitelist allowed MIME types and .log extensions
const multerFileFilter = (
  _req: any,
  file: Express.Multer.File,
  cb: (error: Error | null, acceptFile: boolean) => void,
) => {
  const allowedMimes = [
    'image/png',
    'image/jpeg',
    'image/webp',
    'image/gif',
    'text/plain',
    'application/json',
    'text/csv',
    'application/pdf',
  ];

  if (
    allowedMimes.includes(file.mimetype) ||
    file.originalname.endsWith('.log')
  ) {
    cb(null, true);
  } else {
    cb(
      new BadRequestException(`Unsupported file type: ${file.mimetype}`),
      false,
    );
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
      storage: multerDiskStorage,
      limits: { fileSize: 10 * 1024 * 1024 },
      fileFilter: multerFileFilter,
    }),
  )
  async uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @Body() dto: UploadAttachmentDto,
  ) {
    return this.uploadsService.saveAttachment(file, dto);
  }
}
