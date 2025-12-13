import dotenv from 'dotenv';

dotenv.config();

const unsafePorts = new Set<number>([6000, 6665, 6666, 6667, 6668, 6669, 10080]);
const parsePort = (v: string | undefined): number => {
  const p = Number(v || 4000);
  return unsafePorts.has(p) ? 4000 : p;
};

export const env = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: parsePort(process.env.PORT),
  LOG_LEVEL: process.env.LOG_LEVEL || 'info',
  RATE_LIMIT_WINDOW_MS: Number(process.env.RATE_LIMIT_WINDOW_MS || 15 * 60 * 1000),
  RATE_LIMIT_MAX: Number(process.env.RATE_LIMIT_MAX || 100),
  CORS_ORIGIN: (process.env.CORS_ORIGIN || '*').split(','),
  DATABASE_URL: process.env.DATABASE_URL || '',
  REDIS_URL: process.env.REDIS_URL || 'redis://localhost:6379',
  API_PREFIX: process.env.API_PREFIX || '/api',
  API_VERSION: process.env.API_VERSION || 'v1',
  REFRESH_ROTATION_THRESHOLD: Number(process.env.REFRESH_ROTATION_THRESHOLD || 2),
  JWT_SECRET: process.env.JWT_SECRET || 'changeme_secret',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '1h',
  JWT_REFRESH_EXPIRES_IN: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  JWT_ISSUER: process.env.JWT_ISSUER || 'node-mongodb-template',
  JWT_AUDIENCE: process.env.JWT_AUDIENCE || 'node-mongodb-template',
  SMTP_HOST: process.env.SMTP_HOST || 'localhost',
  SMTP_PORT: Number(process.env.SMTP_PORT || 1025),
  SMTP_SECURE: process.env.SMTP_SECURE === 'true',
  SMTP_USER: process.env.SMTP_USER || '',
  SMTP_PASS: process.env.SMTP_PASS || '',
  EMAIL_FROM: process.env.EMAIL_FROM || 'no-reply@example.com',
  STORAGE_PROVIDER: (process.env.STORAGE_PROVIDER || 'local') as 'local' | 'cloudinary' | 'aws',
  LOCAL_UPLOAD_DIR: process.env.LOCAL_UPLOAD_DIR || 'uploads',
  AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID || '',
  AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY || '',
  AWS_REGION: process.env.AWS_REGION || 'us-east-1',
  AWS_S3_BUCKET: process.env.AWS_S3_BUCKET || '',
  AWS_S3_FOLDER: process.env.AWS_S3_FOLDER || 'uploads',
  CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME || '',
  CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY || '',
  CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET || '',
  CLOUDINARY_FOLDER: process.env.CLOUDINARY_FOLDER || 'uploads',
  OPENAI_API_KEY: process.env.OPENAI_API_KEY || '',
  OPENAI_API_BASE_URL: process.env.OPENAI_API_BASE_URL || 'https://api.openai.com/v1',
  OPENAI_API_MODEL: process.env.OPENAI_API_MODEL || 'gpt-5',
  get BASE_API_PATH(): string {
    return this.API_PREFIX;
  },
  get VERSIONED_API_PATH(): string {
    return `${this.API_PREFIX}/${this.API_VERSION}`;
  },
};
