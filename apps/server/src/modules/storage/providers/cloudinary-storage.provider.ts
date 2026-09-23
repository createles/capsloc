import { Injectable, Logger, InternalServerErrorException } from '@nestjs/common';
import { v2 as cloudinary, UploadApiResponse, UploadApiOptions } from 'cloudinary';
import { Readable } from 'stream';
import { extname } from 'path';
import { randomUUID } from 'crypto';
import { StorageDriver } from '@capsloc/types';
import { IStorageProvider, StoredFile, UploadStorageOptions } from '../types/storage-provider.types.js';

@Injectable()
export class CloudinaryStorageProvider implements IStorageProvider {
  private readonly logger = new Logger(CloudinaryStorageProvider.name);

  constructor() {
    // 1. Initialize Cloudinary SDK with environment credentials
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
      secure: true,
    });
    this.logger.log(`Initialized CloudinaryStorageProvider for cloud: ${process.env.CLOUDINARY_CLOUD_NAME || 'unconfigured'}`);
  }

  /**
       * Streams the in-memory file buffer directly into Cloudinary's
  upload stream
       * Differentiates between 'image' and 'raw' resource types.
       */
  async upload(file: Express.Multer.File, options?: UploadStorageOptions): Promise<StoredFile> {
    const isImage = file.mimetype.startsWith('image/');
    const folder = options?.folder || 'capsloc/attachments';
    const extension = extname(file.originalname).toLowerCase();
    const uniqueId = `${Date.now()}-${randomUUID()}`;

    // Nuance: Raw files (.log, .csv, .pdf) require the extension explicitly in public_id
    // so downloads retain the correct file extension and MIME interpretation
    const publicId = isImage ? uniqueId : `${uniqueId}${extension}`;
    const resourceType = isImage ? 'image' : 'raw';

    const uploadOptions: UploadApiOptions = {
      folder,
      public_id: publicId,
      resource_type: resourceType,
    };

    return new Promise((resolve, reject) => {
      // 2. Open an upload stream to Cloudinary
      const uploadStream = cloudinary.uploader.upload_stream(uploadOptions, (error, result?: UploadApiResponse) => {
        if (error || !result) {
          this.logger.error(`Cloudinary upload failed: ${error?.message || 'Unknown error'}`, error?.stack);
          return reject(
            new InternalServerErrorException(`Cloud
  storage upload failed: ${error?.message || 'Unknown error'}`),
          );
        }

        // 3. Resolve the normalized StoredFile contract with the secure HTTPS CDN URL
        resolve({
          fileUrl: result.secure_url,
          fileName: file.originalname,
          fileSize: result.bytes || file.size,
          mimeType: file.mimetype,
          provider: StorageDriver.CLOUDINARY,
          publicId: result.public_id,
          format: result.format || extension.replace('.', '') || undefined,
        });
      });

      // 4. Pipe the in-memory buffer directly into the upload stream
      Readable.from(file.buffer).pipe(uploadStream);
    });
  }
}
