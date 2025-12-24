import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import http from 'http';
import { env, initializeFirebase } from '@/config';
import { router } from '@/routes';
import { logger, Res, initEmailWorker } from '@/utils';
import { apiRateLimiter, globalErrorHandler } from '@/middlewares';

const app = express();

app.use(helmet());
app.use(cors({ origin: env.CORS_ORIGIN, credentials: true }));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(apiRateLimiter);

app.use((req, _res, next) => {
  logger.info({ method: req.method, path: req.path }, 'Request');
  next();
});

app.use(env.BASE_API_PATH, router);
app.use(env.VERSIONED_API_PATH, router);

app.use((req, res) => {
  return Res.notFound(res, 'Route not found');
});

app.use(globalErrorHandler);

const start = async (): Promise<void> => {
  // Initialize Firebase Admin SDK
  try {
    initializeFirebase();
  } catch (error) {
    logger.warn({ error }, 'Firebase initialization failed. Google auth will be disabled.');
  }

  // Initialize Email Worker
  try {
    initEmailWorker();
    logger.info('Email queue worker initialized');
  } catch (error) {
    logger.warn(
      { error },
      'Email worker initialization failed. Email queue will not process jobs.',
    );
  }

  const server = http.createServer(app);
  server.listen(env.PORT, () => {
    logger.info(`Server listening on port http://localhost:${env.PORT}`);
  });
};

start();

export default app;
