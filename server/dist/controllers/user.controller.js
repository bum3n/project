"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const zod_1 = require("zod");
const user_service_1 = __importDefault(require("../services/user.service"));
const updateProfileSchema = zod_1.z.object({
    displayName: zod_1.z.string().min(1).max(50).optional(),
    bio: zod_1.z.string().max(300).optional(),
});
const changePasswordSchema = zod_1.z.object({
    currentPassword: zod_1.z.string().min(1),
    newPassword: zod_1.z.string().min(8),
});
const userController = {
    /** GET /users/me – full profile of the authenticated user. */
    async getMe(req, res, next) {
        try {
            const { userId } = req.user;
            const profile = await user_service_1.default.getProfile(userId);
            res.json({ success: true, data: profile });
        }
        catch (err) {
            next(err);
        }
    },
    /** GET /users/:id */
    async getProfile(req, res, next) {
        try {
            const profile = await user_service_1.default.getProfile(req.params.id);
            res.json({ success: true, data: profile });
        }
        catch (err) {
            next(err);
        }
    },
    /** PATCH /users/me */
    async updateProfile(req, res, next) {
        try {
            const { userId } = req.user;
            const body = updateProfileSchema.parse(req.body);
            // If a file was uploaded (avatar), attach the URL
            let avatarUrl;
            if (req.file) {
                const { buildFileUrl } = await Promise.resolve().then(() => __importStar(require('../utils/storage')));
                avatarUrl = buildFileUrl(req.file.filename, req);
            }
            const updated = await user_service_1.default.updateProfile(userId, { ...body, avatarUrl });
            res.json({ success: true, data: updated });
        }
        catch (err) {
            next(err);
        }
    },
    /** POST /users/me/change-password */
    async changePassword(req, res, next) {
        try {
            const { userId } = req.user;
            const { currentPassword, newPassword } = changePasswordSchema.parse(req.body);
            await user_service_1.default.changePassword(userId, currentPassword, newPassword);
            res.json({ success: true, message: 'Password changed successfully' });
        }
        catch (err) {
            next(err);
        }
    },
    /** GET /users/search?q=... */
    async searchUsers(req, res, next) {
        try {
            const { userId } = req.user;
            const q = zod_1.z.string().min(1).parse(req.query.q);
            const results = await user_service_1.default.searchUsers(q, userId);
            res.json({ success: true, data: results });
        }
        catch (err) {
            next(err);
        }
    },
    /** GET /users/contacts */
    async getContacts(req, res, next) {
        try {
            const { userId } = req.user;
            const contacts = await user_service_1.default.getContacts(userId);
            res.json({ success: true, data: contacts });
        }
        catch (err) {
            next(err);
        }
    },
};
exports.default = userController;
//# sourceMappingURL=user.controller.js.map