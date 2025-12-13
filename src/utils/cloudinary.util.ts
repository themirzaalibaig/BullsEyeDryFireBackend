import { cloudinary } from '@/config';
import { CloudinaryUploadOptions, CloudinaryUploadResult, CloudinaryResourceType } from '@/types';

const normalizeUploadResult = (r: any): CloudinaryUploadResult => ({
  publicId: r.public_id,
  url: r.url,
  secureUrl: r.secure_url,
  resourceType: r.resource_type,
  bytes: r.bytes,
  width: r.width,
  height: r.height,
  format: r.format,
});

export const uploadFile = async (
  pathOrUrl: string,
  options: CloudinaryUploadOptions = {},
): Promise<CloudinaryUploadResult> => {
  const folder = options.folder || (cloudinary as any).config().upload_folder || undefined;
  const res = await cloudinary.uploader.upload(pathOrUrl, {
    folder: folder || undefined,
    resource_type: options.resourceType || 'auto',
    tags: options.tags,
    overwrite: options.overwrite,
    public_id: options.publicId,
    transformation: options.transformation as any,
  } as any);
  return normalizeUploadResult(res);
};

export const uploadImageFromBuffer = async (
  buffer: Buffer,
  options: CloudinaryUploadOptions = {},
): Promise<CloudinaryUploadResult> => {
  const folder = options.folder || (cloudinary as any).config().upload_folder || undefined;
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: folder || undefined,
        resource_type: options.resourceType || 'image',
        tags: options.tags,
        overwrite: options.overwrite,
        public_id: options.publicId,
        transformation: options.transformation as any,
      } as any,
      (err: any, result: any) => {
        if (err) return reject(err);
        resolve(normalizeUploadResult(result));
      },
    );
    stream.end(buffer);
  });
};

export const deleteAsset = async (
  publicId: string,
  resourceType: CloudinaryResourceType = 'image',
): Promise<boolean> => {
  const res = await cloudinary.uploader.destroy(publicId, {
    resource_type: resourceType,
  } as any);
  return res && (res.result === 'ok' || res.result === 'not found');
};

export const buildUrl = (
  publicId: string,
  resourceType: CloudinaryResourceType = 'image',
  transformation?: Record<string, unknown> | Array<Record<string, unknown>>,
): string => {
  return cloudinary.url(publicId, {
    secure: true,
    resource_type: resourceType,
    transformation: transformation as any,
  } as any);
};
