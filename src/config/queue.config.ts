import { Queue, Worker, JobsOptions, Processor } from 'bullmq';
import { env } from '@/config/env.config';

const redisUrl = new URL(env.REDIS_URL);
const connection = {
  host: redisUrl.hostname,
  port: Number(redisUrl.port || 6379),
  password: redisUrl.password || undefined,
};

export const createQueue = (name: string): Queue => new Queue(name, { connection });
export const createWorker = (name: string, processor: Processor<any>, concurrency = 1): Worker => {
  return new Worker(name, processor, { connection, concurrency });
};

export const defaultJobOptions: JobsOptions = {
  removeOnComplete: true,
  attempts: 3,
  backoff: { type: 'exponential', delay: 1000 },
};
