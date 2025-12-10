import { Response } from 'express';
import {
  ErrorResponse,
  HttpStatusCode,
  ResponseMeta,
  SuccessResponse,
  type ValidationError,
} from '@/types';
import { logger } from '@/utils';

export const success = <T>(
  res: Response,
  data: T,
  message = 'Success',
  statusCode: HttpStatusCode = HttpStatusCode.OK,
  meta?: ResponseMeta,
): Response => {
  const response: SuccessResponse<T> = {
    success: true,
    message,
    data,
    meta,
    timestamp: new Date().toISOString(),
  };
  logger.info({ statusCode, message, dataType: typeof data }, 'API Success Response');
  return res.status(statusCode).json(response);
};

export const error = (
  res: Response,
  message: string,
  statusCode: HttpStatusCode = HttpStatusCode.INTERNAL_SERVER_ERROR,
  errors?: ValidationError[],
  meta?: ResponseMeta,
): Response => {
  const response: ErrorResponse = {
    success: false,
    message,
    data: null,
    errors: errors || [],
    meta,
    timestamp: new Date().toISOString(),
  };
  logger.error({ statusCode, message, errors: errors || [] }, 'API Error Response');
  return res.status(statusCode).json(response);
};

export const validationError = (
  res: Response,
  errors: ValidationError[],
  message = 'Validation failed',
): Response => error(res, message, HttpStatusCode.UNPROCESSABLE_ENTITY, errors);

export const notFound = (
  res: Response,
  message = 'Resource not found',
  errors?: ValidationError[],
): Response => error(res, message, HttpStatusCode.NOT_FOUND, errors);

export const unauthorized = (res: Response, message = 'Unauthorized access'): Response =>
  error(res, message, HttpStatusCode.UNAUTHORIZED);

export const forbidden = (res: Response, message = 'Access forbidden'): Response =>
  error(res, message, HttpStatusCode.FORBIDDEN);

export const badRequest = (
  res: Response,
  message = 'Bad request',
  errors?: ValidationError[],
): Response => error(res, message, HttpStatusCode.BAD_REQUEST, errors);

export const conflict = (
  res: Response,
  message = 'Resource conflict',
  errors?: ValidationError[],
): Response => error(res, message, HttpStatusCode.CONFLICT, errors);

export const rateLimitExceeded = (res: Response, message = 'Rate limit exceeded'): Response =>
  error(res, message, HttpStatusCode.TOO_MANY_REQUESTS);

export const internalError = (
  res: Response,
  message = 'Internal server error',
  err?: Error,
): Response => {
  if (err) logger.error({ message: err.message, stack: err.stack }, 'Internal Server Error');
  return error(res, message, HttpStatusCode.INTERNAL_SERVER_ERROR);
};

export const paginated = <T>(
  res: Response,
  data: T,
  totalItems: number,
  currentPage: number,
  itemsPerPage: number,
  message = 'Data retrieved successfully',
): Response => {
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const hasNextPage = currentPage < totalPages;
  const hasPrevPage = currentPage > 1;
  const meta: ResponseMeta = {
    pagination: {
      currentPage,
      totalPages,
      totalItems,
      itemsPerPage,
      hasNextPage,
      hasPrevPage,
      nextPage: hasNextPage ? currentPage + 1 : null,
      prevPage: hasPrevPage ? currentPage - 1 : null,
    },
  };
  return success(res, data, message, HttpStatusCode.OK, meta);
};

export const created = <T>(
  res: Response,
  data: T,
  message = 'Resource created successfully',
): Response => success(res, data, message, HttpStatusCode.CREATED);

export const noContent = (res: Response): Response => res.status(HttpStatusCode.NO_CONTENT).send();

export const createValidationError = (
  field: string,
  message: string,
  code?: string,
  value?: unknown,
): ValidationError => ({ field, message, code, value });

export const createValidationErrors = (
  errors: Array<{ field: string; message: string; code?: string; value?: unknown }>,
): ValidationError[] => {
  return errors.map((error) =>
    createValidationError(error.field, error.message, error.code, error.value),
  );
};

export const Res = {
  success,
  error,
  validationError,
  notFound,
  unauthorized,
  forbidden,
  badRequest,
  conflict,
  rateLimitExceeded,
  internalError,
  paginated,
  created,
  noContent,
};
