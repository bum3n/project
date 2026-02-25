import { Router } from 'express';
import notificationController from '../controllers/notification.controller';

const router = Router();
// All routes require authentication (applied in routes/index.ts)

router.get('/', notificationController.getNotifications);
router.get('/unread-count', notificationController.getUnreadCount);
router.patch('/read-all', notificationController.markAllAsRead);
router.patch('/:id/read', notificationController.markAsRead);
router.delete('/:id', notificationController.deleteNotification);

export default router;
