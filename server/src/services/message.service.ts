import prisma from '../config/database';
import { createHttpError } from '../middleware/errorHandler';
import { MessageType } from '../types';

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
} as const;

export interface SendMessageInput {
  chatId: string;
  senderId: string;
  content?: string;
  type?: MessageType;
  replyToId?: string;
  attachments?: Array<{
    filename: string;
    storedName: string;
    mimeType: string;
    size: number;
    url: string;
  }>;
}

const messageService = {
  /** Send a message (text or with attachments). */
  async sendMessage(input: SendMessageInput) {
    const { chatId, senderId, content, type = 'TEXT', replyToId, attachments = [] } = input;

    // Verify sender is a member
    const membership = await prisma.chatMember.findUnique({
      where: { chatId_userId: { chatId, userId: senderId } },
    });
    if (!membership) throw createHttpError(403, 'You are not a member of this chat');

    if (!content && attachments.length === 0) {
      throw createHttpError(400, 'Message must have content or at least one attachment');
    }

    const message = await prisma.message.create({
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
    await prisma.messageRead.create({ data: { messageId: message.id, userId: senderId } });

    // Update chat's updatedAt timestamp (signals latest activity)
    await prisma.chat.update({ where: { id: chatId }, data: { updatedAt: new Date() } });

    return message;
  },

  /** Fetch paginated message history for a chat. Uses cursor-based pagination. */
  async getMessages(chatId: string, userId: string, cursor?: string, limit = 50) {
    // Verify membership
    const membership = await prisma.chatMember.findUnique({
      where: { chatId_userId: { chatId, userId } },
    });
    if (!membership) throw createHttpError(403, 'You are not a member of this chat');

    const messages = await prisma.message.findMany({
      where: { chatId, isDeleted: false },
      select: MESSAGE_SELECT,
      orderBy: { createdAt: 'desc' },
      take: limit + 1, // fetch one extra to determine hasMore
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    });

    const hasMore = messages.length > limit;
    if (hasMore) messages.pop();

    return {
      items: messages.reverse(), // chronological order for display
      nextCursor: hasMore ? messages[0]?.id : undefined,
      hasMore,
    };
  },

  /** Edit a message (sender only, text messages only). */
  async editMessage(messageId: string, userId: string, content: string) {
    const message = await prisma.message.findUnique({ where: { id: messageId } });
    if (!message) throw createHttpError(404, 'Message not found');
    if (message.senderId !== userId) throw createHttpError(403, 'Cannot edit another user\'s message');
    if (message.isDeleted) throw createHttpError(400, 'Cannot edit a deleted message');
    if (message.type !== 'TEXT') throw createHttpError(400, 'Only text messages can be edited');

    return prisma.message.update({
      where: { id: messageId },
      data: { content, isEdited: true },
      select: MESSAGE_SELECT,
    });
  },

  /** Soft-delete a message (sender only). */
  async deleteMessage(messageId: string, userId: string) {
    const message = await prisma.message.findUnique({ where: { id: messageId } });
    if (!message) throw createHttpError(404, 'Message not found');
    if (message.senderId !== userId) throw createHttpError(403, 'Cannot delete another user\'s message');

    return prisma.message.update({
      where: { id: messageId },
      data: { isDeleted: true, content: null },
      select: MESSAGE_SELECT,
    });
  },

  /** Mark messages in a chat as read up to a specific message. */
  async markAsRead(chatId: string, userId: string, messageId: string) {
    // Verify membership
    const membership = await prisma.chatMember.findUnique({
      where: { chatId_userId: { chatId, userId } },
    });
    if (!membership) throw createHttpError(403, 'Not a member of this chat');

    const targetMessage = await prisma.message.findFirst({
      where: { id: messageId, chatId },
    });
    if (!targetMessage) throw createHttpError(404, 'Message not found');

    // Find all unread messages up to this point
    const unread = await prisma.message.findMany({
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
      await prisma.messageRead.createMany({
        data: unread.map((m) => ({ messageId: m.id, userId })),
        skipDuplicates: true,
      });
    }

    // Update the member's lastReadAt pointer
    await prisma.chatMember.update({
      where: { chatId_userId: { chatId, userId } },
      data: { lastReadAt: new Date() },
    });

    return { markedCount: unread.length };
  },

  /** Get the number of unread messages in a chat for a user. */
  async getUnreadCount(chatId: string, userId: string): Promise<number> {
    const membership = await prisma.chatMember.findUnique({
      where: { chatId_userId: { chatId, userId } },
    });
    if (!membership) return 0;

    return prisma.message.count({
      where: {
        chatId,
        createdAt: { gt: membership.lastReadAt },
        senderId: { not: userId },
        isDeleted: false,
      },
    });
  },
};

export default messageService;
