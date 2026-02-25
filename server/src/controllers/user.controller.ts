import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import userService from '../services/user.service';
import { AuthRequest } from '../types';

const updateProfileSchema = z.object({
  displayName: z.string().min(1).max(50).optional(),
  bio: z.string().max(300).optional(),
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8),
});

const userController = {
  /** GET /users/me – full profile of the authenticated user. */
  async getMe(req: Request, res: Response, next: NextFunction) {
    try {
      const { userId } = (req as AuthRequest).user!;
      const profile = await userService.getProfile(userId);
      res.json({ success: true, data: profile });
    } catch (err) {
      next(err);
    }
  },

  /** GET /users/:id */
  async getProfile(req: Request, res: Response, next: NextFunction) {
    try {
      const profile = await userService.getProfile(req.params.id);
      res.json({ success: true, data: profile });
    } catch (err) {
      next(err);
    }
  },

  /** PATCH /users/me */
  async updateProfile(req: Request, res: Response, next: NextFunction) {
    try {
      const { userId } = (req as AuthRequest).user!;
      const body = updateProfileSchema.parse(req.body);

      // If a file was uploaded (avatar), attach the URL
      let avatarUrl: string | undefined;
      if (req.file) {
        const { buildFileUrl } = await import('../utils/storage');
        avatarUrl = buildFileUrl(req.file.filename, req);
      }

      const updated = await userService.updateProfile(userId, { ...body, avatarUrl });
      res.json({ success: true, data: updated });
    } catch (err) {
      next(err);
    }
  },

  /** POST /users/me/change-password */
  async changePassword(req: Request, res: Response, next: NextFunction) {
    try {
      const { userId } = (req as AuthRequest).user!;
      const { currentPassword, newPassword } = changePasswordSchema.parse(req.body);
      await userService.changePassword(userId, currentPassword, newPassword);
      res.json({ success: true, message: 'Password changed successfully' });
    } catch (err) {
      next(err);
    }
  },

  /** GET /users/search?q=... */
  async searchUsers(req: Request, res: Response, next: NextFunction) {
    try {
      const { userId } = (req as AuthRequest).user!;
      const q = z.string().min(1).parse(req.query.q);
      const results = await userService.searchUsers(q, userId);
      res.json({ success: true, data: results });
    } catch (err) {
      next(err);
    }
  },

  /** GET /users/contacts */
  async getContacts(req: Request, res: Response, next: NextFunction) {
    try {
      const { userId } = (req as AuthRequest).user!;
      const contacts = await userService.getContacts(userId);
      res.json({ success: true, data: contacts });
    } catch (err) {
      next(err);
    }
  },
};

export default userController;
