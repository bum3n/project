import { SignOptions } from 'jsonwebtoken';

export const jwtConfig = {
  access: {
    secret: process.env.JWT_ACCESS_SECRET || 'fallback-access-secret-change-me',
    expiresIn: (process.env.JWT_ACCESS_EXPIRES_IN || '15m') as SignOptions['expiresIn'],
  },
  refresh: {
    secret: process.env.JWT_REFRESH_SECRET || 'fallback-refresh-secret-change-me',
    expiresIn: (process.env.JWT_REFRESH_EXPIRES_IN || '7d') as SignOptions['expiresIn'],
  },
};

/** How long a refresh token lives in milliseconds (for DB expiry calculation) */
export const REFRESH_TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
