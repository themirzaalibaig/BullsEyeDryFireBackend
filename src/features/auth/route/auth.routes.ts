import { Router } from 'express';
import { AuthController } from '@/features/auth/controller/auth.controller';
import { validate, idempotency, authenticate } from '@/middlewares';
import {
  signupSchema,
  loginSchema,
  verifyOtpSchema,
  resendOtpSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  refreshTokenSchema,
  changePasswordSchema,
  updateProfileSchema,
  googleAuthSchema,
  guestLoginSchema,
  convertGuestToRegisteredSchema,
} from '@/features/auth/validation/auth.validations';
import { z } from 'zod';

export const authRouter = Router();

/**
 * @route POST /signup
 * @desc Signup a new user
 * @access Public
 */
authRouter.post(
  '/signup',
  validate(z.object({ body: signupSchema })),
  idempotency('Signup'),
  AuthController.signup,
);

/**
 * @route POST /login
 * @desc Login a user
 * @access Public
 */
authRouter.post('/login', validate(z.object({ body: loginSchema })), AuthController.login);

/**
 * @route POST /google
 * @desc Google OAuth sign-in/sign-up
 * @access Public
 */
authRouter.post(
  '/google',
  validate(z.object({ body: googleAuthSchema })),
  AuthController.googleAuth,
);

/**
 * @route POST /guest
 * @desc Continue as guest - creates temporary guest account
 * @access Public
 */
authRouter.post(
  '/guest',
  validate(z.object({ body: guestLoginSchema })),
  AuthController.guestLogin,
);

/**
 * @route POST /verify-otp
 * @desc Verify OTP for email verification or password reset
 * @access Public
 */
authRouter.post(
  '/verify-otp',
  validate(z.object({ body: verifyOtpSchema })),
  AuthController.verifyOtp,
);

/**
 * @route POST /resend-otp
 * @desc Resend OTP code
 * @access Public
 */
authRouter.post(
  '/resend-otp',
  validate(z.object({ body: resendOtpSchema })),
  AuthController.resendOtp,
);

/**
 * @route POST /forgot-password
 * @desc Trigger forgot password flow (sends OTP)
 * @access Public
 */
authRouter.post(
  '/forgot-password',
  validate(z.object({ body: forgotPasswordSchema })),
  AuthController.forgotPassword,
);

/**
 * @route POST /reset-password
 * @desc Reset password with OTP
 * @access Public
 */
authRouter.post(
  '/reset-password',
  validate(z.object({ body: resetPasswordSchema })),
  AuthController.resetPassword,
);

/**
 * @route POST /refresh-token
 * @desc Refresh access token
 * @access Public
 */
authRouter.post(
  '/refresh-token',
  validate(z.object({ body: refreshTokenSchema })),
  AuthController.refreshToken,
);

/**
 * @route POST /logout
 * @desc Logout user (blacklist refresh token)
 * @access Private
 */
authRouter.post(
  '/logout',
  authenticate,
  validate(z.object({ body: refreshTokenSchema })),
  AuthController.logout,
);

/**
 * @route GET /me
 * @desc Get current user
 * @access Private
 */
authRouter.get('/me', authenticate, AuthController.getMe);

/**
 * @route PUT /change-password
 * @desc Change password for authenticated user
 * @access Private
 */
authRouter.put(
  '/change-password',
  authenticate,
  validate(z.object({ body: changePasswordSchema })),
  AuthController.changePassword,
);

/**
 * @route PUT /profile
 * @desc Update user profile
 * @access Private
 */
authRouter.put(
  '/profile',
  authenticate,
  validate(z.object({ body: updateProfileSchema })),
  AuthController.updateProfile,
);

/**
 * @route POST /convert-guest
 * @desc Convert guest account to registered account
 * @access Private (Guest users only)
 */
authRouter.post(
  '/convert-guest',
  authenticate,
  validate(z.object({ body: convertGuestToRegisteredSchema })),
  AuthController.convertGuestToRegistered,
);
