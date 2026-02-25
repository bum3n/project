"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const database_1 = __importDefault(require("../config/database"));
const password_1 = require("../utils/password");
const jwt_1 = require("../utils/jwt");
const jwt_2 = require("../config/jwt");
const errorHandler_1 = require("../middleware/errorHandler");
const authService = {
    /** Register a new user and return tokens. */
    async register(input) {
        // Check for existing email or username
        const existing = await database_1.default.user.findFirst({
            where: { OR: [{ email: input.email }, { username: input.username }] },
        });
        if (existing) {
            if (existing.email === input.email)
                throw (0, errorHandler_1.createHttpError)(409, 'Email already in use');
            throw (0, errorHandler_1.createHttpError)(409, 'Username already taken');
        }
        const passwordHash = await (0, password_1.hashPassword)(input.password);
        const user = await database_1.default.user.create({
            data: {
                username: input.username,
                email: input.email,
                passwordHash,
                displayName: input.displayName,
            },
        });
        const tokens = await generateAndStoreTokens(user);
        return { user: sanitizeUser(user), tokens };
    },
    /** Login with email + password and return tokens. */
    async login(input) {
        const user = await database_1.default.user.findUnique({ where: { email: input.email } });
        if (!user)
            throw (0, errorHandler_1.createHttpError)(401, 'Invalid credentials');
        const valid = await (0, password_1.verifyPassword)(input.password, user.passwordHash);
        if (!valid)
            throw (0, errorHandler_1.createHttpError)(401, 'Invalid credentials');
        // Mark user as online
        await database_1.default.user.update({
            where: { id: user.id },
            data: { isOnline: true, lastSeenAt: new Date() },
        });
        const tokens = await generateAndStoreTokens(user);
        return { user: sanitizeUser(user), tokens };
    },
    /** Exchange a valid refresh token for a new token pair (rotation). */
    async refresh(rawRefreshToken) {
        // Verify JWT signature first
        let payload;
        try {
            payload = (0, jwt_1.verifyRefreshToken)(rawRefreshToken);
        }
        catch {
            throw (0, errorHandler_1.createHttpError)(401, 'Invalid refresh token');
        }
        // Check DB record (single-use rotation: delete old, issue new)
        const stored = await database_1.default.refreshToken.findUnique({ where: { token: rawRefreshToken } });
        if (!stored || stored.expiresAt < new Date()) {
            // Possible token reuse attack – invalidate all tokens for this user
            await database_1.default.refreshToken.deleteMany({ where: { userId: payload.userId } });
            throw (0, errorHandler_1.createHttpError)(401, 'Refresh token revoked or expired');
        }
        await database_1.default.refreshToken.delete({ where: { id: stored.id } });
        const user = await database_1.default.user.findUniqueOrThrow({ where: { id: payload.userId } });
        return generateAndStoreTokens(user);
    },
    /** Logout: revoke the provided refresh token and mark user offline. */
    async logout(rawRefreshToken, userId) {
        await database_1.default.refreshToken.deleteMany({ where: { token: rawRefreshToken, userId } });
        await database_1.default.user.update({
            where: { id: userId },
            data: { isOnline: false, lastSeenAt: new Date() },
        });
    },
};
function sanitizeUser(user) {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { passwordHash: _, ...safe } = user;
    return safe;
}
async function generateAndStoreTokens(user) {
    const payload = { userId: user.id, email: user.email, username: user.username };
    const accessToken = (0, jwt_1.signAccessToken)(payload);
    const refreshToken = (0, jwt_1.signRefreshToken)(payload);
    await database_1.default.refreshToken.create({
        data: {
            token: refreshToken,
            userId: user.id,
            expiresAt: new Date(Date.now() + jwt_2.REFRESH_TOKEN_TTL_MS),
        },
    });
    return { accessToken, refreshToken };
}
exports.default = authService;
//# sourceMappingURL=auth.service.js.map