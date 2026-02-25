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
const chat_service_1 = __importDefault(require("../services/chat.service"));
const createGroupSchema = zod_1.z.object({
    name: zod_1.z.string().min(1).max(100),
    description: zod_1.z.string().max(300).optional(),
    memberIds: zod_1.z.array(zod_1.z.string().uuid()).min(1),
});
const updateGroupSchema = zod_1.z.object({
    name: zod_1.z.string().min(1).max(100).optional(),
    description: zod_1.z.string().max(300).optional(),
});
const addMembersSchema = zod_1.z.object({
    memberIds: zod_1.z.array(zod_1.z.string().uuid()).min(1),
});
const chatController = {
    /** POST /chats/private – get-or-create 1-to-1 chat. */
    async getOrCreatePrivate(req, res, next) {
        try {
            const { userId } = req.user;
            const { targetUserId } = zod_1.z.object({ targetUserId: zod_1.z.string().uuid() }).parse(req.body);
            const chat = await chat_service_1.default.getOrCreatePrivateChat(userId, targetUserId);
            res.json({ success: true, data: chat });
        }
        catch (err) {
            next(err);
        }
    },
    /** POST /chats/group – create a new group. */
    async createGroup(req, res, next) {
        try {
            const { userId } = req.user;
            const { name, description, memberIds } = createGroupSchema.parse(req.body);
            const chat = await chat_service_1.default.createGroup(userId, name, memberIds, description);
            res.status(201).json({ success: true, data: chat });
        }
        catch (err) {
            next(err);
        }
    },
    /** GET /chats – list user's chats. */
    async listChats(req, res, next) {
        try {
            const { userId } = req.user;
            const chats = await chat_service_1.default.listUserChats(userId);
            res.json({ success: true, data: chats });
        }
        catch (err) {
            next(err);
        }
    },
    /** GET /chats/:id – get single chat. */
    async getChat(req, res, next) {
        try {
            const { userId } = req.user;
            const chat = await chat_service_1.default.getChatById(req.params.id, userId);
            res.json({ success: true, data: chat });
        }
        catch (err) {
            next(err);
        }
    },
    /** PATCH /chats/:id – update group info. */
    async updateGroup(req, res, next) {
        try {
            const { userId } = req.user;
            const body = updateGroupSchema.parse(req.body);
            // Optional avatar upload
            let avatarUrl;
            if (req.file) {
                const { buildFileUrl } = await Promise.resolve().then(() => __importStar(require('../utils/storage')));
                avatarUrl = buildFileUrl(req.file.filename, req);
            }
            const chat = await chat_service_1.default.updateGroup(req.params.id, userId, { ...body, avatarUrl });
            res.json({ success: true, data: chat });
        }
        catch (err) {
            next(err);
        }
    },
    /** POST /chats/:id/members – add members to group. */
    async addMembers(req, res, next) {
        try {
            const { userId } = req.user;
            const { memberIds } = addMembersSchema.parse(req.body);
            const chat = await chat_service_1.default.addMembers(req.params.id, userId, memberIds);
            res.json({ success: true, data: chat });
        }
        catch (err) {
            next(err);
        }
    },
    /** DELETE /chats/:id/members/:userId – remove a member. */
    async removeMember(req, res, next) {
        try {
            const { userId } = req.user;
            await chat_service_1.default.removeMember(req.params.id, userId, req.params.userId);
            res.json({ success: true, message: 'Member removed' });
        }
        catch (err) {
            next(err);
        }
    },
    /** GET /chats/search?q=... */
    async searchChats(req, res, next) {
        try {
            const { userId } = req.user;
            const q = zod_1.z.string().min(1).parse(req.query.q);
            const results = await chat_service_1.default.searchChats(q, userId);
            res.json({ success: true, data: results });
        }
        catch (err) {
            next(err);
        }
    },
};
exports.default = chatController;
//# sourceMappingURL=chat.controller.js.map