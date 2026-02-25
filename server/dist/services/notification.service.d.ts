import { NotificationType } from '../types';
declare const notificationService: {
    /** Create a notification for one or many users. */
    create(data: {
        userIds: string[];
        type: NotificationType;
        title: string;
        body: string;
        triggeredBy?: string;
        chatId?: string;
        messageId?: string;
    }): Promise<void>;
    /** Get paginated notifications for a user. */
    getNotifications(userId: string, cursor?: string, limit?: number): Promise<{
        items: {
            id: string;
            createdAt: Date;
            userId: string;
            chatId: string | null;
            type: import(".prisma/client").$Enums.NotificationType;
            messageId: string | null;
            title: string;
            body: string;
            isRead: boolean;
            triggerer: {
                id: string;
                username: string;
                displayName: string;
                avatarUrl: string | null;
            } | null;
        }[];
        nextCursor: string | undefined;
        hasMore: boolean;
    }>;
    /** Count unread notifications for a user. */
    getUnreadCount(userId: string): Promise<number>;
    /** Mark a specific notification as read. */
    markAsRead(notificationId: string, userId: string): Promise<import(".prisma/client").Prisma.BatchPayload>;
    /** Mark ALL notifications for a user as read. */
    markAllAsRead(userId: string): Promise<import(".prisma/client").Prisma.BatchPayload>;
    /** Delete a notification. */
    deleteNotification(notificationId: string, userId: string): Promise<import(".prisma/client").Prisma.BatchPayload>;
    /**
     * Create new-message notifications for all chat members except the sender.
     * Called from the Socket.io handler or message controller.
     */
    notifyNewMessage(chatId: string, messageId: string, senderId: string, senderName: string, chatName: string | null, previewText: string): Promise<{
        id: string;
        createdAt: Date;
        userId: string;
        chatId: string | null;
        type: import(".prisma/client").$Enums.NotificationType;
        messageId: string | null;
        title: string;
        body: string;
        isRead: boolean;
        triggerer: {
            id: string;
            username: string;
            displayName: string;
            avatarUrl: string | null;
        } | null;
    }[] | undefined>;
};
export default notificationService;
//# sourceMappingURL=notification.service.d.ts.map