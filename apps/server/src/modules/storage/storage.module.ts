import { Module } from '@nestjs/common';
import { StorageDriver } from '@capsloc/types';
import { StorageService } from './storage.service.js';
import { STORAGE_PROVIDER } from './types/storage-provider.types.js';
import { LocalStorageProvider } from './providers/local-storage.provider.js';
import { CloudinaryStorageProvider } from './providers/cloudinary-storage.provider.js';

@Module({
  providers: [
    StorageService,
    {
      provide: STORAGE_PROVIDER,
      useFactory: () => {
        // Automatic driver resolution:
        // 1. Explicit STORAGE_DRIVER env variable
        // 2. Auto-detect Cloudinary if CLOUDINARY_CLOUD_NAME is populated
        // 3. Fallback to LocalStorageProvider for zero-credential offline development
        const driver = process.env.STORAGE_DRIVER || (process.env.CLOUDINARY_CLOUD_NAME ? StorageDriver.CLOUDINARY : StorageDriver.LOCAL);

        if (driver === StorageDriver.CLOUDINARY) {
          return new CloudinaryStorageProvider();
        }

        return new LocalStorageProvider();
      },
    },
  ],
  exports: [StorageService],
})
export class StorageModule {}
