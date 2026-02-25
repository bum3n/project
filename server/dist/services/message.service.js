"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const database_1 = __importDefault(require("../config/database"));
const errorHandler_1 = require("../middleware/errorHandler");
const MESSAGE_SELECT = {
    id: true,
    chatId: true,
    content: true,
    type: true,
    isEdited: true,
    isDeleted: true,
    createdAt: true,
    updatedAt: true,
    sender: {
        select: { id: true, username: true, displayName: true, avatarUrl: true },
    },
    attachments: {
        select: { id: true, filename: true, storedName: true, mimeType: true, size: true, url: true },
    },
    readBy: {
        select: { userId: true, readAt: true },
    },
    replyTo: {
        select: {
            id: true,
            content: true,
            isDeleted: true,
            sender: { select: { id: true, displayName: true } },
        },
    },
    _count: { select: { readBy: true } },
};
const messageService = {
    /** Send a message (text or with attachments). */
    async sendMessage(input) {
        const { chatId, senderId, content, type = 'TEXT', replyToId, attachments = [] } = input;
        // Verify sender is a member
        const membership = await database_1.default.chatMember.findUnique({
            where: { chatId_userId: { chatId, userId: senderId } },
        });
        if (!membership)
            throw (0, errorHandler_1.createHttpError)(403, 'You are not a member of this chat');
        if (!content && attachments.length === 0) {
            throw (0, errorHandler_1.createHttpError)(400, 'Message must have content or at least one attachment');
        }
        const message = await database_1.default.message.create({
            data: {
                chatId,
                senderId,
                content: content || null,
                type,
                replyToId: replyToId || null,
                attachments: attachments.length > 0 ? { create: attachments } : undefined,
            },
            select: MESSAGE_SELECT,
        });
        // Auto-mark as read by sender
        await database_1.default.messageRead.create({ data: { messageId: message.id, userId: senderId } });
        // Update chat's updatedAt timestamp (signals latest activity)
        await database_1.default.chat.update({ where: { id: chatId }, data: { updatedAt: new Date() } });
        return message;
    },
    /** Fetch paginated message history for a chat. Uses cursor-based pagination. */
    async getMessages(chatId, userId, cursor, limit = 50) {
        // Verify membership
        const membership = await database_1.default.chatMember.findUnique({
            where: { chatId_userId: { chatId, userId } },
        });
        if (!membership)
            throw (0, errorHandler_1.createHttpError)(403, 'You are not a member of this chat');
        const messages = await database_1.default.message.findMany({
            where: { chatId, isDeleted: false },
            select: MESSAGE_SELECT,
            orderBy: { createdAt: 'desc' },
            take: limit + 1, // fetch one extra to determine hasMore
            ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
        });
        const hasMore = messages.length > limit;
        if (hasMore)
            messages.pop();
        return {
            items: messages.reverse(), // chronological order for display
            nextCursor: hasMore ? messages[0]?.id : undefined,
            hasMore,
        };
    },
    /** Edit a message (sender only, text messages only). */
    async editMessage(messageId, userId, content) {
        const message = await database_1.default.message.findUnique({ where: { id: messageId } });
        if (!message)
            throw (0, errorHandler_1.createHttpError)(404, 'Message not found');
        if (message.senderId !== userId)
            throw (0, errorHandler_1.createHttpError)(403, 'Cannot edit another user\'s message');
        if (message.isDeleted)
            throw (0, errorHandler_1.createHttpError)(400, 'Cannot edit a deleted message');
        if (message.type !== 'TEXT')
            throw (0, errorHandler_1.createHttpError)(400, 'Only text messages can be edited');
        return database_1.default.message.update({
            where: { id: messageId },
            data: { content, isEdited: true },
            select: MESSAGE_SELECT,
        });
    },
    /** Soft-delete a message (sender only). */
    async deleteMessage(messageId, userId) {
        const message = await database_1.default.message.findUnique({ where: { id: messageId } });
        if (!message)
            throw (0, errorHandler_1.createHttpError)(404, 'Message not found');
        if (message.senderId !== userId)
            throw (0, errorHandler_1.createHttpError)(403, 'Cannot delete another user\'s message');
        return database_1.default.message.update({
            where: { id: messageId },
            data: { isDeleted: true, content: null },
            select: MESSAGE_SELECT,
        });
    },
    /** Mark messages in a chat as read up to a specific message. */
    async markAsRead(chatId, userId, messageId) {
        // Verify membership
        const membership = await database_1.default.chatMember.findUnique({
            where: { chatId_userId: { chatId, userId } },
        });
        if (!membership)
            throw (0, errorHandler_1.createHttpError)(403, 'Not a member of this chat');
        const targetMessage = await database_1.default.message.findFirst({
            where: { id: messageId, chatId },
        });
        if (!targetMessage)
            throw (0, errorHandler_1.createHttpError)(404, 'Message not found');
        // Find all unread messages up to this point
        const unread = await database_1.default.message.findMany({
            where: {
                chatId,
                createdAt: { lte: targetMessage.createdAt },
                senderId: { not: userId },
                readBy: { none: { userId } },
                isDeleted: false,
            },
            select: { id: true },
        });
        if (unread.length > 0) {
            await database_1.default.messageRead.createMany({
                data: unread.map((m) => ({ messageId: m.id, userId })),
                skipDuplicates: true,
            });
        }
        // Update the member's lastReadAt pointer
        await database_1.default.chatMember.update({
            where: { chatId_userId: { chatId, userId } },
            data: { lastReadAt: new Date() },
        });
        return { markedCount: unread.length };
    },
    /** Get the number of unread messages in a chat for a user. */
    async getUnreadCount(chatId, userId) {
        const membership = await database_1.default.chatMember.findUnique({
            where: { chatId_userId: { chatId, userId } },
        });
        if (!membership)
            return 0;
        return database_1.default.message.count({
            where: {
                chatId,
                createdAt: { gt: membership.lastReadAt },
                senderId: { not: userId },
                isDeleted: false,
            },
        });
    },
};
exports.default = messageService;
//# sourceMappingURL=message.service.js.map