import { S3Client } from '@aws-sdk/client-s3';
import { env } from '@/config';

export const awsConfig = {
  region: env.AWS_REGION,
  credentials:
    env.AWS_ACCESS_KEY_ID && env.AWS_SECRET_ACCESS_KEY
      ? { accessKeyId: env.AWS_ACCESS_KEY_ID, secretAccessKey: env.AWS_SECRET_ACCESS_KEY }
      : undefined,
  bucket: env.AWS_S3_BUCKET,
  folder: env.AWS_S3_FOLDER,
};

export const s3Client = new S3Client({
  region: awsConfig.region,
  credentials: awsConfig.credentials,
});
