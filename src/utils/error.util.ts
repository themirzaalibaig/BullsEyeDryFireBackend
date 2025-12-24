import { HttpStatusCode, ValidationError } from '@/types';

export class AppError extends Error {
  public readonly statusCode: HttpStatusCode;
  public readonly isOperational: boolean;
  public readonly errors?: ValidationError[];

  constructor(
    message: string,
    statusCode: HttpStatusCode = HttpStatusCode.INTERNAL_SERVER_ERROR,
    errors?: ValidationError[],
    isOperational = true,
  ) {
    super(message);
    Object.setPrototypeOf(this, new.target.prototype);

    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.errors = errors;

    Error.captureStackTrace(this);
  }

  static badRequest(message: string, errors?: ValidationError[]): AppError {
    return new AppError(message, HttpStatusCode.BAD_REQUEST, errors);
  }

  static unauthorized(message = 'Unauthorized access', errors?: ValidationError[]): AppError {
    return new AppError(message, HttpStatusCode.UNAUTHORIZED, errors);
  }

  static forbidden(message = 'Access forbidden', errors?: ValidationError[]): AppError {
    return new AppError(message, HttpStatusCode.FORBIDDEN, errors);
  }

  static notFound(message = 'Resource not found', errors?: ValidationError[]): AppError {
    return new AppError(message, HttpStatusCode.NOT_FOUND, errors);
  }

  static conflict(message = 'Resource conflict', errors?: ValidationError[]): AppError {
    return new AppError(message, HttpStatusCode.CONFLICT, errors);
  }

  static validation(message = 'Validation failed', errors?: ValidationError[]): AppError {
    return new AppError(message, HttpStatusCode.UNPROCESSABLE_ENTITY, errors);
  }

  static internalError(message = 'Internal server error', errors?: ValidationError[]): AppError {
    return new AppError(message, HttpStatusCode.INTERNAL_SERVER_ERROR, errors);
  }
}
