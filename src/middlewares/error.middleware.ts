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

  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    const validationError = {
      field,
      message: `${field.charAt(0).toUpperCase() + field.slice(1)} already exists`,
      value: err.keyValue[field],
    };
    return Res.conflict(res, `${field} already exists`, [validationError]);
  }

  return Res.internalError(res, 'Internal Server Error', err);
};
