import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import messageService from '../services/message.service';
import notificationService from '../services/notification.service';
import { AuthRequest } from '../types';
import { buildFileUrl } from '../utils/storage';
import { getSocketIO } from '../socket';

const sendMessageSchema = z.object({
  content: z.string().max(5000).optional(),
  type: z.enum(['TEXT', 'IMAGE', 'FILE', 'AUDIO', 'VIDEO']).default('TEXT'),
  replyToId: z.string().uuid().optional(),
});

const editMessageSchema = z.object({
  content: z.string().min(1).max(5000),
});

const messageController = {
  /** POST /chats/:chatId/messages */
  async sendMessage(req: Request, res: Response, next: NextFunction) {
    try {
      const { userId, username } = (req as AuthRequest).user!;
      const { chatId } = req.params;
      const body = sendMessageSchema.parse(req.body);

      // Process uploaded files
      const files = req.files as Express.Multer.File[] | undefined;
      const attachments =
        files?.map((file) => ({
          filename: file.originalname,
          storedName: file.filename,
          mimeType: file.mimetype,
          size: file.size,
          url: buildFileUrl(file.filename, req),
        })) ?? [];

      const message = await messageService.sendMessage({
        chatId,
        senderId: userId,
        content: body.content,
        type: attachments.length > 0 && body.type === 'TEXT' ? 'FILE' : body.type,
        replyToId: body.replyToId,
        attachments,
      });

      // Emit to Socket.io room so all members receive it in real-time
      const io = getSocketIO();
      if (io) {
        io.to(`chat:${chatId}`).emit('message:new', { message });
      }

      // Create notifications for other members
      const preview = message.content || (attachments.length > 0 ? '📎 Attachment' : '');
      await notificationService.notifyNewMessage(
        chatId,
        message.id,
        userId,
        username,
        null,
        preview,
      ).then((notifications) => {
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
    } catch (err) {
      next(err);
    }
  },

  /** GET /chats/:chatId/messages */
  async getMessages(req: Request, res: Response, next: NextFunction) {
    try {
      const { userId } = (req as AuthRequest).user!;
      const { chatId } = req.params;
      const cursor = req.query.cursor as string | undefined;
      const limit = parseInt(req.query.limit as string || '50', 10);

      const result = await messageService.getMessages(chatId, userId, cursor, limit);
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  },

  /** PATCH /messages/:id */
  async editMessage(req: Request, res: Response, next: NextFunction) {
    try {
      const { userId } = (req as AuthRequest).user!;
      const { content } = editMessageSchema.parse(req.body);
      const message = await messageService.editMessage(req.params.id, userId, content);

      // Notify clients of the edit
      const io = getSocketIO();
      if (io) {
        io.to(`chat:${message.chatId}`).emit('message:edited', { message });
      }

      res.json({ success: true, data: message });
    } catch (err) {
      next(err);
    }
  },

  /** DELETE /messages/:id */
  async deleteMessage(req: Request, res: Response, next: NextFunction) {
    try {
      const { userId } = (req as AuthRequest).user!;
      const message = await messageService.deleteMessage(req.params.id, userId);

      const io = getSocketIO();
      if (io) {
        io.to(`chat:${message.chatId}`).emit('message:deleted', { messageId: message.id, chatId: message.chatId });
      }

      res.json({ success: true, data: message });
    } catch (err) {
      next(err);
    }
  },

  /** POST /chats/:chatId/messages/read */
  async markAsRead(req: Request, res: Response, next: NextFunction) {
    try {
      const { userId } = (req as AuthRequest).user!;
      const { chatId } = req.params;
      const { messageId } = z.object({ messageId: z.string().uuid() }).parse(req.body);

      const result = await messageService.markAsRead(chatId, userId, messageId);

      // Emit read receipt to the chat room
      const io = getSocketIO();
      if (io) {
        io.to(`chat:${chatId}`).emit('message:read', {
          chatId,
          messageId,
          userId,
          readAt: new Date(),
        });
      }

      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  },

  /** GET /chats/:chatId/messages/unread-count */
  async getUnreadCount(req: Request, res: Response, next: NextFunction) {
    try {
      const { userId } = (req as AuthRequest).user!;
      const count = await messageService.getUnreadCount(req.params.chatId, userId);
      res.json({ success: true, data: { count } });
    } catch (err) {
      next(err);
    }
  },
};

export default messageController;
