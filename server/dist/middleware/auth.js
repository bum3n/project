"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticate = authenticate;
const jwt_1 = require("../utils/jwt");
/**
 * Middleware that validates the Bearer JWT in the Authorization header.
 * Sets req.user with the decoded payload if valid.
 */
function authenticate(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        res.status(401).json({ success: false, error: 'Missing or invalid Authorization header' });
        return;
    }
    const token = authHeader.slice(7); // strip "Bearer "
    try {
        const payload = (0, jwt_1.verifyAccessToken)(token);
        req.user = payload;
        next();
    }
    catch (err) {
        const message = err instanceof Error && err.name === 'TokenExpiredError'
            ? 'Access token expired'
            : 'Invalid access token';
        res.status(401).json({ success: false, error: message });
    }
}
//# sourceMappingURL=auth.js.map