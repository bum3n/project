import { Router } from 'express';
import chatController from '../controllers/chat.controller';
import { upload } from '../middleware/upload';

const router = Router();
// All routes here require authentication (applied in routes/index.ts)

router.get('/', chatController.listChats);
router.get('/search', chatController.searchChats);
router.post('/private', chatController.getOrCreatePrivate);
router.post('/group', chatController.createGroup);
router.get('/:id', chatController.getChat);
router.patch('/:id', upload.single('avatar'), chatController.updateGroup);
router.post('/:id/members', chatController.addMembers);
router.delete('/:id/members/:userId', chatController.removeMember);

export default router;
