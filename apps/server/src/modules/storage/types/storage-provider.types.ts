import 'multer';
import { StorageDriver } from '@capsloc/types';

/**
 * Normalized result returned by storage provders on upload completion
 */
export interface StoredFile {
  fileUrl: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  provider: StorageDriver;
  publicId?: string;
  format?: string;
}

/**
 * Options passed to the storage provider to control organization and resource handling
 */
export interface UploadStorageOptions {
  folder?: string;
  resourceType?: 'auto' | 'image' | 'raw';
}

/**
 * The Strategy Pattern interface that all storage drivers must implement
 */
export interface IStorageProvider {
  upload(file: Express.Multer.File, options?: UploadStorageOptions): Promise<StoredFile>;
  delete?(key: string): Promise<void>;
}

/**
 * Dependency Injection token for NestJS IoC container
 */
export const STORAGE_PROVIDER = Symbol('STORAGE_PROVIDER');
