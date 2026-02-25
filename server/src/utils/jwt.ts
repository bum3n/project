import jwt, { JwtPayload as JwtLibPayload } from 'jsonwebtoken';
import { jwtConfig } from '../config/jwt';
import { JwtPayload } from '../types';

/**
 * Sign a short-lived access token (15 minutes by default).
 */
export function signAccessToken(payload: JwtPayload): string {
  return jwt.sign(payload, jwtConfig.access.secret, {
    expiresIn: jwtConfig.access.expiresIn,
  });
}

/**
 * Sign a long-lived refresh token (7 days by default).
 */
export function signRefreshToken(payload: JwtPayload): string {
  return jwt.sign(payload, jwtConfig.refresh.secret, {
    expiresIn: jwtConfig.refresh.expiresIn,
  });
}

/**
 * Verify and decode an access token. Throws if invalid / expired.
 */
export function verifyAccessToken(token: string): JwtPayload {
  const decoded = jwt.verify(token, jwtConfig.access.secret) as JwtLibPayload & JwtPayload;
  return { userId: decoded.userId, email: decoded.email, username: decoded.username };
}

/**
 * Verify and decode a refresh token. Throws if invalid / expired.
 */
export function verifyRefreshToken(token: string): JwtPayload {
  const decoded = jwt.verify(token, jwtConfig.refresh.secret) as JwtLibPayload & JwtPayload;
  return { userId: decoded.userId, email: decoded.email, username: decoded.username };
}
