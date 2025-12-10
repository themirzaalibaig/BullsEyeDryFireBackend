import { Request, Response, NextFunction, RequestHandler } from 'express';

export const catchAsync = (
  fn: (req: Request | any, res: Response, next: NextFunction) => Promise<any>,
): RequestHandler => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

export function wrapAsyncMethods<T extends object>(controller: T): T {
  const proto = Object.getPrototypeOf(controller);

  for (const key of Object.getOwnPropertyNames(proto)) {
    const value = (controller as any)[key];

    if (typeof value === 'function' && key !== 'constructor') {
      (controller as any)[key] = function (req: any, res: any, next: any) {
        Promise.resolve(value.call(controller, req, res, next)).catch(next);
      };
    }
  }

  return controller;
}
