import rateLimit from 'express-rate-limit';
import { env } from '@/config';
import { Res } from '@/utils';

export const apiRateLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  max: env.RATE_LIMIT_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    return Res.rateLimitExceeded(res);
  },
});
