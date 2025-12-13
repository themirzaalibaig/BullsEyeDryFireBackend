import fs from 'fs';
import path from 'path';
import { env } from '@/config';
import { UploadOptions, UploadedAsset } from '@/types';

const ensureDir = (): string => {
  const dir = path.join(process.cwd(), env.LOCAL_UPLOAD_DIR);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  return dir;
};

const buildLocalUrl = (filename: string): string => {
  return `/${env.LOCAL_UPLOAD_DIR}/${filename}`;
};

export const localUploadBuffer = async (
  buffer: Buffer,
  filename: string,
  _options: UploadOptions = {},
): Promise<UploadedAsset> => {
  const dir = ensureDir();
  const filePath = path.join(dir, filename);
  await fs.promises.writeFile(filePath, buffer);
  const url = buildLocalUrl(filename);
  return { publicId: filename, url, secureUrl: url };
};

export const localUploadFile = async (
  filePath: string,
  filename: string,
  options: UploadOptions = {},
): Promise<UploadedAsset> => {
  const dir = ensureDir();
  const dest = path.join(dir, options.publicId || filename);
  await fs.promises.copyFile(filePath, dest);
  const url = buildLocalUrl(options.publicId || filename);
  return { publicId: options.publicId || filename, url, secureUrl: url };
};

export const localDeleteAsset = async (publicId: string): Promise<boolean> => {
  const dir = ensureDir();
  const filePath = path.join(dir, publicId);
  try {
    await fs.promises.unlink(filePath);
    return true;
  } catch {
    return false;
  }
};

export const localBuildUrl = (publicId: string): string => buildLocalUrl(publicId);
