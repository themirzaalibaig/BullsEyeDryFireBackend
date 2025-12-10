import { ValidationError } from '@/types';
import { ZodError } from 'zod';

export const formatZodErrors = (zodError: ZodError, prefix: string): ValidationError[] => {
  return zodError.issues.map((issue: any) => {
    const field =
      prefix === 'body' && issue.path.length > 0
        ? issue.path.join('.')
        : prefix + (issue.path.length > 0 ? '.' + issue.path.join('.') : '');

    return {
      field,
      message: issue.message,
      code: issue.code,
      value:
        issue.path.length > 0 && (issue as any).input
          ? getNestedValue((issue as any).input, issue.path)
          : undefined,
    };
  });
};

export const getNestedValue = (obj: any, path: (string | number)[]): any => {
  return path.reduce((cur, key) => cur?.[key], obj);
};
