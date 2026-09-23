import { Injectable, Logger } from '@nestjs/common';
import { existsSync, mkdirSync, writeFileSync } from 'fs';
import { extname, join } from 'path';
import { randomUUID } from 'crypto';
import { StorageDriver } from '@capsloc/types';
import { IStorageProvider, StoredFile, UploadStorageOptions } from '../types/storage-provider.types.js';

@Injectable()
export class LocalStorageProvider implements IStorageProvider {
  private readonly logger = new Logger(LocalStorageProvider.name);
  private readonly uploadDir = join(process.cwd(), 'uploads');

  constructor() {
    // Ensure the uploads directory exists on disk when using local storage
    if (!existsSync(this.uploadDir)) {
      mkdirSync(this.uploadDir, { recursive: true });
    }
    this.logger.log(`Initialized LocalStorageProvider targeting
  disk: ${this.uploadDir}`);
  }

  /**
       * Writes the in-memory file buffer to the local disk and
  returns the relative URL
       */
  async upload(file: Express.Multer.File, _options?: UploadStorageOptions): Promise<StoredFile> {
    const fileExtension = extname(file.originalname).toLowerCase();
    const uniqueFilename = `${Date.now()}-${randomUUID()}${fileExtension}`;
    const destinationPath = join(this.uploadDir, uniqueFilename);

    // 1. Write the memory buffer to disk
    writeFileSync(destinationPath, file.buffer);

    // 2. Return the normalized StoredFile contract
    return {
      fileUrl: `/uploads/${uniqueFilename}`,
      fileName: file.originalname,
      fileSize: file.size,
      mimeType: file.mimetype,
      provider: StorageDriver.LOCAL,
      publicId: uniqueFilename,
      format: fileExtension.replace('.', '') || undefined,
    };
  }
}
