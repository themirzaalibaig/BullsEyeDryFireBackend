import jwt, { JwtPayload, SignOptions, VerifyOptions } from 'jsonwebtoken';
import { jwtConfig } from '@/config';

export const signToken = (payload: object, options?: SignOptions): string => {
  const opts: SignOptions = {
    expiresIn: jwtConfig.expiresIn as any,
    issuer: jwtConfig.issuer,
    audience: jwtConfig.audience,
    ...options,
  };
  return jwt.sign(payload, jwtConfig.secret, opts);
};

export const verifyToken = (token: string, options?: VerifyOptions): JwtPayload | string => {
  return jwt.verify(token, jwtConfig.secret, {
    issuer: jwtConfig.issuer,
    audience: jwtConfig.audience,
    ...options,
  });
};

export const decodeToken = (token: string): null | JwtPayload | string => {
  return jwt.decode(token, { json: true });
};
export const signRefreshToken = (payload: object, options?: SignOptions): string => {
  const opts: SignOptions = {
    expiresIn: jwtConfig.refreshExpiresIn as any,
    issuer: jwtConfig.issuer,
    audience: jwtConfig.audience,
    ...options,
  };
  return jwt.sign(payload, jwtConfig.secret, opts);
};

export const verifyRefreshToken = (token: string, options?: VerifyOptions): JwtPayload | string => {
  return jwt.verify(token, jwtConfig.secret, {
    issuer: jwtConfig.issuer,
    audience: jwtConfig.audience,
    ...options,
  });
};

export const getTokenExpiration = (token: string): number | null => {
  const decoded = jwt.decode(token) as JwtPayload | null;
  return decoded && decoded.exp ? decoded.exp * 1000 : null;
};

export const isTokenExpired = (token: string): boolean => {
  const exp = getTokenExpiration(token);
  return exp ? Date.now() >= exp : true;
};

export const generateTokens = (payload: object) => {
  const accessToken = signToken(payload);
  const refreshToken = signRefreshToken(payload);
  return { accessToken, refreshToken };
};

export const getRemainingDays = (token: string): number => {
  const expMs = getTokenExpiration(token);
  if (!expMs) return 0;
  const remainingMs = expMs - Date.now();
  return Math.floor(remainingMs / (1000 * 60 * 60 * 24));
};
