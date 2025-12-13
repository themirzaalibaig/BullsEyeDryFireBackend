export type CloudinaryResourceType = 'image' | 'video' | 'raw' | 'auto';

export type CloudinaryUploadOptions = {
  folder?: string;
  resourceType?: CloudinaryResourceType;
  tags?: string[];
  overwrite?: boolean;
  publicId?: string;
  transformation?: Record<string, unknown> | Array<Record<string, unknown>>;
};

export type CloudinaryUploadResult = {
  publicId: string;
  url: string;
  secureUrl: string;
  resourceType: CloudinaryResourceType | string;
  bytes: number;
  width?: number;
  height?: number;
  format?: string;
};
