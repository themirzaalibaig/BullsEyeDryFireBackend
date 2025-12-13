import { PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { s3Client, awsConfig } from '@/config';
import { UploadOptions, UploadedAsset } from '@/types';

const buildKey = (filename: string, folder?: string): string => {
  const f = folder || awsConfig.folder;
  return f ? `${f}/${filename}` : filename;
};

const buildPublicUrl = (key: string): string => {
  return `https://${awsConfig.bucket}.s3.${awsConfig.region}.amazonaws.com/${key}`;
};

export const s3UploadBuffer = async (
  buffer: Buffer,
  filename: string,
  options: UploadOptions = {},
): Promise<UploadedAsset> => {
  const key = buildKey(options.publicId || filename, options.folder);
  await s3Client.send(
    new PutObjectCommand({
      Bucket: awsConfig.bucket,
      Key: key,
      Body: buffer,
      ContentType: undefined,
    }),
  );
  const url = buildPublicUrl(key);
  return { publicId: key, url, secureUrl: url };
};

export const s3UploadFile = async (
  path: string,
  filename: string,
  options: UploadOptions = {},
): Promise<UploadedAsset> => {
  const fs = await import('fs');
  const data = fs.readFileSync(path);
  return s3UploadBuffer(data, filename, options);
};

export const s3DeleteAsset = async (publicId: string): Promise<boolean> => {
  await s3Client.send(
    new DeleteObjectCommand({
      Bucket: awsConfig.bucket,
      Key: publicId,
    }),
  );
  return true;
};

export const s3BuildUrl = (publicId: string): string => {
  return buildPublicUrl(publicId);
};
