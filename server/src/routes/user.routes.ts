import { Router } from 'express';
import userController from '../controllers/user.controller';
import { upload } from '../middleware/upload';

const router = Router();
// All routes here require authentication (applied in routes/index.ts)

router.get('/me', userController.getMe);
router.patch('/me', upload.single('avatar'), userController.updateProfile);
router.post('/me/change-password', userController.changePassword);
router.get('/search', userController.searchUsers);
router.get('/contacts', userController.getContacts);
router.get('/:id', userController.getProfile);

export default router;
