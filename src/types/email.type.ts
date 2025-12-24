/**
 * Email Queue Job Types
 */

export enum EmailJobType {
  VERIFICATION_EMAIL = 'verification-email',
  FORGOT_PASSWORD_EMAIL = 'forgot-password-email',
  WELCOME_EMAIL = 'welcome-email',
  PASSWORD_CHANGED_EMAIL = 'password-changed-email',
  GENERIC_EMAIL = 'generic-email',
}

export interface BaseEmailJobData {
  to: string;
  subject: string;
  html?: string;
  text?: string;
}

export interface VerificationEmailJobData extends BaseEmailJobData {
  otpCode: string;
  type: 'emailVerification';
}

export interface ForgotPasswordEmailJobData extends BaseEmailJobData {
  otpCode: string;
  type: 'forgotPassword';
}

export interface WelcomeEmailJobData extends BaseEmailJobData {
  username: string;
}

export interface PasswordChangedEmailJobData extends BaseEmailJobData {
  username: string;
}

export type EmailJobData =
  | VerificationEmailJobData
  | ForgotPasswordEmailJobData
  | WelcomeEmailJobData
  | PasswordChangedEmailJobData
  | BaseEmailJobData;

export interface EmailJobResult {
  success: boolean;
  messageId?: string;
  error?: string;
}
