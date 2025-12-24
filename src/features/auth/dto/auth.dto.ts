import { AuthType } from '@/features/auth/type/auth.type';

export class AuthDto {
  /**
   * Converts a single AuthType instance to the response format.
   * Excludes sensitive data like password, OTP, refreshToken
   */
  static toResponse(data: AuthType) {
    const safeData = {
      ...data,
      password: undefined,
      otpCode: undefined,
      otpExpiresAt: undefined,
      refreshToken: undefined,
    };
    return {
      user: safeData,
    };
  }

  /**
   * Signup response - excludes sensitive data
   */
  static toSignupResponse(data: AuthType) {
    return this.toResponse(data);
  }

  /**
   * Login response - includes tokens
   */
  static toLoginResponse(data: AuthType, token: { accessToken: string, refreshToken: string }) {
    return {
      ...this.toResponse(data),
      token,
    };
  }

  /**
   * Converts an array of AuthType to a response array.
   */
  static toListResponse(data: AuthType[]) {
    return data.map((item) => this.toResponse(item));
  }

  /**
   * Converts a partial/possibly undefined object to a response shape (or null).
   */
  static toNullableResponse(data: AuthType | null | undefined) {
    return data ? this.toResponse(data) : null;
  }
}
