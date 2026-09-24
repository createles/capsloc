import { Injectable, Inject, BadRequestException } from '@nestjs/common';
import { type IStorageProvider, STORAGE_PROVIDER, StoredFile, UploadStorageOptions } from './types/storage-provider.types.js';

@Injectable()
export class StorageService {
  constructor(@Inject(STORAGE_PROVIDER) private readonly provider: IStorageProvider) {}

  /**
   * Universal upload processor that validates in-memory buffers
   * and delegates to the active storage strategy
   */
  async upload(file: Express.Multer.File, options?: UploadStorageOptions): Promise<StoredFile> {
    if (!file || !file.buffer) {
      throw new BadRequestException('Invalid file buffer received for storage processing');
    }
    return this.provider.upload(file, options);
  }
}
