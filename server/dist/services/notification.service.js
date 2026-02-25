"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const database_1 = __importDefault(require("../config/database"));
const NOTIFICATION_SELECT = {
    id: true,
    userId: true,
    type: true,
    title: true,
    body: true,
    chatId: true,
    messageId: true,
    isRead: true,
    createdAt: true,
    triggerer: {
        select: { id: true, username: true, displayName: true, avatarUrl: true },
    },
};
const notificationService = {
    /** Create a notification for one or many users. */
    async create(data) {
        const { userIds, type, title, body, triggeredBy, chatId, messageId } = data;
        await database_1.default.notification.createMany({
            data: userIds.map((userId) => ({
                userId,
                type,
                title,
                body,
                triggeredBy: triggeredBy || null,
                chatId: chatId || null,
                messageId: messageId || null,
            })),
        });
    },
    /** Get paginated notifications for a user. */
    async getNotifications(userId, cursor, limit = 30) {
        const notifications = await database_1.default.notification.findMany({
            where: { userId },
            select: NOTIFICATION_SELECT,
            orderBy: { createdAt: 'desc' },
            take: limit + 1,
            ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
        });
        const hasMore = notifications.length > limit;
        if (hasMore)
            notifications.pop();
        return {
            items: notifications,
            nextCursor: hasMore ? notifications[notifications.length - 1]?.id : undefined,
            hasMore,
        };
    },
    /** Count unread notifications for a user. */
    async getUnreadCount(userId) {
        return database_1.default.notification.count({ where: { userId, isRead: false } });
    },
    /** Mark a specific notification as read. */
    async markAsRead(notificationId, userId) {
        return database_1.default.notification.updateMany({
            where: { id: notificationId, userId },
            data: { isRead: true },
        });
    },
    /** Mark ALL notifications for a user as read. */
    async markAllAsRead(userId) {
        return database_1.default.notification.updateMany({
            where: { userId, isRead: false },
            data: { isRead: true },
        });
    },
    /** Delete a notification. */
    async deleteNotification(notificationId, userId) {
        return database_1.default.notification.deleteMany({
            where: { id: notificationId, userId },
        });
    },
    /**
     * Create new-message notifications for all chat members except the sender.
     * Called from the Socket.io handler or message controller.
     */
    async notifyNewMessage(chatId, messageId, senderId, senderName, chatName, previewText) {
        // Get all members except sender
        const members = await database_1.default.chatMember.findMany({
            where: { chatId, userId: { not: senderId } },
            select: { userId: true },
        });
        if (members.length === 0)
            return;
        const title = chatName ? `${senderName} in ${chatName}` : senderName;
        const body = previewText.length > 100 ? previewText.slice(0, 97) + '…' : previewText;
        await notificationService.create({
            userIds: members.map((m) => m.userId),
            type: 'NEW_MESSAGE',
            title,
            body,
            triggeredBy: senderId,
            chatId,
            messageId,
        });
        // Return created notifications so Socket.io can emit them
        return database_1.default.notification.findMany({
            where: {
                chatId,
                messageId,
                userId: { in: members.map((m) => m.userId) },
            },
            select: NOTIFICATION_SELECT,
            orderBy: { createdAt: 'desc' },
        });
    },
};
exports.default = notificationService;
//# sourceMappingURL=notification.service.js.map