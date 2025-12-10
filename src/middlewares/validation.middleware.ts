import { NextFunction, Response } from 'express';
import z, { ZodSchema } from 'zod';
import { ValidationError } from '@/types';
import { formatZodErrors, logger, Res } from '@/utils';
import { TypedRequest } from '@/types';

export interface ValidationOptions {
  body?: ZodSchema;
  query?: ZodSchema;
  params?: ZodSchema;
  headers?: ZodSchema;
  skipOnError?: boolean;
}

/**
 * Helper – infer the Zod types for the request parts that are present.
 */
type InferSchema<T extends ZodSchema | undefined> = T extends ZodSchema ? z.infer<T> : unknown;

/**
 * Build the final request type from the options.
 */
type ValidationReq<Opts extends ValidationOptions> = TypedRequest<
  InferSchema<Opts['query']>,
  InferSchema<Opts['body']>,
  InferSchema<Opts['params']>
>;

export const validate = <Opts extends ValidationOptions>(schema: ZodSchema | Opts) => {
  return (req: ValidationReq<Opts>, res: Response, next: NextFunction): void => {
    logger.info({ method: req.method, path: req.path }, 'VALIDATION MIDDLEWARE');

    // -----------------------------------------------------------------
    // Normalise the incoming schema into an options object
    // -----------------------------------------------------------------
    let options: ValidationOptions;

    // 1. Single schema (e.g. `z.object({ … })`)
    if ('safeParse' in (schema as any)) {
      const shape = (schema as any).shape;
      if (shape?.body || shape?.query || shape?.params || shape?.headers) {
        // Object with named keys (body, query, …)
        options = {
          body: shape.body,
          query: shape.query,
          params: shape.params,
          headers: shape.headers,
        };
      } else {
        // Plain body schema
        options = { body: schema as ZodSchema };
      }
    } else {
      // Already an options object
      options = schema as ValidationOptions;
    }

    // -----------------------------------------------------------------
    // Run validation
    // -----------------------------------------------------------------
    try {
      const errors: ValidationError[] = [];

      // ---- BODY -------------------------------------------------------
      if (options.body) {
        const result = options.body.safeParse(req.body);
        if (!result.success) {
          errors.push(...formatZodErrors(result.error, 'body'));
        } else {
          Object.assign(req.body as any, result.data);
        }
      }

      // ---- QUERY ------------------------------------------------------
      if (options.query) {
        const result = options.query.safeParse(req.query);
        if (!result.success) {
          errors.push(...formatZodErrors(result.error, 'query'));
        } else {
          Object.assign(req.query as any, result.data);
        }
      }

      // ---- PARAMS -----------------------------------------------------
      if (options.params) {
        const result = options.params.safeParse(req.params);
        if (!result.success) {
          errors.push(...formatZodErrors(result.error, 'params'));
        } else {
          Object.assign(req.params as any, result.data);
        }
      }

      // ---- HEADERS ----------------------------------------------------
      if (options.headers) {
        const result = options.headers.safeParse(req.headers);
        if (!result.success) {
          errors.push(...formatZodErrors(result.error, 'headers'));
        } else {
          (req as any).validated = (req as any).validated || {};
          (req as any).validated.headers = result.data;
        }
      }

      if (errors.length > 0) {
        logger.warn({ errors, path: req.path, method: req.method }, 'Validation errors');
        Res.validationError(res, errors);
        return;
      }

      next();
    } catch (error) {
      logger.error(
        {
          error: error instanceof Error ? error.message : 'Unknown error',
          path: req.path,
          method: req.method,
        },
        'Validation middleware error',
      );
      Res.internalError(res, 'Validation processing failed');
    }
  };
};
