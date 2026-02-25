import { Router } from 'express';
import messageController from '../controllers/message.controller';
import { upload } from '../middleware/upload';

const router = Router({ mergeParams: true }); // inherit :chatId from parent
// All routes require authentication (applied in routes/index.ts)

// Chat-scoped message routes
router.get('/', messageController.getMessages);
router.post('/', upload.array('files', 10), messageController.sendMessage);
router.get('/unread-count', messageController.getUnreadCount);
router.post('/read', messageController.markAsRead);

// Standalone message routes (registered separately in index.ts)
export const standaloneMessageRouter = Router();
standaloneMessageRouter.patch('/:id', messageController.editMessage);
standaloneMessageRouter.delete('/:id', messageController.deleteMessage);

export default router;
