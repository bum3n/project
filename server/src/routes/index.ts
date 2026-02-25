import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import authRoutes from './auth.routes';
import userRoutes from './user.routes';
import chatRoutes from './chat.routes';
import messageRoutes, { standaloneMessageRouter } from './message.routes';
import notificationRoutes from './notification.routes';

const router = Router();

// ── Public ───────────────────────────────────────────────────────────────────
router.use('/auth', authRoutes);

// ── Protected (JWT required) ─────────────────────────────────────────────────
router.use('/users', authenticate, userRoutes);
router.use('/chats', authenticate, chatRoutes);
router.use('/chats/:chatId/messages', authenticate, messageRoutes);
router.use('/messages', authenticate, standaloneMessageRouter);
router.use('/notifications', authenticate, notificationRoutes);

export default router;
