/**
 * Supported storage drivers
 * Controls which IStorageProvider is instantiated by the NestJS
 */
export enum StorageDriver {
  LOCAL = "local",
  CLOUDINARY = "cloudinary",
  S3 = "s3",
}
