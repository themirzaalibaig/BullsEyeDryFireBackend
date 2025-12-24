import { Router } from 'express';
import { Res } from '@/utils';
import { env } from '@/config';
import { authRouter } from '@/features/auth/route/auth.routes';
export const router = Router();

// Health check
router.get('/health', (req, res) => {
  return Res.success(
    res,
    {
      status: 'ok',
    },
    'Service healthy',
    undefined,
    {
      version: env.API_VERSION,
      timestamp: Date.now(),
    },
  );
});

// Feature routes
router.use('/auth', authRouter);
