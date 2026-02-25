import prisma from '../config/database';
import { NotificationType } from '../types';

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
} as const;

const notificationService = {
  /** Create a notification for one or many users. */
  async create(data: {
    userIds: string[];
    type: NotificationType;
    title: string;
    body: string;
    triggeredBy?: string;
    chatId?: string;
    messageId?: string;
  }) {
    const { userIds, type, title, body, triggeredBy, chatId, messageId } = data;

    await prisma.notification.createMany({
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
  async getNotifications(userId: string, cursor?: string, limit = 30) {
    const notifications = await prisma.notification.findMany({
      where: { userId },
      select: NOTIFICATION_SELECT,
      orderBy: { createdAt: 'desc' },
      take: limit + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    });

    const hasMore = notifications.length > limit;
    if (hasMore) notifications.pop();

    return {
      items: notifications,
      nextCursor: hasMore ? notifications[notifications.length - 1]?.id : undefined,
      hasMore,
    };
  },

  /** Count unread notifications for a user. */
  async getUnreadCount(userId: string): Promise<number> {
    return prisma.notification.count({ where: { userId, isRead: false } });
  },

  /** Mark a specific notification as read. */
  async markAsRead(notificationId: string, userId: string) {
    return prisma.notification.updateMany({
      where: { id: notificationId, userId },
      data: { isRead: true },
    });
  },

  /** Mark ALL notifications for a user as read. */
  async markAllAsRead(userId: string) {
    return prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });
  },

  /** Delete a notification. */
  async deleteNotification(notificationId: string, userId: string) {
    return prisma.notification.deleteMany({
      where: { id: notificationId, userId },
    });
  },

  /**
   * Create new-message notifications for all chat members except the sender.
   * Called from the Socket.io handler or message controller.
   */
  async notifyNewMessage(
    chatId: string,
    messageId: string,
    senderId: string,
    senderName: string,
    chatName: string | null,
    previewText: string,
  ) {
    // Get all members except sender
    const members = await prisma.chatMember.findMany({
      where: { chatId, userId: { not: senderId } },
      select: { userId: true },
    });

    if (members.length === 0) return;

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
    return prisma.notification.findMany({
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

export default notificationService;
