import { CorsOptions } from 'cors';
import { env } from '@/config';
import { logger } from '@/utils';

/**
 * CORS Configuration
 * Handles cross-origin resource sharing for the API
 */
export const corsOptions: CorsOptions = {
  /**
   * Origin validation function
   * Checks if the requesting origin is allowed
   */
  origin: (
    origin: string | undefined,
    callback: (err: Error | null, allow?: boolean) => void,
  ): void => {
    // Allow requests with no origin (like mobile apps, curl, Postman, etc.)
    if (!origin) {
      return callback(null, true);
    }

    const allowedOrigins = env.CORS_ORIGIN;

    logger.info({ allowedOrigins }, 'CORS: Allowed origins');

    if (allowedOrigins.includes('*')) {
      logger.warn('CORS: Wildcard (*) is enabled - allowing all origins');
      return callback(null, true);
    }

    // Check if origin is in the allowed list
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      logger.warn({ origin, allowedOrigins }, 'CORS: Origin not allowed - request blocked');
      callback(new Error(`Origin ${origin} is not allowed by CORS policy`));
    }
  },

  /**
   * Allow credentials (cookies, authorization headers, etc.)
   */
  credentials: true,

  /**
   * Allowed HTTP methods
   */
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],

  /**
   * Allowed request headers
   */
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'Accept',
    'Origin',
    'X-Request-ID',
    'X-CSRF-Token',
  ],

  /**
   * Headers exposed to the client
   */
  exposedHeaders: ['Content-Range', 'X-Content-Range', 'X-Total-Count'],

  /**
   * Cache preflight requests for 24 hours
   */
  maxAge: 86400,

  /**
   * Don't pass the CORS preflight response to the next handler
   */
  preflightContinue: false,

  /**
   * Provide a status code to use for successful OPTIONS requests
   */
  optionsSuccessStatus: 204,
};
