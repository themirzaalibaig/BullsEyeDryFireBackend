import { AuthRepository } from '@/features/auth/repository/auth.repository';
import { prisma } from '@/config';
import { AuthType } from '@/features/auth/type/auth.type';
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
import { AuthDto } from '@/features/auth/dto/auth.dto';
import {
  AppError,
  hashPassword,
  comparePassword,
  generateTokens,
  verifyRefreshToken,
  sendEmail,
  getVerificationEmailTemplate,
  getForgotPasswordEmailTemplate,
  logger,
  verifyFirebaseToken,
} from '@/utils';
import { HttpStatusCode } from '@/types';

export class AuthService {
  /**
   * Generate a 6-digit OTP code
   */
  private static generateOtp(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  /**
   * Sign up a new user
   */
  static async signup(payload: SignupInput) {
    // Check if user already exists
    const existingUser = await AuthRepository.findByEmail(payload.email);
    if (existingUser) {
      throw new AppError('Email already exists', HttpStatusCode.CONFLICT, [
        { field: 'email', message: 'Email already exists' },
      ]);
    }

    // // Check phone if provided
    // if (payload.phone) {
    //   const existingPhone = await AuthRepository.findByPhone(payload.phone);
    //   if (existingPhone) {
    //     throw AppError.conflict('Phone number already exists');
    //   }
    // }

    // Generate OTP
    const otpCode = this.generateOtp();
    const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Create user
    const user = await AuthRepository.create(payload);

    // Update OTP after creation
    await AuthRepository.updateOtp(payload.email, otpCode, otpExpiresAt);

    // Cache OTP
    await AuthRepository.setOtpCache(payload.email, 'emailVerification', otpCode);

    // Send verification email
    try {
      const emailHtml = getVerificationEmailTemplate(otpCode);
      await sendEmail(payload.email, 'Verify Your Email Address', emailHtml);
      logger.info({ email: payload.email }, 'Verification email sent');
    } catch (error) {
      logger.error({ error, email: payload.email }, 'Failed to send verification email');
      // Don't fail signup if email fails
    }

    return AuthDto.toSignupResponse(user);
  }

  /**
   * Login user
   */
  static async login(payload: LoginInput) {
    // Find user with password
    const user = await AuthRepository.findByEmailWithPassword(payload.email);
    if (!user) {
      throw AppError.unauthorized('Invalid email or password', [
        { field: 'email', message: 'Invalid email or password' },
      ]);
    }

    // Check if user is active
    if (!user.isActive) {
      throw AppError.forbidden('Account is deactivated', [
        { field: 'email', message: 'Account is deactivated' },
      ]);
    }

    // Check if user is deleted
    if (user.isDeleted) {
      throw AppError.forbidden('Account has been deleted', [
        { field: 'email', message: 'Account has been deleted' },
      ]);
    }

    // Verify password
    const isPasswordValid = await comparePassword(payload.password, user.password);
    if (!isPasswordValid) {
      throw AppError.unauthorized('Invalid email or password', [
        { field: 'email', message: 'Invalid email or password' },
      ]);
    }

    // Check email verification
    if (!user.isEmailVerified) {
      throw AppError.unauthorized('Please verify your email before logging in', [
        { field: 'email', message: 'Please verify your email before logging in' },
      ]);
    }

    // Generate tokens
    const tokenPayload = {
      id: user.id,
      email: user.email,
      role: user.role,
    };
    const token = generateTokens(tokenPayload);

    // Update refresh token in database
    await AuthRepository.updateRefreshToken(user.id, token.refreshToken);

    return AuthDto.toLoginResponse(user, token);
  }

  /**
   * Verify OTP for signup or password reset
   */
  static async verifyOtp(payload: VerifyOtpInput) {
    const { email, otp, type } = payload;

    // Get cached OTP
    const cachedOtp = await AuthRepository.getOtpCache(email, type);
    if (!cachedOtp || cachedOtp !== otp) {
      // Also check database as fallback
      const user = await AuthRepository.findByEmail(email, false);
      const userWithOtp = user as any;
      if (!user || !userWithOtp.otpCode || userWithOtp.otpCode !== otp) {
        throw AppError.badRequest('Invalid or expired OTP code', [
          { field: 'otp', message: 'Invalid or expired OTP code' },
        ]);
      }

      // Check expiration
      if (!userWithOtp.otpExpiresAt || new Date(userWithOtp.otpExpiresAt) < new Date()) {
        throw AppError.badRequest('OTP code has expired', [
          { field: 'otp', message: 'OTP code has expired' },
        ]);
      }
    }

    // Verify based on type
    if (type === 'emailVerification') {
      const user = await AuthRepository.verifyEmail(email);
      await AuthRepository.deleteOtpCache(email, type);
      logger.info({ email }, 'Email verified successfully');

      const tokenPayload = {
        id: user.id,
        email: user.email,
        role: user.role,
      };
      const token = generateTokens(tokenPayload);
      await AuthRepository.updateRefreshToken(user.id, token.refreshToken);
      return AuthDto.toLoginResponse(user, token);
    } else if (type === 'forgotPassword') {
      // Just verify OTP, don't update password yet
      await AuthRepository.deleteOtpCache(email, type);
      return { verified: true, email };
    }

    throw AppError.badRequest('Invalid verification type');
  }

  /**
   * Resend OTP
   */
  static async resendOtp(payload: ResendOtpInput) {
    const { email, type } = payload;

    const user = await AuthRepository.findByEmail(email);
    if (!user) {
      throw AppError.notFound('User not found');
    }

    // Generate new OTP
    const otpCode = this.generateOtp();
    const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Update OTP in database
    await AuthRepository.updateOtp(email, otpCode, otpExpiresAt);

    // Cache OTP
    await AuthRepository.setOtpCache(email, type, otpCode);

    // Send email
    try {
      const emailHtml =
        type === 'forgotPassword'
          ? getForgotPasswordEmailTemplate(otpCode)
          : getVerificationEmailTemplate(otpCode);
      const subject =
        type === 'forgotPassword' ? 'Reset Your Password' : 'Verify Your Email Address';
      await sendEmail(email, subject, emailHtml);
      logger.info({ email, type }, 'OTP email sent');
    } catch (error) {
      logger.error({ error, email, type }, 'Failed to send OTP email');
      throw AppError.badRequest('Failed to send OTP email');
    }

    return { email };
  }

  /**
   * Forgot password - send OTP
   */
  static async forgotPassword(payload: ForgotPasswordInput) {
    const { email } = payload;

    const user = await AuthRepository.findByEmail(email);
    if (!user) {
      throw AppError.notFound('User not found', [{ field: 'email', message: 'User not found' }]);
    }

    // Generate OTP
    const otpCode = this.generateOtp();
    const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Update OTP in database
    await AuthRepository.updateOtp(email, otpCode, otpExpiresAt);

    // Cache OTP
    await AuthRepository.setOtpCache(email, 'forgotPassword', otpCode);

    // Send email
    try {
      const emailHtml = getForgotPasswordEmailTemplate(otpCode);
      await sendEmail(email, 'Reset Your Password', emailHtml);
      logger.info({ email }, 'Password reset email sent');
    } catch (error) {
      logger.error({ error, email }, 'Failed to send password reset email');
      throw AppError.badRequest('Failed to send password reset email');
    }

    return { email };
  }

  /**
   * Reset password with OTP
   */
  static async resetPassword(payload: ResetPasswordInput) {
    const { email, password } = payload;

    const user = await AuthRepository.findByEmail(email, false);
    if (!user) {
      throw AppError.notFound('User not found', [{ field: 'email', message: 'User not found' }]);
    }
    // Hash and update password (Prisma extension will hash it automatically)
    const updatedUser = await AuthRepository.updatePassword(email, password);

    // Delete OTP cache
    await AuthRepository.deleteOtpCache(email, 'forgotPassword');

    return AuthDto.toResponse(updatedUser);
  }

  /**
   * Refresh access token
   */
  static async refreshToken(payload: RefreshTokenInput) {
    const { refreshToken } = payload;

    // Check if token is blacklisted
    const isBlacklisted = await AuthRepository.isTokenBlacklisted(refreshToken);
    if (isBlacklisted) {
      throw AppError.unauthorized('Token has been revoked');
    }

    // Verify refresh token
    let decoded: any;
    try {
      decoded = verifyRefreshToken(refreshToken);
    } catch {
      throw AppError.unauthorized('Invalid or expired refresh token');
    }

    // Find user
    const user = await AuthRepository.findById(decoded.id);
    if (!user) {
      throw AppError.unauthorized('User not found');
    }

    // Verify refresh token matches database
    if (user.refreshToken !== refreshToken) {
      throw AppError.unauthorized('Invalid refresh token');
    }

    // Check if user is active
    if (!user.isActive || user.isDeleted) {
      throw AppError.forbidden('Account is deactivated or deleted');
    }

    // Generate new tokens
    const tokenPayload = {
      id: user.id,
      email: user.email,
      role: user.role,
    };
    const { accessToken, refreshToken: newRefreshToken } = generateTokens(tokenPayload);

    // Update refresh token in database
    await AuthRepository.updateRefreshToken(user.id, newRefreshToken);

    return AuthDto.toLoginResponse(user, { accessToken, refreshToken: newRefreshToken });
  }

  /**
   * Logout user
   */
  static async logout(userId: string, refreshToken: string) {
    // Blacklist refresh token
    const decoded = verifyRefreshToken(refreshToken) as any;
    if (decoded && decoded.exp) {
      const expiresIn = decoded.exp - Math.floor(Date.now() / 1000);
      if (expiresIn > 0) {
        await AuthRepository.blacklistToken(refreshToken, expiresIn);
      }
    }

    // Clear refresh token from database
    await AuthRepository.updateRefreshToken(userId, null);

    return { message: 'Logged out successfully' };
  }

  /**
   * Change password (for authenticated users)
   */
  static async changePassword(userId: string, payload: ChangePasswordInput) {
    const { currentPassword, newPassword } = payload;

    // Get user with password
    const user = await AuthRepository.findByEmailWithPassword(
      (await AuthRepository.findById(userId))?.email || '',
    );
    if (!user || user.id !== userId) {
      throw AppError.notFound('User not found');
    }

    // Verify current password
    const isPasswordValid = await comparePassword(currentPassword, user.password);
    if (!isPasswordValid) {
      throw AppError.badRequest('Current password is incorrect');
    }

    // Hash new password
    const hashedPassword = await hashPassword(newPassword);

    // Update password
    const updatedUser = await AuthRepository.updatePassword(user.email, hashedPassword);

    return AuthDto.toResponse(updatedUser);
  }

  /**
   * Get current user profile
   */
  static async getMe(userId: string) {
    const user = await AuthRepository.findById(userId);
    if (!user) {
      throw AppError.notFound('User not found');
    }
    return AuthDto.toResponse(user);
  }

  /**
   * Update user profile
   */
  static async updateProfile(userId: string, data: UpdateProfileInput) {
    const user = await AuthRepository.updateProfile(userId, data);
    return AuthDto.toResponse(user);
  }

  /**
   * Google OAuth sign-in/sign-up
   */
  static async googleAuth(payload: GoogleAuthInput) {
    const { idToken, username } = payload;

    // Verify Firebase ID token
    const firebaseUser = await verifyFirebaseToken(idToken);

    if (!firebaseUser.email) {
      throw AppError.badRequest('Email is required for Google authentication', [
        { field: 'idToken', message: 'Email is required for Google authentication' },
      ]);
    }

    // Check if user already exists
    let user = await AuthRepository.findByEmail(firebaseUser.email);

    if (user) {
      // User exists - check if they're using Google sign-in
      if (user.signupMethod !== 'GOOGLE') {
        throw AppError.conflict(
          'An account with this email already exists. Please use email/password login.',
          [{ field: 'email', message: 'Account already exists with email/password' }],
        );
      }

      // Update user info if needed (profile picture, name, etc.)
      const updateData: any = {};
      if (firebaseUser.picture && firebaseUser.picture !== user.profilePicture) {
        updateData.profilePicture = firebaseUser.picture;
      }
      if (firebaseUser.name && firebaseUser.name !== user.username) {
        // Only update username if it's not set or matches the pattern
        if (!user.username || user.username === user.email.split('@')[0]) {
          updateData.username = firebaseUser.name;
        }
      }
      if (firebaseUser.emailVerified && !user.isEmailVerified) {
        updateData.isEmailVerified = true;
      }

      if (Object.keys(updateData).length > 0) {
        user = await AuthRepository.updateProfile(user.id, updateData);
      }

      // Check if user is active
      if (!user.isActive || user.isDeleted) {
        throw AppError.forbidden('Account is deactivated or deleted', [
          { field: 'email', message: 'Account is deactivated or deleted' },
        ]);
      }

      // Generate tokens
      const tokenPayload = {
        id: user.id,
        email: user.email,
        role: user.role,
      };
      const token = generateTokens(tokenPayload);

      // Update refresh token
      await AuthRepository.updateRefreshToken(user.id, token.refreshToken);

      return AuthDto.toLoginResponse(user, token);
    } else {
      // New user - create account
      const generatedUsername = username || firebaseUser.name || firebaseUser.email.split('@')[0];

      // Generate a random password since Prisma extension requires it
      const randomPassword = `google_${Date.now()}_${Math.random().toString(36).slice(2)}`;

      // Create user with Google signup
      const newUser = await AuthRepository.create({
        username: generatedUsername,
        email: firebaseUser.email,
        phone: firebaseUser.phoneNumber || undefined,
        password: randomPassword, // Random password for Google auth users
        signupMethod: 'GOOGLE',
        isEmailVerified: firebaseUser.emailVerified,
        profilePicture: firebaseUser.picture,
        userType: 'REGISTERED',
      });

      // Update user with additional info if needed
      const updateData: any = {};
      if (firebaseUser.emailVerified && !newUser.isEmailVerified) {
        updateData.isEmailVerified = true;
      }
      if (firebaseUser.picture && firebaseUser.picture !== newUser.profilePicture) {
        updateData.profilePicture = firebaseUser.picture;
      }

      let finalUser = newUser;
      if (Object.keys(updateData).length > 0) {
        finalUser = await AuthRepository.updateProfile(newUser.id, updateData);
      }

      // Generate tokens
      const tokenPayload = {
        id: finalUser.id,
        email: finalUser.email,
        role: finalUser.role,
      };
      const token = generateTokens(tokenPayload);

      // Update refresh token
      await AuthRepository.updateRefreshToken(finalUser.id, token.refreshToken);

      logger.info({ email: finalUser.email, userId: finalUser.id }, 'Google user created');
      return AuthDto.toLoginResponse(finalUser, token);
    }
  }

  /**
   * Guest login - creates a temporary guest account
   */
  static async guestLogin(payload: GuestLoginInput) {
    const { username } = payload;

    // Generate unique guest email
    const timestamp = Date.now();
    const randomSuffix = Math.random().toString(36).substring(2, 9);
    const guestEmail = `guest_${timestamp}_${randomSuffix}@guest.local`;

    // Generate unique username if not provided
    const guestUsername = username || `Guest_${timestamp.toString().slice(-6)}`;

    // Generate random password (required by schema, but won't be used for login)
    const randomPassword = `guest_${timestamp}_${Math.random().toString(36).slice(2)}`;

    // Create guest user
    const guestUser = await AuthRepository.create({
      username: guestUsername,
      email: guestEmail,
      password: randomPassword,
      signupMethod: 'EMAIL',
      userType: 'GUEST',
      isEmailVerified: true, // Guests don't need email verification
    });

    // Generate tokens
    const tokenPayload = {
      id: guestUser.id,
      email: guestUser.email,
      role: guestUser.role,
    };
    const token = generateTokens(tokenPayload);

    // Update refresh token
    await AuthRepository.updateRefreshToken(guestUser.id, token.refreshToken);

    logger.info({ userId: guestUser.id, username: guestUsername }, 'Guest user created');
    return AuthDto.toLoginResponse(guestUser, token);
  }

  /**
   * Convert guest user to registered user
   */
  static async convertGuestToRegistered(userId: string, payload: ConvertGuestToRegisteredInput) {
    const { email, password, username } = payload;

    // Get current user
    const user = await AuthRepository.findById(userId);
    if (!user) {
      throw AppError.notFound('User not found');
    }

    // Check if user is a guest
    if (user.userType !== 'GUEST') {
      throw AppError.badRequest('User is already registered', [
        { field: 'userType', message: 'User is already registered' },
      ]);
    }

    // Check if email already exists
    const existingUser = await AuthRepository.findByEmail(email);
    if (existingUser && existingUser.id !== userId) {
      throw AppError.conflict('Email already exists', [
        { field: 'email', message: 'Email already exists' },
      ]);
    }

    // Update user to registered
    await AuthRepository.updateProfile(userId, {
      email,
      password,
      username: username || user.username,
      signupMethod: 'EMAIL',
    });

    // Update userType and email verification status
    const finalUser = await prisma.user.update({
      where: { id: userId },
      data: {
        userType: 'REGISTERED',
        isEmailVerified: false, // Require email verification for registered users
      },
    });

    // Generate new tokens
    const tokenPayload = {
      id: finalUser.id,
      email: finalUser.email,
      role: finalUser.role,
    };
    const token = generateTokens(tokenPayload);

    // Update refresh token
    await AuthRepository.updateRefreshToken(finalUser.id, token.refreshToken);

    // Send verification email
    const otpCode = this.generateOtp();
    const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
    await AuthRepository.updateOtp(email, otpCode, otpExpiresAt);
    await AuthRepository.setOtpCache(email, 'emailVerification', otpCode);

    try {
      const emailHtml = getVerificationEmailTemplate(otpCode);
      await sendEmail(email, 'Verify Your Email Address', emailHtml);
      logger.info(
        { email, userId: finalUser.id },
        'Verification email sent after guest conversion',
      );
    } catch (error) {
      logger.error({ error, email }, 'Failed to send verification email');
      // Don't fail conversion if email fails
    }

    logger.info({ userId: finalUser.id, email }, 'Guest converted to registered user');
    return AuthDto.toLoginResponse(finalUser as AuthType, token);
  }
}
