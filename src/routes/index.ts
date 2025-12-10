import { Router } from 'express';
import { Res } from '@/utils';
import { env } from '@/config/env.config';
import { chatRouter } from '@/features/chat/routes/chat.routes';
import { subscriptionRouter } from '@/features/subscription/routes/subscription.routes';

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
router.use('/chat', chatRouter);
router.use('/subscription', subscriptionRouter);
