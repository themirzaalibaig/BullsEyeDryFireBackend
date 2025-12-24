import { NextFunction, Response, RequestHandler } from 'express';
import { AppError, verifyToken, logger, catchAsync, cacheGet, cacheSet, makeKey } from '@/utils';
import { AuthRepository } from '@/features/auth/repository/auth.repository';
import { TypedRequest } from '@/types';
import { JwtPayload } from 'jsonwebtoken';
import { Role } from '@prisma/client';
import { AuthType } from '@/features/auth';

export interface AuthenticatedRequest<Q = unknown, B = unknown, P = unknown> extends TypedRequest<
  Q,
  B,
  P
> {
  user: AuthType;
}

// Cache TTL for user data in middleware
const USER_MIDDLEWARE_CACHE_TTL = 5 * 60; // 5 minutes

/**
 * Authentication middleware - verifies JWT token and attaches user to request
 * Uses caching to reduce database queries
 */
export const authenticate: RequestHandler = catchAsync(
  async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    // Get token from Authorization header or cookies
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith('Bearer ')
      ? authHeader.substring(7)
      : req.cookies?.accessToken;

    if (!token) {
      throw AppError.unauthorized('Authentication required. Please login.');
    }

    // Check if token is blacklisted
    const isBlacklisted = await AuthRepository.isTokenBlacklisted(token);
    if (isBlacklisted) {
      throw AppError.unauthorized('Token has been revoked. Please login again.');
    }

    // Verify token
    let decoded: JwtPayload;
    try {
      decoded = verifyToken(token) as JwtPayload;
    } catch (error: any) {
      logger.warn({ error: error.message }, 'Token verification failed');
      throw AppError.unauthorized('Invalid or expired token. Please login again.');
    }

    const userId = decoded.id;
    if (!userId) {
      throw AppError.unauthorized('Invalid token payload.');
    }

    // Try to get user from cache first
    const cacheKey = makeKey('auth', 'user', userId);
    let cachedUser = await cacheGet<any>(cacheKey);

    if (!cachedUser) {
      // Get user from database
      const user = await AuthRepository.findById(userId);
      if (!user) {
        throw AppError.unauthorized('User not found. Please login again.');
      }

      // Check if user is active and not deleted
      if (!user.isActive || user.isDeleted) {
        throw AppError.forbidden('Account is deactivated or deleted.');
      }

      // Check email verification (skip for guest users)
      if (!user.isEmailVerified && user.userType !== 'GUEST') {
        throw AppError.unauthorized('Please verify your email before accessing this resource.');
      }

      // Cache user data (exclude sensitive fields)
      cachedUser = {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        userType: user.userType,
        isEmailVerified: user.isEmailVerified,
        isActive: user.isActive,
      };
      await cacheSet(cacheKey, cachedUser, USER_MIDDLEWARE_CACHE_TTL);
    }

    // Attach user to request
    req.user = cachedUser;

    logger.debug({ userId: cachedUser.id, email: cachedUser.email }, 'User authenticated');
    next();
  },
);

/**
 * Optional authentication middleware - attaches user if token is valid, but doesn't require it
 */
export const optionalAuth: RequestHandler = catchAsync(
  async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith('Bearer ')
      ? authHeader.substring(7)
      : req.cookies?.accessToken;

    if (!token) {
      return next();
    }

    try {
      // Check if token is blacklisted
      const isBlacklisted = await AuthRepository.isTokenBlacklisted(token);
      if (isBlacklisted) {
        return next();
      }

      const decoded = verifyToken(token) as JwtPayload;
      const userId = decoded.id;

      if (userId) {
        // Try cache first
        const cacheKey = makeKey('auth', 'user', userId);
        let cachedUser = await cacheGet<any>(cacheKey);

        if (!cachedUser) {
          const user = await AuthRepository.findById(userId);
          if (user && user.isActive && !user.isDeleted && user.isEmailVerified) {
            cachedUser = {
              id: user.id,
              username: user.username,
              email: user.email,
              role: user.role,
              userType: user.userType,
              isEmailVerified: user.isEmailVerified,
              isActive: user.isActive,
            };
            await cacheSet(cacheKey, cachedUser, USER_MIDDLEWARE_CACHE_TTL);
          }
        }

        if (cachedUser) {
          req.user = cachedUser;
        }
      }
    } catch (error) {
      logger.debug({ error }, 'Optional auth failed - continuing without user');
    }

    next();
  },
);

/**
 * Authorization middleware - checks if user has required role(s)
 */
export const authorize = (...allowedRoles: Role[]): RequestHandler =>
  catchAsync(
    async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
      if (!req.user) {
        throw AppError.unauthorized('Authentication required');
      }

      if (!allowedRoles.includes(req.user.role)) {
        throw AppError.forbidden(`Access denied. Required roles: ${allowedRoles.join(', ')}`);
      }

      next();
    },
  );

/**
 * Middleware to require email verification
 */
export const requireEmailVerification: RequestHandler = catchAsync(
  async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    if (!req.user) {
      throw AppError.unauthorized('Authentication required');
    }

    if (!req.user.isEmailVerified) {
      throw AppError.forbidden('Please verify your email before accessing this resource.');
    }

    next();
  },
);
