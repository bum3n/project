"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const zod_1 = require("zod");
const message_service_1 = __importDefault(require("../services/message.service"));
const notification_service_1 = __importDefault(require("../services/notification.service"));
const storage_1 = require("../utils/storage");
const socket_1 = require("../socket");
const sendMessageSchema = zod_1.z.object({
    content: zod_1.z.string().max(5000).optional(),
    type: zod_1.z.enum(['TEXT', 'IMAGE', 'FILE', 'AUDIO', 'VIDEO']).default('TEXT'),
    replyToId: zod_1.z.string().uuid().optional(),
});
const editMessageSchema = zod_1.z.object({
    content: zod_1.z.string().min(1).max(5000),
});
const messageController = {
    /** POST /chats/:chatId/messages */
    async sendMessage(req, res, next) {
        try {
            const { userId, username } = req.user;
            const { chatId } = req.params;
            const body = sendMessageSchema.parse(req.body);
            // Process uploaded files
            const files = req.files;
            const attachments = files?.map((file) => ({
                filename: file.originalname,
                storedName: file.filename,
                mimeType: file.mimetype,
                size: file.size,
                url: (0, storage_1.buildFileUrl)(file.filename, req),
            })) ?? [];
            const message = await message_service_1.default.sendMessage({
                chatId,
                senderId: userId,
                content: body.content,
                type: attachments.length > 0 && body.type === 'TEXT' ? 'FILE' : body.type,
                replyToId: body.replyToId,
                attachments,
            });
            // Emit to Socket.io room so all members receive it in real-time
            const io = (0, socket_1.getSocketIO)();
            if (io) {
                io.to(`chat:${chatId}`).emit('message:new', { message });
            }
            // Create notifications for other members
            const preview = message.content || (attachments.length > 0 ? '📎 Attachment' : '');
            await notification_service_1.default.notifyNewMessage(chatId, message.id, userId, username, null, preview).then((notifications) => {
                if (notifications && io) {
                    notifications.forEach((n) => {
                        // Emit to the specific user's room (joined at socket connect)
                        io.to(`user:${n.userId}`).emit('notification:new', {
                            id: n.id,
                            type: n.type,
                            title: n.title,
                            body: n.body,
                            chatId: n.chatId,
                            createdAt: n.createdAt,
                        });
                    });
                }
            });
            res.status(201).json({ success: true, data: message });
        }
        catch (err) {
            next(err);
        }
    },
    /** GET /chats/:chatId/messages */
    async getMessages(req, res, next) {
        try {
            const { userId } = req.user;
            const { chatId } = req.params;
            const cursor = req.query.cursor;
            const limit = parseInt(req.query.limit || '50', 10);
            const result = await message_service_1.default.getMessages(chatId, userId, cursor, limit);
            res.json({ success: true, data: result });
        }
        catch (err) {
            next(err);
        }
    },
    /** PATCH /messages/:id */
    async editMessage(req, res, next) {
        try {
            const { userId } = req.user;
            const { content } = editMessageSchema.parse(req.body);
            const message = await message_service_1.default.editMessage(req.params.id, userId, content);
            // Notify clients of the edit
            const io = (0, socket_1.getSocketIO)();
            if (io) {
                io.to(`chat:${message.chatId}`).emit('message:edited', { message });
            }
            res.json({ success: true, data: message });
        }
        catch (err) {
            next(err);
        }
    },
    /** DELETE /messages/:id */
    async deleteMessage(req, res, next) {
        try {
            const { userId } = req.user;
            const message = await message_service_1.default.deleteMessage(req.params.id, userId);
            const io = (0, socket_1.getSocketIO)();
            if (io) {
                io.to(`chat:${message.chatId}`).emit('message:deleted', { messageId: message.id, chatId: message.chatId });
            }
            res.json({ success: true, data: message });
        }
        catch (err) {
            next(err);
        }
    },
    /** POST /chats/:chatId/messages/read */
    async markAsRead(req, res, next) {
        try {
            const { userId } = req.user;
            const { chatId } = req.params;
            const { messageId } = zod_1.z.object({ messageId: zod_1.z.string().uuid() }).parse(req.body);
            const result = await message_service_1.default.markAsRead(chatId, userId, messageId);
            // Emit read receipt to the chat room
            const io = (0, socket_1.getSocketIO)();
            if (io) {
                io.to(`chat:${chatId}`).emit('message:read', {
                    chatId,
                    messageId,
                    userId,
                    readAt: new Date(),
                });
            }
            res.json({ success: true, data: result });
        }
        catch (err) {
            next(err);
        }
    },
    /** GET /chats/:chatId/messages/unread-count */
    async getUnreadCount(req, res, next) {
        try {
            const { userId } = req.user;
            const count = await message_service_1.default.getUnreadCount(req.params.chatId, userId);
            res.json({ success: true, data: { count } });
        }
        catch (err) {
            next(err);
        }
    },
};
exports.default = messageController;
//# sourceMappingURL=message.controller.js.map