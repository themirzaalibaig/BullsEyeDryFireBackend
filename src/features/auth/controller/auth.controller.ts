import { Response } from 'express';
import { AuthService } from '@/features/auth/service/auth.service';
import { Res, catchAsync } from '@/utils';
import {
  SignupInput,
  LoginInput,
  VerifyOtpInput,
  ResendOtpInput,
  ForgotPasswordInput,
  ResetPasswordInput,
  RefreshTokenInput,
  ChangePasswordInput,
  UpdateProfileInput,
  GoogleAuthInput,
  GuestLoginInput,
  ConvertGuestToRegisteredInput,
} from '@/features/auth/validation/auth.validations';
import { TypedRequest } from '@/types';
import { AuthenticatedRequest } from '@/middlewares/auth.middleware';

export class AuthController {
  static signup = catchAsync(async (req: TypedRequest<unknown, SignupInput>, res: Response) => {
    const data = await AuthService.signup(req.body);
    return Res.created(res, data, 'Please verify your email.');
  });

  static login = catchAsync(async (req: TypedRequest<unknown, LoginInput>, res: Response) => {
    const data = await AuthService.login(req.body);
    return Res.success(res, data, 'Login successful');
  });

  static verifyOtp = catchAsync(
    async (req: TypedRequest<unknown, VerifyOtpInput>, res: Response) => {
      const data = await AuthService.verifyOtp(req.body);
      return Res.success(res, data, 'Email verified successfully');
    },
  );

  static resendOtp = catchAsync(
    async (req: TypedRequest<unknown, ResendOtpInput>, res: Response) => {
      const data = await AuthService.resendOtp(req.body);
      return Res.success(res, data, 'OTP sent successfully');
    },
  );

  static forgotPassword = catchAsync(
    async (req: TypedRequest<unknown, ForgotPasswordInput>, res: Response) => {
      const data = await AuthService.forgotPassword(req.body);
      return Res.success(res, data, 'Password reset code sent');
    },
  );

  static resetPassword = catchAsync(
    async (req: TypedRequest<unknown, ResetPasswordInput>, res: Response) => {
      const data = await AuthService.resetPassword(req.body);
      return Res.success(res, data, 'Password reset successfully');
    },
  );

  static refreshToken = catchAsync(
    async (req: TypedRequest<unknown, RefreshTokenInput>, res: Response) => {
      const data = await AuthService.refreshToken(req.body);
      return Res.success(res, data, 'Token refreshed successfully');
    },
  );

  static logout = catchAsync(
    async (req: AuthenticatedRequest<unknown, RefreshTokenInput>, res: Response) => {
      const data = await AuthService.logout(req.user.id, req.body.refreshToken);
      return Res.success(res, data, 'Logged out successfully');
    },
  );

  static getMe = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const data = await AuthService.getMe(req.user.id);
    return Res.success(res, data, 'Profile retrieved successfully');
  });

  static updateProfile = catchAsync(
    async (req: AuthenticatedRequest<unknown, UpdateProfileInput>, res: Response) => {
      const data = await AuthService.updateProfile(req.user.id, req.body);
      return Res.success(res, data, 'Profile updated successfully');
    },
  );

  static changePassword = catchAsync(
    async (req: AuthenticatedRequest<unknown, ChangePasswordInput>, res: Response) => {
      const data = await AuthService.changePassword(req.user.id, req.body);
      return Res.success(res, data, 'Password changed successfully');
    },
  );

  static googleAuth = catchAsync(
    async (req: TypedRequest<unknown, GoogleAuthInput>, res: Response) => {
      const data = await AuthService.googleAuth(req.body);
      return Res.success(res, data, 'Google authentication successful');
    },
  );

  static guestLogin = catchAsync(
    async (req: TypedRequest<unknown, GuestLoginInput>, res: Response) => {
      const data = await AuthService.guestLogin(req.body);
      return Res.success(res, data, 'Guest login successful');
    },
  );

  static convertGuestToRegistered = catchAsync(
    async (req: AuthenticatedRequest<unknown, ConvertGuestToRegisteredInput>, res: Response) => {
      const data = await AuthService.convertGuestToRegistered(req.user.id, req.body);
      return Res.success(res, data, 'Account converted to registered successfully');
    },
  );
}
