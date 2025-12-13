import { Request, Response, NextFunction } from 'express';
import { lookup } from 'mime-types';
import { Res } from '@/utils';
import {
  ALL_ALLOWED_MIME_TYPES,
  ALLOWED_IMAGE_MIME_TYPES,
  ALLOWED_VIDEO_MIME_TYPES,
  IMAGE_MAX_BYTES,
  VIDEO_MAX_BYTES,
  DOCUMENT_MAX_BYTES,
} from '@/constants';

const resolveMime = (file: any) => {
  if (file?.mimetype) return file.mimetype as string;
  const guessed = lookup(file?.originalname || '') || '';
  return typeof guessed === 'string' ? guessed : '';
};

const withinSizeLimit = (file: any, mime: string) => {
  const size = file?.size || 0;
  if (ALLOWED_IMAGE_MIME_TYPES.includes(mime)) return size <= IMAGE_MAX_BYTES;
  if (ALLOWED_VIDEO_MIME_TYPES.includes(mime)) return size <= VIDEO_MAX_BYTES;
  return size <= DOCUMENT_MAX_BYTES;
};

export const validateUploadSingleFile = (req: Request, res: Response, next: NextFunction) => {
  const file = (req as any).file;
  if (!file)
    return Res.validationError(res, [{ field: 'file', message: 'File is required' }] as any);
  const mime = resolveMime(file);
  if (!ALL_ALLOWED_MIME_TYPES.includes(mime))
    return Res.validationError(res, [{ field: 'file', message: 'Invalid file type' }] as any);
  if (!withinSizeLimit(file, mime))
    return Res.validationError(res, [{ field: 'file', message: 'File size exceeds limit' }] as any);
  return next();
};

export const validateUploadMultipleFiles = (req: Request, res: Response, next: NextFunction) => {
  const files = ((req as any).files || []) as any[];
  if (!files.length)
    return Res.validationError(res, [{ field: 'files', message: 'Files are required' }] as any);
  const valid = files.filter((f) => {
    const mime = resolveMime(f);
    return ALL_ALLOWED_MIME_TYPES.includes(mime) && withinSizeLimit(f, mime);
  });
  if (!valid.length)
    return Res.validationError(res, [{ field: 'files', message: 'No valid files found' }] as any);
  (req as any).files = valid;
  return next();
};
