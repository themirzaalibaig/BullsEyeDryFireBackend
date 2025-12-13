// import { NextFunction, Response, RequestHandler } from 'express';
// import { AppError, verifyToken, logger, catchAsync } from '@/utils';
// import { UserModel } from '@/features/auth/model/auth.model';
// import { TypedRequest } from '@/types';
// import { UserRole } from '@/enums';
// import { JwtPayload } from 'jsonwebtoken';

// export interface AuthenticatedRequest<Q = unknown, B = unknown, P = unknown>
//   extends TypedRequest<Q, B, P> {
//   user?: {
//     _id: string;
//     id: string;
//     username: string;
//     email: string;
//     role: string;
//     avatar?: string;
//     fiqh?: string;
//     isVerified: boolean;
//   };
// }

// export const authenticate: RequestHandler = catchAsync(
//   async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
//     const accessToken = req.cookies?.accessToken;

//     if (!accessToken) {
//       throw AppError.unauthorized('Authentication required. Please login.');
//     }

//     let decoded: JwtPayload;
//     try {
//       decoded = verifyToken(accessToken) as JwtPayload;
//     } catch (error: any) {
//       logger.warn({ error: error.message }, 'Token verification failed');
//       throw AppError.unauthorized('Invalid or expired token. Please login again.');
//     }
//     const userId = decoded.id || decoded._id;
//     if (!userId) {
//       throw AppError.unauthorized('Invalid token payload.');
//     }

//     const user = await UserModel.findById(userId).select('-password -token -code');
//     if (!user) {
//       throw AppError.unauthorized('User not found. Please login again.');
//     }

//     if (!user.isVerified) {
//       throw AppError.unauthorized('Please verify your email before accessing this resource.');
//     }

//     req.user = {
//       id: userId,
//       _id: user._id?.toString?.() ?? '',
//       username: user.username,
//       email: user.email,
//       role: user.role,
//       avatar: user.avatar,
//       fiqh: user.fiqh,
//       isVerified: user.isVerified,
//     };

//     logger.debug({ userId: user._id, email: user.email }, 'User authenticated');
//     next();
//   },
// );

// export const optionalAuth: RequestHandler = catchAsync(
//   async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
//     const accessToken = req.cookies?.accessToken;

//     if (!accessToken) {
//       return next();
//     }

//     try {
//       const decoded = verifyToken(accessToken) as JwtPayload;
//       const userId = decoded.id || decoded._id;

//       if (userId) {
//         const user = await UserModel.findById(userId).select('-password -token -code');
//         if (user && user.isVerified) {
//           req.user = {
//             id: userId,
//             _id: user._id?.toString?.() ?? '',
//             username: user.username,
//             email: user.email,
//             role: user.role,
//             avatar: user.avatar,
//             fiqh: user.fiqh,
//             isVerified: user.isVerified,
//           };
//         }
//       }
//     } catch (error) {
//       logger.debug({ error }, 'Optional auth failed - continuing without user');
//     }

//     next();
//   },
// );

// export const authorize = (...allowedRoles: UserRole[]): RequestHandler =>
//   catchAsync(
//     async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
//       if (!req.user) {
//         throw AppError.unauthorized('Authentication required');
//       }

//       if (!allowedRoles.includes(req.user.role as UserRole)) {
//         throw AppError.forbidden(`Access denied. Required roles: ${allowedRoles.join(', ')}`);
//       }

//       next();
//     },
//   );
