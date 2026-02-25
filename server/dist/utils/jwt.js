"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.signAccessToken = signAccessToken;
exports.signRefreshToken = signRefreshToken;
exports.verifyAccessToken = verifyAccessToken;
exports.verifyRefreshToken = verifyRefreshToken;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const jwt_1 = require("../config/jwt");
/**
 * Sign a short-lived access token (15 minutes by default).
 */
function signAccessToken(payload) {
    return jsonwebtoken_1.default.sign(payload, jwt_1.jwtConfig.access.secret, {
        expiresIn: jwt_1.jwtConfig.access.expiresIn,
    });
}
/**
 * Sign a long-lived refresh token (7 days by default).
 */
function signRefreshToken(payload) {
    return jsonwebtoken_1.default.sign(payload, jwt_1.jwtConfig.refresh.secret, {
        expiresIn: jwt_1.jwtConfig.refresh.expiresIn,
    });
}
/**
 * Verify and decode an access token. Throws if invalid / expired.
 */
function verifyAccessToken(token) {
    const decoded = jsonwebtoken_1.default.verify(token, jwt_1.jwtConfig.access.secret);
    return { userId: decoded.userId, email: decoded.email, username: decoded.username };
}
/**
 * Verify and decode a refresh token. Throws if invalid / expired.
 */
function verifyRefreshToken(token) {
    const decoded = jsonwebtoken_1.default.verify(token, jwt_1.jwtConfig.refresh.secret);
    return { userId: decoded.userId, email: decoded.email, username: decoded.username };
}
//# sourceMappingURL=jwt.js.map