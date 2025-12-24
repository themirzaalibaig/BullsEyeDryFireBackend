import { z } from 'zod';
import { commonSchemas } from '@/validations';

export const signupSchema = z.object({
  username: commonSchemas.username,
  email: commonSchemas.email,
  phone: commonSchemas.phone.optional(),
  password: commonSchemas.password,
  signupMethod: z.enum(['EMAIL', 'GOOGLE']).optional().default('EMAIL'),
});

export const loginSchema = z.object({
  email: commonSchemas.email,
  password: z.string().min(1, 'Password is required'),
});

export const verifyOtpSchema = z.object({
  email: commonSchemas.email,
  otp: z.string().regex(/^\d{6}$/, 'OTP code must be 6 digits'),
  type: z.enum(['forgotPassword', 'emailVerification']).optional().default('emailVerification'),
});

export const resendOtpSchema = z.object({
  email: commonSchemas.email,
  type: z.enum(['forgotPassword', 'emailVerification']).optional().default('emailVerification'),
});

export const forgotPasswordSchema = z.object({
  email: commonSchemas.email,
});

export const resetPasswordSchema = z.object({
  email: commonSchemas.email,
  password: commonSchemas.password,
});

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: commonSchemas.password,
});

export const updateProfileSchema = z.object({
  username: commonSchemas.username.optional(),
  phone: commonSchemas.phone.optional(),
  profilePicture: z.string().url().optional(),
});

export const googleAuthSchema = z.object({
  idToken: z.string().min(1, 'Firebase ID token is required'),
  username: commonSchemas.username.optional(),
});

export const guestLoginSchema = z.object({
  username: commonSchemas.username.optional(),
});

export const convertGuestToRegisteredSchema = z.object({
  email: commonSchemas.email,
  password: commonSchemas.password,
  username: commonSchemas.username.optional(),
});

export const authIdSchema = z.object({
  id: commonSchemas.uuid,
});

export type AuthIdInput = z.infer<typeof authIdSchema>;
export type SignupInput = z.infer<typeof signupSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type VerifyOtpInput = z.infer<typeof verifyOtpSchema>;
export type ResendOtpInput = z.infer<typeof resendOtpSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type RefreshTokenInput = z.infer<typeof refreshTokenSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type GoogleAuthInput = z.infer<typeof googleAuthSchema>;
export type GuestLoginInput = z.infer<typeof guestLoginSchema>;
export type ConvertGuestToRegisteredInput = z.infer<typeof convertGuestToRegisteredSchema>;
