import { Request, Response, NextFunction } from 'express';
import { AppError, logger, Res } from '@/utils';

export const globalErrorHandler = (
  err: any,
  _req: Request,
  res: Response,
  _next: NextFunction,
): Response => {
  logger.error(
    {
      message: err.message,
      stack: err.stack,
      statusCode: err.statusCode,
      errors: err.errors,
    },
    'Global Error Handler',
  );

  if (err instanceof AppError) {
    return Res.error(res, err.message, err.statusCode, err.errors);
  }

  return Res.internalError(res, 'Internal Server Error', err);
};
