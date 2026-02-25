import { JwtPayload } from '../types';
/**
 * Sign a short-lived access token (15 minutes by default).
 */
export declare function signAccessToken(payload: JwtPayload): string;
/**
 * Sign a long-lived refresh token (7 days by default).
 */
export declare function signRefreshToken(payload: JwtPayload): string;
/**
 * Verify and decode an access token. Throws if invalid / expired.
 */
export declare function verifyAccessToken(token: string): JwtPayload;
/**
 * Verify and decode a refresh token. Throws if invalid / expired.
 */
export declare function verifyRefreshToken(token: string): JwtPayload;
//# sourceMappingURL=jwt.d.ts.map