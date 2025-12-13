export type StorageProvider = 'local' | 'cloudinary' | 'aws';

export type UploadInput = {
  buffer?: Buffer;
  path?: string;
  filename?: string;
  mimeType?: string;
};

export type UploadOptions = {
  folder?: string;
  resourceType?: 'image' | 'video' | 'raw' | 'auto';
  publicId?: string;
  tags?: string[];
};

export type UploadedAsset = {
  publicId: string;
  url: string;
  secureUrl: string;
  resourceType?: string;
  bytes?: number;
  width?: number;
  height?: number;
  format?: string;
};

export type StorageBackend = {
  uploadBuffer: (
    buffer: Buffer,
    filename: string,
    options?: UploadOptions,
  ) => Promise<UploadedAsset>;
  uploadFile: (path: string, filename: string, options?: UploadOptions) => Promise<UploadedAsset>;
  deleteAsset: (publicId: string, resourceType?: string) => Promise<boolean>;
  buildUrl: (publicId: string, resourceType?: string) => string;
};
