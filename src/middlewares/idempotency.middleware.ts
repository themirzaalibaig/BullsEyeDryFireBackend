import { NextFunction, Response } from 'express';
import crypto from 'crypto';
import { cacheGet, cacheSet, acquireLock, releaseLock, makeKey } from '@/utils';

type IdempotencyOptions = {
  ttlSeconds?: number;
  statusCodes?: number[];
};

export const idempotency = (operation: string, opts: IdempotencyOptions = {}) => {
  const ttl = opts.ttlSeconds ?? 24 * 60 * 60;
  const allowed = opts.statusCodes ?? [200, 201, 202];
  return (req: any, res: Response, next: NextFunction) => {
    const header = (req.headers['x-idempotency-key'] || req.headers['X-Idempotency-Key']) as
      | string
      | undefined;
    if (!header) return next();
    const bodyHash = crypto
      .createHash('sha256')
      .update(JSON.stringify(req.body || {}))
      .digest('hex');
    const key = makeKey('idem', operation, header, req.method, req.path, bodyHash);
    const lockKey = makeKey('lock', 'idem', operation, header);
    const run = async () => {
      const cached = await cacheGet<{ status: number; body: any }>(key);
      if (cached) {
        return res.status(cached.status).json(cached.body);
      }
      const locked = await acquireLock(lockKey, 30);
      if (!locked) {
        const again = await cacheGet<{ status: number; body: any }>(key);
        if (again) return res.status(again.status).json(again.body);
      }
      let statusCode: number | undefined;
      const originalStatus = res.status.bind(res);
      const originalJson = res.json.bind(res);
      (res as any).status = (code: number) => {
        statusCode = code;
        return originalStatus(code);
      };
      (res as any).json = (body: any) => {
        const result = originalJson(body);
        const code = statusCode ?? res.statusCode;
        if (allowed.includes(code)) {
          try {
            cacheSet(key, { status: code, body }, ttl).finally(() => releaseLock(lockKey));
          } catch {
            releaseLock(lockKey).catch(() => {});
          }
        } else {
          releaseLock(lockKey).catch(() => {});
        }
        return result;
      };
      next();
    };
    run().catch(() => next());
  };
};
