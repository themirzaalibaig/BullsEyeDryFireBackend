// import { AuthenticatedRequest } from '@/middlewares/auth.middleware';
// import { AppError } from './error.util';
// import { UserRole } from '@/enums';

// /**
//  * Get the current authenticated user from request
//  * Throws error if user is not authenticated
//  *
//  * @param req - Express request object with authenticated user
//  * @returns Current user object
//  * @throws AppError if user is not authenticated
//  *
//  * @example
//  * ```typescript
//  * export const myController = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
//  *   const user = getCurrentUser(req);
//  *   // Use user...
//  * });
//  * ```
//  */
// export const getCurrentUser = (req: AuthenticatedRequest) => {
//   if (!req.user) {
//     throw AppError.unauthorized('User not authenticated');
//   }
//   return req.user;
// };

// /**
//  * Get the current user ID from request
//  * Throws error if user is not authenticated
//  *
//  * @param req - Express request object with authenticated user
//  * @returns Current user ID
//  * @throws AppError if user is not authenticated
//  */
// export const getCurrentUserId = (req: AuthenticatedRequest): string => {
//   const user = getCurrentUser(req);
//   return user._id;
// };

// /**
//  * Check if the current user has a specific role
//  *
//  * @param req - Express request object with authenticated user
//  * @param role - Role to check
//  * @returns True if user has the role, false otherwise
//  */
// export const hasRole = (req: AuthenticatedRequest, role: UserRole | string): boolean => {
//   return req.user?.role === role;
// };

// /**
//  * Check if the current user is an admin
//  *
//  * @param req - Express request object with authenticated user
//  * @returns True if user is admin, false otherwise
//  */
// export const isAdmin = (req: AuthenticatedRequest): boolean => {
//   return hasRole(req, UserRole.ADMIN);
// };

// /**
//  * Require a specific role - throws error if user doesn't have the role
//  *
//  * @param req - Express request object with authenticated user
//  * @param role - Required role
//  * @throws AppError if user doesn't have the required role
//  */
// export const requireRole = (req: AuthenticatedRequest, role: UserRole | string): void => {
//   const user = getCurrentUser(req);
//   if (user.role !== role) {
//     throw AppError.forbidden(`Access denied. ${role} role required.`);
//   }
// };

// /**
//  * Require admin role - throws error if user is not admin
//  *
//  * @param req - Express request object with authenticated user
//  * @throws AppError if user is not admin
//  */
// export const requireAdmin = (req: AuthenticatedRequest): void => {
//   requireRole(req, UserRole.ADMIN);
// };
