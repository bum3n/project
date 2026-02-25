"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const zod_1 = require("zod");
const auth_service_1 = __importDefault(require("../services/auth.service"));
const registerSchema = zod_1.z.object({
    username: zod_1.z
        .string()
        .min(3)
        .max(30)
        .regex(/^[a-zA-Z0-9_]+$/, 'Username may only contain letters, numbers, and underscores'),
    email: zod_1.z.string().email(),
    password: zod_1.z.string().min(8, 'Password must be at least 8 characters'),
    displayName: zod_1.z.string().min(1).max(50),
});
const loginSchema = zod_1.z.object({
    email: zod_1.z.string().email(),
    password: zod_1.z.string().min(1),
});
const refreshSchema = zod_1.z.object({
    refreshToken: zod_1.z.string().min(1),
});
const authController = {
    async register(req, res, next) {
        try {
            const body = registerSchema.parse(req.body);
            const result = await auth_service_1.default.register(body);
            res.status(201).json({ success: true, data: result });
        }
        catch (err) {
            next(err);
        }
    },
    async login(req, res, next) {
        try {
            const body = loginSchema.parse(req.body);
            const result = await auth_service_1.default.login(body);
            res.json({ success: true, data: result });
        }
        catch (err) {
            next(err);
        }
    },
    async refresh(req, res, next) {
        try {
            const { refreshToken } = refreshSchema.parse(req.body);
            const tokens = await auth_service_1.default.refresh(refreshToken);
            res.json({ success: true, data: tokens });
        }
        catch (err) {
            next(err);
        }
    },
    async logout(req, res, next) {
        try {
            const { refreshToken } = refreshSchema.parse(req.body);
            const userId = req.user.userId;
            await auth_service_1.default.logout(refreshToken, userId);
            res.json({ success: true, message: 'Logged out successfully' });
        }
        catch (err) {
            next(err);
        }
    },
    /** Return the authenticated user's info (no DB call – from token). */
    async me(req, res) {
        const user = req.user;
        res.json({ success: true, data: user });
    },
};
exports.default = authController;
//# sourceMappingURL=auth.controller.js.map