import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import chatService from '../services/chat.service';
import { AuthRequest } from '../types';

const createGroupSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(300).optional(),
  memberIds: z.array(z.string().uuid()).min(1),
});

const updateGroupSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(300).optional(),
});

const addMembersSchema = z.object({
  memberIds: z.array(z.string().uuid()).min(1),
});

const chatController = {
  /** POST /chats/private – get-or-create 1-to-1 chat. */
  async getOrCreatePrivate(req: Request, res: Response, next: NextFunction) {
    try {
      const { userId } = (req as AuthRequest).user!;
      const { targetUserId } = z.object({ targetUserId: z.string().uuid() }).parse(req.body);
      const chat = await chatService.getOrCreatePrivateChat(userId, targetUserId);
      res.json({ success: true, data: chat });
    } catch (err) {
      next(err);
    }
  },

  /** POST /chats/group – create a new group. */
  async createGroup(req: Request, res: Response, next: NextFunction) {
    try {
      const { userId } = (req as AuthRequest).user!;
      const { name, description, memberIds } = createGroupSchema.parse(req.body);
      const chat = await chatService.createGroup(userId, name, memberIds, description);
      res.status(201).json({ success: true, data: chat });
    } catch (err) {
      next(err);
    }
  },

  /** GET /chats – list user's chats. */
  async listChats(req: Request, res: Response, next: NextFunction) {
    try {
      const { userId } = (req as AuthRequest).user!;
      const chats = await chatService.listUserChats(userId);
      res.json({ success: true, data: chats });
    } catch (err) {
      next(err);
    }
  },

  /** GET /chats/:id – get single chat. */
  async getChat(req: Request, res: Response, next: NextFunction) {
    try {
      const { userId } = (req as AuthRequest).user!;
      const chat = await chatService.getChatById(req.params.id, userId);
      res.json({ success: true, data: chat });
    } catch (err) {
      next(err);
    }
  },

  /** PATCH /chats/:id – update group info. */
  async updateGroup(req: Request, res: Response, next: NextFunction) {
    try {
      const { userId } = (req as AuthRequest).user!;
      const body = updateGroupSchema.parse(req.body);

      // Optional avatar upload
      let avatarUrl: string | undefined;
      if (req.file) {
        const { buildFileUrl } = await import('../utils/storage');
        avatarUrl = buildFileUrl(req.file.filename, req);
      }

      const chat = await chatService.updateGroup(req.params.id, userId, { ...body, avatarUrl });
      res.json({ success: true, data: chat });
    } catch (err) {
      next(err);
    }
  },

  /** POST /chats/:id/members – add members to group. */
  async addMembers(req: Request, res: Response, next: NextFunction) {
    try {
      const { userId } = (req as AuthRequest).user!;
      const { memberIds } = addMembersSchema.parse(req.body);
      const chat = await chatService.addMembers(req.params.id, userId, memberIds);
      res.json({ success: true, data: chat });
    } catch (err) {
      next(err);
    }
  },

  /** DELETE /chats/:id/members/:userId – remove a member. */
  async removeMember(req: Request, res: Response, next: NextFunction) {
    try {
      const { userId } = (req as AuthRequest).user!;
      await chatService.removeMember(req.params.id, userId, req.params.userId);
      res.json({ success: true, message: 'Member removed' });
    } catch (err) {
      next(err);
    }
  },

  /** GET /chats/search?q=... */
  async searchChats(req: Request, res: Response, next: NextFunction) {
    try {
      const { userId } = (req as AuthRequest).user!;
      const q = z.string().min(1).parse(req.query.q);
      const results = await chatService.searchChats(q, userId);
      res.json({ success: true, data: results });
    } catch (err) {
      next(err);
    }
  },
};

export default chatController;
