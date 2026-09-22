import 'multer';
import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { AttachmentType } from '@capsloc/types';
import { PrismaService } from '../../prisma/prisma.service.js';
import { UploadAttachmentDto } from './dto/upload-attachment.dto.js';
import { UpdateAttachmentDto } from './dto/update-attachment.dto.js';

@Injectable()
export class UploadsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Classifies uploaded media into appropriate domain attachment categories based on MIME and filename
   */
  classifyFileType(mimetype: string, originalname: string): AttachmentType {
    const lowerName = originalname.toLowerCase();

    // 1. If MIME starts with 'image/':
    if (mimetype.startsWith('image/')) {
      if (lowerName.includes('bug') || lowerName.includes('overflow') || lowerName.includes('clip')) {
        return AttachmentType.SCREENSHOT_BUG;
      }
      return AttachmentType.IMAGE;
    }
    if (mimetype === 'text/plain' || lowerName.endsWith('.log') || lowerName.endsWith('.crash')) {
      return AttachmentType.LOG_FILE;
    }

    return AttachmentType.DOCUMENT;
  }

  /**
   * Persists the uploaded file metadata as a staged attachment (messageId = null).
   */
  async saveAttachment(file: Express.Multer.File, dto: UploadAttachmentDto) {
    if (!file) throw new BadRequestException('No file provided for upload');

    const fileType = this.classifyFileType(file.mimetype, file.originalname);
    const fileUrl = `/uploads/${file.filename}`;

    return this.prisma.attachment.create({
      data: {
        messageId: null, // Staged attachment
        fileUrl,
        fileName: file.originalname,
        fileType,
        fileSize: file.size,
        localeTag: dto.localeTag || null,
      },
    });
  }

  /**
   * Updates metadata (e.g. localeTag QA pill) of a staged attachment.
   * Disallows mutating attachments that have already been claimed by a sent message.
   */
  async updateAttachment(id: string, dto: UpdateAttachmentDto) {
    const attachment = await this.prisma.attachment.findUnique({ where: { id } });
    if (!attachment) {
      throw new NotFoundException(`Attachment with ID ${id} not found`);
    }

    if (attachment.messageId !== null) {
      throw new BadRequestException('Cannot edit metadata of an already sent attachment');
    }

    return this.prisma.attachment.update({
      where: { id },
      data: {
        localeTag: dto.localeTag?.trim() || null,
      },
    });
  }
}
