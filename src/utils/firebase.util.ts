import { getFirebaseAuth } from '@/config';
import { AppError } from './error.util';
import { logger } from './logger.util';

/**
 * Verify Firebase ID token and return decoded token
 */
export const verifyFirebaseToken = async (
  idToken: string,
): Promise<{
  uid: string;
  email: string;
  emailVerified: boolean;
  name?: string;
  picture?: string;
  phoneNumber?: string;
}> => {
  try {
    const auth = getFirebaseAuth();
    const decodedToken = await auth.verifyIdToken(idToken);

    return {
      uid: decodedToken.uid,
      email: decodedToken.email || '',
      emailVerified: decodedToken.email_verified || false,
      name: decodedToken.name,
      picture: decodedToken.picture,
      phoneNumber: decodedToken.phone_number,
    };
  } catch (error: any) {
    logger.error({ error: error.message }, 'Firebase token verification failed');
    throw AppError.unauthorized('Invalid or expired Firebase token');
  }
};

/**
 * Get user by Firebase UID
 */
export const getFirebaseUser = async (uid: string) => {
  try {
    const auth = getFirebaseAuth();
    const userRecord = await auth.getUser(uid);
    return {
      uid: userRecord.uid,
      email: userRecord.email || '',
      emailVerified: userRecord.emailVerified,
      displayName: userRecord.displayName,
      photoURL: userRecord.photoURL,
      phoneNumber: userRecord.phoneNumber,
    };
  } catch (error: any) {
    logger.error({ error: error.message, uid }, 'Failed to get Firebase user');
    throw AppError.notFound('Firebase user not found');
  }
};

/**
 * Create custom token for Firebase user
 */
export const createCustomToken = async (
  uid: string,
  additionalClaims?: object,
): Promise<string> => {
  try {
    const auth = getFirebaseAuth();
    return await auth.createCustomToken(uid, additionalClaims);
  } catch (error: any) {
    logger.error({ error: error.message, uid }, 'Failed to create custom token');
    throw AppError.internalError('Failed to create custom token');
  }
};
