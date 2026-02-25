"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.REFRESH_TOKEN_TTL_MS = exports.jwtConfig = void 0;
exports.jwtConfig = {
    access: {
        secret: process.env.JWT_ACCESS_SECRET || 'fallback-access-secret-change-me',
        expiresIn: (process.env.JWT_ACCESS_EXPIRES_IN || '15m'),
    },
    refresh: {
        secret: process.env.JWT_REFRESH_SECRET || 'fallback-refresh-secret-change-me',
        expiresIn: (process.env.JWT_REFRESH_EXPIRES_IN || '7d'),
    },
};
/** How long a refresh token lives in milliseconds (for DB expiry calculation) */
exports.REFRESH_TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
//# sourceMappingURL=jwt.js.map