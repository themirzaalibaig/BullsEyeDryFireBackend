import Redis from 'ioredis';
import { logger } from '@/utils/logger.util';
import { env } from '@/config/env.config';

export const redis = new Redis(env.REDIS_URL);
export const redisPub = redis.duplicate();
export const redisSub = redis.duplicate();

export const connectRedis = async (): Promise<void> => {
  try {
    redis.on('error', (err) => logger.error({ error: err }, 'Redis error'));
    redis.on('ready', () => logger.info('Redis ready'));
    const canConnect = typeof (redis as any).connect === 'function';
    if (canConnect) {
      await redis.connect();
      await redisPub.connect();
      await redisSub.connect();
    }
    logger.info('Redis connected');
  } catch (err) {
    logger.error({ error: err }, 'Redis connection error');
  }
};
