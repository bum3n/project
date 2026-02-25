import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import notificationService from '../services/notification.service';
import { AuthRequest } from '../types';

const notificationController = {
  /** GET /notifications */
  async getNotifications(req: Request, res: Response, next: NextFunction) {
    try {
      const { userId } = (req as AuthRequest).user!;
      const cursor = req.query.cursor as string | undefined;
      const limit = parseInt(req.query.limit as string || '30', 10);

      const result = await notificationService.getNotifications(userId, cursor, limit);
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  },

  /** GET /notifications/unread-count */
  async getUnreadCount(req: Request, res: Response, next: NextFunction) {
    try {
      const { userId } = (req as AuthRequest).user!;
      const count = await notificationService.getUnreadCount(userId);
      res.json({ success: true, data: { count } });
    } catch (err) {
      next(err);
    }
  },

  /** PATCH /notifications/:id/read */
  async markAsRead(req: Request, res: Response, next: NextFunction) {
    try {
      const { userId } = (req as AuthRequest).user!;
      await notificationService.markAsRead(req.params.id, userId);
      res.json({ success: true, message: 'Notification marked as read' });
    } catch (err) {
      next(err);
    }
  },

  /** PATCH /notifications/read-all */
  async markAllAsRead(req: Request, res: Response, next: NextFunction) {
    try {
      const { userId } = (req as AuthRequest).user!;
      const result = await notificationService.markAllAsRead(userId);
      res.json({ success: true, data: { updated: result.count } });
    } catch (err) {
      next(err);
    }
  },

  /** DELETE /notifications/:id */
  async deleteNotification(req: Request, res: Response, next: NextFunction) {
    try {
      const { userId } = (req as AuthRequest).user!;
      await notificationService.deleteNotification(req.params.id, userId);
      res.json({ success: true, message: 'Notification deleted' });
    } catch (err) {
      next(err);
    }
  },
};

export default notificationController;
