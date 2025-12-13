import { v2 as cloudinary } from 'cloudinary';
import { env } from '@/config';

export const cloudinaryConfig = {
  cloud_name: env.CLOUDINARY_CLOUD_NAME,
  api_key: env.CLOUDINARY_API_KEY,
  api_secret: env.CLOUDINARY_API_SECRET,
  secure: true,
};

cloudinary.config(cloudinaryConfig as any);

export { cloudinary };
