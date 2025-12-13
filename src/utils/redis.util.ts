import { redis, redisPub, redisSub } from '@/config';

export const makeKey = (...parts: Array<string | number>): string => parts.join(':');

export const getString = async (key: string): Promise<string | null> => {
  return redis.get(key);
};

export const setString = async (key: string, value: string, ttlSeconds = 0): Promise<void> => {
  if (ttlSeconds > 0) await redis.set(key, value, 'EX', ttlSeconds);
  else await redis.set(key, value);
};

export const cacheGet = async <T>(key: string): Promise<T | null> => {
  const raw = await redis.get(key);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
};

export const cacheSet = async (key: string, value: unknown, ttlSeconds = 60): Promise<void> => {
  const payload = JSON.stringify(value);
  if (ttlSeconds > 0) await redis.set(key, payload, 'EX', ttlSeconds);
  else await redis.set(key, payload);
};

export const cacheDel = async (key: string): Promise<void> => {
  await redis.del(key);
};

export const exists = async (key: string): Promise<boolean> => {
  const n = await redis.exists(key);
  return n === 1;
};

export const incr = async (key: string): Promise<number> => {
  return redis.incr(key);
};

export const decr = async (key: string): Promise<number> => {
  return redis.decr(key);
};

export const expire = async (key: string, seconds: number): Promise<number> => {
  return redis.expire(key, seconds);
};

export const ttl = async (key: string): Promise<number> => {
  return redis.ttl(key);
};

export const hget = async (key: string, field: string): Promise<string | null> => {
  return redis.hget(key, field);
};

export const hset = async (key: string, field: string, value: string): Promise<number> => {
  return redis.hset(key, field, value);
};

export const hdel = async (key: string, field: string): Promise<number> => {
  return redis.hdel(key, field);
};

export const sadd = async (key: string, ...members: string[]): Promise<number> => {
  return redis.sadd(key, ...members);
};

export const srem = async (key: string, ...members: string[]): Promise<number> => {
  return redis.srem(key, ...members);
};

export const smembers = async (key: string): Promise<string[]> => {
  return redis.smembers(key);
};

export const acquireLock = async (key: string, ttlSeconds: number): Promise<boolean> => {
  const res = await redis.set(key, '1', 'EX', ttlSeconds, 'NX');
  return res === 'OK';
};

export const releaseLock = async (key: string): Promise<void> => {
  await redis.del(key);
};

export const publish = async (channel: string, message: string): Promise<number> => {
  return redisPub.publish(channel, message);
};

export const subscribe = async (
  channel: string,
  handler: (message: string) => void,
): Promise<void> => {
  await redisSub.subscribe(channel);
  redisSub.on('message', (ch, msg) => {
    if (ch === channel) handler(msg);
  });
};

export const deleteKeysByPattern = async (pattern: string): Promise<number> => {
  let cursor = '0';
  let deleted = 0;
  do {
    const [next, keys] = await redis.scan(cursor, 'MATCH', pattern, 'COUNT', 200);
    cursor = next;
    if (keys.length > 0) {
      deleted += await redis.del(...keys);
    }
  } while (cursor !== '0');
  return deleted;
};

export const invalidateEntityListCache = async (
  entity: string,
  tenantId?: string,
): Promise<number> => {
  const prefix = tenantId ? makeKey(tenantId, entity, 'list') : makeKey(entity, 'list');
  return deleteKeysByPattern(`${prefix}:*`);
};

export const buildCacheVersionKey = (entity: string, tenantId = 'global'): string => {
  return makeKey('cachever', tenantId, entity);
};

export const readCacheVersion = async (entity: string, tenantId?: string): Promise<number> => {
  const key = buildCacheVersionKey(entity, tenantId || 'global');
  const v = await getString(key);
  return v ? Number(v) : 0;
};

export const incrementCacheVersion = async (entity: string, tenantId?: string): Promise<number> => {
  const key = buildCacheVersionKey(entity, tenantId || 'global');
  return incr(key);
};

export const buildVersionedCacheKey = async (
  entity: string,
  parts: Array<string | number>,
  tenantId?: string,
): Promise<string> => {
  const v = await readCacheVersion(entity, tenantId);
  return makeKey('v', v, tenantId || 'global', entity, ...parts);
};
