import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { BadRequestException } from '@nestjs/common';
import { StorageDriver } from '@capsloc/types';
import { existsSync, unlinkSync } from 'fs';
import { join } from 'path';
import { StorageService } from './storage.service.js';
import { LocalStorageProvider } from './providers/local-storage.provider.js';
import { IStorageProvider, StoredFile } from './types/storage-provider.types.js';

describe('StorageModule Unit Tests', () => {
  describe('StorageService (Facade)', () => {
    let service: StorageService;
    let mockProvider: IStorageProvider;

    beforeEach(() => {
      mockProvider = {
        upload: vi.fn().mockResolvedValue({
          fileUrl: 'https://res.cloudinary.com/demo/image/upload/v1/test.png',
          fileName: 'test.png',
          fileSize: 1024,
          mimeType: 'image/png',
          provider: StorageDriver.CLOUDINARY,
          publicId: 'test',
        } as StoredFile),
      };
      service = new StorageService(mockProvider);
    });

    it('should throw BadRequestException if file is missing or has no buffer', async () => {
      await expect(service.upload(null as any)).rejects.toThrow(BadRequestException);
      await expect(service.upload({} as any)).rejects.toThrow(BadRequestException);
    });

    it('should delegate upload to active provider when valid file buffer is provided', async () => {
      const dummyFile: Express.Multer.File = {
        fieldname: 'file',
        originalname: 'dante_stinger.png',
        encoding: '7bit',
        mimetype: 'image/png',
        buffer: Buffer.from('fake-image-bytes'),
        size: 16,
      } as Express.Multer.File;

      const result = await service.upload(dummyFile);

      expect(mockProvider.upload).toHaveBeenCalledWith(dummyFile, undefined);
      expect(result.fileUrl).toBe('https://res.cloudinary.com/demo/image/upload/v1/test.png');
      expect(result.provider).toBe(StorageDriver.CLOUDINARY);
    });
  });

  describe('LocalStorageProvider (Disk Strategy)', () => {
    let provider: LocalStorageProvider;
    let createdFilePath: string | null = null;

    beforeEach(() => {
      provider = new LocalStorageProvider();
    });

    afterEach(() => {
      // Clean up test file from ./uploads if created
      if (createdFilePath && existsSync(createdFilePath)) {
        unlinkSync(createdFilePath);
      }
    });

    it('should write file buffer to disk and return relative fileUrl', async () => {
      const dummyFile: Express.Multer.File = {
        fieldname: 'file',
        originalname: 're_engine_crash.log',
        encoding: '7bit',
        mimetype: 'text/plain',
        buffer: Buffer.from('FATAL_ERROR: memory leak at 0x004F'),
        size: 35,
      } as Express.Multer.File;

      const result = await provider.upload(dummyFile);

      expect(result.fileUrl).toMatch(/^\/uploads\/\d+-[0-9a-f-]+\.log$/);
      expect(result.fileName).toBe('re_engine_crash.log');
      expect(result.provider).toBe(StorageDriver.LOCAL);

      // Verify the file was physically written to disk
      createdFilePath = join(process.cwd(), result.fileUrl);
      expect(existsSync(createdFilePath)).toBe(true);
    });
  });
});
