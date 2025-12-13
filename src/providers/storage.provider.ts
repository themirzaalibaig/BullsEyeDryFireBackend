import { env } from '@/config';
import {
  uploadImageFromBuffer,
  uploadFile as cloudUploadFile,
  deleteAsset as cloudDelete,
  buildUrl as cloudBuildUrl,
  localUploadBuffer,
  localUploadFile,
  localDeleteAsset,
  localBuildUrl,
  s3UploadBuffer,
  s3UploadFile,
  s3DeleteAsset,
  s3BuildUrl,
} from '@/utils';
import { UploadOptions, UploadedAsset, StorageBackend } from '@/types';

const cloudBackend: StorageBackend = {
  uploadBuffer: (
    buffer: Buffer,
    filename: string,
    options?: UploadOptions,
  ): Promise<UploadedAsset> =>
    uploadImageFromBuffer(buffer, { ...(options || {}), publicId: options?.publicId || filename }),
  uploadFile: (path: string, filename: string, options?: UploadOptions): Promise<UploadedAsset> =>
    cloudUploadFile(path, { ...(options || {}), publicId: options?.publicId || filename }),
  deleteAsset: (publicId: string): Promise<boolean> => cloudDelete(publicId),
  buildUrl: (publicId: string): string => cloudBuildUrl(publicId),
};

const localBackend: StorageBackend = {
  uploadBuffer: (
    buffer: Buffer,
    filename: string,
    options?: UploadOptions,
  ): Promise<UploadedAsset> => localUploadBuffer(buffer, filename, options || {}),
  uploadFile: (path: string, filename: string, options?: UploadOptions): Promise<UploadedAsset> =>
    localUploadFile(path, filename, options || {}),
  deleteAsset: (publicId: string): Promise<boolean> => localDeleteAsset(publicId),
  buildUrl: (publicId: string): string => localBuildUrl(publicId),
};

const s3Backend: StorageBackend = {
  uploadBuffer: (
    buffer: Buffer,
    filename: string,
    options?: UploadOptions,
  ): Promise<UploadedAsset> => s3UploadBuffer(buffer, filename, options || {}),
  uploadFile: (path: string, filename: string, options?: UploadOptions): Promise<UploadedAsset> =>
    s3UploadFile(path, filename, options || {}),
  deleteAsset: (publicId: string): Promise<boolean> => s3DeleteAsset(publicId),
  buildUrl: (publicId: string): string => s3BuildUrl(publicId),
};

const selectBackend = (): StorageBackend => {
  return env.STORAGE_PROVIDER === 'cloudinary'
    ? cloudBackend
    : env.STORAGE_PROVIDER === 'aws'
      ? s3Backend
      : localBackend;
};

export const storageUploadBuffer = async (
  buffer: Buffer,
  filename: string,
  options: UploadOptions = {},
): Promise<UploadedAsset> => {
  return selectBackend().uploadBuffer(buffer, filename, options);
};

export const storageUploadFile = async (
  path: string,
  filename: string,
  options: UploadOptions = {},
): Promise<UploadedAsset> => {
  return selectBackend().uploadFile(path, filename, options);
};

export const storageDeleteAsset = async (publicId: string): Promise<boolean> => {
  return selectBackend().deleteAsset(publicId);
};

export const storageBuildUrl = (publicId: string): string => {
  return selectBackend().buildUrl(publicId);
};
