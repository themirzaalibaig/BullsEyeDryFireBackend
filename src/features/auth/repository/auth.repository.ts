import { SignupInput } from '@/features/auth/validation/auth.validations';
import { AuthType } from '@/features/auth/type/auth.type';
import { prisma } from '@/config';
import { cacheGet, cacheSet, cacheDel, makeKey } from '@/utils';
import { User } from '@prisma/client';

// Use direct Prisma calls instead of cached repository to avoid type issues
// The Prisma client has extensions that don't match the generic PrismaDelegate type

// Cache TTLs
const USER_CACHE_TTL = 15 * 60; // 15 minutes
const OTP_CACHE_TTL = 10 * 60; // 10 minutes

export class AuthRepository {
  static async create(
    payload: SignupInput & {
      isEmailVerified?: boolean;
      profilePicture?: string;
      userType?: 'GUEST' | 'REGISTERED';
    },
  ): Promise<AuthType> {
    const user = await prisma.user.create({
      data: {
        ...payload,
        isEmailVerified: payload.isEmailVerified ?? false,
        userType: payload.userType ?? 'REGISTERED',
      },
    });
    // Cache the user
    await cacheSet(makeKey('user', user.id), user, USER_CACHE_TTL);
    await cacheSet(makeKey('user', 'email', user.email), user, USER_CACHE_TTL);
    return user as AuthType;
  }

  static async findByEmail(email: string, useCache = true): Promise<AuthType | null> {
    if (useCache) {
      const cacheKey = makeKey('user', 'email', email);
      const cached = await cacheGet<AuthType>(cacheKey);
      if (cached) return cached;
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (user && useCache) {
      const cacheKey = makeKey('user', 'email', email);
      await cacheSet(cacheKey, user, USER_CACHE_TTL);
    }
    return user as AuthType | null;
  }

  static async findByPhone(phone: string, useCache = true): Promise<AuthType | null> {
    if (useCache) {
      const cacheKey = makeKey('user', 'phone', phone);
      const cached = await cacheGet<AuthType>(cacheKey);
      if (cached) return cached;
    }

    const user = await prisma.user.findUnique({ where: { phone } });
    if (user && useCache) {
      const cacheKey = makeKey('user', 'phone', phone);
      await cacheSet(cacheKey, user, USER_CACHE_TTL);
    }
    return user as AuthType | null;
  }

  static async findById(id: string): Promise<AuthType | null> {
    // Try cache first
    const cacheKey = makeKey('user', id);
    const cached = await cacheGet<AuthType>(cacheKey);
    if (cached) return cached;

    const user = await prisma.user.findUnique({ where: { id } });
    if (user) {
      await cacheSet(cacheKey, user, USER_CACHE_TTL);
    }
    return user as AuthType | null;
  }

  static async findByEmailWithPassword(email: string): Promise<User | null> {
    return prisma.user.findUnique({ where: { email } }) as Promise<User | null>;
  }

  static async updateOtp(email: string, otp: string, otpExpiresAt: Date): Promise<AuthType> {
    const user = await prisma.user.update({
      where: { email },
      data: { otpCode: otp, otpExpiresAt },
    });
    // Invalidate cache
    await cacheDel(makeKey('user', 'email', email));
    await cacheDel(makeKey('user', user.id));
    return user as AuthType;
  }

  static async verifyEmail(email: string): Promise<AuthType> {
    const user = await prisma.user.update({
      where: { email },
      data: { isEmailVerified: true, otpCode: null, otpExpiresAt: null },
    });
    // Invalidate cache
    await cacheDel(makeKey('user', 'email', email));
    await cacheDel(makeKey('user', user.id));
    return user as AuthType;
  }

  static async updatePassword(email: string, password: string): Promise<AuthType> {
    const user = await prisma.user.update({
      where: { email },
      data: { password, otpCode: null, otpExpiresAt: null },
    });
    // Invalidate cache
    await cacheDel(makeKey('user', 'email', email));
    await cacheDel(makeKey('user', user.id));
    return user as AuthType;
  }

  static async updateRefreshToken(userId: string, refreshToken: string | null): Promise<AuthType> {
    const user = await prisma.user.update({
      where: { id: userId },
      data: { refreshToken },
    });
    // Invalidate cache
    await cacheDel(makeKey('user', userId));
    return user as AuthType;
  }

  static async updateProfile(
    userId: string,
    data: Partial<SignupInput & { profilePicture?: string }>,
  ): Promise<AuthType> {
    const user = await prisma.user.update({
      where: { id: userId },
      data,
    });
    // Invalidate cache
    await cacheDel(makeKey('user', userId));
    await cacheDel(makeKey('user', 'email', user.email));
    if (user.phone) {
      await cacheDel(makeKey('user', 'phone', user.phone));
    }
    return user as AuthType;
  }

  // OTP Cache Management
  static async setOtpCache(email: string, type: string, otp: string): Promise<void> {
    const key = makeKey('otp', type, email);
    await cacheSet(key, otp, OTP_CACHE_TTL);
  }

  static async getOtpCache(email: string, type: string): Promise<string | null> {
    const key = makeKey('otp', type, email);
    return cacheGet<string>(key);
  }

  static async deleteOtpCache(email: string, type: string): Promise<void> {
    const key = makeKey('otp', type, email);
    await cacheDel(key);
  }

  // Token Cache Management (for logout/blacklist)
  static async blacklistToken(token: string, expiresIn: number): Promise<void> {
    const key = makeKey('blacklist', 'token', token);
    await cacheSet(key, '1', expiresIn);
  }

  static async isTokenBlacklisted(token: string): Promise<boolean> {
    const key = makeKey('blacklist', 'token', token);
    const exists = await cacheGet<string>(key);
    return exists !== null;
  }
}
